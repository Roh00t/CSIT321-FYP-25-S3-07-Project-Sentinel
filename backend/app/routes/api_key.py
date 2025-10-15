# backend/app/routes/api_key.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.api_keys import APIKey
from app import db
from datetime import datetime

api_keys_bp = Blueprint("api_keys", __name__)

@api_keys_bp.route("/api/apikeys", methods=["GET"])
@jwt_required()
def list_keys():
    user_id = get_jwt_identity()
    keys = APIKey.query.filter_by(user_id=user_id).all()
    return jsonify([
        {
            "id": k.id,
            "name": k.name,
            "type": k.type,
            "key": k.key,
            "created_at": k.created_at,
            "expires_at": k.expires_at,
            "revoked": k.revoked,
            "last_used": k.last_used,
        }
        for k in keys
    ]), 200


@api_keys_bp.route("/api/apikeys", methods=["POST"])
@jwt_required()
def create_key():
    user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get("name")
    type = data.get("type")
    expires_days = data.get("expires_days")

    if not name or not type:
        return jsonify({"error": "Missing name or type"}), 400

    raw_key = APIKey.generate(user_id, name, type, expires_days)
    return jsonify({"api_key": raw_key}), 201


@api_keys_bp.route("/api/apikeys/<int:key_id>", methods=["DELETE"])
@jwt_required()
def revoke_key(key_id):
    user_id = get_jwt_identity()
    key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()
    if not key:
        return jsonify({"error": "Key not found"}), 404

    key.revoked = True
    db.session.commit()
    return jsonify({"message": "Key revoked"}), 200\

@api_keys_bp.route("/api/apikeys/verify", methods=["POST"])
def verify_key():
    data = request.get_json()
    key_value = data.get("api_key")

    if not key_value:
        return jsonify({"valid": False, "reason": "Missing key"}), 400

    key = APIKey.query.filter_by(key=key_value, revoked=False).first()
    if not key:
        return jsonify({"valid": False, "reason": "Invalid or revoked"}), 403

    if key.expires_at and key.expires_at < datetime.utcnow():
        return jsonify({"valid": False, "reason": "Expired"}), 403

    key.last_used = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "valid": True,
        "user_id": key.user_id,
        "type": key.type,
        "name": key.name
    }), 200

@api_keys_bp.route("/api/apikeys/<int:key_id>", methods=["PUT"])
@jwt_required()
def update_key(key_id):
    user_id = get_jwt_identity()
    key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()
    if not key:
        return jsonify({"error": "Key not found"}), 404

    data = request.get_json()
    new_type = data.get("type")
    if new_type:
        key.type = new_type
        db.session.commit()
        return jsonify({"message": "Key type updated"}), 200
    else:
        return jsonify({"error": "Missing type"}), 400
