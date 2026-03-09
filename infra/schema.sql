-- ============================================================
-- Tata Motors CRM – PostgreSQL Schema
-- Auto-created by SQLAlchemy on startup; this file is for
-- reference documentation and CI/CD purposes.
-- ============================================================

-- Enable UUID extension (if needed in future)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- NOTE: Tables are created automatically by SQLAlchemy Base.metadata.create_all()
-- The application runs migrations on startup. No manual schema creation needed.

-- Example index creation for production performance tuning:
-- CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
-- CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
-- CREATE INDEX IF NOT EXISTS idx_leads_consultant ON leads(assigned_consultant_id);
-- CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
-- CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
-- CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
