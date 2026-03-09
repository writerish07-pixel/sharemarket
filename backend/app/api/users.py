"""User management (HR/Admin functions)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.security import get_current_user, get_password_hash, require_roles
from app.models.crm import User, UserRole
from app.schemas.crm import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/users", tags=["Users"])

GM_ROLES = [UserRole.GENERAL_MANAGER]


@router.get("/", response_model=List[UserOut])
def list_users(
    role: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.full_name).all()


@router.post("/", response_model=UserOut)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.GENERAL_MANAGER)),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    user = User(
        **payload.model_dump(exclude={"password"}),
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # GM can update anyone; others can only update themselves
    if current_user.role != UserRole.GENERAL_MANAGER and current_user.id != user_id:
        raise HTTPException(403, "Forbidden")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.get("/team/{team_leader_id}", response_model=List[UserOut])
def get_team(
    team_leader_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(User).filter(User.team_leader_id == team_leader_id).all()
