# backend/resetdb.py
from app import create_app, db

def reset_db():
    app = create_app()
    with app.app_context():
        # Drop all tables
        db.drop_all()
        print("🗑️ All tables dropped")

        # Create all tables
        db.create_all()
        print("✅ All tables recreated")

if __name__ == "__main__":
    reset_db()
