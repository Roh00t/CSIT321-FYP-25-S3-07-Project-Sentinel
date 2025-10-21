# backend/models/alert.py
from datetime import datetime
from app import db

class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False)  # original event timestamp
    src_ip = db.Column(db.String(64))
    src_port = db.Column(db.Integer)
    dest_ip = db.Column(db.String(64))
    dest_port = db.Column(db.Integer)
    protocol = db.Column(db.String(16))
    signature = db.Column(db.String(512))
    severity = db.Column(db.Integer)

    api_key = db.Column(db.String(128), db.ForeignKey("api_keys.key"), nullable=True)
    source_forwarder_name = db.Column(db.String(128), nullable=True)  # friendly name from APIKey
    user_id = db.Column(db.Integer, db.ForeignKey("app_users.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "src_ip": self.src_ip,
            "src_port": self.src_port,
            "dest_ip": self.dest_ip,
            "dest_port": self.dest_port,
            "protocol": self.protocol,
            "signature": self.signature,
            "severity": self.severity,
            "api_key": self.api_key,
            "source_forwarder_name": self.source_forwarder_name,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
