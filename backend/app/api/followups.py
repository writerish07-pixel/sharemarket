"""Post-delivery follow-up tasks for telecalling team."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, FollowUp, FollowUpStatus, UserRole, CallLog
from app.schemas.crm import FollowUpOut, CallLogCreate, CallLogOut

router = APIRouter(prefix="/followups", tags=["Follow-Ups"])


@router.get("/", response_model=List[FollowUpOut])
def list_followups(
    status: str = None,
    due_today: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(FollowUp)
    if current_user.role == UserRole.TELECALLING:
        q = q.filter(FollowUp.assigned_to_id == current_user.id)
    if status:
        q = q.filter(FollowUp.status == status)
    if due_today:
        q = q.filter(FollowUp.due_date == date.today())
    return q.order_by(FollowUp.due_date.asc()).all()


@router.post("/{followup_id}/complete")
def complete_followup(
    followup_id: int,
    contacted: bool = True,
    satisfaction: int = None,
    issues_reported: str = None,
    action_taken: str = None,
    call_duration: int = None,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fu = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
    if not fu:
        raise HTTPException(404, "Follow-up not found")

    fu.status = FollowUpStatus.DONE
    fu.contacted = contacted
    fu.customer_satisfaction = satisfaction
    fu.issues_reported = issues_reported
    fu.action_taken = action_taken
    fu.call_duration_seconds = call_duration
    fu.notes = notes
    fu.completed_at = datetime.utcnow()
    db.commit()
    return {"message": "Follow-up completed"}


# ─────────── CALL LOGS ─────────────────────────────────────────────────────

@router.post("/call-logs", response_model=CallLogOut, status_code=201)
def log_call(
    payload: CallLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = CallLog(**payload.model_dump(), called_by_id=current_user.id)
    db.add(log)

    # Update lead next follow-up date
    if payload.next_call_date:
        from app.models.crm import Lead
        lead = db.query(Lead).filter(Lead.id == payload.lead_id).first()
        if lead:
            lead.next_follow_up = payload.next_call_date
    db.commit()
    db.refresh(log)
    return log


@router.get("/call-logs/lead/{lead_id}", response_model=List[CallLogOut])
def get_call_logs(
    lead_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(CallLog)
        .filter(CallLog.lead_id == lead_id)
        .order_by(CallLog.called_at.desc())
        .all()
    )


@router.get("/pending-calls")
def pending_calls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all leads with follow-up due today or overdue for telecalling."""
    from app.models.crm import Lead
    from sqlalchemy import func as f
    today = datetime.utcnow()
    leads = (
        db.query(Lead)
        .filter(Lead.next_follow_up <= today, Lead.status.notin_(["BOOKED", "LOST", "JUNK"]))
        .order_by(Lead.next_follow_up.asc())
        .limit(100)
        .all()
    )
    from app.schemas.crm import LeadOut
    return [LeadOut.model_validate(l) for l in leads]
