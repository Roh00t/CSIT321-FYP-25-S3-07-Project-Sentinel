import socketio
import json
import time
import threading
import tkinter as tk
from tkinter import filedialog, scrolledtext, messagebox, ttk

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

        # API Key
        self.api_key_var = tk.StringVar()
        self.show_api_key = tk.BooleanVar(value=False)
        frame = tk.Frame(root)
        frame.pack(padx=10, pady=10)
        tk.Label(frame, text="API Key:").grid(row=0, column=0, sticky="w")
        self.api_key_entry = tk.Entry(
            frame,
            textvariable=self.api_key_var,
            show="*"
        )
        self.api_key_entry.grid(row=0, column=1)

        def toggle_api_key(*args):
            self.api_key_entry.config(show="" if self.show_api_key.get() else "*")

        self.show_api_key.trace_add("write", toggle_api_key)

        show_btn = tk.Checkbutton(
            frame,
            text="Show",
            variable=self.show_api_key
        )
        show_btn.grid(row=0, column=2)

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
        api_key = self.api_key_var.get()
        try:
            sio.connect(
                "http://localhost:5000",
                namespaces=["/api/alerts/stream"],
                transports=["websocket"]
            )
            self.log("✅ Connected to backend with API key handshake")
        except Exception as e:
            self.log(f"❌ Connection failed: {e}")
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
        api_key = self.api_key_var.get()  # get the API key from the GUI
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
                        event["api_key"] = api_key
                        sio.emit("alert_event", event, namespace="/api/alerts/stream")
                        self.log(f"📤 Sent alert: {event.get('event_type')}")
                    except Exception as e:
                        self.log(f"⚠️ JSON error: {e}")
        except Exception as e:
            self.log(f"⚠️ File error: {e}")

@sio.event(namespace="/api/alerts/stream")
def connect():
    print("✅ Socket connected")

@sio.event(namespace="/api/alerts/stream")
def disconnect():
    print("❌ Socket disconnected")

# Launch GUI
if __name__ == "__main__":
    root = tk.Tk()
    root.title("Agent Forwarder")
    app = ForwarderGUI(root)
    root.mainloop()
