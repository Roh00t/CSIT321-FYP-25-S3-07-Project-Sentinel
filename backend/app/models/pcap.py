# backend/app/models/pcap.py
from datetime import datetime
from app import db

class PcapFile(db.Model):
    __tablename__ = "pcap_files"

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(256), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    upload_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    packet_count = db.Column(db.Integer, default=0)
    file_size = db.Column(db.Integer)  # bytes
    file_path = db.Column(db.String(512))  # storage path on server
    
    # Relationships
    packets = db.relationship("PcapPacket", back_populates="pcap_file", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "user_id": self.user_id,
            "upload_time": self.upload_time.isoformat(),
            "packet_count": self.packet_count,
            "file_size": self.file_size,
        }


class PcapPacket(db.Model):
    __tablename__ = "pcap_packets"

    id = db.Column(db.Integer, primary_key=True)
    pcap_file_id = db.Column(db.Integer, db.ForeignKey("pcap_files.id"), nullable=False)
    packet_number = db.Column(db.Integer)  # sequence in PCAP
    timestamp = db.Column(db.DateTime, nullable=False)
    src_ip = db.Column(db.String(64))
    dst_ip = db.Column(db.String(64))
    src_port = db.Column(db.Integer)
    dst_port = db.Column(db.Integer)
    protocol = db.Column(db.String(16))
    packet_length = db.Column(db.Integer)
    packet_data = db.Column(db.LargeBinary)  # raw packet bytes (optional, for deep inspection)
    
    # Relationships
    pcap_file = db.relationship("PcapFile", back_populates="packets")
    matches = db.relationship("AlertPcapMatch", back_populates="packet", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": self.id,
            "pcap_file_id": self.pcap_file_id,
            "packet_number": self.packet_number,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "src_port": self.src_port,
            "dst_port": self.dst_port,
            "protocol": self.protocol,
            "packet_length": self.packet_length,
        }


class AlertPcapMatch(db.Model):
    __tablename__ = "alert_pcap_matches"

    id = db.Column(db.Integer, primary_key=True)
    alert_id = db.Column(db.Integer, db.ForeignKey("alerts.id"), nullable=False)
    pcap_packet_id = db.Column(db.Integer, db.ForeignKey("pcap_packets.id"), nullable=False)
    match_confidence = db.Column(db.Float, default=1.0)  # 0-1 score
    matched_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    alert = db.relationship("Alert", backref="pcap_matches")
    packet = db.relationship("PcapPacket", back_populates="matches")
    
    def to_dict(self):
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "pcap_packet_id": self.pcap_packet_id,
            "match_confidence": self.match_confidence,
            "matched_at": self.matched_at.isoformat(),
        }
