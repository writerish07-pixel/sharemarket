# Tata Motors Dealership CRM

**Production-grade Digital Dealership Management System**
Authorized Tata Motors Dealership · Jaipur, Rajasthan

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                     │
│          Role-based dashboards · TypeScript · Tailwind        │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API (JWT)
┌──────────────────────────▼───────────────────────────────────┐
│                  Backend (FastAPI + Python 3.11)              │
│        JWT Auth · RBAC · SQLAlchemy ORM · Pydantic            │
└──────┬───────────────────┬──────────────────────┬────────────┘
       │                   │                      │
┌──────▼──────┐   ┌────────▼──────┐   ┌──────────▼─────┐
│ PostgreSQL  │   │     Redis     │   │  File Storage  │
│   (CRM DB)  │   │  (caching)    │   │ (docs/photos)  │
└─────────────┘   └───────────────┘   └────────────────┘
```

## Staff Roles Supported (15 roles)

| Role | Department | Key Access |
|------|-----------|------------|
| General Manager | Leadership | Full system + all dashboards |
| Receptionist | Reception | Lead capture, walk-in, QR |
| Sales Manager EV | Sales | EV team performance |
| Sales Manager PV | Sales | PV team performance |
| Team Leader (5) | Sales | Team monitoring, lead distribution |
| Sales Consultant (25+) | Sales | Leads, quotations, bookings |
| Finance Manager | Finance | Loan applications |
| Accounts Officer | Finance | Invoice generation |
| Cashier | Finance | Payment recording |
| Accessories Manager | Accessories | Catalog, orders |
| Telecalling Team | Customer Experience | Follow-ups, call logs |
| Test Drive Coordinator | Vehicle Ops | Test drive scheduling |
| Exchange Manager | Vehicle Ops | Old car valuation |
| Insurance Manager | Vehicle Ops | Policy creation |
| PDI Manager | Vehicle Ops | Pre-delivery inspection |

## Customer Journey (15 Stages)

1. **Reception** → Walk-in capture, QR lead, auto-assignment
2. **Requirement Discovery** → Digital questionnaire + AI recommendations
3. **Product Presentation** → Vehicle catalog with specs/variants
4. **Quotation** → On-road price with GST breakup, PDF/WhatsApp share
5. **Test Drive** → Scheduling, DL verification, feedback
6. **Exchange Evaluation** → Inspection, photos, valuation approval
7. **Booking** → KYC upload, payment, digital receipt
8. **Finance** → Multi-bank loan applications, approval tracking
9. **Insurance** → Multi-insurer comparison, add-on selection
10. **Accessories** → OEM catalog, order management, billing link
11. **Billing** → GST invoice (28%), multi-payment recording
12. **Vehicle Allocation** → VIN-level stock tracking
13. **PDI** → Digital inspection checklist, issue tracking
14. **Delivery** → Prep checklist, customer sign-off, rating
15. **Post-Delivery** → Auto-created Day 1/7/30 follow-up tasks

## Quick Start

```bash
git clone <repo>
cd sharemarket
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend CRM | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| Swagger Docs | http://localhost:8000/api/docs |

## Demo Credentials (password: Tata@1234)

| Role | Email |
|------|-------|
| General Manager | gm@tatadealer.in |
| Receptionist | reception@tatadealer.in |
| Sales Manager | sm.pv@tatadealer.in |
| Team Leader | tl1@tatadealer.in |
| Sales Consultant | sc1@tatadealer.in |
| Finance Manager | finance@tatadealer.in |
| Telecalling | telecall1@tatadealer.in |
| PDI Manager | pdi@tatadealer.in |

## Project Structure

```
sharemarket/
├── backend/
│   ├── app/
│   │   ├── api/               # 17 route modules
│   │   │   ├── auth.py
│   │   │   ├── leads.py
│   │   │   ├── vehicles.py
│   │   │   ├── quotations.py
│   │   │   ├── test_drives.py
│   │   │   ├── exchange.py
│   │   │   ├── bookings.py
│   │   │   ├── finance.py
│   │   │   ├── insurance.py
│   │   │   ├── accessories.py
│   │   │   ├── billing.py
│   │   │   ├── pdi.py
│   │   │   ├── delivery.py
│   │   │   ├── followups.py
│   │   │   ├── dashboard.py
│   │   │   ├── requirements.py
│   │   │   └── users.py
│   │   ├── core/              # Config, security, JWT
│   │   ├── db/                # SQLAlchemy session
│   │   ├── models/            # 20 ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic, EMI calc
│   │   ├── seed.py            # Demo data seeder
│   │   └── main.py            # FastAPI app entry
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── login/         # Auth page
│       │   ├── dashboard/     # Role-based dashboards
│       │   ├── leads/         # Lead management
│       │   ├── vehicles/      # Inventory
│       │   ├── bookings/      # Bookings
│       │   ├── test-drives/   # Test drive management
│       │   ├── exchange/      # Exchange evaluation
│       │   ├── finance/       # Loan applications
│       │   ├── insurance/     # Insurance policies
│       │   ├── accessories/   # Accessories catalog
│       │   ├── billing/       # GST invoices
│       │   ├── pdi/           # PDI checklist
│       │   ├── deliveries/    # Delivery management
│       │   ├── followups/     # Post-delivery follow-ups
│       │   └── team/          # Staff management
│       ├── components/
│       │   └── Layout.tsx     # Sidebar navigation
│       ├── lib/
│       │   └── api.ts         # API client
│       └── types/
│           └── crm.ts         # TypeScript types
├── infra/
│   └── schema.sql
└── docker-compose.yml
```

## Database (20 Tables)

- `users` – All staff (15 RBAC roles)
- `leads` – Customer leads lifecycle
- `customer_requirements` – Requirement discovery
- `vehicles` – VIN-level stock inventory
- `quotations` – On-road price quotations
- `test_drives` – Test drive bookings
- `exchange_vehicles` – Trade-in evaluation
- `bookings` – Sales bookings + KYC
- `finance_applications` – Bank loan tracking
- `insurance_policies` – Policy management
- `accessory_items` – Accessories catalog
- `accessories_orders` – Accessory orders
- `invoices` – GST invoices
- `payments` – Payment records
- `pdi_records` – Pre-delivery inspection
- `deliveries` – Delivery scheduling
- `follow_ups` – D1/D7/D30 auto tasks
- `call_logs` – Telecalling history
- `documents` – File metadata
- `audit_logs` – System audit trail

## API Reference

Full Swagger UI: `http://localhost:8000/api/docs`

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy 2.0 |
| Frontend | Next.js 14, TypeScript, Tailwind CSS 3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Charts | Recharts |
| Auth | JWT (python-jose, bcrypt) |
| Containerization | Docker, Docker Compose |

---

© 2024 Tata Motors Authorized Dealership, Jaipur, Rajasthan
