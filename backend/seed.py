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
        password = "user123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        app_user = AppUser(
            first_name="John",
            last_name="Doe",
            email="john@example.com",
            username="john_doe",
            password=hashed.decode('utf-8'),
            subscription_plan="Pro"
        )
        db.session.add(app_user)
        print("✅ AppUser 'john_doe' created.")

    # Seed Admin
    if not Admin.query.filter_by(username="admin").first():
        password = "admin123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        admin = Admin(
            username="admin",
            password=hashed.decode('utf-8')
        )
        db.session.add(admin)
        print("✅ Admin 'admin' created.")

    db.session.commit()