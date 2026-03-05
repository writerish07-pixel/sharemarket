from datetime import datetime
from pydantic import BaseModel, Field


class OrderRequest(BaseModel):
    symbol: str
    side: str = Field(pattern="^(BUY|SELL)$")
    quantity: int = Field(gt=0)
    order_type: str = Field(pattern="^(MARKET|LIMIT|SL|BO)$")
    price: float | None = None
    product_type: str = "INTRADAY"
    exchange: str = "NSE"


class OrderResponse(BaseModel):
    status: str
    broker_order_id: str | None
    message: str


class Signal(BaseModel):
    symbol: str
    trend: str
    entry_price: float
    stop_loss: float
    target_price: float
    risk_reward: float
    confidence: float
    indicators: dict
    generated_at: datetime


class PortfolioSnapshot(BaseModel):
    holdings: list[dict]
    positions: list[dict]
    realized_pnl: float
    unrealized_pnl: float
