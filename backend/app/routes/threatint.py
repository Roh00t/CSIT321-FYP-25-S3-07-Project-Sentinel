from flask import Blueprint, request, jsonify
import requests, os
from dotenv import load_dotenv

threat_bp = Blueprint('threatint', __name__)

load_dotenv()

ABUSE_API_KEY = os.getenv("ABUSE_API_KEY")
VT_API_KEY = os.getenv("VT_API_KEY")
print("AbuseIPDB Key:", ABUSE_API_KEY)
print("VirusTotal Key:", VT_API_KEY)

@threat_bp.route("/api/threatintel", methods=["POST"])
def threat_intel():
    data = request.get_json()
    ip = data.get("ip")
    if not ip:
        return jsonify({"error": "No IP provided"}), 400

    abuse_result = {}
    vt_result = {}

    try:
        abuse_resp = requests.get(
            f"https://api.abuseipdb.com/api/v2/check",
            headers={"Key": ABUSE_API_KEY, "Accept": "application/json"},
            params={"ipAddress": ip, "maxAgeInDays": 90}
        )
        abuse_result = abuse_resp.json()
    except Exception as e:
        abuse_result = {"error": str(e)}

    try:
        vt_resp = requests.get(
            f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
            headers={"x-apikey": VT_API_KEY}
        )
        vt_result = vt_resp.json()
    except Exception as e:
        vt_result = {"error": str(e)}

    return jsonify({"abuse": abuse_result, "vt": vt_result})
