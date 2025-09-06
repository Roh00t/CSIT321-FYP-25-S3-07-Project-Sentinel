# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from dotenv import load_dotenv
from sqlalchemy import inspect

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173"])

    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(main_bp, url_prefix='/api')

    # CREATE TABLES IF NOT EXIST — runs when app is created
    with app.app_context():
        inspector = inspect(db.engine)
        if not inspector.get_table_names():
            db.create_all()
            print("Database tables created successfully!")
        else:
            print("Database tables already exist — skipping creation.")

    return app