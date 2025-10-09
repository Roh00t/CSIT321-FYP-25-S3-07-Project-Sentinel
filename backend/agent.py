import socketio
import json
import time
from threading import Thread, Event

sio = socketio.Client()
EVE_PATH = r"D:\Program Files\Suricata\log\eve.json"
stop_event = Event()  # signal to stop tailing

@sio.event
def connect():
    print("✅ Connected to Flask SocketIO")

@sio.event
def disconnect():
    print("❌ Disconnected from server")

def tail_eve():
    try:
        with open(EVE_PATH, "r", encoding="utf-8") as f:
            f.seek(0, 2)  # go to end of file
            while not stop_event.is_set():
                line = f.readline()
                if not line:
                    time.sleep(0.2)  # use regular sleep here
                    continue
                try:
                    event = json.loads(line.strip())
                    sio.emit("alert_event", event, namespace="/api/alerts/stream")
                    print("📤 Sent alert:", event.get("event_type"))
                except Exception as e:
                    print("⚠️ Error:", e)
    except Exception as e:
        print("⚠️ tail_eve error:", e)

try:
    sio.connect("http://localhost:5000", namespaces=["/api/alerts/stream"])
    thread = Thread(target=tail_eve)
    thread.start()
    sio.wait()  # main thread waits for SocketIO events
except KeyboardInterrupt:
    print("\n🛑 Stopping client...")
    stop_event.set()    # tell tail_eve to exit
    thread.join()       # wait for thread to finish
    sio.disconnect()    # disconnect socket
    print("✅ Client stopped gracefully")
