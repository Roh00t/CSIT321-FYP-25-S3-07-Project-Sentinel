# config.py
import os

class Config:
    # Use SQLite database stored in the project directory
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'your-super-secret-key'  # Change this in production!