# run.py
from app import create_app, db

app = create_app()

# Create tables if they don't exist — runs ONLY when starting server
with app.app_context():
    # Check if any table exists (e.g., 'users')
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    if not inspector.get_table_names():
        db.create_all()
        print("Database tables created successfully!")
    else:
        print("Database tables already exist — skipping creation.")

if __name__ == '__main__':
    app.run(port=5000, debug=True)