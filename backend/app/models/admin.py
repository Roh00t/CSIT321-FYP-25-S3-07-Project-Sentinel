# app/models/admin.py
from app import db
from .user import User

class Admin(User):
    __tablename__ = 'admins'

    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'admin',
    }

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'user_type': self.user_type,
            'username': self.username
        }

    def __repr__(self):
        return f'<Admin {self.username}>'