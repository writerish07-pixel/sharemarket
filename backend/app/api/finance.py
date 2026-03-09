"""Finance/loan application management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, FinanceApplication, FinanceStatus, UserRole
from app.schemas.crm import FinanceCreate, FinanceOut
from app.services.crm_service import generate_finance_number, calculate_emi

router = APIRouter(prefix="/finance", tags=["Finance"])


@router.post("/", response_model=FinanceOut, status_code=201)
def create_finance_application(
    payload: FinanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [
        UserRole.FINANCE_MANAGER, UserRole.GENERAL_MANAGER, UserRole.ACCOUNTS_OFFICER
    ]:
        raise HTTPException(403, "Only Finance team can create loan applications")

    emi = calculate_emi(payload.loan_amount, payload.interest_rate, payload.tenure_months)
    app = FinanceApplication(
        **payload.model_dump(),
        app_number=generate_finance_number(db),
        emi_amount=emi,
        handled_by_id=current_user.id,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/", response_model=List[FinanceOut])
def list_applications(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(FinanceApplication)
    if current_user.role == UserRole.FINANCE_MANAGER:
        q = q.filter(FinanceApplication.handled_by_id == current_user.id)
    if status:
        q = q.filter(FinanceApplication.status == status)
    return q.order_by(FinanceApplication.created_at.desc()).all()


@router.get("/{app_id}", response_model=FinanceOut)
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    app = db.query(FinanceApplication).filter(FinanceApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    return app


@router.post("/{app_id}/submit")
def submit_to_bank(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(FinanceApplication).filter(FinanceApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    app.status = FinanceStatus.SUBMITTED
    app.submitted_at = datetime.utcnow()
    db.commit()
    return {"message": "Application submitted to bank"}


@router.post("/{app_id}/approve")
def approve_application(
    app_id: int,
    bank_reference: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.FINANCE_MANAGER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Insufficient permissions")
    app = db.query(FinanceApplication).filter(FinanceApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    app.status = FinanceStatus.APPROVED
    app.bank_reference = bank_reference
    app.approved_at = datetime.utcnow()
    db.commit()
    return {"message": "Loan approved", "bank_reference": bank_reference}


@router.post("/{app_id}/reject")
def reject_application(
    app_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(FinanceApplication).filter(FinanceApplication.id == app_id).first()
    if not app:
        raise HTTPException(404, "Application not found")
    app.status = FinanceStatus.REJECTED
    app.rejection_reason = reason
    app.rejected_at = datetime.utcnow()
    db.commit()
    return {"message": "Application rejected"}
