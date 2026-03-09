"""Dashboard analytics for all roles."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import (
    User, Lead, Booking, Delivery, FollowUp, FollowUpStatus,
    UserRole, LeadStatus, BookingStatus, DeliveryStatus,
    Vehicle, VehicleStatus, FinanceApplication, FinanceStatus,
)
from app.services.crm_service import gm_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/gm")
def gm_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.GENERAL_MANAGER:
        raise HTTPException(403, "GM only")
    return gm_dashboard_stats(db)


@router.get("/sales-manager")
def sales_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [
        UserRole.SALES_MANAGER_EV, UserRole.SALES_MANAGER_PV, UserRole.GENERAL_MANAGER
    ]:
        raise HTTPException(403, "Sales Manager only")

    month_start = date.today().replace(day=1)

    # Find TLs under this manager
    tl_ids = [u.id for u in db.query(User).filter(User.manager_id == current_user.id).all()]

    leads = db.query(func.count(Lead.id)).filter(
        Lead.assigned_team_leader_id.in_(tl_ids)
    ).scalar() or 0

    bookings = db.query(func.count(Booking.id)).filter(
        Booking.created_at >= month_start,
        Booking.status != BookingStatus.CANCELLED
    ).scalar() or 0

    tl_perf = []
    for tl in db.query(User).filter(User.id.in_(tl_ids)).all():
        tl_leads = db.query(func.count(Lead.id)).filter(
            Lead.assigned_team_leader_id == tl.id
        ).scalar() or 0
        tl_booked = db.query(func.count(Lead.id)).filter(
            Lead.assigned_team_leader_id == tl.id,
            Lead.status == LeadStatus.BOOKED,
        ).scalar() or 0
        tl_perf.append({
            "id": tl.id,
            "name": tl.full_name,
            "leads": tl_leads,
            "booked": tl_booked,
            "conversion": round(tl_booked / tl_leads * 100, 1) if tl_leads > 0 else 0,
        })

    return {
        "category": "EV" if current_user.role == UserRole.SALES_MANAGER_EV else "PV",
        "total_leads": leads,
        "bookings_month": bookings,
        "team_leaders": tl_perf,
    }


@router.get("/team-leader")
def team_leader_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.TEAM_LEADER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Team Leader only")

    consultants = db.query(User).filter(
        User.team_leader_id == current_user.id,
        User.role == UserRole.SALES_CONSULTANT,
    ).all()

    consultant_data = []
    for c in consultants:
        c_leads = db.query(func.count(Lead.id)).filter(
            Lead.assigned_consultant_id == c.id
        ).scalar() or 0
        c_booked = db.query(func.count(Lead.id)).filter(
            Lead.assigned_consultant_id == c.id,
            Lead.status == LeadStatus.BOOKED,
        ).scalar() or 0
        consultant_data.append({
            "id": c.id,
            "name": c.full_name,
            "leads": c_leads,
            "booked": c_booked,
            "conversion": round(c_booked / c_leads * 100, 1) if c_leads > 0 else 0,
        })

    total_leads = db.query(func.count(Lead.id)).filter(
        Lead.assigned_team_leader_id == current_user.id
    ).scalar() or 0
    booked = db.query(func.count(Lead.id)).filter(
        Lead.assigned_team_leader_id == current_user.id,
        Lead.status == LeadStatus.BOOKED,
    ).scalar() or 0

    return {
        "team_size": len(consultants),
        "total_leads": total_leads,
        "booked": booked,
        "conversion_rate": round(booked / total_leads * 100, 1) if total_leads > 0 else 0,
        "consultants": consultant_data,
    }


@router.get("/finance")
def finance_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [
        UserRole.FINANCE_MANAGER, UserRole.ACCOUNTS_OFFICER, UserRole.GENERAL_MANAGER
    ]:
        raise HTTPException(403, "Finance team only")

    stats = {}
    for s in FinanceStatus:
        stats[s.value] = db.query(func.count(FinanceApplication.id)).filter(
            FinanceApplication.status == s
        ).scalar() or 0

    return {"applications_by_status": stats}


@router.get("/delivery")
def delivery_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today = date.today()
    upcoming = (
        db.query(Delivery)
        .filter(Delivery.scheduled_date >= today, Delivery.status == DeliveryStatus.SCHEDULED)
        .order_by(Delivery.scheduled_date.asc())
        .limit(20)
        .all()
    )

    from app.schemas.crm import DeliveryOut
    return {
        "upcoming_deliveries": [DeliveryOut.model_validate(d) for d in upcoming],
        "total_scheduled": len(upcoming),
    }


@router.get("/stock")
def stock_dashboard(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Vehicle inventory summary."""
    summary = {}
    for s in VehicleStatus:
        count = db.query(func.count(Vehicle.id)).filter(Vehicle.status == s).scalar() or 0
        summary[s.value] = count

    # Model-wise breakup
    from app.models.crm import VehicleCategory
    model_stock = (
        db.query(Vehicle.model, func.count(Vehicle.id).label("count"))
        .filter(Vehicle.status == VehicleStatus.IN_STOCK)
        .group_by(Vehicle.model)
        .all()
    )

    return {
        "by_status": summary,
        "available_by_model": [{"model": m, "count": c} for m, c in model_stock],
    }


@router.get("/notifications")
def my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.crm import Notification
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return notifs


@router.post("/notifications/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.crm import Notification
    n = db.query(Notification).filter(
        Notification.id == notif_id, Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}
