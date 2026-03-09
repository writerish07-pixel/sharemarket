"""Insurance policy management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, InsurancePolicy, UserRole
from app.schemas.crm import InsuranceCreate, InsuranceOut

router = APIRouter(prefix="/insurance", tags=["Insurance"])

INSURANCE_COMPANIES = [
    {"name": "Tata AIG", "contact": "1800-266-7780"},
    {"name": "HDFC ERGO", "contact": "1800-2700-700"},
    {"name": "Bajaj Allianz", "contact": "1800-209-0144"},
    {"name": "ICICI Lombard", "contact": "1800-2666"},
    {"name": "New India Assurance", "contact": "1800-209-1415"},
    {"name": "United India Insurance", "contact": "1800-425-33333"},
]

AVAILABLE_ADDONS = [
    {"id": "zero_dep", "name": "Zero Depreciation", "description": "Full claim without depreciation"},
    {"id": "engine_protect", "name": "Engine Protection", "description": "Engine & gearbox damage"},
    {"id": "roadside_assist", "name": "24x7 Roadside Assistance", "description": "Breakdown help"},
    {"id": "return_to_invoice", "name": "Return to Invoice", "description": "Full invoice value"},
    {"id": "key_replacement", "name": "Key Replacement Cover"},
    {"id": "tyre_protect", "name": "Tyre Protection Cover"},
    {"id": "consumables", "name": "Consumables Cover"},
]


@router.get("/companies")
def get_insurance_companies():
    return INSURANCE_COMPANIES


@router.get("/addons")
def get_addons():
    return AVAILABLE_ADDONS


@router.post("/", response_model=InsuranceOut, status_code=201)
def create_policy(
    payload: InsuranceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.INSURANCE_MANAGER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Only Insurance Manager can create policies")

    total = (payload.premium_amount or 0) + (payload.addon_premium or 0)
    policy = InsurancePolicy(
        **payload.model_dump(),
        total_premium=total,
        handled_by_id=current_user.id,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.get("/booking/{booking_id}", response_model=InsuranceOut)
def get_booking_insurance(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    p = db.query(InsurancePolicy).filter(InsurancePolicy.booking_id == booking_id).first()
    if not p:
        raise HTTPException(404, "Insurance policy not found")
    return p


@router.patch("/{policy_id}/policy-number")
def update_policy_number(
    policy_id: int,
    policy_number: str,
    policy_doc_url: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(404, "Policy not found")
    policy.policy_number = policy_number
    if policy_doc_url:
        policy.policy_doc_url = policy_doc_url
    db.commit()
    return {"message": "Policy number updated"}
