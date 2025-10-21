from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import get_jwt_identity
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
    from datetime import datetime, timezone
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

    
from flask_jwt_extended import jwt_required

@alerts_bp.route("/upload-alerts", methods=["POST"])
@jwt_required(optional=True)
def upload_alerts():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(current_app.root_path, UPLOAD_FOLDER, filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    alerts = []
    try:
        from app.models.app_user import AppUser
        from app.models.alert import Alert
        from app import db
        user_id = request.form.get("user_id") or request.args.get("user_id")
        plan_type = request.form.get("plan_type") or request.args.get("plan_type")
        if not user_id:
            user_id = get_jwt_identity()
        app_user = None
        if user_id:
            app_user = AppUser.query.filter_by(id=user_id).first()
            print(f"[DEBUG] user_id={user_id}, found={bool(app_user)}, plan={getattr(app_user, 'subscription_plan', None)}")
        else:
            print(f"[DEBUG] No user_id provided in upload request, plan_type={plan_type}")

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
                        print(f"[ERROR] JSON decode error for line: {line}")
                        continue

        # If Pro user, persist alerts (by user_id or plan_type)
        persist_pro = False
        persist_user_id = None
        if app_user and app_user.subscription_plan == "Pro":
            persist_pro = True
            persist_user_id = app_user.id
        elif plan_type == "Pro":
            persist_pro = True
        if persist_pro:
            print(f"[DEBUG] Persisting {len(alert_objs)} alerts for Pro user (user_id={persist_user_id})")
            for alert in alert_objs:
                if alert.get("event_type") == "stats":
                    continue
                norm = normalize_alert(alert)
                # Robust timestamp parsing for DB insert
                ts_val = norm["timestamp"]
                from datetime import datetime
                db_ts = None
                if ts_val:
                    try:
                        db_ts = datetime.fromisoformat(ts_val)
                    except Exception:
                        try:
                            db_ts = datetime.strptime(ts_val, "%m/%d-%H:%M:%S.%f").replace(year=datetime.now().year)
                        except Exception:
                            print(f"[WARN] Could not parse DB timestamp '{ts_val}', using utcnow.")
                            db_ts = datetime.utcnow()
                else:
                    db_ts = datetime.utcnow()
                # Defensive: if db_ts is still None, set to utcnow
                if db_ts is None:
                    db_ts = datetime.utcnow()
                # Set user_id if available
                alert_model = Alert(
                    timestamp=db_ts,
                    src_ip=norm["src_ip"],
                    src_port=norm["src_port"],
                    dest_ip=norm["dest_ip"],
                    dest_port=norm["dest_port"],
                    protocol=norm["protocol"],
                    signature=norm["signature"],
                    severity=norm["severity"],
                    api_key=norm.get("api_key"),
                    source_forwarder_name=None,
                    user_id=persist_user_id
                )
                db.session.add(alert_model)
                print(f"[DEBUG] Added alert to DB: {alert_model.to_dict()}")
                alerts.append(alert_model.to_dict())
            db.session.commit()
            print(f"[DEBUG] Committed alerts for Pro user")
        else:
            # Basic user: do not persist, just normalize
            print(f"[DEBUG] Normalizing {len(alert_objs)} alerts for Basic user or no user")
            for alert in alert_objs:
                if alert.get("event_type") == "stats":
                    continue
                alerts.append(normalize_alert(alert))

        return jsonify({"alerts": alerts}), 200
    except Exception as e:
        print(f"[ERROR] Upload error: {e}")
        return jsonify({"error": f"Failed to parse or save alerts: {str(e)}"}), 400
        return jsonify({"alerts": alerts}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to parse or save alerts: {str(e)}"}), 400
