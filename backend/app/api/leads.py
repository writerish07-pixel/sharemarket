"""Lead management – core CRM module."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import Lead, User, UserRole
from app.schemas.crm import LeadCreate, LeadUpdate, LeadOut
from app.services.crm_service import generate_lead_number, log_action

router = APIRouter(prefix="/leads", tags=["Leads"])


def _lead_or_404(lead_id: int, db: Session) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return lead


@router.get("/", response_model=List[LeadOut])
def list_leads(
    status: Optional[str] = None,
    source: Optional[str] = None,
    consultant_id: Optional[int] = None,
    team_leader_id: Optional[int] = None,
    search: Optional[str] = Query(None),
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Lead)

    # Role-based filtering
    if current_user.role == UserRole.SALES_CONSULTANT:
        q = q.filter(Lead.assigned_consultant_id == current_user.id)
    elif current_user.role == UserRole.TEAM_LEADER:
        q = q.filter(Lead.assigned_team_leader_id == current_user.id)
    elif current_user.role in [UserRole.SALES_MANAGER_EV, UserRole.SALES_MANAGER_PV]:
        # See all leads under their TLs
        tl_ids = [u.id for u in db.query(User).filter(User.manager_id == current_user.id).all()]
        q = q.filter(Lead.assigned_team_leader_id.in_(tl_ids))
    elif current_user.role == UserRole.TELECALLING:
        q = q  # All leads for follow-up
    # GM, Receptionist see all

    if status:
        q = q.filter(Lead.status == status)
    if source:
        q = q.filter(Lead.source == source)
    if consultant_id:
        q = q.filter(Lead.assigned_consultant_id == consultant_id)
    if team_leader_id:
        q = q.filter(Lead.assigned_team_leader_id == team_leader_id)
    if search:
        q = q.filter(
            or_(
                Lead.customer_name.ilike(f"%{search}%"),
                Lead.phone.ilike(f"%{search}%"),
                Lead.lead_number.ilike(f"%{search}%"),
            )
        )

    total = q.count()
    items = q.order_by(Lead.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return items


@router.post("/", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = Lead(
        **payload.model_dump(),
        lead_number=generate_lead_number(db),
        created_by_id=current_user.id,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    log_action(db, current_user.id, "CREATE", "lead", lead.id, new_values={"lead_number": lead.lead_number})
    return lead


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _lead_or_404(lead_id, db)


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = _lead_or_404(lead_id, db)
    old = {"status": lead.status, "assigned_consultant_id": lead.assigned_consultant_id}
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(lead, k, v)
    db.commit()
    db.refresh(lead)
    log_action(db, current_user.id, "UPDATE", "lead", lead_id, old_values=old)
    return lead


@router.post("/{lead_id}/assign", response_model=LeadOut)
def assign_lead(
    lead_id: int,
    team_leader_id: int,
    consultant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = _lead_or_404(lead_id, db)
    lead.assigned_team_leader_id = team_leader_id
    lead.assigned_consultant_id = consultant_id
    from app.models.crm import LeadStatus
    if lead.status == LeadStatus.NEW:
        lead.status = LeadStatus.ASSIGNED
    db.commit()
    db.refresh(lead)
    return lead
