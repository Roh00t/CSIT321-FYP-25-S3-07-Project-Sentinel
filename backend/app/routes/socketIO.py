#backend/app/routes/socketIO.py
from flask import Blueprint
from flask_socketio import emit, Namespace
from datetime import datetime, timezone
import threading
import time

class AlertsNamespace(Namespace):
    def on_connect(self):
        print("Pro user connected to real-time alerts")
        emit("alert", {"message": "Connected to real-time alerts"})

    def on_disconnect(self):
        print("Pro user disconnected")
    
    def on_alert_event(self, data):
        print("📥 Received alert event:", data.get("event_type") or data.get("alert_type"))
        if data.get("event_type") in ["flow", "stats"]:
            return
        normalized = normalize_alert(data)
        emit("new_alert", normalized, broadcast=True)
        print("📤 Forwarded normalized alert to frontend:", normalized.get("signature"))
        
def send_initial_fetch():
    try:
        with open(EVE_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()
            recent_lines = lines[-50:]  # last 50 alerts
            for line in recent_lines:
                try:
                    event = json.loads(line.strip())
                    sio.emit("alert_event", event)  # same event name
                    print("📤 Sent initial alert:", event.get("event_type"))
                except Exception as e:
                    print("⚠️ Error processing line:", e)
    except Exception as e:
        print("⚠️ Failed initial fetch:", e)

# Use your normalize_alert function
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

    signature = (
        alert_obj.get("signature")
        or alert.get("signature")
        or alert.get("msg")
        or alert.get("rule")
        or alert.get("class")
    )

    sig_id = (
        alert_obj.get("signature_id")
        or alert.get("sid")
        or alert_obj.get("sig_id")
        or alert.get("Event", {}).get("signature_id")
    )
    if isinstance(sig_id, int):
        sig_id = f"signature ID:{sig_id}"

    gid = (
        alert_obj.get("gid")
        or alert.get("gid")
        or alert.get("Event", {}).get("generator_id")
    )

    pkt_num = alert.get("pkt_num") or alert.get("Event", {}).get("event_id") or alert.get("event_id")
    action = alert.get("action") or alert_obj.get("packet_action") or alert.get("Event", {}).get("packet_action")

    ts = (
        alert.get("timestamp")
        or alert.get("time")
        or alert_obj.get("timestamp")
        or alert.get("Event", {}).get("event_second")
    )
    micro = alert.get("Event", {}).get("event_microsecond", 0)
    if isinstance(ts, int):
        ts = datetime.fromtimestamp(ts + micro / 1_000_000, tz=timezone.utc).isoformat()

    src_port = (
        alert.get("src_port")
        or alert_obj.get("src_port")
        or alert.get("Event", {}).get("src_port")
    )
    if not src_port and alert.get("src_ap") and ":" in alert.get("src_ap"):
        try:
            src_port = int(alert.get("src_ap").split(":")[1])
        except ValueError:
            src_port = None

    dest_port = (
        alert.get("dest_port")
        or alert_obj.get("dest_port")
        or alert.get("Event", {}).get("dest_port")
    )
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

# Optional: Background thread to simulate sending alerts
def background_alert_sender():
    while True:
        time.sleep(5)  # send every 5 seconds
        socketio.emit("alert_event", {"alert": "New alert generated!"}, namespace="/api/alerts/stream")
