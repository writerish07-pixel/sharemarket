"""
Pydantic schemas for Tata Motors CRM API request/response validation.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.crm import (
    UserRole, LeadSource, LeadStatus, FuelType, TransmissionType,
    VehicleCategory, VehicleStatus, TestDriveStatus, BookingStatus,
    FinanceStatus, PDIStatus, DeliveryStatus, FollowUpType,
    FollowUpStatus, PaymentMode,
)


# ────────────────── AUTH ──────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ────────────────── USERS ─────────────────────────────────────────────────────

class UserCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    phone: str
    password: str
    role: UserRole
    department: Optional[str] = None
    team_leader_id: Optional[int] = None
    manager_id: Optional[int] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    team_leader_id: Optional[int] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None


class UserOut(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: str
    phone: str
    role: UserRole
    department: Optional[str]
    team_leader_id: Optional[int]
    manager_id: Optional[int]
    is_active: bool
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── LEADS ─────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    source: LeadSource = LeadSource.WALK_IN
    customer_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    alternate_phone: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    interested_model: Optional[str] = None
    interested_variant: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    has_exchange: bool = False
    exchange_brand: Optional[str] = None
    exchange_model: Optional[str] = None
    exchange_year: Optional[int] = None
    assigned_team_leader_id: Optional[int] = None
    assigned_consultant_id: Optional[int] = None
    priority: str = "MEDIUM"
    remarks: Optional[str] = None


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    interested_model: Optional[str] = None
    interested_variant: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    has_exchange: Optional[bool] = None
    assigned_team_leader_id: Optional[int] = None
    assigned_consultant_id: Optional[int] = None
    priority: Optional[str] = None
    next_follow_up: Optional[datetime] = None
    lost_reason: Optional[str] = None
    remarks: Optional[str] = None


class LeadOut(BaseModel):
    id: int
    lead_number: str
    source: LeadSource
    status: LeadStatus
    customer_name: str
    phone: str
    alternate_phone: Optional[str]
    email: Optional[str]
    city: Optional[str]
    interested_model: Optional[str]
    interested_variant: Optional[str]
    budget_min: Optional[Decimal]
    budget_max: Optional[Decimal]
    has_exchange: bool
    assigned_team_leader_id: Optional[int]
    assigned_consultant_id: Optional[int]
    created_by_id: Optional[int]
    priority: str
    next_follow_up: Optional[datetime]
    visit_date: datetime
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ────────────────── CUSTOMER REQUIREMENT ─────────────────────────────────────

class RequirementCreate(BaseModel):
    lead_id: int
    family_size: Optional[int] = None
    primary_use: Optional[str] = None
    monthly_km: Optional[int] = None
    fuel_preference: Optional[FuelType] = None
    transmission: Optional[TransmissionType] = None
    color_preference: Optional[str] = None
    feature_priority: Optional[List[str]] = None
    finance_required: bool = False
    down_payment: Optional[Decimal] = None
    emi_budget: Optional[Decimal] = None
    notes: Optional[str] = None


class RequirementOut(BaseModel):
    id: int
    lead_id: int
    family_size: Optional[int]
    primary_use: Optional[str]
    monthly_km: Optional[int]
    fuel_preference: Optional[FuelType]
    transmission: Optional[TransmissionType]
    color_preference: Optional[str]
    feature_priority: Optional[List[str]]
    finance_required: bool
    down_payment: Optional[Decimal]
    emi_budget: Optional[Decimal]
    recommended_models: Optional[List[str]]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── VEHICLES ──────────────────────────────────────────────────

class VehicleCreate(BaseModel):
    vin: str = Field(..., min_length=17, max_length=17)
    engine_number: str
    model: str
    variant: str
    color: str
    color_code: Optional[str] = None
    fuel_type: FuelType
    transmission: TransmissionType
    category: VehicleCategory = VehicleCategory.PV
    ex_showroom_price: Decimal
    manufacturing_year: int
    manufacturing_month: int
    stock_location: str = "YARD"
    invoice_date: Optional[date] = None


class VehicleOut(BaseModel):
    id: int
    vin: str
    engine_number: str
    model: str
    variant: str
    color: str
    fuel_type: FuelType
    transmission: TransmissionType
    category: VehicleCategory
    status: VehicleStatus
    ex_showroom_price: Decimal
    manufacturing_year: int
    manufacturing_month: int
    stock_location: str
    days_in_stock: int
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── QUOTATIONS ────────────────────────────────────────────────

class QuotationCreate(BaseModel):
    lead_id: int
    model: str
    variant: str
    color: str
    fuel_type: FuelType
    ex_showroom: Decimal
    rto_charges: Decimal
    insurance_amount: Decimal
    accessories_amount: Decimal = Decimal("0")
    extended_warranty: Decimal = Decimal("0")
    other_charges: Decimal = Decimal("0")
    discount: Decimal = Decimal("0")
    cgst_amount: Decimal
    sgst_amount: Decimal
    igst_amount: Decimal = Decimal("0")
    loan_amount: Optional[Decimal] = None
    down_payment: Optional[Decimal] = None
    emi_amount: Optional[Decimal] = None
    loan_tenure_months: Optional[int] = None
    bank_name: Optional[str] = None
    interest_rate: Optional[float] = None
    valid_till: Optional[date] = None
    notes: Optional[str] = None


class QuotationOut(BaseModel):
    id: int
    quote_number: str
    lead_id: int
    created_by_id: int
    model: str
    variant: str
    color: str
    fuel_type: FuelType
    ex_showroom: Decimal
    rto_charges: Decimal
    insurance_amount: Decimal
    accessories_amount: Decimal
    extended_warranty: Decimal
    discount: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    total_on_road: Decimal
    loan_amount: Optional[Decimal]
    emi_amount: Optional[Decimal]
    loan_tenure_months: Optional[int]
    bank_name: Optional[str]
    is_active: bool
    valid_till: Optional[date]
    pdf_url: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── TEST DRIVES ───────────────────────────────────────────────

class TestDriveCreate(BaseModel):
    lead_id: int
    vehicle_id: int
    scheduled_at: datetime
    dl_number: Optional[str] = None


class TestDriveUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[TestDriveStatus] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    dl_number: Optional[str] = None
    dl_verified: Optional[bool] = None
    customer_feedback: Optional[str] = None
    interest_level: Optional[str] = None
    coordinator_notes: Optional[str] = None


class TestDriveOut(BaseModel):
    id: int
    td_number: str
    lead_id: int
    vehicle_id: int
    coordinator_id: Optional[int]
    scheduled_at: datetime
    status: TestDriveStatus
    dl_number: Optional[str]
    dl_verified: bool
    customer_feedback: Optional[str]
    interest_level: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── EXCHANGE VEHICLE ──────────────────────────────────────────

class ExchangeCreate(BaseModel):
    lead_id: int
    registration_no: str
    brand: str
    model: str
    variant: Optional[str] = None
    year: int
    fuel_type: FuelType
    km_driven: int
    color: Optional[str] = None
    body_condition: Optional[str] = None
    engine_condition: Optional[str] = None
    tyre_condition: Optional[str] = None
    interior_condition: Optional[str] = None
    damage_notes: Optional[str] = None
    market_value: Optional[Decimal] = None
    offered_value: Optional[Decimal] = None
    notes: Optional[str] = None


class ExchangeOut(BaseModel):
    id: int
    lead_id: int
    registration_no: str
    brand: str
    model: str
    year: int
    km_driven: int
    offered_value: Optional[Decimal]
    final_value: Optional[Decimal]
    approved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── BOOKINGS ──────────────────────────────────────────────────

class BookingCreate(BaseModel):
    lead_id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[EmailStr] = None
    customer_address: str
    customer_dob: Optional[date] = None
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    model: str
    variant: str
    color: str
    fuel_type: FuelType
    booking_amount: Decimal
    payment_mode: PaymentMode
    payment_reference: Optional[str] = None
    payment_date: date
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None


class BookingOut(BaseModel):
    id: int
    booking_number: str
    lead_id: int
    customer_name: str
    customer_phone: str
    model: str
    variant: str
    color: str
    fuel_type: FuelType
    vin: Optional[str]
    booking_amount: Decimal
    payment_mode: PaymentMode
    status: BookingStatus
    expected_delivery_date: Optional[date]
    receipt_number: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── FINANCE ───────────────────────────────────────────────────

class FinanceCreate(BaseModel):
    booking_id: int
    bank_name: str
    loan_amount: Decimal
    down_payment: Decimal
    interest_rate: float
    tenure_months: int
    employment_type: str
    monthly_income: Decimal
    company_name: Optional[str] = None
    cibil_score: Optional[int] = None
    notes: Optional[str] = None


class FinanceOut(BaseModel):
    id: int
    app_number: str
    booking_id: int
    bank_name: str
    loan_amount: Decimal
    down_payment: Decimal
    interest_rate: float
    tenure_months: int
    emi_amount: Optional[Decimal]
    status: FinanceStatus
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    disbursed_at: Optional[datetime]
    bank_reference: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── INSURANCE ─────────────────────────────────────────────────

class InsuranceCreate(BaseModel):
    booking_id: int
    insurer_name: str
    policy_type: str
    premium_amount: Decimal
    idv_value: Decimal
    addons: Optional[List[str]] = None
    addon_premium: Optional[Decimal] = None
    start_date: date
    end_date: date


class InsuranceOut(BaseModel):
    id: int
    booking_id: int
    insurer_name: str
    policy_type: str
    policy_number: Optional[str]
    premium_amount: Decimal
    idv_value: Decimal
    addons: Optional[List[str]]
    total_premium: Decimal
    start_date: date
    end_date: date
    policy_doc_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── ACCESSORIES ───────────────────────────────────────────────

class AccessoriesOrderCreate(BaseModel):
    booking_id: int
    items: List[Dict[str, Any]]   # [{"id":1,"name":"","price":0,"qty":1}]
    notes: Optional[str] = None


class AccessoriesOrderOut(BaseModel):
    id: int
    order_number: str
    booking_id: int
    items: List[Dict[str, Any]]
    subtotal: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    installation_status: str
    installation_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── INVOICE ───────────────────────────────────────────────────

class InvoiceCreate(BaseModel):
    booking_id: int
    customer_gstin: Optional[str] = None
    discount: Decimal = Decimal("0")
    payment_mode: PaymentMode
    payment_reference: Optional[str] = None
    invoice_date: date


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    booking_id: int
    customer_name: str
    vin: Optional[str]
    engine_number: Optional[str]
    model: str
    variant: str
    ex_showroom: Decimal
    cgst_amount: Decimal
    sgst_amount: Decimal
    total_amount: Decimal
    balance_amount: Decimal
    invoice_date: date
    pdf_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── PDI ───────────────────────────────────────────────────────

PDI_CHECKLIST_TEMPLATE = {
    "exterior": {
        "paint_quality": False,
        "panel_gaps": False,
        "glass_condition": False,
        "headlamps": False,
        "taillamps": False,
        "tyres_pressure": False,
        "wheel_alignment": False,
    },
    "interior": {
        "seat_condition": False,
        "dashboard": False,
        "infotainment": False,
        "ac_system": False,
        "windows": False,
        "sunroof": False,
    },
    "mechanical": {
        "engine_start": False,
        "brake_test": False,
        "steering": False,
        "suspension": False,
        "transmission": False,
        "battery_ev": False,
    },
    "electrical": {
        "all_lights": False,
        "horn": False,
        "wipers": False,
        "central_locking": False,
        "sensors": False,
    },
    "documents": {
        "owner_manual": False,
        "service_booklet": False,
        "warranty_card": False,
        "duplicate_key": False,
    },
}


class PDICreate(BaseModel):
    booking_id: int
    vehicle_id: int
    scheduled_date: date
    checklist: Optional[Dict[str, Any]] = None


class PDIUpdate(BaseModel):
    status: Optional[PDIStatus] = None
    conducted_date: Optional[date] = None
    checklist: Optional[Dict[str, Any]] = None
    odometer_reading: Optional[int] = None
    fuel_level: Optional[str] = None
    issues_found: Optional[List[Dict[str, Any]]] = None
    rectification_notes: Optional[str] = None
    notes: Optional[str] = None


class PDIOut(BaseModel):
    id: int
    pdi_number: str
    booking_id: int
    vehicle_id: int
    status: PDIStatus
    scheduled_date: Optional[date]
    conducted_date: Optional[date]
    checklist: Optional[Dict[str, Any]]
    issues_found: Optional[List[Dict[str, Any]]]
    odometer_reading: Optional[int]
    fuel_level: Optional[str]
    passed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── DELIVERY ──────────────────────────────────────────────────

class DeliveryCreate(BaseModel):
    booking_id: int
    scheduled_date: date
    delivery_time: str = "11:00 AM"


class DeliveryUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    delivery_time: Optional[str] = None
    status: Optional[DeliveryStatus] = None
    vehicle_cleaned: Optional[bool] = None
    docs_ready: Optional[bool] = None
    accessories_fitted: Optional[bool] = None
    fuel_topped: Optional[bool] = None
    customer_briefing_done: Optional[bool] = None
    customer_rating: Optional[int] = None
    customer_remarks: Optional[str] = None
    documents_handed: Optional[Dict[str, bool]] = None
    postponed_reason: Optional[str] = None
    notes: Optional[str] = None


class DeliveryOut(BaseModel):
    id: int
    delivery_number: str
    booking_id: int
    scheduled_date: date
    delivery_time: str
    status: DeliveryStatus
    vehicle_cleaned: bool
    docs_ready: bool
    accessories_fitted: bool
    fuel_topped: bool
    customer_briefing_done: bool
    completed_at: Optional[datetime]
    customer_rating: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ────────────────── FOLLOW-UPS ────────────────────────────────────────────────

class FollowUpOut(BaseModel):
    id: int
    delivery_id: int
    assigned_to_id: Optional[int]
    follow_up_type: FollowUpType
    due_date: date
    status: FollowUpStatus
    contacted: bool
    customer_satisfaction: Optional[int]
    issues_reported: Optional[str]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ────────────────── CALL LOG ──────────────────────────────────────────────────

class CallLogCreate(BaseModel):
    lead_id: int
    outcome: str
    duration_seconds: Optional[int] = None
    next_call_date: Optional[datetime] = None
    notes: Optional[str] = None


class CallLogOut(BaseModel):
    id: int
    lead_id: int
    called_by_id: int
    called_at: datetime
    outcome: str
    duration_seconds: Optional[int]
    next_call_date: Optional[datetime]
    notes: Optional[str]

    class Config:
        from_attributes = True


# ────────────────── DASHBOARD ─────────────────────────────────────────────────

class GMDashboard(BaseModel):
    total_leads_today: int
    total_leads_month: int
    total_bookings_month: int
    total_deliveries_month: int
    revenue_month: Decimal
    ev_sales_month: int
    pv_sales_month: int
    conversion_rate: float
    leads_by_status: Dict[str, int]
    leads_by_source: Dict[str, int]
    top_consultants: List[Dict[str, Any]]


class SalesManagerDashboard(BaseModel):
    category: str  # EV or PV
    total_leads: int
    bookings: int
    deliveries: int
    target: int
    achievement_pct: float
    team_leaders: List[Dict[str, Any]]


class TeamLeaderDashboard(BaseModel):
    team_size: int
    total_leads: int
    contacted: int
    booked: int
    conversion_rate: float
    consultants: List[Dict[str, Any]]


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int
