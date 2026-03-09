"""Booking and KYC management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, Booking, Lead, LeadStatus, BookingStatus, UserRole
from app.schemas.crm import BookingCreate, BookingOut
from app.services.crm_service import generate_booking_number, generate_receipt_number, log_action

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=BookingOut, status_code=201)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate lead
    lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    if db.query(Booking).filter(Booking.lead_id == payload.lead_id).first():
        raise HTTPException(400, "Booking already exists for this lead")

    booking = Booking(
        **payload.model_dump(),
        booking_number=generate_booking_number(db),
        receipt_number=generate_receipt_number(),
        created_by_id=current_user.id,
    )
    db.add(booking)

    # Update lead status
    lead.status = LeadStatus.BOOKED
    db.commit()
    db.refresh(booking)
    log_action(db, current_user.id, "CREATE", "booking", booking.id,
               new_values={"booking_number": booking.booking_number})
    return booking


@router.get("/", response_model=List[BookingOut])
def list_bookings(
    status: Optional[str] = None,
    model: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Booking)
    if current_user.role == UserRole.SALES_CONSULTANT:
        q = q.filter(Booking.created_by_id == current_user.id)
    if status:
        q = q.filter(Booking.status == status)
    if model:
        q = q.filter(Booking.model.ilike(f"%{model}%"))
    return q.order_by(Booking.created_at.desc()).all()


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(404, "Booking not found")
    return b


@router.post("/{booking_id}/allocate-vehicle")
def allocate_vehicle(
    booking_id: int,
    vin: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.crm import Vehicle, VehicleStatus
    if current_user.role not in [
        UserRole.GENERAL_MANAGER, UserRole.SALES_MANAGER_EV, UserRole.SALES_MANAGER_PV
    ]:
        raise HTTPException(403, "Insufficient permissions")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")

    vehicle = db.query(Vehicle).filter(Vehicle.vin == vin).first()
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    if vehicle.status != VehicleStatus.IN_STOCK:
        raise HTTPException(400, f"Vehicle is not available (status: {vehicle.status})")

    booking.vin = vin
    booking.status = BookingStatus.CONFIRMED
    vehicle.status = VehicleStatus.ALLOCATED
    vehicle.allocated_booking_id = booking_id
    db.commit()
    return {"message": "Vehicle allocated", "vin": vin}


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = reason
    from datetime import date
    booking.cancellation_date = date.today()

    # Free vehicle if allocated
    if booking.vin:
        from app.models.crm import Vehicle, VehicleStatus
        v = db.query(Vehicle).filter(Vehicle.vin == booking.vin).first()
        if v:
            v.status = VehicleStatus.IN_STOCK
            v.allocated_booking_id = None
    db.commit()
    log_action(db, current_user.id, "CANCEL", "booking", booking_id)
    return {"message": "Booking cancelled"}
