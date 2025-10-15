# backend/resetdb.py
from app import create_app, db
from app import models
from app.models import AppUser, Admin, Filter
from app.models.api_keys import APIKey  # Ensure model is imported
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def reset_db():
    app = create_app()
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("🗑️ All tables dropped")

        # Create all tables
        db.create_all()
        print("✅ All tables recreated")

        # === SEEDING LOGIC ===

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
            app_user.password = hash_password("appuser123")
            db.session.add(app_user)
            print("AppUser 'appuser' created.")

        # Seed AppUser (Basic Plan - second user)
        if not AppUser.query.filter_by(username="appuser1").first():
            app_user = AppUser(
                first_name="App",
                last_name="User",
                email="appuser1@example.com",
                username="appuser1",
                subscription_plan="Basic",
                email_verified=True
            )
            app_user.password = hash_password("appuser123")
            db.session.add(app_user)
            print("AppUser 'appuser1' created.")

        # Seed AppUser (Pro Plan)
        if not AppUser.query.filter_by(username="appuserpro").first():
            app_user = AppUser(
                first_name="App",
                last_name="User",
                email="appuserpro@example.com",
                username="appuserpro",
                subscription_plan="Pro",
                admin_email="company@company.com",
                email_verified=True
            )
            app_user.password = hash_password("appuserpro123")
            db.session.add(app_user)
            print("AppUser 'appuserpro' created.")

        # Seed Admin
        if not Admin.query.filter_by(username="admin").first():
            admin = Admin(
                username="admin",
                email="admin@example.com"
            )
            admin.password = hash_password("admin123")
            db.session.add(admin)
            print("Admin 'admin' created.")

        # Seed Filter (assuming appuserpro has ID=3 after insertion order)
        # Note: Relying on auto-increment IDs can be fragile.
        # Better: query the user after creation or use a known ID.
        pro_user = AppUser.query.filter_by(username="appuserpro").first()
        if pro_user and not Filter.query.filter_by(user_id=pro_user.id).first():
            sample_filter = Filter(
                user_id=pro_user.id,
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
                    "Threshold": 100
                },
                report_frequency="None"
            )
            db.session.add(sample_filter)
            print("Sample filter 'Critical Alerts Only' created.")

        # Optional: Explicitly ensure APIKey table exists (usually unnecessary after db.create_all())
        # But kept for safety if you have conditional table creation elsewhere
        if not db.engine.dialect.has_table(db.engine.connect(), APIKey.__tablename__):
            APIKey.__table__.create(db.engine)
            print("Table 'api_keys' created.")

        # Commit all changes
        db.session.commit()
        print("🌱 Database seeded successfully.")

if __name__ == "__main__":
    reset_db()