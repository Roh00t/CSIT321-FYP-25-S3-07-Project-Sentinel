from flask import Blueprint, request, jsonify, current_app
import os, json
from werkzeug.utils import secure_filename

alerts_bp = Blueprint("alerts", __name__)
UPLOAD_FOLDER = "uploads"

@alerts_bp.route("/upload-alerts", methods=["POST"])
def upload_alerts():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(current_app.root_path, UPLOAD_FOLDER, filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    file.save(save_path)

    alerts = []

    try:
        with open(save_path, "r") as f:
            first_char = f.read(1)
            f.seek(0)

            if first_char == "[":
                data = json.load(f)
                for alert in data:
                    # Skip stats-only events
                    if alert.get("event_type") == "stats":
                        continue
                    alerts.append({
                        "timestamp": alert.get("timestamp") or alert.get("time"),
                        "src_ip": alert.get("src_ip"),
                        "dest_ip": alert.get("dest_ip"),
                        "signature": alert.get("alert", {}).get("signature") if "alert" in alert else alert.get("msg"),
                        "severity": alert.get("alert", {}).get("severity"),
                        "protocol": alert.get("proto"),  # optional
                        "original": alert
                    })
            else:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        alert = json.loads(line)
                        if alert.get("event_type") == "stats":
                            continue
                        alerts.append({
                            "timestamp": alert.get("timestamp") or alert.get("time"),
                            "src_ip": alert.get("src_ip"),
                            "dest_ip": alert.get("dest_ip"),
                            "signature": alert.get("alert", {}).get("signature") if "alert" in alert else alert.get("msg"),
                            "severity": alert.get("alert", {}).get("severity"),
                            "protocol": alert.get("proto"),
                            "original": alert
                        })
                    except json.JSONDecodeError:
                        continue

        return jsonify({"alerts": alerts}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400
