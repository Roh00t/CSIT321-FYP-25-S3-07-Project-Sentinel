# backend/app/models/filter.py
from app import db
from datetime import datetime

class Filter(db.Model):
    __tablename__ = "filters"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  # you can link to AppUser.id
    name = db.Column(db.String(100), nullable=False)
    filters_json = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
