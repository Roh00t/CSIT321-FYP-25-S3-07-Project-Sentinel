# backend/app/routes/pcap.py
import os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from app import db
from app.models.pcap import PcapFile, PcapPacket, AlertPcapMatch
from app.models.alert import Alert

pcap_bp = Blueprint("pcap", __name__)

ALLOWED_EXTENSIONS = {"pcap", "pcapng", "cap"}
UPLOAD_FOLDER = "app/uploads/pcaps"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_pcap_file(file_path):
    """
    Parse PCAP file and extract packet metadata.
    Returns list of packet dictionaries.
    """

    try:
        from scapy.all import rdpcap, IP, IPv6, TCP, UDP, ICMP
    except ImportError:
        return {"error": "scapy not installed. Run: pip install scapy"}

    packets = []
    try:
        pcap_packets = rdpcap(file_path)

        for idx, pkt in enumerate(pcap_packets):
            # Handle IPv4
            if IP in pkt:
                packet_info = {
                    "packet_number": idx + 1,
                    "timestamp": datetime.fromtimestamp(float(pkt.time)),
                    "src_ip": pkt[IP].src,
                    "dst_ip": pkt[IP].dst,
                    "src_port": None,
                    "dst_port": None,
                    "protocol": None,
                    "packet_length": len(pkt),
                    "packet_data": bytes(pkt)
                }

                # Extract port and protocol info
                if TCP in pkt:
                    packet_info["protocol"] = "TCP"
                    packet_info["src_port"] = pkt[TCP].sport
                    packet_info["dst_port"] = pkt[TCP].dport
                elif UDP in pkt:
                    packet_info["protocol"] = "UDP"
                    packet_info["src_port"] = pkt[UDP].sport
                    packet_info["dst_port"] = pkt[UDP].dport
                elif ICMP in pkt:
                    packet_info["protocol"] = "ICMP"
                else:
                    packet_info["protocol"] = "OTHER"

                packets.append(packet_info)
            # Handle IPv6
            elif IPv6 in pkt:
                packet_info = {
                    "packet_number": idx + 1,
                    "timestamp": datetime.fromtimestamp(float(pkt.time)),
                    "src_ip": pkt[IPv6].src,
                    "dst_ip": pkt[IPv6].dst,
                    "src_port": None,
                    "dst_port": None,
                    "protocol": None,
                    "packet_length": len(pkt),
                    "packet_data": bytes(pkt)
                }

                # Extract port and protocol info
                if TCP in pkt:
                    packet_info["protocol"] = "TCP"
                    packet_info["src_port"] = pkt[TCP].sport
                    packet_info["dst_port"] = pkt[TCP].dport
                elif UDP in pkt:
                    packet_info["protocol"] = "UDP"
                    packet_info["src_port"] = pkt[UDP].sport
                    packet_info["dst_port"] = pkt[UDP].dport
                else:
                    packet_info["protocol"] = "OTHER"

                packets.append(packet_info)

        return packets
    except Exception as e:
        return {"error": f"Failed to parse PCAP: {str(e)}"}


def match_packets_to_alerts(packets, time_window_seconds=5):
    """
    Match parsed packets to existing alerts based on:
    - Source IP + Dest IP
    - Source Port + Dest Port
    - Timestamp within time_window_seconds
    
    Returns list of (packet, alert, confidence) tuples
    """
    import ipaddress
    matches = []

    def normalize_ip(ip):
        try:
            if ':' in ip:
                return str(ipaddress.IPv6Address(ip))
            else:
                return str(ipaddress.IPv4Address(ip))
        except Exception:
            return ip

    for packet in packets:
        pkt_time = packet["timestamp"]
        time_start = pkt_time - timedelta(seconds=time_window_seconds)
        time_end = pkt_time + timedelta(seconds=time_window_seconds)

        # Normalize IPs for matching
        pkt_src_ip = normalize_ip(packet["src_ip"])
        pkt_dst_ip = normalize_ip(packet["dst_ip"])
        
        # Find all alerts within time window, then filter by normalized IPs
        potential_alerts = Alert.query.filter(
            Alert.timestamp >= time_start,
            Alert.timestamp <= time_end
        ).all()
        
        # Filter alerts by normalized IPs and ports
        for alert in potential_alerts:
            alert_src_ip = normalize_ip(alert.src_ip)
            alert_dst_ip = normalize_ip(alert.dest_ip)
            
            # Check IP match
            if alert_src_ip != pkt_src_ip or alert_dst_ip != pkt_dst_ip:
                continue
            
            # Check port match if both packet and alert have ports
            if packet["src_port"] and packet["dst_port"]:
                if alert.src_port != packet["src_port"] or alert.dest_port != packet["dst_port"]:
                    continue
            
            confidence = 1.0

            # Check protocol match
            if packet["protocol"] and alert.protocol:
                if packet["protocol"].upper() != alert.protocol.upper():
                    confidence *= 0.8

            # Check time difference (closer = higher confidence)
            time_diff = abs((pkt_time - alert.timestamp).total_seconds())
            if time_diff > 1:
                confidence *= (1 - (time_diff / time_window_seconds) * 0.2)

            matches.append((packet, alert, confidence))

    return matches


@pcap_bp.route("/api/pcaps/upload", methods=["POST", "OPTIONS"])
@cross_origin()
@jwt_required()
def upload_pcap():
    """Upload and parse a PCAP file, then match to alerts"""
    current_user_id = get_jwt_identity()
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Use .pcap, .pcapng, or .cap"}), 400
    
    # Create upload directory if it doesn't exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Save file
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(file_path)
    
    file_size = os.path.getsize(file_path)
    
    # Parse PCAP
    packets = parse_pcap_file(file_path)
    
    if isinstance(packets, dict) and "error" in packets:
        os.remove(file_path)  # Clean up file
        return jsonify(packets), 500
    
    # Create PcapFile record
    pcap_file = PcapFile(
        filename=filename,
        user_id=current_user_id,
        packet_count=len(packets),
        file_size=file_size,
        file_path=file_path
    )
    db.session.add(pcap_file)
    db.session.flush()  # Get pcap_file.id
    
    # Store packets in database
    for pkt_data in packets:
        packet = PcapPacket(
            pcap_file_id=pcap_file.id,
            packet_number=pkt_data["packet_number"],
            timestamp=pkt_data["timestamp"],
            src_ip=pkt_data["src_ip"],
            dst_ip=pkt_data["dst_ip"],
            src_port=pkt_data["src_port"],
            dst_port=pkt_data["dst_port"],
            protocol=pkt_data["protocol"],
            packet_length=pkt_data["packet_length"],
            packet_data=pkt_data["packet_data"][:10000]  # Limit to 10KB per packet
        )
        db.session.add(packet)
    
    # Match packets to alerts
    time_window = int(request.form.get("time_window", 5))  # Default 5 seconds
    matches = match_packets_to_alerts(packets, time_window)
    
    # Store matches
    for packet_data, alert, confidence in matches:
        # Find the PcapPacket we just created
        pcap_packet = PcapPacket.query.filter_by(
            pcap_file_id=pcap_file.id,
            packet_number=packet_data["packet_number"]
        ).first()
        
        if pcap_packet:
            match = AlertPcapMatch(
                alert_id=alert.id,
                pcap_packet_id=pcap_packet.id,
                match_confidence=confidence
            )
            db.session.add(match)
    
    db.session.commit()
    
    return jsonify({
        "message": "PCAP uploaded and processed successfully",
        "pcap_file": pcap_file.to_dict(),
        "packets_parsed": len(packets),
        "matches_found": len(matches)
    }), 201


@pcap_bp.route("/api/pcaps", methods=["GET", "OPTIONS"])
@cross_origin()
@jwt_required()
def get_pcaps():
    """Get all PCAP files for current user"""
    current_user_id = get_jwt_identity()
    
    pcap_files = PcapFile.query.filter_by(user_id=current_user_id).order_by(PcapFile.upload_time.desc()).all()
    
    return jsonify([pf.to_dict() for pf in pcap_files]), 200


@pcap_bp.route("/api/pcaps/<int:pcap_id>", methods=["DELETE", "OPTIONS"])
@cross_origin()
@jwt_required()
def delete_pcap(pcap_id):
    """Delete a PCAP file and all associated data"""
    current_user_id = get_jwt_identity()
    
    pcap_file = PcapFile.query.filter_by(id=pcap_id, user_id=current_user_id).first()
    
    if not pcap_file:
        return jsonify({"error": "PCAP file not found"}), 404
    
    # Delete physical file
    if pcap_file.file_path and os.path.exists(pcap_file.file_path):
        os.remove(pcap_file.file_path)
    
    # Delete from database (cascade will handle packets and matches)
    db.session.delete(pcap_file)
    db.session.commit()
    
    return jsonify({"message": "PCAP file deleted"}), 200


@pcap_bp.route("/api/alerts/<int:alert_id>/packets", methods=["GET", "OPTIONS"])
@cross_origin()
@jwt_required()
def get_alert_packets(alert_id):
    """Get all PCAP packets matched to a specific alert"""
    
    matches = AlertPcapMatch.query.filter_by(alert_id=alert_id).order_by(AlertPcapMatch.match_confidence.desc()).all()
    
    result = []
    for match in matches:
        packet = match.packet
        packet_dict = packet.to_dict()
        packet_dict["match_confidence"] = match.match_confidence
        packet_dict["pcap_filename"] = packet.pcap_file.filename
        
        # Optionally include hex dump
        if packet.packet_data:
            packet_dict["hex_dump"] = packet.packet_data.hex()
        
        result.append(packet_dict)
    
    return jsonify(result), 200


@pcap_bp.route("/api/pcaps/<int:pcap_id>/packets", methods=["GET", "OPTIONS"])
@cross_origin()
@jwt_required()
def get_pcap_packets(pcap_id):
    """Get all packets from a specific PCAP file"""
    current_user_id = get_jwt_identity()
    
    pcap_file = PcapFile.query.filter_by(id=pcap_id, user_id=current_user_id).first()
    
    if not pcap_file:
        return jsonify({"error": "PCAP file not found"}), 404
    
    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 100, type=int)
    
    packets = PcapPacket.query.filter_by(pcap_file_id=pcap_id).order_by(PcapPacket.packet_number).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        "packets": [p.to_dict() for p in packets.items],
        "total": packets.total,
        "page": page,
        "per_page": per_page
    }), 200
