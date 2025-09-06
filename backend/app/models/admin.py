# app/models/admin.py
from app import db
from .user import User

class Admin(User):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)

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