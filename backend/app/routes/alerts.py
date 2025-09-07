from flask import Blueprint, request, jsonify, current_app
import os, json
from werkzeug.utils import secure_filename

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
    }

    
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
        with open(save_path, "r") as f:
            first_char = f.read(1)
            f.seek(0)

            if first_char == "[":
                data = json.load(f)
                for alert in data:
                    # Skip stats-only events
                    if alert.get("event_type") == "stats":
                        continue
                    alerts.append(normalize_alert(alert))
            else:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        alert = json.loads(line)
                        if alert.get("event_type") == "stats":
                            continue
                        alerts.append(normalize_alert(alert))
                    except json.JSONDecodeError:
                        continue

        return jsonify({"alerts": alerts}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400
