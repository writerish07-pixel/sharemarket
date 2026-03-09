"""Exchange vehicle evaluation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, ExchangeVehicle, UserRole
from app.schemas.crm import ExchangeCreate, ExchangeOut

router = APIRouter(prefix="/exchange", tags=["Exchange"])


@router.post("/", response_model=ExchangeOut, status_code=201)
def create_exchange(
    payload: ExchangeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if db.query(ExchangeVehicle).filter(ExchangeVehicle.lead_id == payload.lead_id).first():
        raise HTTPException(400, "Exchange record already exists for this lead")
    ex = ExchangeVehicle(**payload.model_dump(), evaluated_by_id=current_user.id)
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


@router.get("/lead/{lead_id}", response_model=ExchangeOut)
def get_exchange(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    ex = db.query(ExchangeVehicle).filter(ExchangeVehicle.lead_id == lead_id).first()
    if not ex:
        raise HTTPException(404, "No exchange record found")
    return ex


@router.patch("/{exchange_id}/approve")
def approve_exchange(
    exchange_id: int,
    final_value: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.EXCHANGE_MANAGER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Only Exchange Manager can approve valuations")
    ex = db.query(ExchangeVehicle).filter(ExchangeVehicle.id == exchange_id).first()
    if not ex:
        raise HTTPException(404, "Exchange record not found")
    ex.final_value = final_value
    ex.approved_by_id = current_user.id
    ex.approved_at = datetime.utcnow()
    db.commit()
    return {"message": "Exchange valuation approved", "final_value": final_value}
