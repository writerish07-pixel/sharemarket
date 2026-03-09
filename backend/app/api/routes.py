"""Central router – aggregates all CRM modules."""

from fastapi import APIRouter
from app.api import (
    auth, users, leads, requirements, vehicles, quotations,
    test_drives, exchange, bookings, finance, insurance,
    accessories, billing, pdi, delivery, followups, dashboard,
)

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(leads.router)
router.include_router(requirements.router)
router.include_router(vehicles.router)
router.include_router(quotations.router)
router.include_router(test_drives.router)
router.include_router(exchange.router)
router.include_router(bookings.router)
router.include_router(finance.router)
router.include_router(insurance.router)
router.include_router(accessories.router)
router.include_router(billing.router)
router.include_router(pdi.router)
router.include_router(delivery.router)
router.include_router(followups.router)
router.include_router(dashboard.router)


@router.get("/health")
def health():
    return {"status": "ok", "service": "Tata Motors CRM API"}
