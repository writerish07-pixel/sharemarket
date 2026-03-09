// ─────────────────── Core Enums ─────────────────────────────────────────────

export type UserRole =
  | 'GENERAL_MANAGER' | 'RECEPTIONIST' | 'SALES_MANAGER_EV' | 'SALES_MANAGER_PV'
  | 'TEAM_LEADER' | 'SALES_CONSULTANT' | 'FINANCE_MANAGER' | 'ACCOUNTS_OFFICER'
  | 'CASHIER' | 'ACCESSORIES_MANAGER' | 'TELECALLING' | 'TEST_DRIVE_COORDINATOR'
  | 'EXCHANGE_MANAGER' | 'INSURANCE_MANAGER' | 'PDI_MANAGER';

export type LeadStatus =
  | 'NEW' | 'ASSIGNED' | 'CONTACTED' | 'REQUIREMENT_DONE'
  | 'PRESENTATION' | 'QUOTATION_SENT' | 'TEST_DRIVE' | 'NEGOTIATION'
  | 'BOOKED' | 'LOST' | 'JUNK';

export type LeadSource =
  | 'WALK_IN' | 'PHONE' | 'WEBSITE' | 'WHATSAPP' | 'REFERRAL'
  | 'SOCIAL_MEDIA' | 'TATA_PORTAL' | 'EXCHANGE' | 'CAMP' | 'OTHER';

export type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'AMT';
export type VehicleStatus = 'IN_STOCK' | 'ALLOCATED' | 'IN_TRANSIT' | 'PDI' | 'DELIVERED' | 'TEST_DRIVE';
export type VehicleCategory = 'EV' | 'PV';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED';
export type FinanceStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
export type PDIStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'RECTIFIED';
export type DeliveryStatus = 'SCHEDULED' | 'COMPLETED' | 'POSTPONED';
export type FollowUpStatus = 'PENDING' | 'DONE' | 'MISSED';

// ─────────────────── Models ──────────────────────────────────────────────────

export interface User {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string;
  team_leader_id?: number;
  manager_id?: number;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Lead {
  id: number;
  lead_number: string;
  source: LeadSource;
  status: LeadStatus;
  customer_name: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  city?: string;
  interested_model?: string;
  interested_variant?: string;
  budget_min?: number;
  budget_max?: number;
  has_exchange: boolean;
  assigned_team_leader_id?: number;
  assigned_consultant_id?: number;
  created_by_id?: number;
  priority: string;
  next_follow_up?: string;
  visit_date: string;
  created_at: string;
  updated_at?: string;
}

export interface Vehicle {
  id: number;
  vin: string;
  engine_number: string;
  model: string;
  variant: string;
  color: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  category: VehicleCategory;
  status: VehicleStatus;
  ex_showroom_price: number;
  manufacturing_year: number;
  manufacturing_month: number;
  stock_location: string;
  days_in_stock: number;
  created_at: string;
}

export interface Quotation {
  id: number;
  quote_number: string;
  lead_id: number;
  created_by_id: number;
  model: string;
  variant: string;
  color: string;
  fuel_type: FuelType;
  ex_showroom: number;
  rto_charges: number;
  insurance_amount: number;
  accessories_amount: number;
  extended_warranty: number;
  discount: number;
  cgst_amount: number;
  sgst_amount: number;
  total_on_road: number;
  loan_amount?: number;
  emi_amount?: number;
  loan_tenure_months?: number;
  bank_name?: string;
  is_active: boolean;
  valid_till?: string;
  pdf_url?: string;
  notes?: string;
  created_at: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  lead_id: number;
  customer_name: string;
  customer_phone: string;
  model: string;
  variant: string;
  color: string;
  fuel_type: FuelType;
  vin?: string;
  booking_amount: number;
  payment_mode: string;
  status: BookingStatus;
  expected_delivery_date?: string;
  receipt_number?: string;
  created_at: string;
}

export interface FinanceApplication {
  id: number;
  app_number: string;
  booking_id: number;
  bank_name: string;
  loan_amount: number;
  down_payment: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount?: number;
  status: FinanceStatus;
  submitted_at?: string;
  approved_at?: string;
  disbursed_at?: string;
  bank_reference?: string;
  created_at: string;
}

export interface TestDrive {
  id: number;
  td_number: string;
  lead_id: number;
  vehicle_id: number;
  coordinator_id?: number;
  scheduled_at: string;
  status: string;
  dl_number?: string;
  dl_verified: boolean;
  customer_feedback?: string;
  interest_level?: string;
  created_at: string;
}

export interface Delivery {
  id: number;
  delivery_number: string;
  booking_id: number;
  scheduled_date: string;
  delivery_time: string;
  status: DeliveryStatus;
  vehicle_cleaned: boolean;
  docs_ready: boolean;
  accessories_fitted: boolean;
  fuel_topped: boolean;
  customer_briefing_done: boolean;
  completed_at?: string;
  customer_rating?: number;
  created_at: string;
}

export interface PDIRecord {
  id: number;
  pdi_number: string;
  booking_id: number;
  vehicle_id: number;
  status: PDIStatus;
  scheduled_date?: string;
  conducted_date?: string;
  checklist?: Record<string, Record<string, boolean>>;
  issues_found?: Array<Record<string, string>>;
  odometer_reading?: number;
  fuel_level?: string;
  passed_at?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  booking_id: number;
  customer_name: string;
  vin?: string;
  engine_number?: string;
  model: string;
  variant: string;
  ex_showroom: number;
  cgst_amount: number;
  sgst_amount: number;
  total_amount: number;
  balance_amount: number;
  invoice_date: string;
  pdf_url?: string;
  created_at: string;
}

export interface FollowUp {
  id: number;
  delivery_id: number;
  assigned_to_id?: number;
  follow_up_type: string;
  due_date: string;
  status: FollowUpStatus;
  contacted: boolean;
  customer_satisfaction?: number;
  issues_reported?: string;
  completed_at?: string;
}

export interface CallLog {
  id: number;
  lead_id: number;
  called_by_id: number;
  called_at: string;
  outcome: string;
  duration_seconds?: number;
  next_call_date?: string;
  notes?: string;
}

// ─────────────────── Auth ────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
}

// ─────────────────── Dashboard ───────────────────────────────────────────────

export interface GMDashboardData {
  total_leads_today: number;
  total_leads_month: number;
  total_bookings_month: number;
  total_deliveries_month: number;
  revenue_month: number;
  ev_sales_month: number;
  pv_sales_month: number;
  conversion_rate: number;
  leads_by_status: Record<string, number>;
  leads_by_source: Record<string, number>;
  top_consultants: Array<{ name: string; bookings: number }>;
}

// ─────────────────── Accessory ───────────────────────────────────────────────

export interface AccessoryItem {
  id: number;
  name: string;
  part_number?: string;
  category: string;
  price: number;
  is_oem: boolean;
  description?: string;
  image_url?: string;
}

export interface AccessoriesOrder {
  id: number;
  order_number: string;
  booking_id: number;
  items: Array<{ id: number; name: string; price: number; qty: number }>;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  installation_status: string;
  installation_date?: string;
  created_at: string;
}
