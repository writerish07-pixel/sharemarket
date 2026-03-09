"""Quotation generation."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, Quotation
from app.schemas.crm import QuotationCreate, QuotationOut
from app.services.crm_service import generate_quote_number, compute_quotation_total

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.post("/", response_model=QuotationOut, status_code=201)
def create_quotation(
    payload: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = Quotation(
        **payload.model_dump(),
        quote_number=generate_quote_number(db),
        created_by_id=current_user.id,
    )
    q.total_on_road = compute_quotation_total(q)
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/lead/{lead_id}", response_model=List[QuotationOut])
def quotations_for_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Quotation).filter(Quotation.lead_id == lead_id)\
        .order_by(Quotation.created_at.desc()).all()


@router.get("/{quote_id}", response_model=QuotationOut)
def get_quotation(
    quote_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quotation not found")
    return q
