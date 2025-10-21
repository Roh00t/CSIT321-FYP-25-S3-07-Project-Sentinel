# backend/routes/alertsdb.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.alert import Alert
from app.models.api_keys import APIKey
from app.models.app_user import AppUser
from app.models.pcap import AlertPcapMatch
from datetime import datetime, timezone

adbp = Blueprint("alerts_api_init", __name__)

def normalize_alert(alert: dict) -> dict:
    alert_obj = alert.get("alert") or alert.get("Event", {}).get("alert") or alert.get("Event") or {}

    # Source IP
    src_ip = (
        alert.get("src_ip")
        or alert.get("src_addr")
        or alert.get("src_host")
        or alert_obj.get("ip_source")
        or alert_obj.get("ip_source")
        or alert.get("Event", {}).get("ip_source")
        or (alert.get("src_ap").split(":")[0] if alert.get("src_ap") and ":" in alert.get("src_ap") else None)
    )

    # Destination IP
    dest_ip = (
        alert.get("dest_ip")
        or alert.get("dst_ip")
        or alert.get("dst_addr")
        or alert.get("dst_host")
        or alert_obj.get("ip_destination")
        or alert_obj.get("ip_dest")
        or alert.get("Event", {}).get("ip_dest")
        or (alert.get("dst_ap").split(":")[0] if alert.get("dst_ap") and ":" in alert.get("dst_ap") else None)
    )

    # Severity / priority
    severity = (
        alert_obj.get("severity")
        or alert_obj.get("priority")
        or alert.get("severity")
        or alert.get("priority")
        or alert.get("Event", {}).get("priority_id")
    )

    # Protocol
    protocol = (
        alert.get("proto")
        or alert.get("protocol")
        or alert_obj.get("protocol")
        or alert_obj.get("ip_proto")
        or alert.get("Event", {}).get("ip_proto")
    )

    # Signature / message
    signature = (
        alert_obj.get("signature")
        or alert.get("signature")
        or alert.get("msg")
        or alert.get("rule")
        or alert.get("class")
    )

    # Signature ID
    sig_id = (
        alert_obj.get("signature_id")
        or alert.get("sid")
        or alert_obj.get("sig_id")
        or alert.get("Event", {}).get("signature_id")
    )
    if isinstance(sig_id, int):
        sig_id = f"signature ID:{sig_id}"

    # Generator ID / GID
    gid = (
        alert_obj.get("gid")
        or alert.get("gid")
        or alert.get("Event", {}).get("generator_id")
    )

    # Packet number / event ID
    pkt_num = alert.get("pkt_num") or alert.get("Event", {}).get("event_id") or alert.get("event_id")

    # Action
    action = alert.get("action") or alert_obj.get("packet_action") or alert.get("Event", {}).get("packet_action")

    # Timestamp
    ts = None
    if "timestamp" in alert:
        ts = alert.get("timestamp")
    elif "time" in alert:
        ts = alert.get("time")
    elif "timestamp" in alert_obj:
        ts = alert_obj.get("timestamp")
    elif "event_second" in alert.get("Event", {}):
        ts = alert.get("Event", {}).get("event_second")
    micro = alert.get("Event", {}).get("event_microsecond", 0)
    iso_ts = None
    try:
        if ts is not None:
            if isinstance(ts, int):
                iso_ts = datetime.fromtimestamp(ts + micro / 1_000_000, tz=timezone.utc).isoformat()
            elif isinstance(ts, str):
                try:
                    iso_ts = datetime.fromisoformat(ts).isoformat()
                except Exception:
                    try:
                        iso_ts = datetime.strptime(ts, "%m/%d-%H:%M:%S.%f").replace(year=datetime.now().year).isoformat()
                    except Exception:
                        print(f"[WARN] Could not parse timestamp '{ts}', using utcnow.")
                        iso_ts = datetime.utcnow().isoformat()
            else:
                iso_ts = datetime.utcnow().isoformat()
        else:
            iso_ts = datetime.utcnow().isoformat()
    except Exception:
        iso_ts = datetime.utcnow().isoformat()
    # Source port
    src_port = (
        alert.get("src_port")
        or alert_obj.get("src_port")
        or alert.get("Event", {}).get("src_port")
    )
    # If Unified2 style "ip:port" exists in src_ap
    if not src_port and alert.get("src_ap") and ":" in alert.get("src_ap"):
        try:
            src_port = int(alert.get("src_ap").split(":")[1])
        except ValueError:
            src_port = None

    # Destination port
    dest_port = (
        alert.get("dest_port")
        or alert_obj.get("dest_port")
        or alert.get("Event", {}).get("dest_port")
    )
    # If Unified2 style "ip:port" exists in dst_ap
    if not dest_port and alert.get("dst_ap") and ":" in alert.get("dst_ap"):
        try:
            dest_port = int(alert.get("dst_ap").split(":")[1])
        except ValueError:
            dest_port = None

    return {
        "timestamp": iso_ts,
        "src_ip": src_ip,
        "dest_ip": dest_ip,
        "signature": signature,
        "severity": severity,
        "protocol": protocol,
        "signature_id": sig_id,
        "gid": gid,
        "pkt_num": pkt_num,
        "action": action,
        "original": alert,
        "src_port": src_port,
        "dest_port": dest_port,
    }

@adbp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required(optional=True)
def get_alerts_for_user():
    """
    GET /api/alerts?page=1&per_page=100
    Returns paginated alerts tied to any of the user's API keys
    """
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"error": "unauthenticated"}), 401

    # Pagination params
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 100))

    keys = APIKey.query.filter_by(user_id=user.id).all()
    key_values = [k.key for k in keys]

    print(f"[DEBUG] User ID: {user.id}, API Keys: {key_values}")

    # Return alerts if api_key OR user_id matches
    if key_values:
        query = Alert.query.filter(
            (Alert.api_key.in_(key_values)) | (Alert.user_id == user.id)
        ).order_by(Alert.created_at.desc())
    else:
        query = Alert.query.filter(
            Alert.user_id == user.id
        ).order_by(Alert.created_at.desc())
    
    total = query.count()
    print(f"[DEBUG] Total alerts found: {total}")
    
    alerts = query.offset((page - 1) * per_page).limit(per_page).all()
    print(f"[DEBUG] Alerts returned: {len(alerts)}")

    # Add pcap match count to each alert
    alerts_data = []
    for alert in alerts:
        alert_dict = alert.to_dict()
        match_count = AlertPcapMatch.query.filter_by(alert_id=alert.id).count()
        alert_dict["pcap_match_count"] = match_count
        alerts_data.append(alert_dict)

    return jsonify({
        "alerts": alerts_data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "used_api_keys": key_values
    })