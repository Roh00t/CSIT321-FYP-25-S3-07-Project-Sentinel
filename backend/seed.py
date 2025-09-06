# seed.py
from app import create_app, db
from app.models import User, AppUser, Admin
import bcrypt

app = create_app()

with app.app_context():
    # Create tables if not exist
    db.create_all()
    print("✅ Tables created (if not exist).")

    # Seed AppUser
    if not AppUser.query.filter_by(username="john_doe").first():
        app_user = AppUser(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            username="john_doe",
            subscription_plan="Pro"
        )
        app_user.set_password("user123")
        db.session.add(app_user)
        print("✅ AppUser 'john_doe' created.")

    # Seed Admin
    if not Admin.query.filter_by(username="admin").first():
        admin = Admin(
            username="admin",
            email="admin@example.com"
        )
        admin.set_password("admin123")
        db.session.add(admin)
        print("✅ Admin 'admin' created.")

    db.session.commit()