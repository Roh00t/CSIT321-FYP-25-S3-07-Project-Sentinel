# backend/routes/alertsdb.py
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.alert import Alert
from app.models.api_keys import APIKey
from app.models.app_user import AppUser

adbp = Blueprint("alerts_api_init", __name__)

@adbp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required(optional=True)
def get_alerts_for_user():
    """
    GET /api/alerts?page=1&per_page=100
    Returns paginated alerts tied to any of the user's API keys
    """
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"error": "unauthenticated"}), 401

    # Pagination params
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 100))

    keys = APIKey.query.filter_by(user_id=user.id).all()
    key_values = [k.key for k in keys]

    if not key_values:
        return jsonify({"alerts": [], "total": 0})

    query = Alert.query.filter(Alert.api_key.in_(key_values)).order_by(Alert.created_at.desc())
    total = query.count()
    alerts = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "alerts": [a.to_dict() for a in alerts],
        "total": total,
        "page": page,
        "per_page": per_page,
        "used_api_keys": key_values
    })