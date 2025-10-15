import socketio
import json
import time
import threading
import tkinter as tk
from tkinter import filedialog, scrolledtext, ttk, messagebox

sio = socketio.Client(reconnection=False)
forwarders = {}  # path -> {"stop_event": Event, "thread": Thread, "api_key": str}

class MultiForwarderGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Multi Suricata Forwarder")

        # === Source list ===
        self.tree = ttk.Treeview(root, columns=("path", "apikey", "status"), show="headings", height=8)
        self.tree.heading("path", text="EVE JSON Path")
        self.tree.heading("apikey", text="API Key")
        self.tree.heading("status", text="Status")
        self.tree.column("path", width=400)
        self.tree.column("apikey", width=200)
        self.tree.column("status", width=100)
        self.tree.pack(padx=10, pady=(10, 5), fill="x")

        # === Buttons ===
        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=5)
        tk.Button(btn_frame, text="Add Source", command=self.add_source).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Remove Selected", command=self.remove_source).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Start All", command=self.start_all).pack(side="left", padx=5)
        tk.Button(btn_frame, text="Stop All", command=self.stop_all).pack(side="left", padx=5)

        # === Log box ===
        self.log_box = scrolledtext.ScrolledText(root, width=90, height=18, state="disabled", wrap="word")
        self.log_box.pack(padx=10, pady=10, fill="both", expand=True)

        # === Status bar ===
        self.status_var = tk.StringVar(value="🔴 Disconnected")
        tk.Label(root, textvariable=self.status_var, anchor="w").pack(fill="x", padx=10, pady=(0, 10))

        # === Connect to backend ===
        self.connect_socket()

    # ----------------------------
    def connect_socket(self):
        try:
            sio.connect(
                "http://localhost:5000",
                namespaces=["/api/alerts/stream"],
                transports=["websocket"]
            )
            self.status_var.set("🟢 Connected")
            self.log("✅ Connected to backend.")
        except Exception as e:
            self.status_var.set("🔴 Disconnected")
            self.log(f"❌ Connection failed: {e}")
            self.root.after(5000, self.connect_socket)  # retry

    # ----------------------------
    def add_source(self):
        path = filedialog.askopenfilename(title="Select eve.json", filetypes=[("JSON files", "*.json")])
        if not path:
            return
        if path in forwarders:
            messagebox.showwarning("Already added", f"{path} is already in the list.")
            return

        # ask for API key
        popup = tk.Toplevel(self.root)
        popup.title("Enter API Key")
        tk.Label(popup, text=f"API key for:\n{path}", wraplength=400).pack(padx=10, pady=10)
        api_key_var = tk.StringVar()
        entry = tk.Entry(popup, textvariable=api_key_var, width=40, show="*")
        entry.pack(padx=10, pady=5)
        tk.Button(
            popup,
            text="Add",
            command=lambda: self.confirm_add_source(path, api_key_var.get(), popup)
        ).pack(pady=5)

    def confirm_add_source(self, path, api_key, popup):
        popup.destroy()
        forwarders[path] = {
            "api_key": api_key,
            "stop_event": threading.Event(),
            "thread": None,
        }
        self.tree.insert("", "end", iid=path, values=(path, api_key[:6] + "•••", "Stopped"))
        self.log(f"➕ Added source: {path}")

    def remove_source(self):
        selected = self.tree.selection()
        for iid in selected:
            self.stop_forwarder(iid)
            del forwarders[iid]
            self.tree.delete(iid)
        self.log("🗑️ Removed selected source(s)")

    # ----------------------------
    def start_all(self):
        for path in forwarders.keys():
            self.start_forwarder(path)

    def stop_all(self):
        for path in forwarders.keys():
            self.stop_forwarder(path)

    def start_forwarder(self, path):
        fwd = forwarders[path]
        if fwd["thread"] and fwd["thread"].is_alive():
            return
        fwd["stop_event"].clear()
        t = threading.Thread(target=self.tail_eve, args=(path, fwd["api_key"], fwd["stop_event"]), daemon=True)
        fwd["thread"] = t
        t.start()
        self.tree.set(path, "status", "Running")
        self.log(f"▶️ Started forwarding from {path}")

    def stop_forwarder(self, path):
        if path in forwarders:
            forwarders[path]["stop_event"].set()
            self.tree.set(path, "status", "Stopped")
            self.log(f"🛑 Stopped forwarding from {path}")

    # ----------------------------
    def tail_eve(self, path, api_key, stop_event):
        try:
            with open(path, "r", encoding="utf-8") as f:
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
                    except Exception as e:
                        self.log(f"⚠️ JSON error in {path}: {e}")
        except Exception as e:
            self.log(f"⚠️ File error in {path}: {e}")

    # ----------------------------
    def log(self, msg):
        print(msg)
        self.log_box.configure(state="normal")
        self.log_box.insert(tk.END, msg + "\n")
        self.log_box.configure(state="disabled")
        self.log_box.see(tk.END)


# ----------------------------
@sio.event(namespace="/api/alerts/stream")
def connect():
    print("✅ Socket connected")

@sio.event(namespace="/api/alerts/stream")
def disconnect():
    print("❌ Socket disconnected")

# ----------------------------
if __name__ == "__main__":
    root = tk.Tk()
    app = MultiForwarderGUI(root)
    root.mainloop()
