# app/routes/auth.py
from flask import Blueprint, request, jsonify
<<<<<<< HEAD
from app.models.user import User
from app.models.app_user import AppUser
=======
from app.models import User, AppUser, Admin
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4
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

<<<<<<< HEAD
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
=======
    # Validate required fields
    required_fields = ['first_name', 'last_name', 'username', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field].strip():
            return jsonify({"msg": f"'{field}' is required"}), 400

    # CRITICAL: Use AppUser, NOT User
    if AppUser.query.filter_by(username=data['username']).first():
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4
        return jsonify({"msg": "Username already exists"}), 400

    if AppUser.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400

<<<<<<< HEAD
    # Create new user
    new_user = User(
    username=data['username'],
    email=data['email'],
    user_type='app_user'
)
    new_user.set_password(data['password'])

    db.session.add(new_user)
=======
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
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201

# Login
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Username and password required"}), 400

<<<<<<< HEAD
    # Login by username
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({"msg": "Invalid username or password"}), 401

    # Generate JWT (valid for 1 hour)
    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1))
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
=======
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
>>>>>>> 113e087731a23ec12e6bf1997c7110ef0d1c44d4
    }), 200

# Protected route example
@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "username": user.username,
        "id": user.id,
        "email": user.email,
        "user_type": user.user_type
    }), 200

