# app/models/user_layout.py
from app import db
from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

class UserLayout(db.Model):
    __tablename__ = 'user_layouts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('app_users.id'), nullable=False, unique=True)
    layout = db.Column(db.Text, nullable=False)

    user = db.relationship("AppUser", back_populates="layout")