import socketio
import tkinter as tk
from tkinter import ttk, messagebox

sio = socketio.Client(reconnection=False)

class SendAlertGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Send Crafted Alert")

        # API Key
        tk.Label(root, text="API Key:").pack(padx=10, pady=(10, 0), anchor="w")
        self.api_key_var = tk.StringVar()
        tk.Entry(root, textvariable=self.api_key_var, width=40, show="*").pack(padx=10, pady=5)

        # Alert Level
        tk.Label(root, text="Alert Level (Severity):").pack(padx=10, pady=(10, 0), anchor="w")
        self.severity_var = tk.StringVar(value="1")
        ttk.Combobox(root, textvariable=self.severity_var, values=["1", "2", "3"], width=10).pack(padx=10, pady=5)

        # Message
        tk.Label(root, text="Alert Message (Signature):").pack(padx=10, pady=(10, 0), anchor="w")
        self.message_var = tk.StringVar()
        tk.Entry(root, textvariable=self.message_var, width=60).pack(padx=10, pady=5)

        # Source/Dest IP
        tk.Label(root, text="Source IP:").pack(padx=10, pady=(10, 0), anchor="w")
        self.src_ip_var = tk.StringVar()
        tk.Entry(root, textvariable=self.src_ip_var, width=30).pack(padx=10, pady=5)
        tk.Label(root, text="Destination IP:").pack(padx=10, pady=(10, 0), anchor="w")
        self.dest_ip_var = tk.StringVar()
        tk.Entry(root, textvariable=self.dest_ip_var, width=30).pack(padx=10, pady=5)

        # Send Button
        tk.Button(root, text="Send Alert", command=self.send_alert).pack(pady=15)

        # Status
        self.status_var = tk.StringVar(value="🔴 Disconnected")
        tk.Label(root, textvariable=self.status_var, anchor="w").pack(fill="x", padx=10, pady=(0, 10))

        self.connect_socket()

    def connect_socket(self):
        try:
            sio.connect(
                "http://localhost:5000",
                namespaces=["/api/alerts/stream"],
                transports=["websocket"]
            )
            self.status_var.set("🟢 Connected")
        except Exception as e:
            self.status_var.set("🔴 Disconnected")
            messagebox.showerror("Connection Error", f"Failed to connect: {e}")

    def send_alert(self):
        api_key = self.api_key_var.get().strip()
        severity = int(self.severity_var.get())
        signature = self.message_var.get().strip()
        src_ip = self.src_ip_var.get().strip()
        dest_ip = self.dest_ip_var.get().strip()
        if not api_key or not signature or not src_ip or not dest_ip:
            messagebox.showwarning("Missing Fields", "Please fill in all fields.")
            return
        alert = {
            "event_type": "alert",
            "api_key": api_key,
            "severity": severity,
            "signature": signature,
            "src_ip": src_ip,
            "dest_ip": dest_ip,
        }
        try:
            sio.emit("alert_event", alert, namespace="/api/alerts/stream")
            messagebox.showinfo("Alert Sent", f"Alert sent with severity {severity}!")
        except Exception as e:
            messagebox.showerror("Send Error", f"Failed to send alert: {e}")

@sio.event(namespace="/api/alerts/stream")
def connect():
    print("✅ Socket connected")

@sio.event(namespace="/api/alerts/stream")
def disconnect():
    print("❌ Socket disconnected")

if __name__ == "__main__":
    root = tk.Tk()
    app = SendAlertGUI(root)
    root.mainloop()
