import socketio
import json
import time
import threading
import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox

sio = socketio.Client(reconnection=False)  # manual reconnect
stop_event = threading.Event()
thread = None

class ForwarderGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Suricata Alert Forwarder")

        # EVE JSON path
        tk.Label(root, text="EVE JSON Path:").pack(anchor="w", padx=10, pady=(10, 0))
        self.path_var = tk.StringVar(value=r"D:\Program Files\Suricata\log\eve.json")
        path_frame = tk.Frame(root)
        path_frame.pack(fill="x", padx=10)
        self.path_entry = tk.Entry(path_frame, textvariable=self.path_var, width=60)
        self.path_entry.pack(side="left", fill="x", expand=True)
        tk.Button(path_frame, text="Browse", command=self.browse).pack(side="left", padx=5)

        # Buttons + checkbox
        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=5)
        tk.Button(btn_frame, text="Start Forwarding", command=self.start_forwarding).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Stop", command=self.stop_forwarding).pack(side="left", padx=5)
        self.auto_reconnect = tk.BooleanVar(value=True)
        tk.Checkbutton(btn_frame, text="Auto Reconnect", variable=self.auto_reconnect).pack(side="left", padx=10)

        # Log box
        self.log_box = scrolledtext.ScrolledText(root, width=80, height=20, state="disabled", wrap="word")
        self.log_box.pack(padx=10, pady=10)

        # Status bar
        self.status_var = tk.StringVar(value="🔴 Disconnected")
        tk.Label(root, textvariable=self.status_var, anchor="w").pack(fill="x", padx=10, pady=(0, 10))

        # Connect socket initially
        self.connect_socket()

    def browse(self):
        path = filedialog.askopenfilename(title="Select eve.json", filetypes=[("JSON files", "*.json")])
        if path:
            self.path_var.set(path)

    def log(self, text):
        """Log to both console and GUI."""
        print(text)
        self.log_box.configure(state="normal")
        self.log_box.insert(tk.END, text + "\n")
        self.log_box.configure(state="disabled")
        self.log_box.see(tk.END)

    def connect_socket(self):
        """Attempt connection to Flask SocketIO."""
        try:
            sio.connect("http://localhost:5000", namespaces=["/api/alerts/stream"])
            self.status_var.set("🟢 Connected")
            self.log("✅ Connected to Flask SocketIO")
        except Exception as e:
            self.status_var.set("🔴 Disconnected")
            self.log(f"⚠️ Connection error: {e}")
            if self.auto_reconnect.get():
                self.log("🔁 Will retry connection in 5 seconds...")
                self.root.after(5000, self.connect_socket)

    def start_forwarding(self):
        global thread
        if thread and thread.is_alive():
            self.log("⚠️ Already running")
            return
        stop_event.clear()
        thread = threading.Thread(target=self.tail_eve, daemon=True)
        thread.start()
        self.log("▶️ Started forwarding Suricata alerts")

    def stop_forwarding(self):
        stop_event.set()
        self.log("🛑 Stopped forwarding alerts")

    def tail_eve(self):
        eve_path = self.path_var.get()
        try:
            with open(eve_path, "r", encoding="utf-8") as f:
                f.seek(0, 2)
                while not stop_event.is_set():
                    line = f.readline()
                    if not line:
                        time.sleep(0.3)
                        continue
                    try:
                        event = json.loads(line.strip())
                        sio.emit("alert_event", event, namespace="/api/alerts/stream")
                        self.log(f"📤 Sent alert: {event.get('event_type')}")
                    except Exception as e:
                        self.log(f"⚠️ JSON error: {e}")
        except Exception as e:
            self.log(f"⚠️ File error: {e}")

@sio.event
def connect():
    print("✅ Socket connected")

@sio.event
def disconnect():
    print("❌ Socket disconnected")

# Launch GUI
if __name__ == "__main__":
    root = tk.Tk()
    gui = ForwarderGUI(root)
    root.protocol("WM_DELETE_WINDOW", lambda: (stop_event.set(), root.destroy()))
    root.mainloop()
