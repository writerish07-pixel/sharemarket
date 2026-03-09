"""
Core business logic for Tata Motors CRM.
Handles auto-numbering, lead assignment, PDF generation helpers, etc.
"""

import math
import random
import string
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract

from app.models.crm import (
    Lead, Booking, Quotation, TestDrive, ExchangeVehicle,
    FinanceApplication, InsurancePolicy, AccessoriesOrder, Invoice,
    PDIRecord, Delivery, FollowUp, FollowUpType, FollowUpStatus,
    Vehicle, VehicleStatus, User, AuditLog, Notification, Payment,
    LeadStatus, BookingStatus, PDIStatus, DeliveryStatus,
)


# ─────────────────────────── AUTO NUMBERING ─────────────────────────────────

def _next_number(db: Session, model, field: str, prefix: str) -> str:
    """Generate sequential document numbers like TM-2024-00001."""
    year = datetime.now().year
    count = db.query(func.count(model.id)).scalar() or 0
    return f"{prefix}-{year}-{str(count + 1).zfill(5)}"


def generate_lead_number(db: Session) -> str:
    return _next_number(db, Lead, "lead_number", "TM")


def generate_booking_number(db: Session) -> str:
    return _next_number(db, Booking, "booking_number", "BK")


def generate_quote_number(db: Session) -> str:
    return _next_number(db, Quotation, "quote_number", "QT")


def generate_td_number(db: Session) -> str:
    return _next_number(db, TestDrive, "td_number", "TD")


def generate_finance_number(db: Session) -> str:
    return _next_number(db, FinanceApplication, "app_number", "FIN")


def generate_invoice_number(db: Session) -> str:
    return _next_number(db, Invoice, "invoice_number", "INV")


def generate_pdi_number(db: Session) -> str:
    return _next_number(db, PDIRecord, "pdi_number", "PDI")


def generate_delivery_number(db: Session) -> str:
    return _next_number(db, Delivery, "delivery_number", "DLV")


def generate_receipt_number() -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    rnd = "".join(random.choices(string.digits, k=4))
    return f"RCP-{ts}-{rnd}"


def generate_order_number(db: Session) -> str:
    return _next_number(db, AccessoriesOrder, "order_number", "ACC")


# ─────────────────────────── VEHICLE RECOMMENDATION ─────────────────────────

TATA_MODELS = {
    "EV": [
        {"name": "Tiago EV", "range_km": 315, "price_min": 860000, "price_max": 1200000},
        {"name": "Tigor EV", "range_km": 306, "price_min": 1200000, "price_max": 1500000},
        {"name": "Nexon EV", "range_km": 465, "price_min": 1450000, "price_max": 2000000},
        {"name": "Punch EV", "range_km": 421, "price_min": 1000000, "price_max": 1400000},
        {"name": "Curvv EV", "range_km": 502, "price_min": 1700000, "price_max": 2300000},
    ],
    "PV": [
        {"name": "Tiago", "fuel": ["PETROL", "CNG"], "price_min": 530000, "price_max": 820000},
        {"name": "Tigor", "fuel": ["PETROL", "CNG"], "price_min": 600000, "price_max": 900000},
        {"name": "Altroz", "fuel": ["PETROL", "DIESEL", "CNG"], "price_min": 680000, "price_max": 1050000},
        {"name": "Punch", "fuel": ["PETROL", "CNG"], "price_min": 600000, "price_max": 1000000},
        {"name": "Nexon", "fuel": ["PETROL", "DIESEL"], "price_min": 800000, "price_max": 1550000},
        {"name": "Harrier", "fuel": ["DIESEL"], "price_min": 1500000, "price_max": 2500000},
        {"name": "Safari", "fuel": ["DIESEL"], "price_min": 1600000, "price_max": 2700000},
        {"name": "Curvv", "fuel": ["PETROL", "DIESEL"], "price_min": 1000000, "price_max": 1800000},
    ],
}


def recommend_vehicles(
    budget_max: Optional[Decimal],
    fuel_preference: Optional[str],
    family_size: Optional[int],
    transmission: Optional[str],
) -> list:
    """Return recommended Tata models based on customer requirements."""
    recommendations = []
    budget = float(budget_max) if budget_max else 2000000

    if fuel_preference == "ELECTRIC":
        models = TATA_MODELS["EV"]
        for m in models:
            if m["price_min"] <= budget:
                recommendations.append(m["name"])
    else:
        models = TATA_MODELS["PV"]
        for m in models:
            if m["price_min"] <= budget:
                if fuel_preference and fuel_preference in m.get("fuel", []):
                    recommendations.insert(0, m["name"])
                else:
                    recommendations.append(m["name"])

    return recommendations[:5]


# ─────────────────────────── EMI CALCULATOR ─────────────────────────────────

def calculate_emi(principal: Decimal, annual_rate: float, months: int) -> Decimal:
    """Standard reducing balance EMI calculation."""
    if annual_rate == 0:
        return Decimal(str(round(float(principal) / months, 2)))
    r = annual_rate / (12 * 100)
    emi = float(principal) * r * ((1 + r) ** months) / (((1 + r) ** months) - 1)
    return Decimal(str(round(emi, 2)))


# ─────────────────────────── QUOTATION TOTAL ─────────────────────────────────

def compute_quotation_total(q) -> Decimal:
    total = (
        (q.ex_showroom or 0)
        + (q.rto_charges or 0)
        + (q.insurance_amount or 0)
        + (q.accessories_amount or 0)
        + (q.extended_warranty or 0)
        + (q.other_charges or 0)
        + (q.cgst_amount or 0)
        + (q.sgst_amount or 0)
        + (q.igst_amount or 0)
        - (q.discount or 0)
    )
    return Decimal(str(total))


# ─────────────────────────── POST-DELIVERY FOLLOWUPS ────────────────────────

def create_post_delivery_followups(db: Session, delivery: Delivery, telecalling_user_id: int):
    """Automatically create Day 1, Day 7, Day 30 follow-up tasks."""
    base = delivery.scheduled_date or date.today()
    tasks = [
        (FollowUpType.DAY_1, base + timedelta(days=1)),
        (FollowUpType.DAY_7, base + timedelta(days=7)),
        (FollowUpType.DAY_30, base + timedelta(days=30)),
    ]
    for fu_type, due in tasks:
        fu = FollowUp(
            delivery_id=delivery.id,
            assigned_to_id=telecalling_user_id,
            follow_up_type=fu_type,
            due_date=due,
            status=FollowUpStatus.PENDING,
        )
        db.add(fu)
    db.commit()


# ─────────────────────────── AUDIT LOGGING ──────────────────────────────────

def log_action(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    old_values: dict = None,
    new_values: dict = None,
    ip_address: str = None,
):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()


# ─────────────────────────── NOTIFICATION ────────────────────────────────────

def notify_user(db: Session, user_id: int, title: str, message: str,
                entity_type: str = None, entity_id: int = None):
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(n)
    db.commit()


# ─────────────────────────── DASHBOARD STATS ─────────────────────────────────

def gm_dashboard_stats(db: Session) -> dict:
    today = date.today()
    month_start = today.replace(day=1)

    leads_today = db.query(func.count(Lead.id)).filter(
        func.date(Lead.created_at) == today
    ).scalar() or 0

    leads_month = db.query(func.count(Lead.id)).filter(
        Lead.created_at >= month_start
    ).scalar() or 0

    bookings_month = db.query(func.count(Booking.id)).filter(
        Booking.created_at >= month_start,
        Booking.status != BookingStatus.CANCELLED,
    ).scalar() or 0

    deliveries_month = db.query(func.count(Delivery.id)).filter(
        Delivery.scheduled_date >= month_start,
        Delivery.status == DeliveryStatus.COMPLETED,
    ).scalar() or 0

    # Revenue from invoices
    revenue = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.invoice_date >= month_start
    ).scalar() or Decimal("0")

    # EV vs PV (from bookings this month)
    from app.models.crm import FuelType
    ev_sales = db.query(func.count(Booking.id)).filter(
        Booking.created_at >= month_start,
        Booking.fuel_type == FuelType.ELECTRIC,
        Booking.status != BookingStatus.CANCELLED,
    ).scalar() or 0
    pv_sales = bookings_month - ev_sales

    conversion_rate = round((bookings_month / leads_month * 100) if leads_month > 0 else 0, 1)

    # Leads by status
    from sqlalchemy import case
    status_counts = db.query(Lead.status, func.count(Lead.id)).filter(
        Lead.created_at >= month_start
    ).group_by(Lead.status).all()
    leads_by_status = {s.value: c for s, c in status_counts}

    # Leads by source
    source_counts = db.query(Lead.source, func.count(Lead.id)).filter(
        Lead.created_at >= month_start
    ).group_by(Lead.source).all()
    leads_by_source = {s.value: c for s, c in source_counts}

    # Top consultants (by bookings)
    from app.models.crm import UserRole
    top_q = (
        db.query(User.full_name, func.count(Booking.id).label("bookings"))
        .join(Booking, Booking.created_by_id == User.id)
        .filter(
            User.role == UserRole.SALES_CONSULTANT,
            Booking.created_at >= month_start,
            Booking.status != BookingStatus.CANCELLED,
        )
        .group_by(User.id, User.full_name)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )
    top_consultants = [{"name": name, "bookings": bk} for name, bk in top_q]

    return {
        "total_leads_today": leads_today,
        "total_leads_month": leads_month,
        "total_bookings_month": bookings_month,
        "total_deliveries_month": deliveries_month,
        "revenue_month": revenue,
        "ev_sales_month": ev_sales,
        "pv_sales_month": pv_sales,
        "conversion_rate": conversion_rate,
        "leads_by_status": leads_by_status,
        "leads_by_source": leads_by_source,
        "top_consultants": top_consultants,
    }
