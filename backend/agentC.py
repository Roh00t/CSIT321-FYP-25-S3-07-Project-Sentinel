import socketio
import json
import time
from threading import Thread, Event

sio = socketio.Client()
EVE_PATH = r"C:\Program Files\Suricata\log\eve.json"
stop_event = Event()

@sio.event
def connect():
    pass

@sio.event
def disconnect():
    pass

def tail_eve():
    try:
        with open(EVE_PATH, "r", encoding="utf-8") as f:
            f.seek(0, 2)
            while not stop_event.is_set():
                line = f.readline()
                if not line:
                    time.sleep(0.2)
                    continue
                try:
                    event = json.loads(line.strip())
                    sio.emit("alert_event", event, namespace="/api/alerts/stream")
                except Exception:
                    pass
    except Exception:
        pass

try:
    sio.connect("http://localhost:5000", namespaces=["/api/alerts/stream"])
    thread = Thread(target=tail_eve)
    thread.start()
    sio.wait()
except KeyboardInterrupt:
    stop_event.set()
    thread.join()
    sio.disconnect()
