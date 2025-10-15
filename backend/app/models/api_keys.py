# backend/models/api_keys.py
from datetime import datetime, timedelta
import secrets
from app import db

class APIKey(db.Model):
    __tablename__ = "api_keys"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    key = db.Column(db.String(128), unique=True, nullable=False)
    type = db.Column(db.String(50))  # e.g. 'suricata', 'snort', 'zeek'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    last_used = db.Column(db.DateTime, nullable=True)
    revoked = db.Column(db.Boolean, default=False)
    data = db.Column(db.JSON, nullable=True)

    user = db.relationship("AppUser", backref="api_keys")

    @staticmethod
    def generate(user_id, name, type, expires_days=None):
        """Generate and store a new API key."""
        raw_key = secrets.token_hex(32)
        expires_at = (
            datetime.utcnow() + timedelta(days=expires_days)
            if expires_days
            else None
        )

        key_obj = APIKey(
            user_id=user_id,
            name=name,
            type=type,
            key=raw_key,
            expires_at=expires_at,
        )
        db.session.add(key_obj)
        db.session.commit()
        return raw_key  # Return plaintext once
