"""Delivery scheduling, preparation, and completion."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import (
    User, Delivery, DeliveryStatus, UserRole, Booking, BookingStatus,
    Vehicle, VehicleStatus,
)
from app.schemas.crm import DeliveryCreate, DeliveryUpdate, DeliveryOut
from app.services.crm_service import generate_delivery_number, create_post_delivery_followups

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.post("/", response_model=DeliveryOut, status_code=201)
def schedule_delivery(
    payload: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(Delivery).filter(Delivery.booking_id == payload.booking_id).first():
        raise HTTPException(400, "Delivery already scheduled for this booking")
    delivery = Delivery(
        delivery_number=generate_delivery_number(db),
        booking_id=payload.booking_id,
        scheduled_date=payload.scheduled_date,
        delivery_time=payload.delivery_time,
        scheduled_by_id=current_user.id,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


@router.get("/", response_model=List[DeliveryOut])
def list_deliveries(
    status: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Delivery)
    if status:
        q = q.filter(Delivery.status == status)
    return q.order_by(Delivery.scheduled_date.asc()).all()


@router.get("/{delivery_id}", response_model=DeliveryOut)
def get_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    d = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not d:
        raise HTTPException(404, "Delivery not found")
    return d


@router.patch("/{delivery_id}", response_model=DeliveryOut)
def update_delivery(
    delivery_id: int,
    payload: DeliveryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not d:
        raise HTTPException(404, "Delivery not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@router.post("/{delivery_id}/complete")
def complete_delivery(
    delivery_id: int,
    customer_rating: int = None,
    customer_remarks: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    d = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not d:
        raise HTTPException(404, "Delivery not found")

    d.status = DeliveryStatus.COMPLETED
    d.completed_at = datetime.utcnow()
    d.delivered_by_id = current_user.id
    if customer_rating:
        d.customer_rating = customer_rating
    if customer_remarks:
        d.customer_remarks = customer_remarks

    # Update booking and vehicle status
    booking = db.query(Booking).filter(Booking.id == d.booking_id).first()
    if booking:
        booking.status = BookingStatus.CONVERTED
        if booking.vin:
            v = db.query(Vehicle).filter(Vehicle.vin == booking.vin).first()
            if v:
                v.status = VehicleStatus.DELIVERED

    db.commit()

    # Create post-delivery follow-up tasks
    # Find a telecalling user to assign (first active one)
    from app.models.crm import UserRole as UR
    tc_user = db.query(User).filter(User.role == UR.TELECALLING, User.is_active == True).first()
    if tc_user:
        create_post_delivery_followups(db, d, tc_user.id)

    return {"message": "Delivery completed", "delivery_number": d.delivery_number}


@router.get("/upcoming/today")
def upcoming_today(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from datetime import date
    today = date.today()
    deliveries = (
        db.query(Delivery)
        .filter(Delivery.scheduled_date == today, Delivery.status == DeliveryStatus.SCHEDULED)
        .all()
    )
    return [DeliveryOut.model_validate(d) for d in deliveries]
