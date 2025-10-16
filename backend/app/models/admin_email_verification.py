import datetime
import secrets
from app import db

class AdminEmailVerification(db.Model):
    __tablename__ = 'admin_email_verifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('app_users.id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    verified = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship('AppUser', backref=db.backref('admin_email_verifications', cascade='all, delete-orphan'))

    def __init__(self, user_id, email):
        now_utc_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        self.user_id = user_id
        self.email = email
        self.token = secrets.token_urlsafe(32)
        self.created_at = now_utc_naive
        self.expires_at = now_utc_naive + datetime.timedelta(hours=24)
        self.verified = False

    def is_expired(self):
        now_utc_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        return now_utc_naive > self.expires_at