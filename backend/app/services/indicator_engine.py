from __future__ import annotations
import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, EMAIndicator
from ta.volatility import BollingerBands


def compute_indicators(df: pd.DataFrame) -> dict:
    close = df["close"]
    volume = df["volume"]

    ema9 = EMAIndicator(close, window=9).ema_indicator().iloc[-1]
    ema21 = EMAIndicator(close, window=21).ema_indicator().iloc[-1]
    ema50 = EMAIndicator(close, window=50).ema_indicator().iloc[-1]
    rsi = RSIIndicator(close, window=14).rsi().iloc[-1]
    macd = MACD(close)
    bb = BollingerBands(close)
    vwap = (df["close"] * volume).cumsum().iloc[-1] / volume.cumsum().iloc[-1]

    return {
        "ema9": float(ema9),
        "ema21": float(ema21),
        "ema50": float(ema50),
        "rsi": float(rsi),
        "macd": float(macd.macd().iloc[-1]),
        "macd_signal": float(macd.macd_signal().iloc[-1]),
        "vwap": float(vwap),
        "bb_high": float(bb.bollinger_hband().iloc[-1]),
        "bb_low": float(bb.bollinger_lband().iloc[-1]),
    }
