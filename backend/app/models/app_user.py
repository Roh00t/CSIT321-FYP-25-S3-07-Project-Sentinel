# app/models/app_user.py
from app import db
from .user import User
from datetime import datetime

class AppUser(User):
    __tablename__ = 'app_users'

    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    subscription_plan = db.Column(db.String(10), default='Basic')  # Basic, Plus, Team
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


    __mapper_args__ = {
        'polymorphic_identity': 'app_user',
    }

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'user_type': self.user_type,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'username': self.username,
            'subscription_plan': self.subscription_plan,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<AppUser {self.username}>'