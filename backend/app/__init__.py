# app/__init__.py
from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from dotenv import load_dotenv
from sqlalchemy import inspect, text
from sqlalchemy.exc import ProgrammingError
from app.routes.alerts import alerts_bp
from flask_socketio import SocketIO
from app.routes.socketIO import AlertsNamespace
import threading
import time
from flask_mail import Mail

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet', ping_interval=10, ping_timeout=30)
mail = Mail()
socketio.on_namespace(AlertsNamespace("/api/alerts/stream"))

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions (required before using db.get_engine)
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    socketio.init_app(app)

    socketio.on_namespace(AlertsNamespace("/api/alerts/stream"))

    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.main import main_bp
    from app.routes.geoip import geo_bp
    from app.routes.filters import filters_bp
    from app.routes.threatint import threat_bp
    from app.routes.api_key import api_keys_bp
    from app.routes.alerts_api import adbp
    from app.routes.pcap import pcap_bp
    from app.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(main_bp, url_prefix='/api')
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(geo_bp)
    app.register_blueprint(filters_bp)
    app.register_blueprint(threat_bp)
    app.register_blueprint(api_keys_bp)
    app.register_blueprint(adbp, url_prefix="/api/alerts_api")
    app.register_blueprint(pcap_bp)
    app.register_blueprint(dashboard_bp, url_prefix='/api')

    # Initialize CORS after blueprints are registered
    CORS(app,
        resources={
            r"/*": {
                "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
                "expose_headers": ["Content-Type", "Authorization"],
                "max_age": 600
            }
        }
    )

    with app.app_context():
        # Extract config values
        db_user = app.config['DB_USER']
        db_pass = app.config['DB_PASS']
        db_host = app.config['DB_HOST']
        db_name = app.config['DB_NAME']

        # Check if database exists, create if not
        try:
            # Try to connect to the target database
            engine = db.get_engine()
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"Database '{db_name}' exists.")
        except Exception as e:
            print(f"Database '{db_name}' not found or connection failed: {str(e)}")
            print(f"Creating database '{db_name}'...")

            # Connect to MySQL server without specifying database
            temp_uri = f"mysql+pymysql://{db_user}:{db_pass}@{db_host}"
            temp_engine = db.create_engine(temp_uri)

            try:
                with temp_engine.connect() as conn:
                    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                print(f"Database '{db_name}' created successfully.")
            except Exception as create_error:
                print(f"Failed to create database: {str(create_error)}")
                raise

        # Create tables if they don't exist
        try:
            inspector = inspect(db.get_engine())
            if not inspector.get_table_names():
                db.create_all()
                print("Tables created successfully!")
            else:
                print("Tables already exist — skipping creation.")
        except Exception as table_error:
            print(f"Error during table creation: {str(table_error)}")
            raise

    return app