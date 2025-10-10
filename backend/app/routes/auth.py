# app/routes/auth.py
from re import sub
from flask import Blueprint, request, jsonify, current_app
from app.models import User, AppUser, Admin
from app import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import stripe
import os
import datetime
from sqlalchemy.exc import SQLAlchemyError

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
    access_token = create_access_token(identity=str(user.id))

    # Return user_type so frontend knows role
    return jsonify({
        "access_token": access_token,
        "user_type": user.user_type,  # 'app_user' or 'admin'
        "username": user.username
    }), 200

@auth_bp.route('/admin/profile', methods=['GET'])
@jwt_required()
def get_admin_profile():
    user_id = get_jwt_identity()

    try:
        user = Admin.query.get(int(user_id))
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid user ID"}), 401

    if not user:
        return jsonify({"msg": "Admin not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "user_type": user.user_type,
        "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') else None
    }), 200


# PUT Update Admin Profile
@auth_bp.route('/admin/profile', methods=['PUT'])
@jwt_required()
def update_admin_profile():
    user_id = get_jwt_identity()
    user = Admin.query.get(user_id)

    if not user:
        return jsonify({"msg": "Admin not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400

    updated = False  # Track if anything changed

    # Update username (if provided)
    if 'username' in data:
        username = data['username'].strip()
        if not username:
            return jsonify({"msg": "Username cannot be empty"}), 400

        # Check conflicts
        if AppUser.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already taken by an app user"}), 400

        if Admin.query.filter(Admin.username == username, Admin.id != user_id).first():
            return jsonify({"msg": "Username already taken by another admin"}), 400

        user.username = username
        updated = True

    # Update email (if provided)
    if 'email' in data:
        email = data['email'].strip()
        if not email:
            return jsonify({"msg": "Email cannot be empty"}), 400

        # Simple email format check (you can improve with regex)
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({"msg": "Invalid email format"}), 400

        # Check if email is taken
        if AppUser.query.filter_by(email=email).first():
            return jsonify({"msg": "Email already taken by an app user"}), 400

        if Admin.query.filter(Admin.email == email, Admin.id != user_id).first():
            return jsonify({"msg": "Email already taken by another admin"}), 400

        user.email = email
        updated = True

    # Update password (if provided)
    if 'password' in data:
        password = data['password'].strip()
        if len(password) < 6:
            return jsonify({"msg": "Password must be at least 6 characters"}), 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed.decode('utf-8')
        updated = True

    # Nothing to update
    if not updated:
        return jsonify({"msg": "No valid data to update"}), 400

    # Save to DB
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Database error", "error": str(e)}), 500

    # Return success
    return jsonify({
        "msg": "Profile updated successfully",
        "username": user.username,
        "email": user.email
    }), 200

# GET: List all AppUsers
@auth_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def list_users():
    user_id = get_jwt_identity()
    admin = Admin.query.get(int(user_id))
    if not admin:
        return jsonify({"msg": "Admin access required"}), 403

    users = AppUser.query.all()
    return jsonify({
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "subscription_plan": u.subscription_plan,
                "created_at": u.created_at.isoformat() if u.created_at else None
            } for u in users
        ]
    }), 200


# GET: Single user by ID (for edit form)
@auth_bp.route('/admin/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(int(admin_id))
    if not admin:
        return jsonify({"msg": "Admin access required"}), 403

    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "subscription_plan": user.subscription_plan
    }), 200

# PUT: Update any user (by admin)
@auth_bp.route('/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(int(admin_id))
    if not admin:
        return jsonify({"msg": "Admin access required"}), 403

    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400

    updated = False

    # Update username
    if 'username' in data:
        username = data['username'].strip()
        if not username:
            return jsonify({"msg": "Username cannot be empty"}), 400

        if AppUser.query.filter(AppUser.username == username, AppUser.id != user_id).first():
            return jsonify({"msg": "Username already taken"}), 400

        if Admin.query.filter_by(username=username).first():
            return jsonify({"msg": "Username taken by admin"}), 400

        user.username = username
        updated = True

    # Update email
    if 'email' in data:
        email = data['email'].strip()
        if not email:
            return jsonify({"msg": "Email cannot be empty"}), 400

        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({"msg": "Invalid email format"}), 400

        if AppUser.query.filter(AppUser.email == email, AppUser.id != user_id).first():
            return jsonify({"msg": "Email already taken"}), 400

        if Admin.query.filter_by(email=email).first():
            return jsonify({"msg": "Email taken by admin"}), 400

        user.email = email
        updated = True

    # Update first_name
    if 'first_name' in data:
        first_name = data['first_name'].strip()
        if not first_name:
            return jsonify({"msg": "First name cannot be empty"}), 400
        user.first_name = first_name
        updated = True

    # Update last_name
    if 'last_name' in data:
        last_name = data['last_name'].strip()
        if not last_name:
            return jsonify({"msg": "Last name cannot be empty"}), 400
        user.last_name = last_name
        updated = True

    # Update subscription_plan
    if 'subscription_plan' in data:
        plan = data['subscription_plan'].strip()
        if plan not in ['Basic', 'Pro', 'Team']:
            return jsonify({"msg": "Invalid subscription plan"}), 400
        user.subscription_plan = plan
        updated = True

    # Update password
    if 'password' in data:
        password = data['password'].strip()
        if len(password) < 6:
            return jsonify({"msg": "Password must be at least 6 characters"}), 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed.decode('utf-8')
        updated = True

    if not updated:
        return jsonify({"msg": "No changes to save"}), 400

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Database error", "error": str(e)}), 500

    return jsonify({"msg": "User updated successfully"}), 200

# DELETE: Admin deletes a user
@auth_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    admin_id = get_jwt_identity()
    admin = Admin.query.get(int(admin_id))
    if not admin:
        return jsonify({"msg": "Admin access required"}), 403

    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    try:
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Database error", "error": str(e)}), 500

    return jsonify({"msg": "User deleted successfully"}), 200

# GET AppUser Profile
@auth_bp.route('/appuser/profile', methods=['GET'])
@jwt_required()
def get_appuser_profile():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    subscription_end_date = None

    if user.subscription_plan in ['Pro', 'Team'] and user.stripe_customer_id:
        try:
            subscriptions = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                status='active',
                limit=1
            )
            if subscriptions.data:
                sub = stripe.Subscription.retrieve(subscriptions.data[0].id)
                
                items = sub.get('items', {}).get('data', [])
                if items:
                    end = items[0].get('current_period_end')
                else:
                    end = None

                if end is None:
                    current_app.logger.error(f"No current_period_end found in subscription items for {sub.id}")
                elif isinstance(end, int) and end > 0:
                    # Stripe always returns timestamps as ints in raw JSON
                    subscription_end_date = datetime.datetime.utcfromtimestamp(end).isoformat() + "Z"
                else:
                    current_app.logger.warning(f"Unexpected current_period_end value: {end} (type: {type(end)})")

        except Exception:
            current_app.logger.exception("Error fetching subscription from Stripe")
            
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "subscription_plan": user.subscription_plan or "Basic",
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "subscription_end_date": subscription_end_date
    })

# PUT Update AppUser Profile
@auth_bp.route('/appuser/profile', methods=['PUT'])
@jwt_required()
def update_appuser_profile():
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400

    updated = False

    # Update username
    if 'username' in data:
        username = data['username'].strip()
        if not username:
            return jsonify({"msg": "Username cannot be empty"}), 400

        if AppUser.query.filter(AppUser.username == username, AppUser.id != user_id).first():
            return jsonify({"msg": "Username already taken"}), 400

        if Admin.query.filter_by(username=username).first():
            return jsonify({"msg": "Username taken by admin"}), 400

        user.username = username
        updated = True

    # Update email
    if 'email' in data:
        email = data['email'].strip()
        if not email:
            return jsonify({"msg": "Email cannot be empty"}), 400

        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({"msg": "Invalid email format"}), 400

        if AppUser.query.filter(AppUser.email == email, AppUser.id != user_id).first():
            return jsonify({"msg": "Email already taken"}), 400

        if Admin.query.filter_by(email=email).first():
            return jsonify({"msg": "Email taken by admin"}), 400

        user.email = email
        updated = True

    # Update first_name
    if 'first_name' in data:
        first_name = data['first_name'].strip()
        if not first_name:
            return jsonify({"msg": "First name cannot be empty"}), 400
        user.first_name = first_name
        updated = True

    # Update last_name
    if 'last_name' in data:
        last_name = data['last_name'].strip()
        if not last_name:
            return jsonify({"msg": "Last name cannot be empty"}), 400
        user.last_name = last_name
        updated = True

    # Update password
    if 'password' in data:
        password = data['password'].strip()
        if len(password) < 6:
            return jsonify({"msg": "Password must be at least 6 characters"}), 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed.decode('utf-8')
        updated = True

    if not updated:
        return jsonify({"msg": "No changes to save"}), 400

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Database error", "error": str(e)}), 500

    return jsonify({
        "msg": "Profile updated successfully",
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name
    }), 200

@auth_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({
        "user_id": user.id,
        "user_type": user.user_type,
        "subscription_plan": user.subscription_plan  # ← always fresh from DB
    }), 200

# DELETE: AppUser deletes own account
@auth_bp.route('/appuser/delete', methods=['DELETE'])
@jwt_required()
def delete_own_account():
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Confirm deletion (frontend should send confirmation)
    data = request.get_json()
    if not data or not data.get("confirm"):
        return jsonify({"msg": "Confirmation required"}), 400

    try:
        db.session.delete(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Database error", "error": str(e)}), 500

    return jsonify({"msg": "Account deleted successfully"}), 200

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

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

@auth_bp.route('/checkout/create-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    try:
        user_id = get_jwt_identity()
        user = AppUser.query.get(int(user_id))
        if not user:
            return jsonify({"msg": "User not found"}), 404

        data = request.get_json()
        plan = data.get('plan')

        if plan not in ['Pro', 'Team']:
            return jsonify({"msg": "Invalid plan. Choose 'Pro' or 'Team'."}), 400

        # Map plan to Stripe Price ID (CREATE THESE IN STRIPE DASHBOARD FIRST!)
        PRICE_IDS = {
            'Pro': 'price_1SFtzfCxWn2BMTPyBOzbSDOF',   # ← REPLACE with your Pro Price ID
            'Team': 'price_1SFwuPCxWn2BMTPyXOGiS0Jx',  # ← REPLACE with your Team Price ID
        }

        checkout_session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{
                'price': PRICE_IDS[plan],
                'quantity': 1,
            }],
            subscription_data={
                'metadata': {
                    'user_id': str(user.id),
                    'plan': plan
                }
            },
            success_url=f"{os.getenv('FRONTEND_URL')}/app/dashboard?upgrade=success",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/upgrade?cancelled=true",
            client_reference_id=str(user.id),
        )

        return jsonify({'url': checkout_session.url})
    except Exception as e:
        current_app.logger.error(f"Checkout error: {str(e)}")
        return jsonify({'msg': 'Failed to create checkout session'}), 500

@auth_bp.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        current_app.logger.error(f"Invalid payload: {str(e)}")
        return 'Invalid payload', 400
    except stripe.error.SignatureVerificationError as e:
        current_app.logger.error(f"Invalid signature: {str(e)}")
        return 'Invalid signature', 400

    # Handle successful checkout
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id_str = session.get('client_reference_id')
        subscription_id = session.get('subscription')
        customer_id = session.get('customer')

        # Validate required data
        if not user_id_str or not subscription_id:
            current_app.logger.warning("Missing client_reference_id or subscription ID")
            return jsonify({'status': 'success'})

        try:
            # Retrieve subscription to get metadata
            subscription = stripe.Subscription.retrieve(subscription_id)
            plan = subscription.get('metadata', {}).get('plan')

            if plan not in ['Pro', 'Team']:
                current_app.logger.warning(f"Invalid plan in metadata: {plan}")
                return jsonify({'status': 'success'})

            # Fetch user from DB (AppUser uses 'app_users' table)
            try:
                user_id = int(user_id_str)
            except (TypeError, ValueError):
                current_app.logger.error(f"Invalid user_id format: {user_id_str}")
                return jsonify({'status': 'success'})

            user = AppUser.query.get(user_id)
            if not user:
                current_app.logger.warning(f"AppUser with ID {user_id} not found")
                return jsonify({'status': 'success'})

            # Update subscription plan
            current_app.logger.info(f"Updating user {user_id} to plan: {plan}")
            user.subscription_plan = plan
            user.stripe_customer_id = customer_id

            # Commit to MySQL
            db.session.commit()
            current_app.logger.info(f"Successfully updated user {user_id} to {plan} plan")

        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"MySQL error updating user plan: {str(e)}")
            return jsonify({'status': 'error'}), 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error in webhook: {str(e)}")
            return jsonify({'status': 'error'}), 500

    return jsonify({'status': 'success'})