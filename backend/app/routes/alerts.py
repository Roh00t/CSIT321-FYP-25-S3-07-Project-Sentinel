from flask import Blueprint, request, jsonify, current_app
import os, json
from werkzeug.utils import secure_filename
from app.utils.email_utils import send_alert_email
try:
    from app.models.app_user import AppUser
    from app.models.api_keys import ApiKey
    from app import db
except ImportError:
    # These imports should be done after db is initialized in app/__init__.py
    AppUser = None
    ApiKey = None
    db = None

alerts_bp = Blueprint("alerts", __name__)
UPLOAD_FOLDER = "uploads"

from datetime import datetime, timezone

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
    ts = (
        alert.get("timestamp")
        or alert.get("time")
        or alert_obj.get("timestamp")
        or alert.get("Event", {}).get("event_second")
    )
    micro = alert.get("Event", {}).get("event_microsecond", 0)
    if isinstance(ts, int):
        from datetime import datetime, timezone
        ts = datetime.fromtimestamp(ts + micro / 1_000_000, tz=timezone.utc).isoformat()
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

    api_key = alert.get("api_key")
    admin_email = get_admin_email_for_api_key(api_key)

    return {
        "timestamp": ts,
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
        "api_key": api_key,
        "admin_email": admin_email,
    }

def get_admin_email_for_api_key(api_key_value):
    if not api_key_value or api_key_value == "0":
        return None
    key = ApiKey.query.filter_by(key=api_key_value).first()
    if key and key.user_id:
        user = AppUser.query.filter_by(id=key.user_id).first()
        if user and user.admin_email:
            return user.admin_email
    return None

    
@alerts_bp.route("/upload-alerts", methods=["POST"])
def upload_alerts():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(current_app.root_path, UPLOAD_FOLDER, filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    file.save(save_path)

    alerts = []
    try:
        from app.models.app_user import AppUser
        from app.models.alert import Alert
        from app import db
        user_id = request.form.get("user_id") or request.args.get("user_id")
        app_user = None
        if user_id:
            app_user = AppUser.query.filter_by(id=user_id).first()

        with open(save_path, "r") as f:
            first_char = f.read(1)
            f.seek(0)
            if first_char == "[":
                data = json.load(f)
                alert_objs = data
            else:
                alert_objs = []
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        alert = json.loads(line)
                        alert_objs.append(alert)
                    except json.JSONDecodeError:
                        continue

        # If Pro user, persist alerts
        print(app_user.subscription_plan)
        if app_user and app_user.subscription_plan == "Pro":
            for alert in alert_objs:
                if alert.get("event_type") == "stats":
                    continue
                norm = normalize_alert(alert)
                alert_model = Alert(
                    timestamp=datetime.fromisoformat(norm["timestamp"]) if norm["timestamp"] else datetime.utcnow(),
                    src_ip=norm["src_ip"],
                    src_port=norm["src_port"],
                    dest_ip=norm["dest_ip"],
                    dest_port=norm["dest_port"],
                    protocol=norm["protocol"],
                    signature=norm["signature"],
                    severity=norm["severity"],
                    api_key=norm.get("api_key"),
                    source_forwarder_name=None,
                    user_id=app_user.id
                )
                db.session.add(alert_model)
                alerts.append(alert_model.to_dict())
            db.session.commit()
        else:
            # Basic user: do not persist, just normalize
            for alert in alert_objs:
                if alert.get("event_type") == "stats":
                    continue
                alerts.append(normalize_alert(alert))

        return jsonify({"alerts": alerts}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to parse or save alerts: {str(e)}"}), 400

@alerts_bp.route("/stream/send-email", methods=["POST"])
def send_alert_stream_email():
    data = request.get_json()
    to_email = data.get("to")
    message = data.get("message")
    if not to_email or not message:
        return jsonify({"error": "Missing 'to' or 'message' field"}), 400
    subject = "Security Alert Notification"
    success = send_alert_email(to_email, subject, message)
    if success:
        return jsonify({"status": "sent"}), 200
    else:
        return jsonify({"error": "Failed to send email"}), 500
