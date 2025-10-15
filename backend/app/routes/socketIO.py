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
import os
EVE_PATH = os.path.join(os.path.dirname(__file__), "..", "uploads", "eve.json")

class AlertsNamespace(Namespace):
    def handle_connect(self):
        print("🔌 Client connected — sending all alerts from eve.json")

        if not os.path.exists(EVE_PATH):
            print("⚠️ eve.json not found, skipping preload")
            emit("bulk_alerts", {"alerts": []})
            return

        try:
            with open(EVE_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()

            alerts = []
            for line in lines:
                try:
                    event = json.loads(line.strip())
                    if event.get("event_type") == "alert":
                        alerts.append(event)
                except Exception:
                    continue

            #print(f"📤 Sending {len(alerts)} pre-existing alerts to new client")
            emit("bulk_alerts", {"alerts": alerts})

        except Exception as e:
            print(f"⚠️ Failed to read eve.json: {e}")
            emit("bulk_alerts", {"alerts": []})

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
            print(f"⚠️ Failed to read eve.json: {e}")
            emit("bulk_alerts", {"alerts": []}, namespace="/api/alerts/stream")

    @staticmethod
    def tail_last_lines(file_path, n=100):
        last_lines = deque(maxlen=n)
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                last_lines.append(line.strip())
        return list(last_lines)
    
    def on_disconnect(self):
        print("❌ Pro user disconnected")

    def on_alert_event(self, data):
        if not data:
            print("⚠️ Received empty alert event")
            return

        api_key = data.get("api_key") 
        event_type = data.get("event_type")

        # Ignore flow/stats events entirely
        if event_type in ["flow", "stats"]:
            return

        # ✅ Handle DNS events nicely
        if event_type == "dns":
            normalized = dns_to_display(data)
        else:
            normalized = normalize_alert(data)

        normalized["api_key"] = api_key
        
        alert_buffer.append(normalized)
        send_alert_email_if_needed(normalized)
        #print(f"📥 Buffered alert: {normalized.get('signature') or event_type} (API Key: {api_key})")


# 🔹 DNS events: lightweight normalization for display
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


# 🔹 Normalize regular alerts
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

    # ✅ Add port detection here
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

    return {
        "timestamp": alert.get("timestamp"),
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
    from app import db
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
    # Find the latest filter for this user (or use defaults)
    filter_obj = Filter.query.filter_by(user_id=user_id).order_by(Filter.id.desc()).first()
    if filter_obj and filter_obj.alerts_options:
        return filter_obj.alerts_options
    # Default options
    return {"high": True, "medium": False, "low": False, "threshold": 100}


def send_alert_email_if_needed(alert):
    api_key = alert.get("api_key")
    from app.models.api_keys import APIKey

    key = APIKey.query.filter_by(key=api_key).first() if api_key and api_key != "0" else None
    user_id = key.user_id if key else None
    print(f"User ID: {user_id}")
    alert_options = get_alert_options_for_user(user_id)
    print(alert_options)

    # ✅ Always count all activity (even benign)
    if user_id:
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        user_alerts = recent_alerts_per_user.setdefault(user_id, [])
        user_alerts.append(now)

        # Clean up old entries (>1h)
        user_alerts = [t for t in user_alerts if t > one_hour_ago]
        recent_alerts_per_user[user_id] = user_alerts

        # Load user’s threshold (default 100/hour)
        alert_options = get_alert_options_for_user(user_id)
        threshold = alert_options.get("threshold", 100)

        if len(user_alerts) >= threshold:
            admin_email = get_admin_email_for_api_key(api_key)
            print(f"🚨 User {user_id} exceeded {threshold} events/hour — emailing {admin_email}")
            send_alert_email(
                admin_email,
                "⚠️ High Activity Volume Detected",
                f"You have received {len(user_alerts)} total events in the past hour (threshold: {threshold})."
            )
            # Prevent spam: reset counter
            recent_alerts_per_user[user_id] = []

    # ✅ Then check if this specific alert deserves a severity email
    alert_options = get_alert_options_for_user(user_id) if user_id else {"high": True, "medium": False, "low": False}
    severity = int(alert.get("severity") or 0)
    should_send = (
        (severity == 1 and alert_options.get("high")) or
        (severity == 2 and alert_options.get("medium")) or
        (severity == 3 and alert_options.get("low"))
    )

    if should_send:
        admin_email = get_admin_email_for_api_key(api_key)
        print(f"✉️ Sending alert email from {DEFAULT_ADMIN_EMAIL} to {admin_email} for alert: {alert['signature']}")
        send_alert_email(
            admin_email,
            "Security Alert Notification",
            f"Alert detected! Severity: {alert['severity']}, Signature: {alert['signature']}"
        )


# 🔹 Background task that flushes buffer every second
def bulk_alert_sender():
    from app import socketio
    print("🚀 Bulk alert sender started (running every 1s)")
    while True:
        eventlet.sleep(BUFFER_INTERVAL)
        if alert_buffer:
            batch = list(alert_buffer)
            alert_buffer.clear()
            try:
                #print("🧾 Example alert being sent:", batch[0])
                # Emit all alerts including their api_key field
                socketio.emit(
                    "bulk_alerts",
                    {"alerts": batch},
                    namespace="/api/alerts/stream"
                )
                #print(f"📤 Sent {len(batch)} buffered alerts to frontend")
            except Exception as e:
                print(f"⚠️ Error emitting alerts: {e}")


# 🔹 Start background sender only once
def start_bulk_sender():
    from app import socketio  # ✅ Lazy import here too
    if not getattr(start_bulk_sender, "started", False):
        socketio.start_background_task(bulk_alert_sender)
        start_bulk_sender.started = True
        #print("🧵 Started background alert sender thread")
