"""Test drive scheduling and management."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, TestDrive, UserRole
from app.schemas.crm import TestDriveCreate, TestDriveUpdate, TestDriveOut
from app.services.crm_service import generate_td_number, log_action

router = APIRouter(prefix="/test-drives", tags=["Test Drives"])


@router.post("/", response_model=TestDriveOut, status_code=201)
def request_test_drive(
    payload: TestDriveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    td = TestDrive(
        **payload.model_dump(),
        td_number=generate_td_number(db),
        requested_by_id=current_user.id,
    )
    db.add(td)
    db.commit()
    db.refresh(td)
    log_action(db, current_user.id, "CREATE", "test_drive", td.id)
    return td


@router.get("/", response_model=List[TestDriveOut])
def list_test_drives(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TestDrive)
    if current_user.role == UserRole.TEST_DRIVE_COORDINATOR:
        q = q.filter(TestDrive.coordinator_id == current_user.id)
    elif current_user.role == UserRole.SALES_CONSULTANT:
        q = q.filter(TestDrive.requested_by_id == current_user.id)
    if status:
        q = q.filter(TestDrive.status == status)
    return q.order_by(TestDrive.scheduled_at.desc()).all()


@router.patch("/{td_id}", response_model=TestDriveOut)
def update_test_drive(
    td_id: int,
    payload: TestDriveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    td = db.query(TestDrive).filter(TestDrive.id == td_id).first()
    if not td:
        raise HTTPException(404, "Test drive not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(td, k, v)
    # Assign coordinator if not set
    if not td.coordinator_id and current_user.role == UserRole.TEST_DRIVE_COORDINATOR:
        td.coordinator_id = current_user.id
    db.commit()
    db.refresh(td)
    return td
