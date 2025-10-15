import eventlet
from flask_socketio import emit, Namespace

alert_buffer = []
BUFFER_INTERVAL = 1.0  # seconds between flushes


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

            print(f"📤 Sending {len(alerts)} pre-existing alerts to new client")
            emit("bulk_alerts", {"alerts": alerts})

        except Exception as e:
            print(f"⚠️ Failed to read eve.json: {e}")
            emit("bulk_alerts", {"alerts": []})

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
        print(f"📥 Buffered alert: {normalized.get('signature') or event_type} (API Key: {api_key})")


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
                print("🧾 Example alert being sent:", batch[0])
                # Emit all alerts including their api_key field
                socketio.emit(
                    "bulk_alerts",
                    {"alerts": batch},
                    namespace="/api/alerts/stream"
                )
                print(f"📤 Sent {len(batch)} buffered alerts to frontend")
            except Exception as e:
                print(f"⚠️ Error emitting alerts: {e}")


# 🔹 Start background sender only once
def start_bulk_sender():
    from app import socketio  # ✅ Lazy import here too
    if not getattr(start_bulk_sender, "started", False):
        socketio.start_background_task(bulk_alert_sender)
        start_bulk_sender.started = True
        print("🧵 Started background alert sender thread")
