from flask import Blueprint, jsonify, request
from app.geo import get_geo

geo_bp = Blueprint('geo', __name__)

@geo_bp.route('/api/geo', methods=['POST'])
def geo_mapping():
    ips = request.json.get('ips', [])
    locations = [get_geo(ip) for ip in ips if get_geo(ip)]
    return jsonify(locations)
