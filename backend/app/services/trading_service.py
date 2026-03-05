from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.trading import TradeLog
from app.schemas.trading import OrderRequest, OrderResponse
from app.services.angel_client import angel_client


class TradingService:
    async def place_order(self, db: Session, order: OrderRequest) -> OrderResponse:
        payload = {
            "tradingsymbol": order.symbol,
            "transactiontype": order.side,
            "exchange": order.exchange,
            "ordertype": order.order_type,
            "producttype": order.product_type,
            "quantity": str(order.quantity),
            "price": str(order.price or 0),
            "duration": "DAY",
        }
        response = await angel_client.place_order(payload)
        broker_order_id = response.get("orderid")

        log = TradeLog(
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            order_type=order.order_type,
            price=order.price or 0,
            status=response.get("status", "unknown").upper(),
            broker_order_id=broker_order_id,
            meta=response,
        )
        db.add(log)
        db.commit()

        return OrderResponse(
            status=response.get("status", "success"),
            broker_order_id=broker_order_id,
            message=response.get("message", "Order submitted"),
        )


trading_service = TradingService()
