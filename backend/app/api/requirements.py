"""Customer requirement discovery."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, CustomerRequirement
from app.schemas.crm import RequirementCreate, RequirementOut
from app.services.crm_service import recommend_vehicles

router = APIRouter(prefix="/requirements", tags=["Requirements"])


@router.post("/", response_model=RequirementOut, status_code=201)
def create_or_update_requirement(
    payload: RequirementCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    req = db.query(CustomerRequirement).filter(CustomerRequirement.lead_id == payload.lead_id).first()
    recs = recommend_vehicles(payload.budget_max if hasattr(payload, "budget_max") else None,
                              payload.fuel_preference.value if payload.fuel_preference else None,
                              payload.family_size, payload.transmission)
    if req:
        for k, v in payload.model_dump(exclude_none=True).items():
            setattr(req, k, v)
        req.recommended_models = recs
    else:
        req = CustomerRequirement(**payload.model_dump(), recommended_models=recs)
        db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/{lead_id}", response_model=RequirementOut)
def get_requirement(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    req = db.query(CustomerRequirement).filter(CustomerRequirement.lead_id == lead_id).first()
    if not req:
        raise HTTPException(404, "Requirement not found")
    return req
