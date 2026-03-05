from __future__ import annotations
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.trading import OrderRequest, PortfolioSnapshot
from app.services.angel_client import angel_client
from app.services.market_data import market_router
from app.services.signal_engine import signal_engine
from app.services.trading_service import trading_service
from app.ws.manager import ws_manager

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/orders")
async def place_order(order: OrderRequest, db: Session = Depends(get_db)):
    return await trading_service.place_order(db, order)


@router.get("/portfolio", response_model=PortfolioSnapshot)
async def portfolio_snapshot():
    holdings = (await angel_client.holdings()).get("data", [])
    positions = (await angel_client.positions()).get("data", [])
    realized = sum(float(p.get("realised", 0)) for p in positions) if positions else 0
    unrealized = sum(float(p.get("unrealised", 0)) for p in positions) if positions else 0
    return PortfolioSnapshot(
        holdings=holdings,
        positions=positions,
        realized_pnl=realized,
        unrealized_pnl=unrealized,
    )


@router.get("/signals/{symbol}")
def signal(symbol: str):
    candles = 100
    df = pd.DataFrame(
        {
            "close": np.cumsum(np.random.randn(candles)) + 100,
            "volume": np.random.randint(10_000, 100_000, size=candles),
        }
    )
    generated = signal_engine.generate_signal(symbol, df)
    return generated.model_dump() if generated else {"signal": None}


@router.websocket("/ws/market")
async def market_socket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        async for tick in market_router.stream_symbols(["NSE:NIFTY50", "NSE:BANKNIFTY", "NSE:RELIANCE"]):
            await websocket.send_json({
                "symbol": tick.symbol,
                "ltp": tick.ltp,
                "volume": tick.volume,
                "timestamp": tick.timestamp.isoformat(),
                "provider": market_router.active_provider.name if market_router.active_provider else "unknown",
            })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
