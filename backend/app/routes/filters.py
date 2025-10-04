from flask import Blueprint, request, jsonify
from app import db
from app.models.filter import Filter
from flask_cors import cross_origin

filters_bp = Blueprint("filters", __name__)

# Get all filters for a user
@filters_bp.route("/<int:user_id>", methods=["GET", "OPTIONS"])
@cross_origin(origins="http://localhost:5173")
def get_filters(user_id):
    if request.method == "OPTIONS":
        return "", 200
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
@filters_bp.route("/", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:5173")
def create_filter():
    if request.method == "OPTIONS":
        return "", 200
    data = request.get_json()
    new_filter = Filter(
        user_id=data["user_id"],
        name=data["name"],
        filters_json=data["filters_json"]
    )
    db.session.add(new_filter)
    db.session.commit()
    return jsonify({"message": "Filter saved!", "id": new_filter.id}), 201

# Delete a filter
@filters_bp.route("/<int:filter_id>", methods=["DELETE", "OPTIONS"])
@cross_origin(origins="http://localhost:5173")
def delete_filter(filter_id):
    if request.method == "OPTIONS":
        return "", 200
    f = Filter.query.get(filter_id)
    if not f:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(f)
    db.session.commit()
    return jsonify({"message": "Filter deleted"})
