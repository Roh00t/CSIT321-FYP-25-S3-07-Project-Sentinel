# append_test_alert.py
import json
from datetime import datetime, timezone
from pathlib import Path

EVE_PATH = Path("D:\Program Files\Suricata\log\eve.json")

alert = {
  "timestamp": datetime.now(timezone.utc).isoformat(),
  "flow_id": 999999999999,
  "in_iface": "test_iface",
  "event_type": "alert",
  "src_ip": "192.168.1.250",
  "src_port": 54321,
  "dest_ip": "203.0.113.5",
  "dest_port": 4444,
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 1000001,
    "rev": 1,
    "signature": "TEST-ALERT harmless test signature",
    "category": "Test",
    "severity": 1
  },
  "extra_field": "test-alert"
}

# Append as a single JSON line (Suricata format)
with EVE_PATH.open("a", encoding="utf-8") as f:
    f.write(json.dumps(alert) + "\n")

print("Wrote test alert to", EVE_PATH)
