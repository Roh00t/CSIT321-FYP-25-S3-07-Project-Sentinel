# seed.py
from app import create_app, db
from app.models import AppUser, Admin, Filter
import bcrypt

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
            subscription_plan="Basic"
        )
        # Override password with bcrypt hash directly
        app_user.password = hash_password("appuser123")
        db.session.add(app_user)
        db.session.commit()
        print("AppUser 'appuser' created.")

    # Seed AppUser (Pro Plan)
    if not AppUser.query.filter_by(username="appuserpro").first():
        app_user = AppUser(
            first_name="App",
            last_name="User",
            email="appuserpro@example.com",
            username="appuserpro",
            subscription_plan="Pro",
            admin_email="company@company.com"
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
                "Threshold": 100
            },
            report_frequency= "None"  # can be "monthly", "bi-weekly", "weekly", or None
        )
        db.session.add(sample_filter)
        print("Sample filter 'Critical Alerts Only' created.")

    db.session.commit()
    print("Database seeded successfully.")