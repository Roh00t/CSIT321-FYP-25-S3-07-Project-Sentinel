# app/models/app_user_team_member.py (unchanged)
from app import db
import datetime

class AppUserTeamMember(db.Model):
    __tablename__ = 'app_user_team_members'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('app_user_teams.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('app_users.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # 'admin' or 'member'
    invited_at = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    joined_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    team = db.relationship('AppUserTeam', back_populates='members')
    user = db.relationship('AppUser', back_populates='team_memberships')

    __table_args__ = (db.UniqueConstraint('team_id', 'user_id', name='unique_team_user'),)