"""Pre-Delivery Inspection (PDI) module."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, PDIRecord, PDIStatus, UserRole
from app.schemas.crm import PDICreate, PDIUpdate, PDIOut, PDI_CHECKLIST_TEMPLATE
from app.services.crm_service import generate_pdi_number

router = APIRouter(prefix="/pdi", tags=["PDI"])


@router.post("/", response_model=PDIOut, status_code=201)
def create_pdi(
    payload: PDICreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.PDI_MANAGER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Only PDI Manager can create PDI records")

    if db.query(PDIRecord).filter(PDIRecord.booking_id == payload.booking_id).first():
        raise HTTPException(400, "PDI already created for this booking")

    pdi = PDIRecord(
        pdi_number=generate_pdi_number(db),
        booking_id=payload.booking_id,
        vehicle_id=payload.vehicle_id,
        scheduled_date=payload.scheduled_date,
        checklist=payload.checklist or PDI_CHECKLIST_TEMPLATE,
        conducted_by_id=current_user.id,
    )
    db.add(pdi)
    db.commit()
    db.refresh(pdi)
    return pdi


@router.get("/", response_model=List[PDIOut])
def list_pdi(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(PDIRecord)
    if current_user.role == UserRole.PDI_MANAGER:
        q = q.filter(PDIRecord.conducted_by_id == current_user.id)
    if status:
        q = q.filter(PDIRecord.status == status)
    return q.order_by(PDIRecord.scheduled_date.desc()).all()


@router.get("/{pdi_id}", response_model=PDIOut)
def get_pdi(
    pdi_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pdi = db.query(PDIRecord).filter(PDIRecord.id == pdi_id).first()
    if not pdi:
        raise HTTPException(404, "PDI record not found")
    return pdi


@router.patch("/{pdi_id}", response_model=PDIOut)
def update_pdi(
    pdi_id: int,
    payload: PDIUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pdi = db.query(PDIRecord).filter(PDIRecord.id == pdi_id).first()
    if not pdi:
        raise HTTPException(404, "PDI record not found")

    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(pdi, k, v)

    if payload.status == PDIStatus.PASSED and not pdi.passed_at:
        pdi.passed_at = datetime.utcnow()
        # Update vehicle status
        from app.models.crm import Vehicle, VehicleStatus
        v = db.query(Vehicle).filter(Vehicle.id == pdi.vehicle_id).first()
        if v:
            v.status = VehicleStatus.PDI

    db.commit()
    db.refresh(pdi)
    return pdi


@router.get("/booking/{booking_id}", response_model=PDIOut)
def get_pdi_by_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    pdi = db.query(PDIRecord).filter(PDIRecord.booking_id == booking_id).first()
    if not pdi:
        raise HTTPException(404, "PDI not found for this booking")
    return pdi
