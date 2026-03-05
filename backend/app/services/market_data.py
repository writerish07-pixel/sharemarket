from __future__ import annotations
import asyncio
import random
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass
class Tick:
    symbol: str
    ltp: float
    volume: int
    timestamp: datetime


class BaseMarketFeed:
    name = "base"
    latency_score = 999

    async def connect(self) -> None:
        return None

    async def fetch_tick(self, symbol: str) -> Tick:
        base = 100 + random.random() * 10
        return Tick(symbol=symbol, ltp=base, volume=random.randint(1000, 100000), timestamp=datetime.utcnow())


class AngelMarketFeed(BaseMarketFeed):
    name = "angel"
    latency_score = 5


class AlpacaMarketFeed(BaseMarketFeed):
    name = "alpaca"
    latency_score = 15


class PolygonMarketFeed(BaseMarketFeed):
    name = "polygon"
    latency_score = 10


class YFinanceFeed(BaseMarketFeed):
    name = "yfinance"
    latency_score = 40


class MarketDataRouter:
    def __init__(self) -> None:
        self.providers = [AngelMarketFeed(), PolygonMarketFeed(), AlpacaMarketFeed(), YFinanceFeed()]
        self.active_provider: BaseMarketFeed | None = None

    async def select_best_provider(self) -> BaseMarketFeed:
        self.active_provider = sorted(self.providers, key=lambda p: p.latency_score)[0]
        await self.active_provider.connect()
        return self.active_provider

    async def stream_symbols(self, symbols: list[str]):
        provider = self.active_provider or await self.select_best_provider()
        while True:
            for symbol in symbols:
                yield await provider.fetch_tick(symbol)
            await asyncio.sleep(0.5)


market_router = MarketDataRouter()
