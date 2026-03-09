"""Vehicle inventory management."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, Vehicle, VehicleStatus, UserRole
from app.schemas.crm import VehicleCreate, VehicleOut

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("/", response_model=List[VehicleOut])
def list_vehicles(
    model: Optional[str] = None,
    color: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    fuel_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Vehicle)
    if model:
        q = q.filter(Vehicle.model.ilike(f"%{model}%"))
    if color:
        q = q.filter(Vehicle.color.ilike(f"%{color}%"))
    if status:
        q = q.filter(Vehicle.status == status)
    if category:
        q = q.filter(Vehicle.category == category)
    if fuel_type:
        q = q.filter(Vehicle.fuel_type == fuel_type)
    return q.order_by(Vehicle.model, Vehicle.variant).all()


@router.post("/", response_model=VehicleOut, status_code=201)
def add_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.GENERAL_MANAGER, UserRole.SALES_MANAGER_EV,
                                  UserRole.SALES_MANAGER_PV, UserRole.PDI_MANAGER]:
        raise HTTPException(403, "Insufficient permissions")
    if db.query(Vehicle).filter(Vehicle.vin == payload.vin).first():
        raise HTTPException(400, "VIN already exists")
    v = Vehicle(**payload.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(404, "Vehicle not found")
    return v


@router.get("/stock/available", response_model=List[VehicleOut])
def available_stock(
    model: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.IN_STOCK)
    if model:
        q = q.filter(Vehicle.model.ilike(f"%{model}%"))
    return q.all()
