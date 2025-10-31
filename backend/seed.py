# seed.py
from app import create_app, db
from app import models
from app.models import AppUser, Admin, Filter
import bcrypt
from app.models.api_keys import APIKey  # Ensure model is imported
from app.models.pcap import PcapFile, PcapPacket, AlertPcapMatch  # Ensure model is imported

app = create_app()

with app.app_context():
    db.create_all()
    print("Tables created (if not exist).")

    # Helper to hash with bcrypt
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Seed AppUser (Basic Plan)
    if not AppUser.query.filter_by(username="appuser").first():
        app_user = AppUser(
            first_name="App",
            last_name="User",
            email="appuser@example.com",
            username="appuser",
            subscription_plan="Basic",
            email_verified=True
        )
        # Override password with bcrypt hash directly
        app_user.password = hash_password("appuser123")
        db.session.add(app_user)
        db.session.commit()
        print("AppUser 'appuser' created.")

    # Seed AppUser (Basic Plan)
    if not AppUser.query.filter_by(username="appuser1").first():
        app_user = AppUser(
            first_name="App",
            last_name="User",
            email="appuser1@example.com",
            username="appuser1",
            subscription_plan="Basic",
            email_verified=True
        )
        # Override password with bcrypt hash directly
        app_user.password = hash_password("appuser123")
        db.session.add(app_user)
        db.session.commit()
        print("AppUser 'appuser1' created.")

    # Seed AppUser (Pro Plan)
    if not AppUser.query.filter_by(username="appuserpro").first():
        app_user = AppUser(
            first_name="App",
            last_name="User",
            email="appuserpro@example.com",
            username="appuserpro",
            subscription_plan="Pro",
            admin_email="projectsentinelfyp@gmail.com",
            email_verified=True
        )
        # Override password with bcrypt hash directly
        app_user.password = hash_password("appuserpro123")
        db.session.add(app_user)
        db.session.commit()
        print("AppUser 'appuserpro' created.")

    # Seed Admin
    if not Admin.query.filter_by(username="admin").first():
        admin = Admin(
            username="admin",
            email="admin@example.com"
        )
        # Override password with bcrypt hash directly
        admin.password = hash_password("admin123")
        db.session.add(admin)
        print("Admin 'admin' created.")
    #filters table

    if not Filter.query.first():
        sample_filter = Filter(
            user_id=3,  # assuming appuser gets ID 1
            name="Critical Alerts Only",
            filters_json={
                "alertsOnly": True,
                "minSeverity": 1,
                "protocols": [],
                "port": None,
                "ip": "",
                "timeRange": {"start": None, "end": None}
            },
            alerts_options={
                "High": True,
                "Medium": False,
                "Low": False,
                "Threshold": 10000
            },
            report_frequency= "None"  # can be "monthly", "bi-weekly", "weekly", or None
        )
        db.session.add(sample_filter)
        print("Sample filter 'Critical Alerts Only' created.")

    # --- Ensure APIKey table exists ---
    # If you want to explicitly check and create, but db.create_all() already does this.
    if not db.engine.dialect.has_table(db.engine.connect(), APIKey.__tablename__):
        APIKey.__table__.create(db.engine)
        print("Table 'api_keys' created.")

    # --- Ensure PCAP tables exist ---
    for model in [PcapFile, PcapPacket, AlertPcapMatch]:
        if not db.engine.dialect.has_table(db.engine.connect(), model.__tablename__):
            model.__table__.create(db.engine)
            print(f"Table '{model.__tablename__}' created.")

    db.session.commit()
    print("Database seeded successfully.")