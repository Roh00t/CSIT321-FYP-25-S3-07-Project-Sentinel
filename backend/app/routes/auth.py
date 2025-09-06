# app/routes/auth.py
from flask import Blueprint, request, jsonify
from app.models import User, AppUser, Admin
from app import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import bcrypt

auth_bp = Blueprint('auth', __name__)

# Registration
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    # Validate required fields
    required_fields = ['first_name', 'last_name', 'username', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field].strip():
            return jsonify({"msg": f"'{field}' is required"}), 400

    # CRITICAL: Use AppUser, NOT User
    if AppUser.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400

    if AppUser.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400

    # Hash password
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

    # Create AppUser
    user = AppUser(
        first_name=data['first_name'],
        last_name=data['last_name'],
        username=data['username'],
        email=data['email'],
        password=hashed.decode('utf-8'),
        subscription_plan="Basic"
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201

# Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Username and password required"}), 400

    # Try to find user in AppUser first
    user = AppUser.query.filter_by(username=data['username']).first()

    # If not found, try Admin
    if not user:
        user = Admin.query.filter_by(username=data['username']).first()

    # Validate password
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"msg": "Invalid username or password"}), 401

    # Create JWT token
    access_token = create_access_token(identity=user.user_id)

    # Return user_type so frontend knows role
    return jsonify({
        "access_token": access_token,
        "user_type": user.user_type,  # 'app_user' or 'admin'
        "username": user.username
    }), 200

# Protected route example
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({"id": user.id, "username": user.username, "email": user.email})
