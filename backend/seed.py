# seed.py
from app import create_app, db
from app.models import User 
import bcrypt

app = create_app()

with app.app_context():
    # Create tables if they don't exist
    db.create_all()

    # Check if user already exists
    if not User.query.filter_by(username="john_doe").first():
        password = "password123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user = User(
            username="john_doe",
            email="john@example.com",
            password=hashed.decode('utf-8')
        )
        db.session.add(user)
        db.session.commit()
        print("Test user created!")
    else:
        print("User 'john_doe' already exists.")