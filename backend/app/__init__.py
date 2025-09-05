# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config  # Make sure config.py is accessible

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)  # Load config from Config class

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)  # Allow frontend to communicate

    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(main_bp, url_prefix='/api')

    # Create tables in the database (only for SQLite dev)
    with app.app_context():
        db.create_all()
        print("Database created with SQLite at 'app.db'")

    return app