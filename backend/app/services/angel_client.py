from __future__ import annotations
from typing import Any
import httpx
from app.core.config import get_settings


class AngelOneClient:
    """Thin SmartAPI wrapper. Replace mock routes with official endpoints in production."""

    base_url = "https://apiconnect.angelone.in/rest"

    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.angel_api_key
        self.client_code = settings.angel_client_code

    async def _request(self, method: str, path: str, json: dict | None = None) -> dict[str, Any]:
        headers = {"X-PrivateKey": self.api_key, "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.request(method, f"{self.base_url}{path}", json=json, headers=headers)
            response.raise_for_status()
            return response.json()

    async def place_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            return {"status": "success", "orderid": "paper-order", "message": "Paper mode active"}
        return await self._request("POST", "/secure/angelbroking/order/v1/placeOrder", json=payload)

    async def order_book(self) -> dict[str, Any]:
        if not self.api_key:
            return {"data": []}
        return await self._request("GET", "/secure/angelbroking/order/v1/getOrderBook")

    async def holdings(self) -> dict[str, Any]:
        if not self.api_key:
            return {"data": []}
        return await self._request("GET", "/secure/angelbroking/portfolio/v1/getAllHolding")

    async def positions(self) -> dict[str, Any]:
        if not self.api_key:
            return {"data": []}
        return await self._request("GET", "/secure/angelbroking/order/v1/getPosition")

    async def rms_limits(self) -> dict[str, Any]:
        if not self.api_key:
            return {"data": {"net": 0}}
        return await self._request("GET", "/secure/angelbroking/user/v1/getRMS")


angel_client = AngelOneClient()
