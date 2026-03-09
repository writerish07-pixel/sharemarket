"""
Database seeder – creates default users, sample vehicles, and accessory catalog.
Run: python -m app.seed
"""

from app.db.session import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.crm import User, UserRole, Vehicle, VehicleCategory, FuelType, TransmissionType, AccessoryItem

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        # ── Users ────────────────────────────────────────────────────────────
        staff = [
            {"employee_id": "TM-GM-001", "full_name": "Rajesh Sharma",
             "email": "gm@tatadealer.in", "phone": "9800000001",
             "role": UserRole.GENERAL_MANAGER, "department": "Management"},

            {"employee_id": "TM-REC-001", "full_name": "Priya Verma",
             "email": "reception@tatadealer.in", "phone": "9800000002",
             "role": UserRole.RECEPTIONIST, "department": "Reception"},

            {"employee_id": "TM-SM-EV", "full_name": "Amit Gupta",
             "email": "sm.ev@tatadealer.in", "phone": "9800000003",
             "role": UserRole.SALES_MANAGER_EV, "department": "Sales"},

            {"employee_id": "TM-SM-PV", "full_name": "Suresh Agarwal",
             "email": "sm.pv@tatadealer.in", "phone": "9800000004",
             "role": UserRole.SALES_MANAGER_PV, "department": "Sales"},

            {"employee_id": "TM-TL-001", "full_name": "Deepak Joshi",
             "email": "tl1@tatadealer.in", "phone": "9800000005",
             "role": UserRole.TEAM_LEADER, "department": "Sales"},

            {"employee_id": "TM-TL-002", "full_name": "Neha Saxena",
             "email": "tl2@tatadealer.in", "phone": "9800000006",
             "role": UserRole.TEAM_LEADER, "department": "Sales"},

            {"employee_id": "TM-SC-001", "full_name": "Rahul Meena",
             "email": "sc1@tatadealer.in", "phone": "9800000007",
             "role": UserRole.SALES_CONSULTANT, "department": "Sales"},

            {"employee_id": "TM-SC-002", "full_name": "Pooja Kumari",
             "email": "sc2@tatadealer.in", "phone": "9800000008",
             "role": UserRole.SALES_CONSULTANT, "department": "Sales"},

            {"employee_id": "TM-FM-001", "full_name": "Vikram Singh",
             "email": "finance@tatadealer.in", "phone": "9800000009",
             "role": UserRole.FINANCE_MANAGER, "department": "Finance"},

            {"employee_id": "TM-AO-001", "full_name": "Sunita Yadav",
             "email": "accounts@tatadealer.in", "phone": "9800000010",
             "role": UserRole.ACCOUNTS_OFFICER, "department": "Finance"},

            {"employee_id": "TM-CA-001", "full_name": "Mohan Lal",
             "email": "cashier@tatadealer.in", "phone": "9800000011",
             "role": UserRole.CASHIER, "department": "Finance"},

            {"employee_id": "TM-ACC-001", "full_name": "Kavita Sharma",
             "email": "accessories@tatadealer.in", "phone": "9800000012",
             "role": UserRole.ACCESSORIES_MANAGER, "department": "Accessories"},

            {"employee_id": "TM-TC-001", "full_name": "Ravi Kumar",
             "email": "telecall1@tatadealer.in", "phone": "9800000013",
             "role": UserRole.TELECALLING, "department": "Customer Experience"},

            {"employee_id": "TM-TC-002", "full_name": "Anita Singh",
             "email": "telecall2@tatadealer.in", "phone": "9800000014",
             "role": UserRole.TELECALLING, "department": "Customer Experience"},

            {"employee_id": "TM-TD-001", "full_name": "Sameer Khan",
             "email": "testdrive@tatadealer.in", "phone": "9800000015",
             "role": UserRole.TEST_DRIVE_COORDINATOR, "department": "Vehicle Operations"},

            {"employee_id": "TM-EX-001", "full_name": "Hemant Rajput",
             "email": "exchange@tatadealer.in", "phone": "9800000016",
             "role": UserRole.EXCHANGE_MANAGER, "department": "Vehicle Operations"},

            {"employee_id": "TM-INS-001", "full_name": "Nisha Goyal",
             "email": "insurance@tatadealer.in", "phone": "9800000017",
             "role": UserRole.INSURANCE_MANAGER, "department": "Vehicle Operations"},

            {"employee_id": "TM-PDI-001", "full_name": "Tarun Mishra",
             "email": "pdi@tatadealer.in", "phone": "9800000018",
             "role": UserRole.PDI_MANAGER, "department": "Vehicle Operations"},
        ]

        gm_id = None
        sm_ev_id = None
        sm_pv_id = None
        tl_ids = []

        for s in staff:
            if not db.query(User).filter(User.email == s["email"]).first():
                u = User(**s, hashed_password=get_password_hash("Tata@1234"))
                db.add(u)
                db.flush()
                if s["role"] == UserRole.GENERAL_MANAGER:
                    gm_id = u.id
                elif s["role"] == UserRole.SALES_MANAGER_EV:
                    sm_ev_id = u.id
                elif s["role"] == UserRole.SALES_MANAGER_PV:
                    sm_pv_id = u.id
                elif s["role"] == UserRole.TEAM_LEADER:
                    tl_ids.append(u.id)

        db.commit()

        # Set manager_id for TLs
        if sm_pv_id and tl_ids:
            for tl_id in tl_ids:
                tl = db.query(User).filter(User.id == tl_id).first()
                if tl and not tl.manager_id:
                    tl.manager_id = sm_pv_id
            db.commit()

        # Set team_leader_id for SCs
        if tl_ids:
            scs = db.query(User).filter(User.role == UserRole.SALES_CONSULTANT).all()
            for i, sc in enumerate(scs):
                if not sc.team_leader_id:
                    sc.team_leader_id = tl_ids[i % len(tl_ids)]
            db.commit()

        # ── Sample Vehicles ──────────────────────────────────────────────────
        vehicles = [
            {"vin": "MAT612451N2000001", "engine_number": "REVA1234567",
             "model": "Nexon EV", "variant": "Max LR", "color": "Pristine White",
             "color_code": "WHITE", "fuel_type": FuelType.ELECTRIC,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.EV,
             "ex_showroom_price": 1845000, "manufacturing_year": 2024,
             "manufacturing_month": 10, "stock_location": "SHOWROOM"},

            {"vin": "MAT612451N2000002", "engine_number": "REVA1234568",
             "model": "Nexon EV", "variant": "Creative Plus", "color": "Daytona Grey",
             "color_code": "GREY", "fuel_type": FuelType.ELECTRIC,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.EV,
             "ex_showroom_price": 1485000, "manufacturing_year": 2024,
             "manufacturing_month": 11, "stock_location": "YARD"},

            {"vin": "MAT612451N2000003", "engine_number": "PETA1234567",
             "model": "Punch EV", "variant": "Empowered Plus", "color": "Tropical Mist",
             "color_code": "CYAN", "fuel_type": FuelType.ELECTRIC,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.EV,
             "ex_showroom_price": 1265000, "manufacturing_year": 2024,
             "manufacturing_month": 11, "stock_location": "YARD"},

            {"vin": "MAT612451N2000004", "engine_number": "NEXP1234567",
             "model": "Nexon", "variant": "XZ+ (O)", "color": "Flame Red",
             "color_code": "RED", "fuel_type": FuelType.PETROL,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.PV,
             "ex_showroom_price": 1455000, "manufacturing_year": 2024,
             "manufacturing_month": 9, "stock_location": "SHOWROOM"},

            {"vin": "MAT612451N2000005", "engine_number": "NEXP1234568",
             "model": "Nexon", "variant": "XZA+", "color": "Magnetic Red",
             "color_code": "DKRED", "fuel_type": FuelType.PETROL,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.PV,
             "ex_showroom_price": 1555000, "manufacturing_year": 2024,
             "manufacturing_month": 10, "stock_location": "YARD"},

            {"vin": "MAT612451N2000006", "engine_number": "SAFP1234567",
             "model": "Safari", "variant": "XZA+ Dark Edition", "color": "Cosmic Gold",
             "color_code": "GOLD", "fuel_type": FuelType.DIESEL,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.PV,
             "ex_showroom_price": 2545000, "manufacturing_year": 2024,
             "manufacturing_month": 8, "stock_location": "SHOWROOM"},

            {"vin": "MAT612451N2000007", "engine_number": "HARP1234567",
             "model": "Harrier", "variant": "XZA+", "color": "Orcus White",
             "color_code": "WHITE2", "fuel_type": FuelType.DIESEL,
             "transmission": TransmissionType.AUTOMATIC, "category": VehicleCategory.PV,
             "ex_showroom_price": 2245000, "manufacturing_year": 2024,
             "manufacturing_month": 9, "stock_location": "YARD"},

            {"vin": "MAT612451N2000008", "engine_number": "PUNP1234567",
             "model": "Punch", "variant": "Creative Plus", "color": "Tornado Blue",
             "color_code": "BLUE", "fuel_type": FuelType.PETROL,
             "transmission": TransmissionType.AMT, "category": VehicleCategory.PV,
             "ex_showroom_price": 895000, "manufacturing_year": 2024,
             "manufacturing_month": 11, "stock_location": "YARD"},

            {"vin": "MAT612451N2000009", "engine_number": "TIAP1234567",
             "model": "Tiago", "variant": "XZA+", "color": "Pearlescent White",
             "color_code": "PEARL", "fuel_type": FuelType.PETROL,
             "transmission": TransmissionType.AMT, "category": VehicleCategory.PV,
             "ex_showroom_price": 735000, "manufacturing_year": 2024,
             "manufacturing_month": 11, "stock_location": "YARD"},

            {"vin": "MAT612451N2000010", "engine_number": "ALTP1234567",
             "model": "Altroz", "variant": "XZ+ i-Turbo", "color": "Avenue White",
             "color_code": "WHITE3", "fuel_type": FuelType.PETROL,
             "transmission": TransmissionType.MANUAL, "category": VehicleCategory.PV,
             "ex_showroom_price": 1045000, "manufacturing_year": 2024,
             "manufacturing_month": 10, "stock_location": "SHOWROOM"},
        ]

        for v in vehicles:
            if not db.query(Vehicle).filter(Vehicle.vin == v["vin"]).first():
                db.add(Vehicle(**v))

        db.commit()

        # ── Accessory Catalog ─────────────────────────────────────────────────
        accessories = [
            {"name": "3D Floor Mats (OEM)", "part_number": "TM-MAT-001", "category": "PROTECTION",
             "price": 3500, "is_oem": True, "description": "All-weather OEM floor mats"},
            {"name": "Car Body Cover", "part_number": "TM-COV-001", "category": "PROTECTION",
             "price": 2200, "is_oem": True},
            {"name": "Seat Covers Premium", "part_number": "TM-SC-001", "category": "INTERIOR",
             "price": 8500, "is_oem": False},
            {"name": "Dashcam 2K", "part_number": "TM-CAM-001", "category": "TECH",
             "price": 6500, "is_oem": False, "description": "Front & rear dashcam"},
            {"name": "Reverse Parking Camera", "part_number": "TM-CAM-002", "category": "TECH",
             "price": 4200, "is_oem": True},
            {"name": "OEM Running Boards", "part_number": "TM-RB-001", "category": "AESTHETIC",
             "price": 12000, "is_oem": True},
            {"name": "Chrome Door Sill Plates", "part_number": "TM-DSP-001", "category": "AESTHETIC",
             "price": 3200, "is_oem": True},
            {"name": "LED Interior Lighting Kit", "part_number": "TM-LED-001", "category": "AESTHETIC",
             "price": 2800, "is_oem": False},
            {"name": "Anti-Rust Coating (Underbody)", "part_number": "TM-ARC-001", "category": "PROTECTION",
             "price": 6000, "is_oem": False},
            {"name": "Paint Protection Film", "part_number": "TM-PPF-001", "category": "PROTECTION",
             "price": 18000, "is_oem": False, "description": "Full front PPF"},
            {"name": "Extended Warranty (2yr)", "part_number": "TM-EW-002", "category": "WARRANTY",
             "price": 22000, "is_oem": True},
            {"name": "Extended Warranty (3yr)", "part_number": "TM-EW-003", "category": "WARRANTY",
             "price": 28000, "is_oem": True},
            {"name": "OEM Mud Flaps", "part_number": "TM-MF-001", "category": "PROTECTION",
             "price": 1200, "is_oem": True},
            {"name": "Tyre Pressure Monitoring", "part_number": "TM-TPMS-001", "category": "SAFETY",
             "price": 5500, "is_oem": False},
            {"name": "EV Wall Charger (7.2kW)", "part_number": "TM-WC-001", "category": "EV",
             "price": 35000, "is_oem": True, "description": "Home charging unit for EVs"},
        ]

        for a in accessories:
            if not db.query(AccessoryItem).filter(AccessoryItem.part_number == a["part_number"]).first():
                db.add(AccessoryItem(**a))

        db.commit()
        print("✅ Seed completed successfully!")
        print("\n📋 Login credentials (password: Tata@1234):")
        print("  GM:            gm@tatadealer.in")
        print("  Receptionist:  reception@tatadealer.in")
        print("  Sales Manager: sm.pv@tatadealer.in")
        print("  Team Leader:   tl1@tatadealer.in")
        print("  Sales Consult: sc1@tatadealer.in")
        print("  Finance:       finance@tatadealer.in")
        print("  Telecalling:   telecall1@tatadealer.in")
        print("  Test Drive:    testdrive@tatadealer.in")
        print("  Exchange:      exchange@tatadealer.in")
        print("  PDI Manager:   pdi@tatadealer.in")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
