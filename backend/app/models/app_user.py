# app/models/app_user.py
from app import db
from .user import User
from datetime import datetime

class AppUser(User):
    __tablename__ = 'app_users'

    id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    subscription_plan = db.Column(db.String(10), default='Basic')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    admin_email = db.Column(db.String(255), nullable=True)
    stripe_customer_id = db.Column(db.String(255), nullable=True)
    
    # Free trial tracking columns
    free_trial_used = db.Column(db.Boolean, default=False, nullable=False)
    free_trial_started_at = db.Column(db.DateTime, nullable=True)
    free_trial_ends_at = db.Column(db.DateTime, nullable=True)

    # Team relationships
    owned_teams = db.relationship('AppUserTeam', back_populates='owner', cascade='all, delete-orphan')
    team_memberships = db.relationship('AppUserTeamMember', back_populates='user', cascade='all, delete-orphan')

    # Email verification columns
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(100), unique=True, nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)

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
            'admin_email': self.admin_email,
            'stripe_customer_id': self.stripe_customer_id,
            'free_trial_used': self.free_trial_used,
            'free_trial_started_at': self.free_trial_started_at.isoformat() if self.free_trial_started_at else None,
            'free_trial_ends_at': self.free_trial_ends_at.isoformat() if self.free_trial_ends_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def is_eligible_for_free_trial(self):
        """Check if user is eligible for free trial"""
        return not self.free_trial_used and self.subscription_plan == 'Basic'

    def __repr__(self):
        return f'<AppUser {self.username}>'