"""Trading API – place orders and view portfolio."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.trading import OrderRequest, OrderResponse
from app.services.trading_service import trading_service

router = APIRouter(prefix="/trading", tags=["Trading"])


@router.post("/order", response_model=OrderResponse)
async def place_order(
    order: OrderRequest,
    db: Session = Depends(get_db),
):
    return await trading_service.place_order(db, order)
