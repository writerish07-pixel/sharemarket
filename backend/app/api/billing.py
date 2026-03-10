"""Billing, invoice generation and payment recording."""

from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, Invoice, Booking, Payment, UserRole
from app.schemas.crm import InvoiceCreate, InvoiceOut
from app.services.crm_service import generate_invoice_number, generate_receipt_number

router = APIRouter(prefix="/billing", tags=["Billing"])

GST_RATE_PV = Decimal("14.0")   # CGST 14% + SGST 14% = 28% for vehicles above 4m
CESS_RATE   = Decimal("1.0")    # 1% cess on luxury


@router.post("/invoices", response_model=InvoiceOut, status_code=201)
def generate_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ACCOUNTS_OFFICER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Only Accounts Officer can generate invoices")

    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if db.query(Invoice).filter(Invoice.booking_id == payload.booking_id).first():
        raise HTTPException(400, "Invoice already generated for this booking")

    # Fetch related data
    from app.models.crm import (
        InsurancePolicy, AccessoriesOrder, ExchangeVehicle,
        FinanceApplication, Vehicle,
    )
    insurance = db.query(InsurancePolicy).filter(InsurancePolicy.booking_id == booking.id).first()
    acc_order = db.query(AccessoriesOrder).filter(AccessoriesOrder.booking_id == booking.id).first()
    from app.models.crm import Lead
    exchange = (
        db.query(ExchangeVehicle)
        .join(Lead, ExchangeVehicle.lead_id == Lead.id)
        .filter(Lead.id == booking.lead_id)
        .first()
    )
    finance = db.query(FinanceApplication).filter(FinanceApplication.booking_id == booking.id).first()
    vehicle = db.query(Vehicle).filter(Vehicle.vin == booking.vin).first() if booking.vin else None

    # GST calculation — read ex_showroom from the active quotation
    from app.models.crm import Quotation
    quote = (
        db.query(Quotation)
        .filter(Quotation.lead_id == booking.lead_id, Quotation.is_active == True)
        .order_by(Quotation.created_at.desc())
        .first()
    )
    ex_showroom = Decimal(str(quote.ex_showroom)) if quote else Decimal("0")
    taxable_val = ex_showroom - (payload.discount or Decimal("0"))
    cgst = (taxable_val * GST_RATE_PV / Decimal("100")).quantize(Decimal("0.01"))
    sgst = cgst

    insurance_amt = Decimal(str(insurance.total_premium)) if insurance else Decimal("0")
    acc_amt = Decimal(str(acc_order.total_amount)) if acc_order else Decimal("0")
    rto = quote.rto_charges if quote else Decimal("0")
    warranty = quote.extended_warranty if quote else Decimal("0")

    total = ex_showroom + cgst + sgst + rto + insurance_amt + acc_amt + warranty - (payload.discount or Decimal("0"))
    exchange_deduction = Decimal("0")   # handled separately if exchange approved
    loan_amt = Decimal(str(finance.loan_amount)) if finance else Decimal("0")
    balance = total - (booking.booking_amount or Decimal("0")) - exchange_deduction - loan_amt

    invoice = Invoice(
        invoice_number=generate_invoice_number(db),
        booking_id=booking.id,
        customer_name=booking.customer_name,
        customer_address=booking.customer_address,
        customer_gstin=payload.customer_gstin,
        customer_pan=booking.pan_number,
        vin=booking.vin or "",
        engine_number=vehicle.engine_number if vehicle else "",
        model=booking.model,
        variant=booking.variant,
        color=booking.color,
        hsn_code="87032190",   # HSN for passenger vehicles
        ex_showroom=ex_showroom,
        discount=payload.discount or Decimal("0"),
        taxable_value=taxable_val,
        cgst_rate=float(GST_RATE_PV),
        cgst_amount=cgst,
        sgst_rate=float(GST_RATE_PV),
        sgst_amount=sgst,
        rto_charges=rto,
        insurance_amount=insurance_amt,
        accessories_amount=acc_amt,
        extended_warranty=warranty,
        total_amount=total,
        exchange_amount=exchange_deduction,
        booking_amount_paid=booking.booking_amount or Decimal("0"),
        loan_amount=loan_amt,
        balance_amount=balance,
        payment_mode=payload.payment_mode,
        payment_reference=payload.payment_reference,
        invoice_date=payload.invoice_date,
        generated_by_id=current_user.id,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/invoices", response_model=List[InvoiceOut])
def list_invoices(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")
    return inv


@router.post("/payments")
def record_payment(
    invoice_id: int,
    amount: float,
    payment_mode: str,
    reference_number: str = None,
    payment_date: str = None,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.CASHIER, UserRole.ACCOUNTS_OFFICER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Only Cashier/Accounts can record payments")

    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

    from datetime import date as dt
    payment = Payment(
        invoice_id=invoice_id,
        amount=Decimal(str(amount)),
        payment_mode=payment_mode,
        reference_number=reference_number,
        payment_date=dt.fromisoformat(payment_date) if payment_date else dt.today(),
        receipt_url=None,
        notes=notes,
        recorded_by_id=current_user.id,
    )
    db.add(payment)

    # Update balance
    inv.balance_amount = (inv.balance_amount or Decimal("0")) - Decimal(str(amount))
    inv.receipt_number = generate_receipt_number()
    db.commit()
    return {"message": "Payment recorded", "receipt_number": inv.receipt_number}
