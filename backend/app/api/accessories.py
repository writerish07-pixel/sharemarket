"""Accessories catalog and orders."""

from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.crm import User, AccessoryItem, AccessoriesOrder, UserRole
from app.schemas.crm import AccessoriesOrderCreate, AccessoriesOrderOut
from app.services.crm_service import generate_order_number

router = APIRouter(prefix="/accessories", tags=["Accessories"])

GST_RATE = Decimal("18.0")


@router.get("/catalog", response_model=List[dict])
def get_catalog(
    category: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(AccessoryItem).filter(AccessoryItem.is_active == True)
    if category:
        q = q.filter(AccessoryItem.category == category)
    items = q.all()
    return [
        {
            "id": i.id, "name": i.name, "part_number": i.part_number,
            "category": i.category, "price": float(i.price), "is_oem": i.is_oem,
            "description": i.description, "image_url": i.image_url,
        }
        for i in items
    ]


@router.post("/catalog", status_code=201)
def add_catalog_item(
    name: str,
    category: str,
    price: float,
    part_number: str = None,
    is_oem: bool = True,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ACCESSORIES_MANAGER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Only Accessories Manager can add items")
    item = AccessoryItem(
        name=name, category=category, price=price,
        part_number=part_number, is_oem=is_oem, description=description,
    )
    db.add(item)
    db.commit()
    return {"message": "Item added", "id": item.id}


@router.post("/orders", response_model=AccessoriesOrderOut, status_code=201)
def create_order(
    payload: AccessoriesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subtotal = Decimal("0")
    for item in payload.items:
        subtotal += Decimal(str(item.get("price", 0))) * int(item.get("qty", 1))

    gst = (subtotal * GST_RATE / Decimal("100")).quantize(Decimal("0.01"))
    total = subtotal + gst

    order = AccessoriesOrder(
        order_number=generate_order_number(db),
        booking_id=payload.booking_id,
        items=payload.items,
        subtotal=subtotal,
        gst_amount=gst,
        total_amount=total,
        notes=payload.notes,
        handled_by_id=current_user.id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders/booking/{booking_id}", response_model=AccessoriesOrderOut)
def get_order(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    order = db.query(AccessoriesOrder).filter(AccessoriesOrder.booking_id == booking_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.post("/orders/{order_id}/approve")
def approve_order(
    order_id: int,
    installation_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.ACCESSORIES_MANAGER, UserRole.GENERAL_MANAGER]:
        raise HTTPException(403, "Insufficient permissions")
    order = db.query(AccessoriesOrder).filter(AccessoriesOrder.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    order.approved_by_id = current_user.id
    order.installation_status = "APPROVED"
    if installation_date:
        from datetime import date
        order.installation_date = date.fromisoformat(installation_date)
    db.commit()
    return {"message": "Order approved"}
