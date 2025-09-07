# seed.py
from app import create_app, db
from app.models import AppUser, Admin
import bcrypt

app = create_app()

with app.app_context():
    db.create_all()
    print("Tables created (if not exist).")

    # Helper to hash with bcrypt
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Seed AppUser
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
        print("AppUser 'appuser' created.")

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

    db.session.commit()
    print("Database seeded successfully.")