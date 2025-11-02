# backend/routes/alertsdb.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.alert import Alert
from app.models.api_keys import APIKey
from app.models.app_user import AppUser
from app.models.pcap import AlertPcapMatch

adbp = Blueprint("alerts_api_init", __name__)

@adbp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required(optional=True)
def get_alerts_for_user():
    """
    GET /api/alerts?page=1&per_page=100&time_range=today&min_severity=1&alerts_only=true&protocols=TCP,UDP&port=80&ip=192.168&agent=key123&start_time=2025-01-01&end_time=2025-12-31
    Returns paginated alerts tied to any of the user's API keys with server-side filtering
    """
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"error": "unauthenticated"}), 401

    # Pagination params
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 100))
    time_range = request.args.get("time_range", "today")  # today, week, month, year
    
    # Filter params
    min_severity = request.args.get("min_severity", type=int)
    alerts_only = request.args.get("alerts_only", "false").lower() == "true"
    matched_pcaps_only = request.args.get("matched_pcaps_only", "false").lower() == "true"
    protocols_str = request.args.get("protocols", "")
    protocols = [p.strip() for p in protocols_str.split(",") if p.strip()]
    port = request.args.get("port", type=int)
    ip_filter = request.args.get("ip", "")
    agent_filter = request.args.get("agent", "")
    start_time = request.args.get("start_time", "")
    end_time = request.args.get("end_time", "")

    keys = APIKey.query.filter_by(user_id=user.id).all()
    key_values = [k.key for k in keys]

    # Return alerts if api_key OR user_id matches
    if key_values:
        query = Alert.query.filter(
            (Alert.api_key.in_(key_values)) | (Alert.user_id == user.id)
        )
    else:
        query = Alert.query.filter(
            Alert.user_id == user.id
        )
    
    # Apply filters
    if alerts_only:
        query = query.filter(Alert.severity.isnot(None), Alert.severity > 0)
    
    if matched_pcaps_only:
        # Filter to only alerts that have PCAP matches for this user
        from app.models.pcap import PcapFile, PcapPacket
        query = query.join(AlertPcapMatch, Alert.id == AlertPcapMatch.alert_id)\
                     .join(PcapPacket, AlertPcapMatch.pcap_packet_id == PcapPacket.id)\
                     .join(PcapFile, PcapPacket.pcap_file_id == PcapFile.id)\
                     .filter(PcapFile.user_id == user.id)\
                     .distinct()
    
    if min_severity:
        query = query.filter(Alert.severity.isnot(None), Alert.severity <= min_severity)
    
    if protocols:
        query = query.filter(Alert.protocol.in_(protocols))
    
    if port:
        query = query.filter(db.or_(Alert.src_port == port, Alert.dest_port == port))
    
    if ip_filter:
        query = query.filter(
            db.or_(
                Alert.src_ip.like(f"%{ip_filter}%"),
                Alert.dest_ip.like(f"%{ip_filter}%")
            )
        )
    
    if agent_filter:
        if agent_filter == "0":
            # Manually uploaded - has user_id but no api_key (or api_key = "0")
            query = query.filter(
                db.or_(
                    Alert.api_key == "0",
                    db.and_(Alert.api_key.is_(None), Alert.user_id == user.id)
                )
            )
        else:
            query = query.filter(Alert.api_key == agent_filter)
    
    if start_time:
        from datetime import datetime
        try:
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            query = query.filter(Alert.timestamp >= start_dt)
        except:
            pass
    
    if end_time:
        from datetime import datetime
        try:
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            query = query.filter(Alert.timestamp <= end_dt)
        except:
            pass
    
    # Apply ordering
    query = query.order_by(Alert.created_at.desc())
    
    total = query.count()
    
    # Calculate summary statistics from DB
    from sqlalchemy import func
    
    # Severity counts
    severity_counts = db.session.query(
        Alert.severity, func.count(Alert.id)
    ).filter(
        Alert.id.in_([a.id for a in query.all()])
    ).group_by(Alert.severity).all()
    
    severity_data = {
        "high": next((count for sev, count in severity_counts if sev == 1), 0),
        "medium": next((count for sev, count in severity_counts if sev == 2), 0),
        "low": next((count for sev, count in severity_counts if sev == 3), 0),
    }
    
    # Total alerts = sum of high + medium + low severity
    total_alerts = severity_data["high"] + severity_data["medium"] + severity_data["low"]
    
    # Protocol counts
    protocol_counts = db.session.query(
        Alert.protocol, func.count(Alert.id)
    ).filter(
        Alert.id.in_([a.id for a in query.all()])
    ).group_by(Alert.protocol).all()
    
    protocol_data = {proto: count for proto, count in protocol_counts if proto}
    
    # Top talkers (source IPs)
    top_talkers = db.session.query(
        Alert.src_ip, func.count(Alert.id)
    ).filter(
        Alert.id.in_([a.id for a in query.all()]),
        Alert.src_ip.isnot(None)
    ).group_by(Alert.src_ip).order_by(func.count(Alert.id).desc()).limit(5).all()
    
    # Top attacked hosts (destination IPs)
    top_hosts = db.session.query(
        Alert.dest_ip, func.count(Alert.id)
    ).filter(
        Alert.id.in_([a.id for a in query.all()]),
        Alert.dest_ip.isnot(None)
    ).group_by(Alert.dest_ip).order_by(func.count(Alert.id).desc()).limit(5).all()
    
    # Top signatures
    top_signatures = db.session.query(
        Alert.signature, func.count(Alert.id)
    ).filter(
        Alert.id.in_([a.id for a in query.all()]),
        Alert.signature.isnot(None)
    ).group_by(Alert.signature).order_by(func.count(Alert.id).desc()).limit(5).all()
    
    # Activity over time (threats vs non-threats grouped by time)
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    
    # Determine time range and grouping format
    if time_range == "today":
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        # Group by hour: DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
        time_format = func.date_format(Alert.timestamp, '%Y-%m-%d %H:00:00')
    elif time_range == "week":
        start_time = now - timedelta(days=now.weekday())
        start_time = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
        # Group by day: DATE(timestamp)
        time_format = func.date(Alert.timestamp)
    elif time_range == "month":
        start_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Group by day: DATE(timestamp)
        time_format = func.date(Alert.timestamp)
    elif time_range == "year":
        start_time = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        # Group by month: DATE_FORMAT(timestamp, '%Y-%m-01')
        time_format = func.date_format(Alert.timestamp, '%Y-%m-01')
    else:
        start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        time_format = func.date_format(Alert.timestamp, '%Y-%m-%d %H:00:00')
    
    # Query for alerts with severity (threats)
    threats_over_time = db.session.query(
        time_format.label('time_bucket'),
        func.count(Alert.id).label('count')
    ).filter(
        Alert.id.in_([a.id for a in query.all()]),
        Alert.timestamp >= start_time,
        Alert.severity.isnot(None),
        Alert.severity > 0
    ).group_by('time_bucket').all()
    
    # Query for alerts without severity (activity)
    activity_over_time = db.session.query(
        time_format.label('time_bucket'),
        func.count(Alert.id).label('count')
    ).filter(
        Alert.id.in_([a.id for a in query.all()]),
        Alert.timestamp >= start_time,
        db.or_(Alert.severity.is_(None), Alert.severity == 0)
    ).group_by('time_bucket').all()
    
    # Convert to dictionaries for easy lookup
    threats_dict = {str(bucket): count for bucket, count in threats_over_time}
    activity_dict = {str(bucket): count for bucket, count in activity_over_time}
    
    alerts = query.offset((page - 1) * per_page).limit(per_page).all()

    # Add pcap match count to each alert
    alerts_data = []
    for alert in alerts:
        alert_dict = alert.to_dict()
        match_count = AlertPcapMatch.query.filter_by(alert_id=alert.id).count()
        alert_dict["pcap_match_count"] = match_count
        alerts_data.append(alert_dict)

    return jsonify({
        "alerts": alerts_data,
        "total": total_alerts,
        "page": page,
        "per_page": per_page,
        "used_api_keys": key_values,
        "summary": {
            "total_alerts": total_alerts,  # Sum of high + medium + low severity
            "severity": severity_data,
            "protocols": protocol_data,
            "top_talkers": [[ip, count] for ip, count in top_talkers],
            "top_hosts": [[ip, count] for ip, count in top_hosts],
            "top_signatures": [[sig, count] for sig, count in top_signatures],
            "activity_over_time": {
                "threats": threats_dict,
                "activity": activity_dict,
                "time_range": time_range
            }
        }
    })