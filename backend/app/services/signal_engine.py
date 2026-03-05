from __future__ import annotations
from datetime import datetime
import pandas as pd
from app.schemas.trading import Signal
from app.services.indicator_engine import compute_indicators


class SignalEngine:
    def generate_signal(self, symbol: str, ohlcv: pd.DataFrame) -> Signal | None:
        indicators = compute_indicators(ohlcv)
        last_price = float(ohlcv["close"].iloc[-1])

        bullish = (
            indicators["ema9"] > indicators["ema21"] > indicators["ema50"]
            and indicators["macd"] > indicators["macd_signal"]
            and indicators["rsi"] < 70
            and last_price > indicators["vwap"]
        )
        bearish = (
            indicators["ema9"] < indicators["ema21"] < indicators["ema50"]
            and indicators["macd"] < indicators["macd_signal"]
            and indicators["rsi"] > 30
            and last_price < indicators["vwap"]
        )

        if not bullish and not bearish:
            return None

        direction = "BULLISH" if bullish else "BEARISH"
        stop_loss = round(last_price * (0.995 if bullish else 1.005), 2)
        target = round(last_price * (1.01 if bullish else 0.99), 2)
        risk = abs(last_price - stop_loss)
        reward = abs(target - last_price)
        rr = reward / risk if risk else 0
        confidence = min(0.85, 0.6 + (rr / 10))

        return Signal(
            symbol=symbol,
            trend=direction,
            entry_price=round(last_price, 2),
            stop_loss=stop_loss,
            target_price=target,
            risk_reward=round(rr, 2),
            confidence=round(confidence, 2),
            indicators=indicators,
            generated_at=datetime.utcnow(),
        )


signal_engine = SignalEngine()
