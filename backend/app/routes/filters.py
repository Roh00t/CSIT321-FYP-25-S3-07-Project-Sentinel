# backend/app/routes/filters.py
from flask import Blueprint, request, jsonify
from app import db
from app.models.filter import Filter
from flask_jwt_extended import jwt_required, get_jwt_identity

filters_bp = Blueprint("filters", __name__, url_prefix="/api/filters")

# Get all filters for the logged-in user
@filters_bp.route("/", methods=["GET"])
@jwt_required()
def get_filters():
    user_id = get_jwt_identity()
    filters = Filter.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": f.id,
            "name": f.name,
            "filters_json": f.filters_json,
            "created_at": f.created_at.isoformat()
        }
        for f in filters
    ])

# Save a new filter
@filters_bp.route("/", methods=["POST"])
@jwt_required()
def create_filter():
    user_id = get_jwt_identity()
    data = request.get_json()
    new_filter = Filter(
        user_id=user_id,
        name=data["name"],
        filters_json=data["filters_json"]
    )
    db.session.add(new_filter)
    db.session.commit()
    return jsonify({
        "id": new_filter.id,
        "name": new_filter.name,
        "filters_json": new_filter.filters_json,
    }), 201

# Delete a filter
@filters_bp.route("/<int:filter_id>", methods=["DELETE"])
@jwt_required()
def delete_filter(filter_id):
    user_id = get_jwt_identity()
    f = Filter.query.filter_by(id=filter_id, user_id=user_id).first()
    if not f:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(f)
    db.session.commit()
    return jsonify({"message": "Filter deleted"})

@filters_bp.route("/alert-options", methods=["GET"])
@jwt_required()
def get_alert_options():
    user_id = get_jwt_identity()
    flt = Filter.query.filter_by(user_id=user_id).first()

    if not flt:
        return jsonify({"error": "Filter not found"}), 404

    return jsonify({
        "alerts_options": flt.alerts_options or {},
        "report_frequency": flt.report_frequency
    })


# Update current user's alert options
@filters_bp.route("/alert-options", methods=["PUT"])
@jwt_required()
def update_alert_options():
    user_id = get_jwt_identity()
    data = request.get_json()
    flt = Filter.query.filter_by(user_id=user_id).first()

    if not flt:
        return jsonify({"error": "Filter not found"}), 404

    flt.alerts_options = data.get("alerts_options", flt.alerts_options)
    flt.report_frequency = data.get("report_frequency", flt.report_frequency)
    db.session.commit()

    return jsonify({"message": "Alert options updated successfully"})