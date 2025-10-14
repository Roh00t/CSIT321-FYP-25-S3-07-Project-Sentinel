# app/models/app_user_team.py
from app import db
import datetime

class AppUserTeam(db.Model):
    __tablename__ = 'app_user_teams'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('app_users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    members = db.relationship('AppUserTeamMember', back_populates='team', cascade='all, delete-orphan')
    owner = db.relationship('AppUser', foreign_keys=[owner_id])

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'owner_id': self.owner_id,
            'owner_name': f"{self.owner.first_name} {self.owner.last_name}" if self.owner else None,
            'created_at': self.created_at.isoformat()
        }