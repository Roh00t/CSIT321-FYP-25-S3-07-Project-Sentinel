# filepath: backend/app/routes/geoip.py
from flask import Blueprint, request, jsonify
from app.geo import get_geo  # You must have a lookup_ip(ip) function

geo_bp = Blueprint('geoip', __name__)

@geo_bp.route('/api/geo', methods=['POST'])
def geo_lookup():
    data = request.get_json()
    ips = data.get('ips', [])
    results = []
    for ip in ips:
        loc = get_geo(ip)
        if loc:
            results.append({
                "ip": ip,
                "lat": loc.get("lat"),
                "lon": loc.get("lon")
            })
    return jsonify(results)