"""
Tata Motors CRM – Complete SQLAlchemy Models
Covers: Users, Leads, Customers, Vehicles, Quotations, TestDrives,
        Exchange, Bookings, Finance, Insurance, Accessories, Invoices,
        PDI, Deliveries, FollowUps, Documents, AuditLogs
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Enum,
    ForeignKey, JSON, Date, Numeric, BigInteger,
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db.session import Base


# ─────────────────────────── ENUMS ──────────────────────────────────────────

class UserRole(str, enum.Enum):
    GENERAL_MANAGER       = "GENERAL_MANAGER"
    RECEPTIONIST          = "RECEPTIONIST"
    SALES_MANAGER_EV      = "SALES_MANAGER_EV"
    SALES_MANAGER_PV      = "SALES_MANAGER_PV"
    TEAM_LEADER           = "TEAM_LEADER"
    SALES_CONSULTANT      = "SALES_CONSULTANT"
    FINANCE_MANAGER       = "FINANCE_MANAGER"
    ACCOUNTS_OFFICER      = "ACCOUNTS_OFFICER"
    CASHIER               = "CASHIER"
    ACCESSORIES_MANAGER   = "ACCESSORIES_MANAGER"
    TELECALLING           = "TELECALLING"
    TEST_DRIVE_COORDINATOR = "TEST_DRIVE_COORDINATOR"
    EXCHANGE_MANAGER      = "EXCHANGE_MANAGER"
    INSURANCE_MANAGER     = "INSURANCE_MANAGER"
    PDI_MANAGER           = "PDI_MANAGER"


class LeadSource(str, enum.Enum):
    WALK_IN       = "WALK_IN"
    PHONE         = "PHONE"
    WEBSITE       = "WEBSITE"
    WHATSAPP      = "WHATSAPP"
    REFERRAL      = "REFERRAL"
    SOCIAL_MEDIA  = "SOCIAL_MEDIA"
    TATA_PORTAL   = "TATA_PORTAL"
    EXCHANGE      = "EXCHANGE"
    CAMP          = "CAMP"
    OTHER         = "OTHER"


class LeadStatus(str, enum.Enum):
    NEW            = "NEW"
    ASSIGNED       = "ASSIGNED"
    CONTACTED      = "CONTACTED"
    REQUIREMENT_DONE = "REQUIREMENT_DONE"
    PRESENTATION   = "PRESENTATION"
    QUOTATION_SENT = "QUOTATION_SENT"
    TEST_DRIVE     = "TEST_DRIVE"
    NEGOTIATION    = "NEGOTIATION"
    BOOKED         = "BOOKED"
    LOST           = "LOST"
    JUNK           = "JUNK"


class FuelType(str, enum.Enum):
    PETROL     = "PETROL"
    DIESEL     = "DIESEL"
    CNG        = "CNG"
    ELECTRIC   = "ELECTRIC"
    HYBRID     = "HYBRID"


class TransmissionType(str, enum.Enum):
    MANUAL    = "MANUAL"
    AUTOMATIC = "AUTOMATIC"
    AMT       = "AMT"


class VehicleCategory(str, enum.Enum):
    EV  = "EV"
    PV  = "PV"


class VehicleStatus(str, enum.Enum):
    IN_STOCK   = "IN_STOCK"
    ALLOCATED  = "ALLOCATED"
    IN_TRANSIT = "IN_TRANSIT"
    PDI        = "PDI"
    DELIVERED  = "DELIVERED"
    TEST_DRIVE = "TEST_DRIVE"


class TestDriveStatus(str, enum.Enum):
    SCHEDULED  = "SCHEDULED"
    COMPLETED  = "COMPLETED"
    CANCELLED  = "CANCELLED"
    NO_SHOW    = "NO_SHOW"


class BookingStatus(str, enum.Enum):
    PENDING     = "PENDING"
    CONFIRMED   = "CONFIRMED"
    CANCELLED   = "CANCELLED"
    CONVERTED   = "CONVERTED"


class FinanceStatus(str, enum.Enum):
    DRAFT      = "DRAFT"
    SUBMITTED  = "SUBMITTED"
    APPROVED   = "APPROVED"
    REJECTED   = "REJECTED"
    DISBURSED  = "DISBURSED"


class PDIStatus(str, enum.Enum):
    PENDING    = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    PASSED     = "PASSED"
    FAILED     = "FAILED"
    RECTIFIED  = "RECTIFIED"


class DeliveryStatus(str, enum.Enum):
    SCHEDULED  = "SCHEDULED"
    COMPLETED  = "COMPLETED"
    POSTPONED  = "POSTPONED"


class FollowUpType(str, enum.Enum):
    DAY_1   = "DAY_1"
    DAY_7   = "DAY_7"
    DAY_30  = "DAY_30"
    CUSTOM  = "CUSTOM"


class FollowUpStatus(str, enum.Enum):
    PENDING   = "PENDING"
    DONE      = "DONE"
    MISSED    = "MISSED"


class PaymentMode(str, enum.Enum):
    CASH    = "CASH"
    CARD    = "CARD"
    UPI     = "UPI"
    NEFT    = "NEFT"
    RTGS    = "RTGS"
    CHEQUE  = "CHEQUE"
    EMI     = "EMI"


# ─────────────────────────── USERS ──────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    employee_id  = Column(String(20), unique=True, index=True)
    full_name    = Column(String(100), nullable=False)
    email        = Column(String(150), unique=True, index=True, nullable=False)
    phone        = Column(String(15), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role         = Column(Enum(UserRole), nullable=False)
    department   = Column(String(50))
    team_leader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    manager_id   = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active    = Column(Boolean, default=True)
    avatar_url   = Column(String(500))
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    team_members  = relationship("User", foreign_keys=[team_leader_id], backref=backref("team_leader", remote_side="User.id"), lazy="dynamic")
    leads_assigned = relationship("Lead", foreign_keys="Lead.assigned_consultant_id", back_populates="consultant")
    leads_created  = relationship("Lead", foreign_keys="Lead.created_by_id", back_populates="created_by")
    audit_logs     = relationship("AuditLog", back_populates="user")


# ─────────────────────────── LEADS ──────────────────────────────────────────

class Lead(Base):
    __tablename__ = "leads"

    id               = Column(Integer, primary_key=True, index=True)
    lead_number      = Column(String(20), unique=True, index=True)  # e.g. TM-2024-00001
    source           = Column(Enum(LeadSource), default=LeadSource.WALK_IN)
    status           = Column(Enum(LeadStatus), default=LeadStatus.NEW)

    # Basic info
    customer_name    = Column(String(100), nullable=False)
    phone            = Column(String(15), nullable=False, index=True)
    alternate_phone  = Column(String(15))
    email            = Column(String(150))
    city             = Column(String(50))
    pincode          = Column(String(10))

    # Interest
    interested_model = Column(String(100))
    interested_variant = Column(String(100))
    budget_min       = Column(Numeric(12, 2))
    budget_max       = Column(Numeric(12, 2))
    has_exchange     = Column(Boolean, default=False)
    exchange_brand   = Column(String(50))
    exchange_model   = Column(String(50))
    exchange_year    = Column(Integer)

    # Assignment
    assigned_team_leader_id = Column(Integer, ForeignKey("users.id"))
    assigned_consultant_id  = Column(Integer, ForeignKey("users.id"))
    created_by_id           = Column(Integer, ForeignKey("users.id"))

    # Priority & follow-up
    priority         = Column(String(10), default="MEDIUM")  # HIGH/MEDIUM/LOW
    next_follow_up   = Column(DateTime(timezone=True))
    lost_reason      = Column(Text)
    remarks          = Column(Text)

    # Timestamps
    visit_date       = Column(DateTime(timezone=True), server_default=func.now())
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    consultant       = relationship("User", foreign_keys=[assigned_consultant_id], back_populates="leads_assigned")
    created_by       = relationship("User", foreign_keys=[created_by_id], back_populates="leads_created")
    team_leader      = relationship("User", foreign_keys=[assigned_team_leader_id])
    requirement      = relationship("CustomerRequirement", back_populates="lead", uselist=False)
    quotations       = relationship("Quotation", back_populates="lead")
    test_drives      = relationship("TestDrive", back_populates="lead")
    exchange_vehicle = relationship("ExchangeVehicle", back_populates="lead", uselist=False)
    booking          = relationship("Booking", back_populates="lead", uselist=False)
    call_logs        = relationship("CallLog", back_populates="lead")


# ─────────────────── CUSTOMER REQUIREMENT DISCOVERY ─────────────────────────

class CustomerRequirement(Base):
    __tablename__ = "customer_requirements"

    id              = Column(Integer, primary_key=True, index=True)
    lead_id         = Column(Integer, ForeignKey("leads.id"), unique=True)

    # Family & usage
    family_size     = Column(Integer)
    primary_use     = Column(String(50))         # city/highway/mixed
    monthly_km      = Column(Integer)

    # Preferences
    fuel_preference = Column(Enum(FuelType))
    transmission    = Column(Enum(TransmissionType))
    color_preference = Column(String(50))
    feature_priority = Column(JSON)              # ["safety","mileage","comfort",...]

    # Finance
    finance_required = Column(Boolean, default=False)
    down_payment     = Column(Numeric(12, 2))
    emi_budget       = Column(Numeric(10, 2))

    # Recommended models (system generated)
    recommended_models = Column(JSON)

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    lead            = relationship("Lead", back_populates="requirement")


# ─────────────────────── VEHICLE INVENTORY ──────────────────────────────────

class Vehicle(Base):
    __tablename__ = "vehicles"

    id              = Column(Integer, primary_key=True, index=True)
    vin             = Column(String(17), unique=True, index=True)  # 17-char VIN
    engine_number   = Column(String(30), unique=True)
    model           = Column(String(100), nullable=False)    # Nexon, Punch, Tiago, Altroz, etc.
    variant         = Column(String(100))                    # XE, XZ, XZ+, ...
    color           = Column(String(50))
    color_code      = Column(String(20))
    fuel_type       = Column(Enum(FuelType))
    transmission    = Column(Enum(TransmissionType))
    category        = Column(Enum(VehicleCategory), default=VehicleCategory.PV)
    status          = Column(Enum(VehicleStatus), default=VehicleStatus.IN_STOCK)

    # Pricing
    ex_showroom_price = Column(Numeric(12, 2))
    manufacturing_year = Column(Integer)
    manufacturing_month = Column(Integer)

    # Stock tracking
    stock_location  = Column(String(100))    # yard/showroom/transit
    invoice_date    = Column(Date)           # OEM invoice date
    days_in_stock   = Column(Integer, default=0)

    # Linked bookings/deliveries
    allocated_booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    test_drives      = relationship("TestDrive", back_populates="vehicle")
    pdi_record       = relationship("PDIRecord", back_populates="vehicle", uselist=False)


# ─────────────────────────── QUOTATIONS ─────────────────────────────────────

class Quotation(Base):
    __tablename__ = "quotations"

    id              = Column(Integer, primary_key=True, index=True)
    quote_number    = Column(String(20), unique=True, index=True)  # QT-2024-00001
    lead_id         = Column(Integer, ForeignKey("leads.id"))
    created_by_id   = Column(Integer, ForeignKey("users.id"))

    # Vehicle details
    model           = Column(String(100))
    variant         = Column(String(100))
    color           = Column(String(50))
    fuel_type       = Column(Enum(FuelType))

    # Pricing breakdown
    ex_showroom     = Column(Numeric(12, 2))
    rto_charges     = Column(Numeric(10, 2))
    insurance_amount = Column(Numeric(10, 2))
    accessories_amount = Column(Numeric(10, 2))
    extended_warranty = Column(Numeric(10, 2))
    other_charges   = Column(Numeric(10, 2), default=0)
    discount        = Column(Numeric(10, 2), default=0)
    total_on_road   = Column(Numeric(12, 2))

    # GST
    cgst_amount     = Column(Numeric(10, 2))
    sgst_amount     = Column(Numeric(10, 2))
    igst_amount     = Column(Numeric(10, 2), default=0)

    # Finance
    loan_amount     = Column(Numeric(12, 2))
    down_payment    = Column(Numeric(12, 2))
    emi_amount      = Column(Numeric(10, 2))
    loan_tenure_months = Column(Integer)
    bank_name       = Column(String(100))
    interest_rate   = Column(Float)

    # Status
    is_active       = Column(Boolean, default=True)
    valid_till      = Column(Date)
    pdf_url         = Column(String(500))

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    lead            = relationship("Lead", back_populates="quotations")
    created_by      = relationship("User", foreign_keys=[created_by_id])


# ─────────────────────────── TEST DRIVES ────────────────────────────────────

class TestDrive(Base):
    __tablename__ = "test_drives"

    id              = Column(Integer, primary_key=True, index=True)
    td_number       = Column(String(20), unique=True, index=True)
    lead_id         = Column(Integer, ForeignKey("leads.id"))
    vehicle_id      = Column(Integer, ForeignKey("vehicles.id"))
    coordinator_id  = Column(Integer, ForeignKey("users.id"))
    requested_by_id = Column(Integer, ForeignKey("users.id"))  # sales consultant

    scheduled_at    = Column(DateTime(timezone=True))
    started_at      = Column(DateTime(timezone=True))
    ended_at        = Column(DateTime(timezone=True))
    status          = Column(Enum(TestDriveStatus), default=TestDriveStatus.SCHEDULED)

    # DL verification
    dl_number       = Column(String(20))
    dl_verified     = Column(Boolean, default=False)
    dl_doc_url      = Column(String(500))

    # Outcome
    customer_feedback = Column(Text)
    interest_level  = Column(String(20))   # HIGH/MEDIUM/LOW
    coordinator_notes = Column(Text)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    lead            = relationship("Lead", back_populates="test_drives")
    vehicle         = relationship("Vehicle", back_populates="test_drives")
    coordinator     = relationship("User", foreign_keys=[coordinator_id])
    requested_by    = relationship("User", foreign_keys=[requested_by_id])


# ──────────────────────── EXCHANGE VEHICLE ───────────────────────────────────

class ExchangeVehicle(Base):
    __tablename__ = "exchange_vehicles"

    id              = Column(Integer, primary_key=True, index=True)
    lead_id         = Column(Integer, ForeignKey("leads.id"), unique=True)
    evaluated_by_id = Column(Integer, ForeignKey("users.id"))

    # Vehicle info
    registration_no = Column(String(15))
    brand           = Column(String(50))
    model           = Column(String(50))
    variant         = Column(String(50))
    year            = Column(Integer)
    fuel_type       = Column(Enum(FuelType))
    km_driven       = Column(Integer)
    color           = Column(String(30))

    # Inspection
    inspection_date = Column(Date)
    body_condition  = Column(String(20))     # EXCELLENT/GOOD/FAIR/POOR
    engine_condition = Column(String(20))
    tyre_condition  = Column(String(20))
    interior_condition = Column(String(20))
    damage_notes    = Column(Text)
    photo_urls      = Column(JSON)           # list of photo URLs

    # Valuation
    market_value    = Column(Numeric(12, 2))
    offered_value   = Column(Numeric(12, 2))
    final_value     = Column(Numeric(12, 2))
    approved_by_id  = Column(Integer, ForeignKey("users.id"))
    approved_at     = Column(DateTime(timezone=True))

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    lead            = relationship("Lead", back_populates="exchange_vehicle")
    evaluated_by    = relationship("User", foreign_keys=[evaluated_by_id])
    approved_by     = relationship("User", foreign_keys=[approved_by_id])


# ─────────────────────────── BOOKINGS ───────────────────────────────────────

class Booking(Base):
    __tablename__ = "bookings"

    id              = Column(Integer, primary_key=True, index=True)
    booking_number  = Column(String(20), unique=True, index=True)   # BK-2024-00001
    lead_id         = Column(Integer, ForeignKey("leads.id"), unique=True)
    created_by_id   = Column(Integer, ForeignKey("users.id"))

    # Customer details
    customer_name   = Column(String(100))
    customer_phone  = Column(String(15))
    customer_email  = Column(String(150))
    customer_address = Column(Text)
    customer_dob    = Column(Date)
    aadhar_number   = Column(String(12))
    pan_number      = Column(String(10))

    # Vehicle preference
    model           = Column(String(100))
    variant         = Column(String(100))
    color           = Column(String(50))
    fuel_type       = Column(Enum(FuelType))
    vin             = Column(String(17))    # allocated VIN

    # Booking payment
    booking_amount  = Column(Numeric(10, 2))
    payment_mode    = Column(Enum(PaymentMode))
    payment_reference = Column(String(100))
    payment_date    = Column(Date)
    receipt_number  = Column(String(50))

    status          = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    expected_delivery_date = Column(Date)
    cancellation_reason = Column(Text)
    cancellation_date   = Column(Date)

    # KYC docs
    kyc_docs        = Column(JSON)          # {"aadhar": url, "pan": url, "photo": url}

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    lead            = relationship("Lead", back_populates="booking")
    created_by      = relationship("User", foreign_keys=[created_by_id])
    finance_app     = relationship("FinanceApplication", back_populates="booking", uselist=False)
    insurance       = relationship("InsurancePolicy", back_populates="booking", uselist=False)
    accessories_order = relationship("AccessoriesOrder", back_populates="booking", uselist=False)
    invoice         = relationship("Invoice", back_populates="booking", uselist=False)
    pdi_record      = relationship("PDIRecord", back_populates="booking", uselist=False)
    delivery        = relationship("Delivery", back_populates="booking", uselist=False)


# ──────────────────────── FINANCE APPLICATION ────────────────────────────────

class FinanceApplication(Base):
    __tablename__ = "finance_applications"

    id              = Column(Integer, primary_key=True, index=True)
    app_number      = Column(String(20), unique=True, index=True)
    booking_id      = Column(Integer, ForeignKey("bookings.id"), unique=True)
    handled_by_id   = Column(Integer, ForeignKey("users.id"))

    # Loan details
    bank_name       = Column(String(100))
    loan_amount     = Column(Numeric(12, 2))
    down_payment    = Column(Numeric(12, 2))
    interest_rate   = Column(Float)
    tenure_months   = Column(Integer)
    emi_amount      = Column(Numeric(10, 2))

    # Customer income
    employment_type = Column(String(30))    # SALARIED/SELF_EMPLOYED/BUSINESS
    monthly_income  = Column(Numeric(12, 2))
    company_name    = Column(String(150))
    cibil_score     = Column(Integer)

    # Application status
    status          = Column(Enum(FinanceStatus), default=FinanceStatus.DRAFT)
    submitted_at    = Column(DateTime(timezone=True))
    approved_at     = Column(DateTime(timezone=True))
    rejected_at     = Column(DateTime(timezone=True))
    disbursed_at    = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)

    # Documents
    documents       = Column(JSON)          # {"salary_slip": url, "form16": url, ...}
    bank_reference  = Column(String(100))

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    booking         = relationship("Booking", back_populates="finance_app")
    handled_by      = relationship("User", foreign_keys=[handled_by_id])


# ──────────────────────── INSURANCE POLICY ───────────────────────────────────

class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id              = Column(Integer, primary_key=True, index=True)
    booking_id      = Column(Integer, ForeignKey("bookings.id"), unique=True)
    handled_by_id   = Column(Integer, ForeignKey("users.id"))

    # Policy details
    insurer_name    = Column(String(100))   # Tata AIG, HDFC ERGO, etc.
    policy_type     = Column(String(50))    # COMPREHENSIVE/THIRD_PARTY
    policy_number   = Column(String(50))
    premium_amount  = Column(Numeric(10, 2))
    idv_value       = Column(Numeric(12, 2))

    # Add-ons
    addons          = Column(JSON)          # ["zero_dep","engine_protect","roadside_assist"]
    addon_premium   = Column(Numeric(10, 2), default=0)
    total_premium   = Column(Numeric(10, 2))

    # Validity
    start_date      = Column(Date)
    end_date        = Column(Date)
    policy_doc_url  = Column(String(500))

    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    booking         = relationship("Booking", back_populates="insurance")
    handled_by      = relationship("User", foreign_keys=[handled_by_id])


# ──────────────────────── ACCESSORIES ORDER ──────────────────────────────────

class AccessoryItem(Base):
    __tablename__ = "accessory_items"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(150), nullable=False)
    part_number = Column(String(50))
    category    = Column(String(50))     # PROTECTION/AESTHETIC/TECH/SAFETY
    price       = Column(Numeric(10, 2))
    is_oem      = Column(Boolean, default=True)
    is_active   = Column(Boolean, default=True)
    description = Column(Text)
    image_url   = Column(String(500))


class AccessoriesOrder(Base):
    __tablename__ = "accessories_orders"

    id              = Column(Integer, primary_key=True, index=True)
    order_number    = Column(String(20), unique=True, index=True)
    booking_id      = Column(Integer, ForeignKey("bookings.id"), unique=True)
    handled_by_id   = Column(Integer, ForeignKey("users.id"))

    items           = Column(JSON)    # [{"id":1,"name":"","price":0,"qty":1}, ...]
    subtotal        = Column(Numeric(10, 2))
    gst_amount      = Column(Numeric(10, 2))
    total_amount    = Column(Numeric(10, 2))

    installation_status = Column(String(20), default="PENDING")
    installation_date   = Column(Date)
    approved_by_id  = Column(Integer, ForeignKey("users.id"))

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    booking         = relationship("Booking", back_populates="accessories_order")
    handled_by      = relationship("User", foreign_keys=[handled_by_id])
    approved_by     = relationship("User", foreign_keys=[approved_by_id])


# ────────────────────────── INVOICE / BILLING ────────────────────────────────

class Invoice(Base):
    __tablename__ = "invoices"

    id              = Column(Integer, primary_key=True, index=True)
    invoice_number  = Column(String(20), unique=True, index=True)   # INV-2024-00001
    booking_id      = Column(Integer, ForeignKey("bookings.id"), unique=True)
    generated_by_id = Column(Integer, ForeignKey("users.id"))

    # Customer
    customer_name   = Column(String(100))
    customer_address = Column(Text)
    customer_gstin  = Column(String(15))
    customer_pan    = Column(String(10))

    # Vehicle
    vin             = Column(String(17))
    engine_number   = Column(String(30))
    model           = Column(String(100))
    variant         = Column(String(100))
    color           = Column(String(50))
    hsn_code        = Column(String(20))   # GST HSN for vehicles

    # Price components
    ex_showroom     = Column(Numeric(12, 2))
    discount        = Column(Numeric(10, 2), default=0)
    taxable_value   = Column(Numeric(12, 2))
    cgst_rate       = Column(Float, default=14.0)
    cgst_amount     = Column(Numeric(10, 2))
    sgst_rate       = Column(Float, default=14.0)
    sgst_amount     = Column(Numeric(10, 2))
    igst_rate       = Column(Float, default=0.0)
    igst_amount     = Column(Numeric(10, 2), default=0)
    cess_amount     = Column(Numeric(10, 2), default=0)
    rto_charges     = Column(Numeric(10, 2))
    insurance_amount = Column(Numeric(10, 2))
    accessories_amount = Column(Numeric(10, 2), default=0)
    extended_warranty = Column(Numeric(10, 2), default=0)
    other_charges   = Column(Numeric(10, 2), default=0)
    total_amount    = Column(Numeric(12, 2))

    # Exchange deduction
    exchange_amount = Column(Numeric(12, 2), default=0)
    booking_amount_paid = Column(Numeric(10, 2), default=0)
    loan_amount     = Column(Numeric(12, 2), default=0)
    balance_amount  = Column(Numeric(12, 2))

    # Payment
    payment_mode    = Column(Enum(PaymentMode))
    payment_reference = Column(String(100))
    paid_at         = Column(DateTime(timezone=True))
    receipt_number  = Column(String(50))

    invoice_date    = Column(Date)
    pdf_url         = Column(String(500))

    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    booking         = relationship("Booking", back_populates="invoice")
    generated_by    = relationship("User", foreign_keys=[generated_by_id])
    payments        = relationship("Payment", back_populates="invoice")


class Payment(Base):
    __tablename__ = "payments"

    id              = Column(Integer, primary_key=True, index=True)
    invoice_id      = Column(Integer, ForeignKey("invoices.id"))
    recorded_by_id  = Column(Integer, ForeignKey("users.id"))

    amount          = Column(Numeric(12, 2))
    payment_mode    = Column(Enum(PaymentMode))
    reference_number = Column(String(100))
    bank_name       = Column(String(100))
    cheque_number   = Column(String(50))
    payment_date    = Column(Date)
    receipt_url     = Column(String(500))
    notes           = Column(Text)

    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    invoice         = relationship("Invoice", back_populates="payments")
    recorded_by     = relationship("User", foreign_keys=[recorded_by_id])


# ─────────────────────── PDI (PRE-DELIVERY INSPECTION) ──────────────────────

class PDIRecord(Base):
    __tablename__ = "pdi_records"

    id              = Column(Integer, primary_key=True, index=True)
    pdi_number      = Column(String(20), unique=True, index=True)
    booking_id      = Column(Integer, ForeignKey("bookings.id"), unique=True)
    vehicle_id      = Column(Integer, ForeignKey("vehicles.id"), unique=True)
    conducted_by_id = Column(Integer, ForeignKey("users.id"))

    scheduled_date  = Column(Date)
    conducted_date  = Column(Date)
    status          = Column(Enum(PDIStatus), default=PDIStatus.PENDING)

    # Checklist (JSON of checklist items with pass/fail)
    checklist       = Column(JSON)   # {"exterior":{"paint":true,"glass":true,...},...}
    odometer_reading = Column(Integer)
    fuel_level      = Column(String(20))   # FULL/3/4/HALF/1/4/EMPTY

    # Issues found
    issues_found    = Column(JSON)         # [{"item":"","description":"","severity":""}]
    rectification_notes = Column(Text)
    rectified_at    = Column(DateTime(timezone=True))

    # Sign-off
    inspector_signature = Column(String(500))   # URL to signed image
    passed_at       = Column(DateTime(timezone=True))
    photos          = Column(JSON)              # list of photo URLs

    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    booking         = relationship("Booking", back_populates="pdi_record")
    vehicle         = relationship("Vehicle", back_populates="pdi_record")
    conducted_by    = relationship("User", foreign_keys=[conducted_by_id])


# ─────────────────────────── DELIVERY ───────────────────────────────────────

class Delivery(Base):
    __tablename__ = "deliveries"

    id              = Column(Integer, primary_key=True, index=True)
    delivery_number = Column(String(20), unique=True, index=True)
    booking_id      = Column(Integer, ForeignKey("bookings.id"), unique=True)
    scheduled_by_id = Column(Integer, ForeignKey("users.id"))

    scheduled_date  = Column(Date)
    delivery_time   = Column(String(20))    # e.g. "11:00 AM"
    status          = Column(Enum(DeliveryStatus), default=DeliveryStatus.SCHEDULED)

    # Prep checklist
    vehicle_cleaned  = Column(Boolean, default=False)
    docs_ready       = Column(Boolean, default=False)  # RC, Insurance, etc.
    accessories_fitted = Column(Boolean, default=False)
    fuel_topped      = Column(Boolean, default=False)
    customer_briefing_done = Column(Boolean, default=False)

    # Actual delivery
    completed_at    = Column(DateTime(timezone=True))
    delivered_by_id = Column(Integer, ForeignKey("users.id"))

    # Customer sign-off
    customer_signature_url = Column(String(500))
    delivery_photos = Column(JSON)          # list of photo URLs
    customer_rating = Column(Integer)       # 1-5 star
    customer_remarks = Column(Text)

    # Docs handed
    documents_handed = Column(JSON)   # {"rc_book":true,"insurance":true,...}

    postponed_reason = Column(Text)
    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    booking         = relationship("Booking", back_populates="delivery")
    scheduled_by    = relationship("User", foreign_keys=[scheduled_by_id])
    delivered_by    = relationship("User", foreign_keys=[delivered_by_id])
    follow_ups      = relationship("FollowUp", back_populates="delivery")


# ──────────────────────── POST-DELIVERY FOLLOW-UPS ───────────────────────────

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id              = Column(Integer, primary_key=True, index=True)
    delivery_id     = Column(Integer, ForeignKey("deliveries.id"))
    assigned_to_id  = Column(Integer, ForeignKey("users.id"))   # telecalling team

    follow_up_type  = Column(Enum(FollowUpType))
    due_date        = Column(Date)
    status          = Column(Enum(FollowUpStatus), default=FollowUpStatus.PENDING)

    # Call outcome
    contacted       = Column(Boolean, default=False)
    customer_satisfaction = Column(Integer)   # 1-5
    issues_reported = Column(Text)
    action_taken    = Column(Text)
    call_duration_seconds = Column(Integer)

    completed_at    = Column(DateTime(timezone=True))
    notes           = Column(Text)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    delivery        = relationship("Delivery", back_populates="follow_ups")
    assigned_to     = relationship("User", foreign_keys=[assigned_to_id])


# ──────────────────────── CALL LOGS (TELECALLING) ────────────────────────────

class CallLog(Base):
    __tablename__ = "call_logs"

    id              = Column(Integer, primary_key=True, index=True)
    lead_id         = Column(Integer, ForeignKey("leads.id"))
    called_by_id    = Column(Integer, ForeignKey("users.id"))

    called_at       = Column(DateTime(timezone=True), server_default=func.now())
    duration_seconds = Column(Integer)
    outcome         = Column(String(30))  # ANSWERED/NOT_ANSWERED/CALLBACK/BUSY/WRONG_NUMBER
    next_call_date  = Column(DateTime(timezone=True))
    notes           = Column(Text)

    lead            = relationship("Lead", back_populates="call_logs")
    called_by       = relationship("User", foreign_keys=[called_by_id])


# ─────────────────────────── DOCUMENTS ──────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id              = Column(Integer, primary_key=True, index=True)
    entity_type     = Column(String(50))    # lead/booking/finance/vehicle/...
    entity_id       = Column(Integer)
    doc_type        = Column(String(50))    # aadhar/pan/dl/salary_slip/...
    file_name       = Column(String(255))
    file_url        = Column(String(500))
    file_size_kb    = Column(Integer)
    mime_type       = Column(String(100))
    uploaded_by_id  = Column(Integer, ForeignKey("users.id"))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    uploaded_by     = relationship("User", foreign_keys=[uploaded_by_id])


# ──────────────────────────── AUDIT LOGS ─────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id          = Column(BigInteger, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    action      = Column(String(100))       # CREATE/UPDATE/DELETE/LOGIN/EXPORT
    entity_type = Column(String(50))
    entity_id   = Column(Integer)
    old_values  = Column(JSON)
    new_values  = Column(JSON)
    ip_address  = Column(String(45))
    user_agent  = Column(String(500))
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user        = relationship("User", back_populates="audit_logs")


# ─────────────────────────── NOTIFICATIONS ───────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    title       = Column(String(200))
    message     = Column(Text)
    entity_type = Column(String(50))
    entity_id   = Column(Integer)
    is_read     = Column(Boolean, default=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
