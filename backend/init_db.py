# init_db.py
from app import create_app, db

app = create_app()

with app.app_context():
    db.create_all()  # Creates all tables defined in your models
    print("Database tables created successfully!")
