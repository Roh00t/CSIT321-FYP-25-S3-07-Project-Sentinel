# app/models/user.py
from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    user_type = db.Column(db.String(20), nullable=False)  # 'app_user' or 'admin'

    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': user_type
    }

    def __repr__(self):
        return f'<User {self.user_id} ({self.user_type})>'