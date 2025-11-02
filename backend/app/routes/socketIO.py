import eventlet
import os
import json
from flask_socketio import emit, Namespace
from app.utils.email_utils import send_alert_email
from collections import deque
from datetime import datetime, timedelta

recent_alerts_per_user = {} 
alert_buffer = []
BUFFER_INTERVAL = 1.0  # seconds between flushes
LAST_N = 100 
DEFAULT_ADMIN_EMAIL = os.getenv("MAIL_USERNAME", "projectsentinelfyp@gmail.com")
EVE_PATH = os.path.join(os.path.dirname(__file__), "..", "uploads", "eve.json")

class AlertsNamespace(Namespace):
    def handle_connect(self):
        pass

    def on_get_last_alerts(self, data=None):
        """Called by the frontend on page load to fetch the last N alerts"""
        if not os.path.exists(EVE_PATH):
            emit("bulk_alerts", {"alerts": []}, namespace="/api/alerts/stream")
            return

        last_lines = deque(maxlen=LAST_N)
        try:
            with open(EVE_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    last_lines.append(line.strip())

            alerts = []
            for line in last_lines:
                try:
                    event = json.loads(line)
                    if event.get("event_type") == "alert":
                        alerts.append(event)
                except Exception:
                    continue

            emit("bulk_alerts", {"alerts": alerts}, namespace="/api/alerts/stream")

        except Exception as e:
            emit("bulk_alerts", {"alerts": []}, namespace="/api/alerts/stream")

    @staticmethod
    def tail_last_lines(file_path, n=100):
        last_lines = deque(maxlen=n)
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                last_lines.append(line.strip())
        return list(last_lines)
    
    def on_disconnect(self):
        pass

    def on_alert_event(self, data):
        if not data:
            return

        api_key = data.get("api_key") 
        event_type = data.get("event_type")

        # Ignore flow/stats events entirely
        if event_type in ["flow", "stats"]:
            return

        # Handle DNS events
        if event_type == "dns":
            normalized = dns_to_display(data)
        else:
            normalized = normalize_alert(data)

        normalized["api_key"] = api_key
        
        alert_buffer.append(normalized)
        send_alert_email_if_needed(normalized)


# DNS events normalization for display
def dns_to_display(dns_event):
    rrname = (
        dns_event.get("dns", {}).get("queries", [{}])[0].get("rrname")
        if dns_event.get("dns")
        else "unknown.domain"
    )
    return {
        "timestamp": dns_event.get("timestamp"),
        "src_ip": dns_event.get("src_ip"),
        "src_port": dns_event.get("src_port"),
        "dest_ip": dns_event.get("dest_ip"),
        "dest_port": dns_event.get("dest_port"),
        "protocol": dns_event.get("proto"),
        "signature": f"DNS query for {rrname}",
        "severity": dns_event.get("severity"),
    }


# Normalize regular alerts
def normalize_alert(alert: dict) -> dict:
    alert_obj = alert.get("alert") or alert.get("Event", {}).get("alert") or alert.get("Event") or {}

    src_ip = (
        alert.get("src_ip")
        or alert.get("src_addr")
        or alert.get("src_host")
        or alert_obj.get("ip_source")
        or alert.get("Event", {}).get("ip_source")
        or (alert.get("src_ap").split(":")[0] if alert.get("src_ap") and ":" in alert.get("src_ap") else None)
    )

    dest_ip = (
        alert.get("dest_ip")
        or alert.get("dst_ip")
        or alert.get("dst_addr")
        or alert.get("dst_host")
        or alert_obj.get("ip_destination")
        or alert.get("Event", {}).get("ip_dest")
        or (alert.get("dst_ap").split(":")[0] if alert.get("dst_ap") and ":" in alert.get("dst_ap") else None)
    )

    src_port = (
        alert.get("src_port")
        or alert.get("sport")
        or alert.get("Event", {}).get("sport")
    )

    dest_port = (
        alert.get("dest_port")
        or alert.get("dport")
        or alert.get("Event", {}).get("dport")
    )

    signature = (
        alert_obj.get("signature")
        or alert.get("signature")
        or alert.get("msg")
        or alert.get("rule")
        or alert.get("class")
    )

    severity = (
        alert_obj.get("severity")
        or alert_obj.get("priority")
        or alert.get("severity")
        or alert.get("priority")
        or alert.get("Event", {}).get("priority_id")
    )

    protocol = (
        alert.get("proto")
        or alert.get("protocol")
        or alert_obj.get("protocol")
        or alert_obj.get("ip_proto")
        or alert.get("Event", {}).get("ip_proto")
    )

    # Robust timestamp normalization
    ts = alert.get("timestamp")
    from datetime import datetime, timezone
    iso_ts = None
    if ts is not None:
        if isinstance(ts, int):
            iso_ts = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        elif isinstance(ts, str):
            try:
                iso_ts = datetime.fromisoformat(ts).isoformat()
            except Exception:
                try:
                    iso_ts = datetime.strptime(ts, "%m/%d-%H:%M:%S.%f").replace(year=datetime.now().year).isoformat()
                except Exception:
                    iso_ts = datetime.utcnow().isoformat()
        else:
            iso_ts = datetime.utcnow().isoformat()
    else:
        iso_ts = datetime.utcnow().isoformat()

    return {
        "timestamp": iso_ts,
        "src_ip": src_ip,
        "src_port": src_port,
        "dest_ip": dest_ip,
        "dest_port": dest_port,
        "signature": signature,
        "severity": severity,
        "protocol": protocol,
    }


def get_admin_email_for_api_key(api_key_value):
    from app.models.app_user import AppUser
    from app.models.api_keys import APIKey
    if not api_key_value or api_key_value == "0":
        return DEFAULT_ADMIN_EMAIL
    key = APIKey.query.filter_by(key=api_key_value).first()
    if key and key.user_id:
        user = AppUser.query.filter_by(id=key.user_id).first()
        if user and user.admin_email:
            return user.admin_email
    return DEFAULT_ADMIN_EMAIL


def get_alert_options_for_user(user_id):
    from app.models.filter import Filter
    filter_obj = Filter.query.filter_by(user_id=user_id).order_by(Filter.id.desc()).first()
    if filter_obj and filter_obj.alerts_options:
        return filter_obj.alerts_options
    return {"high": True, "medium": False, "low": False, "threshold": 100}


def send_alert_email_if_needed(alert):
    from app.models.api_keys import APIKey
    api_key = alert.get("api_key")
    key = APIKey.query.filter_by(key=api_key).first() if api_key and api_key != "0" else None
    user_id = key.user_id if key else None

    # Count all activity
    if user_id:
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        user_alerts = recent_alerts_per_user.setdefault(user_id, [])
        user_alerts.append(now)
        user_alerts = [t for t in user_alerts if t > one_hour_ago]
        recent_alerts_per_user[user_id] = user_alerts

        alert_options = get_alert_options_for_user(user_id)
        threshold = alert_options.get("threshold", 100)

        if len(user_alerts) >= threshold:
            admin_email = get_admin_email_for_api_key(api_key)
            send_alert_email(
                admin_email,
                "High Activity Volume Detected",
                f"You have received {len(user_alerts)} total events in the past hour (threshold: {threshold})."
            )
            recent_alerts_per_user[user_id] = []

    # Severity email
    alert_options = get_alert_options_for_user(user_id) if user_id else {"high": True, "medium": False, "low": False}
    severity = int(alert.get("severity") or 0)
    should_send = (
        (severity == 1 and alert_options.get("high")) or
        (severity == 2 and alert_options.get("medium")) or
        (severity == 3 and alert_options.get("low"))
    )
    if should_send:
        admin_email = get_admin_email_for_api_key(api_key)
        send_alert_email(
            admin_email,
            "Security Alert Notification",
            f"Alert detected! Severity: {alert['severity']}, Signature: {alert['signature']}"
        )

def persist_alert_to_db(alert_item):
    from app import db
    from app.models.alert import Alert

    ts = None
    try:
        if alert_item.get("timestamp"):
            ts = datetime.fromisoformat(alert_item["timestamp"].replace("Z", "+00:00"))
    except Exception:
        ts = datetime.utcnow()
    if ts is None:
        ts = datetime.utcnow()

    alertobj = Alert(
        timestamp=ts,
        src_ip=alert_item.get("src_ip"),
        src_port=alert_item.get("src_port"),
        dest_ip=alert_item.get("dest_ip"),
        dest_port=alert_item.get("dest_port"),
        protocol=alert_item.get("protocol"),
        signature=alert_item.get("signature"),
        severity=alert_item.get("severity"),
        api_key=alert_item.get("api_key"),
        created_at=datetime.utcnow()
    )

    try:
        db.session.add(alertobj)
        db.session.commit()
    except Exception as e:
        db.session.rollback()

_app = None  # module-level global

def set_app(flask_app):
    global _app
    _app = flask_app

# Background task that flushes buffer every second
def bulk_alert_sender():
    from app import socketio
    
    while True:
        eventlet.sleep(BUFFER_INTERVAL)
        if alert_buffer:
            batch = list(alert_buffer)
            alert_buffer.clear()

            # Emit to frontend
            try:
                socketio.emit("bulk_alerts", {"alerts": batch}, namespace="/api/alerts/stream")
            except Exception as e:
                pass

            # Persist alerts inside app context
            with _app.app_context():
                for item in batch:
                    persist_alert_to_db(item)



# Start background sender only once
def start_bulk_sender():
    from app import socketio  # Lazy import
    if not getattr(start_bulk_sender, "started", False):
        socketio.start_background_task(bulk_alert_sender)
        start_bulk_sender.started = True
