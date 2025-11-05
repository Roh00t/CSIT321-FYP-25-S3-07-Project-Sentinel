# app/routes/auth.py
from re import sub
from flask import Blueprint, request, jsonify, current_app
from app.models import User, AppUser, Admin, AppUserTeam, AppUserTeamMember, AdminEmailVerification
from app import db
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import stripe
import os
import datetime
from sqlalchemy.exc import SQLAlchemyError
import secrets
from flask_mail import Message
from urllib.parse import urljoin
from app import mail

auth_bp = Blueprint('auth', __name__)

def generate_verification_token():
    return secrets.token_urlsafe(32)

def send_verification_email(mail, to_email, token, frontend_url):
    msg = Message(
        subject="Verify Your SENTINEL Account",
        recipients=[to_email],
        html=f"""
        <h2>Welcome to SENTINEL!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{frontend_url}/verify-email?token={token}" 
           style="display:inline-block;padding:10px 20px;background:#059669;color:white;text-decoration:none;border-radius:5px;">
           Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn’t create an account, please ignore this email.</p>
        """
    )
    mail.send(msg)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    required_fields = ['first_name', 'last_name', 'username', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field].strip():
            return jsonify({"msg": f"'{field}' is required"}), 400

    if AppUser.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400
    if AppUser.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400

    # Hash password
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

    # Generate verification token
    token = secrets.token_urlsafe(32)
    expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)

    # Create AppUser (NOT verified)
    user = AppUser(
        first_name=data['first_name'],
        last_name=data['last_name'],
        username=data['username'],
        email=data['email'],
        password=hashed.decode('utf-8'),
        subscription_plan="Basic",
        email_verified=False,
        verification_token=token,
        verification_token_expires=expires,
        admin_email=data['email'] 
    )
    db.session.add(user)
    db.session.commit()

    # Send verification email
    try:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        send_verification_email(
            mail,
            user.email,
            token,
            frontend_url
        )
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email: {str(e)}")
        return jsonify({"msg": "Registration successful, but failed to send verification email. Please contact support."}), 201

    return jsonify({
        "msg": "Registration successful! Please check your email to verify your account.",
        "needs_verification": True
    }), 201

@auth_bp.route('/verify-email', methods=['GET'])
def verify_email():
    token = request.args.get('token')
    if not token:
        return jsonify({"msg": "Invalid or missing token"}), 400

    user = AppUser.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({"msg": "Invalid or expired token"}), 400

    now_utc_naive = datetime.datetime.utcnow()
    if user.verification_token_expires < now_utc_naive:
        return jsonify({"msg": "Token has expired"}), 400

    # Verify user
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.session.commit()

    return jsonify({"msg": "Email verified successfully! You can now log in."}), 200

@auth_bp.route('/admin-email/request', methods=['POST'])
@jwt_required()
def request_admin_email_change():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    new_email = data.get('email', '').strip()

    if not new_email:
        return jsonify({"msg": "Email is required"}), 400
    if '@' not in new_email or '.' not in new_email.split('@')[-1]:
        return jsonify({"msg": "Invalid email format"}), 400

    # Optional: Prevent duplicate pending requests
    existing = AdminEmailVerification.query.filter_by(
        user_id=user.id,
        verified=False
    ).first()
    if existing and not existing.is_expired():
        return jsonify({"msg": "A verification email was already sent. Please check your inbox."}), 400

    # Create verification record
    verification = AdminEmailVerification(user_id=user.id, email=new_email)
    db.session.add(verification)
    db.session.commit()

    # Send verification email
    try:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        msg = Message(
            subject="Verify Your SENTINEL Admin Email",
            recipients=[new_email],
            html=f"""
            <h2>Verify Admin Email for SENTINEL</h2>
            <p>You requested to set this email as your admin contact.</p>
            <p>Please confirm by clicking the link below:</p>
            <a href="{frontend_url}/verify-admin-email?token={verification.token}"
               style="display:inline-block;padding:10px 20px;background:#059669;color:white;text-decoration:none;border-radius:5px;">
               Confirm Admin Email
            </a>
            <p>This link expires in 24 hours.</p>
            <p>If you didn’t make this request, please ignore this email.</p>
            """
        )
        mail.send(msg)
    except Exception as e:
        current_app.logger.error(f"Failed to send admin email verification: {str(e)}")
        return jsonify({"msg": "Request received, but failed to send verification email."}), 202

    return jsonify({"msg": "Verification email sent. Please check your inbox."}), 200

@auth_bp.route('/verify-admin-email', methods=['GET'])
def verify_admin_email():
    token = request.args.get('token')
    if not token:
        return jsonify({"msg": "Invalid or missing token"}), 400

    verification = AdminEmailVerification.query.filter_by(token=token).first()
    if not verification:
        return jsonify({"msg": "Invalid or expired token"}), 400

    now_utc_naive = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    if now_utc_naive > verification.expires_at:
        return jsonify({"msg": "Token has expired"}), 400

    if verification.verified:
        return jsonify({"msg": "This email has already been verified"}), 200

    user = AppUser.query.get(verification.user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.admin_email = verification.email
    verification.verified = True
    db.session.commit()

    return jsonify({"msg": "Admin email updated successfully!"}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Username and password required"}), 400

    user = AppUser.query.filter_by(username=data['username']).first()
    if not user:
        user = Admin.query.filter_by(username=data['username']).first()

    if not user:
        return jsonify({"msg": "Invalid username or password"}), 403

    # For AppUser only: check email verification
    if isinstance(user, AppUser) and not user.email_verified:
        return jsonify({"msg": "Please verify your email before logging in."}), 403

    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"msg": "Invalid username or password"}), 403

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user_type": user.user_type,
        "username": user.username,
        "subscription_plan": getattr(user, 'subscription_plan', 'Basic')
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

def cancel_user_subscription(user):
    """Cancel user's Stripe subscription if it exists and handle team cleanup if user is a Team owner."""
    if user.subscription_plan == "Basic" or not user.stripe_customer_id:
        return None

    try:
        # Get active/trialing subscription
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='active',
            limit=1
        )
        trial_subs = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='trialing',
            limit=1
        )
        all_subs = subscriptions.data + trial_subs.data

        if all_subs:
            sub = all_subs[0]
            if sub.status != 'canceled':
                stripe.Subscription.delete(sub.id)
                current_app.logger.info(f"Cancelled Stripe subscription {sub.id} for deleted user {user.id}")

        # If user is a Team owner, downgrade all team members to Basic
        if user.subscription_plan == "Team":
            owned_team = AppUserTeam.query.filter_by(owner_id=user.id).first()
            if owned_team:
                # Downgrade all ACTIVE members (including those who joined via invitation)
                members = AppUserTeamMember.query.filter_by(
                    team_id=owned_team.id,
                    is_active=True
                ).all()
                for membership in members:
                    member_user = AppUser.query.get(membership.user_id)
                    if member_user and member_user.subscription_plan == "Team":
                        member_user.subscription_plan = "Basic"
                        current_app.logger.info(f"Downgraded team member {member_user.id} to Basic due to owner deletion")

                # Optional: Delete the team (will cascade-delete memberships due to `cascade='all, delete-orphan'`)
                db.session.delete(owned_team)

        return all_subs[0].id if all_subs else None

    except Exception as e:
        current_app.logger.error(f"Error in cancel_user_subscription for user {user.id}: {str(e)}")
        # Don't raise — allow account deletion to proceed
    return None

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
        # Cancel subscription first
        cancelled_sub_id = cancel_user_subscription(user)
        
        # Delete user from database
        db.session.delete(user)
        db.session.commit()
        
        current_app.logger.info(f"Admin deleted user {user_id}, cancelled subscription: {cancelled_sub_id}")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(f"Error deleting user {user_id}")
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
    is_cancelling = False

    # 1. Try to get subscription from Stripe (for owners or Pro users)
    if user.subscription_plan in ['Pro', 'Team'] and user.stripe_customer_id:
        try:
            subscriptions = None
            subscriptionsActive = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                status='active',
                limit=1
            )
            subscriptionTrial = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                status='trialing',
                limit=1
            )
            if subscriptionsActive.data:
                subscriptions = subscriptionsActive
            elif subscriptionTrial.data:
                subscriptions = subscriptionTrial

            if subscriptions and subscriptions.data:
                sub = stripe.Subscription.retrieve(subscriptions.data[0].id)
                is_cancelling = bool(sub.get('cancel_at_period_end', False))
                items = sub.get('items', {}).get('data', [])
                end = items[0].get('current_period_end') if items else None

                if end and isinstance(end, int) and end > 0:
                    subscription_end_date = datetime.datetime.utcfromtimestamp(end).isoformat() + "Z"
                else:
                    current_app.logger.warning(f"Unexpected current_period_end: {end}")
        except Exception:
            current_app.logger.exception("Error fetching subscription from Stripe")

    # If still no subscription_end_date AND user is on Team plan -> get from team
    if user.subscription_plan == 'Team' and subscription_end_date is None:
        try:
            team_membership = AppUserTeamMember.query.filter_by(
                user_id=user.id,
                is_active=True
            ).first()
            if team_membership and team_membership.team:
                team = team_membership.team
                if team.subscription_end_date:
                    end_dt = team.subscription_end_date

                subscription_end_date = end_dt
                is_cancelling = team.is_cancelling
        except Exception:
            current_app.logger.exception("Error fetching team subscription info")
    
    # Add team information if user is on Team plan
    team_info = None
    if user.subscription_plan == 'Team':
        # Check if user is a team owner
        owned_team = AppUserTeam.query.filter_by(owner_id=user.id).first()
        if owned_team:
            team_info = {
                'id': owned_team.id,
                'name': owned_team.name,
                'role': 'owner'
            }
        else:
            # Check if user is a team member
            team_membership = AppUserTeamMember.query.filter_by(
                user_id=user.id, 
                is_active=True
            ).first()
            if team_membership and team_membership.team:
                team_info = {
                    'id': team_membership.team.id,
                    'name': team_membership.team.name,
                    'role': team_membership.role
                }

    # Check for pending team invitations (for ANY plan user)
    pending_team_invitation = None
    pending_membership = AppUserTeamMember.query.filter_by(
        user_id=user.id, 
        is_active=True,
        joined_at=None  # Not yet accepted
    ).first()
    
    if pending_membership and pending_membership.team:
        pending_team_invitation = {
            'team_id': pending_membership.team_id,
            'team_name': pending_membership.team.name,
            'invited_at': pending_membership.invited_at.isoformat() if pending_membership.invited_at else None
        }

    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "subscription_plan": user.subscription_plan or "Basic",
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "subscription_end_date": subscription_end_date,
        "is_cancelling": is_cancelling,
        "is_eligible_for_free_trial": user.is_eligible_for_free_trial(),
        "team_info": team_info,
        "pending_team_invitation": pending_team_invitation,
        "admin_email": user.admin_email
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
        # Cancel subscription first
        cancelled_sub_id = cancel_user_subscription(user)
        
        # Delete user from database
        db.session.delete(user)
        db.session.commit()
        
        current_app.logger.info(f"User {user_id} deleted own account, cancelled subscription: {cancelled_sub_id}")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(f"Error deleting own account for user {user_id}")
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

        # Map plan to Stripe Price ID
        PRICE_IDS = {
            'Pro': 'price_1SGhgWCxWn2BMTPyktbgtr4C',
            'Team': 'price_1SGhgfCxWn2BMTPycHx6KrND',
        }

        # Ensure Stripe customer exists
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.first_name} {user.last_name}",
                metadata={"user_id": str(user.id)}
            )
            user.stripe_customer_id = customer.id
            db.session.commit()

        customer_id = user.stripe_customer_id

        # Check for existing active subscription
        active_subs = stripe.Subscription.list(
            customer=customer_id,
            status='active',
            limit=1
        )

        if active_subs.data:
            # User already has an active subscription
            current_sub = active_subs.data[0]
            current_plan = current_sub['items']['data'][0]['price']['id']

            # If same plan, don't create new session
            if (current_plan == PRICE_IDS[plan]):
                return jsonify({"msg": "You're already subscribed to this plan."}), 400
            
            # Cancel current subscription at period end
            stripe.Subscription.modify(
                current_sub.id,
                cancel_at_period_end=True
            )
            current_app.logger.info(f"Cancelled current subscription {current_sub.id} at period end for user {user.id}")

        # Determine trial eligibility (only for Pro, and only if no prior trial)
        trial_days = None
        if plan == 'Pro' and user.is_eligible_for_free_trial():
            trial_days = 7

        subscription_data = {
            'metadata': {
                'user_id': str(user.id),
                'plan': plan
            }
        }

        if trial_days:
            subscription_data['trial_period_days'] = trial_days
            subscription_data['trial_settings'] = {
                'end_behavior': {
                    'missing_payment_method': 'cancel'
                }
            }

        checkout_session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{
                'price': PRICE_IDS[plan],
                'quantity': 1,
            }],
            subscription_data=subscription_data,
            customer=customer_id,
            success_url=f"{os.getenv('FRONTEND_URL')}/app/dashboard?upgrade=success",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/app/plan",
            client_reference_id=str(user.id),
        )

        return jsonify({'url': checkout_session.url})

    except Exception as e:
        current_app.logger.error(f"Checkout error: {str(e)}")
        return jsonify({'msg': 'Failed to create checkout session'}), 500

# Stripe webhook endpoint
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

        if not user_id_str or not subscription_id:
            current_app.logger.warning("Missing client_reference_id or subscription ID")
            return jsonify({'status': 'success'})

        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            plan = subscription.get('metadata', {}).get('plan')

            if plan not in ['Pro', 'Team']:
                current_app.logger.warning(f"Invalid plan in metadata: {plan}")
                return jsonify({'status': 'success'})

            try:
                user_id = int(user_id_str)
            except (TypeError, ValueError):
                current_app.logger.error(f"Invalid user_id format: {user_id_str}")
                return jsonify({'status': 'success'})

            user = AppUser.query.get(user_id)
            if not user:
                current_app.logger.warning(f"AppUser with ID {user_id} not found")
                return jsonify({'status': 'success'})

            current_app.logger.info(f"Updating user {user_id} to plan: {plan}")
            
            # Update customer ID if missing
            if not user.stripe_customer_id:
                user.stripe_customer_id = customer_id

            # Handle trial
            trial_end = subscription.get('trial_end')
            if trial_end:
                user.free_trial_used = True
                user.free_trial_started_at = datetime.datetime.now(datetime.timezone.utc)
                trial_end_datetime = datetime.datetime.fromtimestamp(trial_end, tz=datetime.timezone.utc)
                user.free_trial_ends_at = trial_end_datetime
            
            # Upgrade plan
            user.subscription_plan = plan

            if plan == 'Team':
                existing_team = AppUserTeam.query.filter_by(owner_id=user.id).first()
                if not existing_team:
                    team_name = f"{user.first_name}'s Team"
                    new_team = AppUserTeam(
                        name=team_name,
                        owner_id=user.id
                    )
                    db.session.add(new_team)
                    db.session.flush()
                    
                    owner_membership = AppUserTeamMember(
                        team_id=new_team.id,
                        user_id=user.id,
                        role='admin',
                        joined_at=datetime.datetime.now(datetime.timezone.utc)
                    )
                    db.session.add(owner_membership)
                    team_to_update = new_team
                else:
                    team_to_update = existing_team

                # Extract subscription end date from Stripe
                item = subscription.get('items', {}).get('data', [])
                if item:
                    current_period_end = item[0].get('current_period_end')
                else:
                    current_period_end = None

                end_date = datetime.datetime.utcfromtimestamp(current_period_end).isoformat() + "Z" if current_period_end else None

                # Update team with subscription metadata
                team_to_update.stripe_subscription_id = subscription_id
                team_to_update.subscription_end_date = end_date
                team_to_update.is_cancelling = False

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

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        
        if not customer_id:
            current_app.logger.warning("No customer_id in subscription.deleted event")
            return jsonify({'status': 'success'})

        try:
            user = AppUser.query.filter_by(stripe_customer_id=customer_id).first()
            if not user:
                current_app.logger.info(f"No user found for customer {customer_id}")
                return jsonify({'status': 'success'})

            # Check if user has accepted a team invitation
            active_membership = AppUserTeamMember.query.filter(
                AppUserTeamMember.user_id == user.id,
                AppUserTeamMember.is_active == True,
                AppUserTeamMember.joined_at.isnot(None)  # Must have accepted
            ).first()

            # Check if user owns a team
            owned_team = AppUserTeam.query.filter_by(owner_id=user.id).first()

            if active_membership and user.subscription_plan != "Team":
                user.subscription_plan = "Team"
                current_app.logger.info(f"User {user.id} is in a team. Upgraded to Team plan.")
            else:
                user.subscription_plan = "Basic"
                current_app.logger.info(f"User {user.id} not in team. Downgraded to Basic.")

                # Clean up team if owner
                if owned_team:
                    # Downgrade all members
                    members = AppUserTeamMember.query.filter_by(team_id=owned_team.id).all()
                    for member in members:
                        member_user = AppUser.query.get(member.user_id)
                        if member_user and member_user.subscription_plan == "Team":
                            member_user.subscription_plan = "Basic"
                    db.session.delete(owned_team)

            db.session.commit()

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error in subscription.deleted webhook: {str(e)}")
            return jsonify({'status': 'error'}), 500

    return jsonify({'status': 'success'})

# Cancel Subscription
@auth_bp.route('/subscription/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    user_id = get_jwt_identity()
    user = AppUser.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.subscription_plan == "Basic":
        return jsonify({"msg": "No active subscription to cancel"}), 400

    if not user.stripe_customer_id:
        return jsonify({"msg": "No Stripe customer found"}), 400

    try:
        # Find active subscription
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='active',
            limit=1
        )
        subscriptionTrial = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='trialing',
            limit=1
        )

        if not subscriptions.data and not subscriptionTrial.data:
            return jsonify({"msg": "No active subscription found"}), 400

        sub = subscriptionTrial.data[0] if subscriptionTrial.data else subscriptions.data[0]
        
        # CANCEL AT PERIOD END
        updated_sub = stripe.Subscription.modify(
            sub.id,
            cancel_at_period_end=True
        )
        
        current_app.logger.info(f"Set subscription {sub.id} to cancel at period end")

        # 🟢 Update team's is_cancelling flag if user is a Team owner
        if user.subscription_plan == "Team":
            team = AppUserTeam.query.filter_by(owner_id=user.id).first()
            if team:
                team.is_cancelling = True
                db.session.add(team)
                db.session.commit()  # Commit the flag update

        # Prepare response data
        cancel_at_period_end = updated_sub.get('cancel_at_period_end', False)
        current_period_end = updated_sub.get('current_period_end')
        current_period_end_iso = None
        if current_period_end:
            if isinstance(current_period_end, int):
                current_period_end_iso = datetime.datetime.utcfromtimestamp(current_period_end).isoformat() + "Z"
            elif isinstance(current_period_end, datetime.datetime):
                current_period_end_iso = current_period_end.isoformat().replace('+00:00', 'Z')

        message = "Subscription cancelled. You'll keep access until the end of your billing period."
        if user.subscription_plan == "Team":
            message += " All team members will lose access to Team plan features when your subscription ends."

        return jsonify({
            "msg": message,
            "cancel_at_period_end": cancel_at_period_end,
            "current_period_end": current_period_end_iso
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception("Error cancelling subscription")
        return jsonify({"msg": "Failed to cancel subscription", "error": str(e)}), 500
    
def start_free_trial(user, trial_days=7):
    if not user.is_eligible_for_free_trial():
        raise ValueError("User is not eligible for free trial")
    
    # Create Stripe customer if not exists
    if not user.stripe_customer_id:
        stripe_customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = stripe_customer.id
    
    # Update user record
    user.free_trial_used = True
    user.free_trial_started_at = datetime.datetime.now(datetime.timezone.utc)  # Fixed!
    user.free_trial_ends_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=trial_days)  # Fixed!
    user.subscription_plan = 'Pro'  # or whatever plan they're trialing
    
    db.session.commit()
    
    # Create Stripe subscription with trial period
    subscription = stripe.Subscription.create(
        customer=user.stripe_customer_id,
        items=[{'price': 'your_pro_plan_price_id'}],
        trial_period_days=trial_days,
        trial_settings={
            'end_behavior': {
                'missing_payment_method': 'cancel'
            }
        }
    )
    
    return subscription

@auth_bp.route('/teams', methods=['GET'])
@jwt_required()
def get_user_team():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Check if user is on Team plan
    if user.subscription_plan != 'Team':
        return jsonify({"msg": "Team plan required"}), 403

    # Get user's team (either as owner or member)
    team_member = AppUserTeamMember.query.filter_by(user_id=user.id, is_active=True).first()
    if not team_member:
        return jsonify({"msg": "No team found"}), 404

    team = team_member.team
    members = []
    for member in team.members:
        if member.is_active:
            member_user = member.user
            members.append({
                'id': member.id,
                'user_id': member.user_id,
                'name': f"{member_user.first_name} {member_user.last_name}",
                'email': member_user.email,
                'role': member.role,
                'joined_at': member.joined_at.isoformat() if member.joined_at else None,
                'is_owner': member.user_id == team.owner_id
            })

    return jsonify({
        'team': team.to_dict(),
        'members': members,
        'current_user_role': team_member.role
    })

@auth_bp.route('/teams/invite', methods=['POST'])
@jwt_required()
def invite_team_member():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.subscription_plan != 'Team':
        return jsonify({"msg": "Team plan required"}), 403

    team = AppUserTeam.query.filter_by(owner_id=user.id).first()
    if not team:
        return jsonify({"msg": "Only team owners can invite members"}), 403

    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"msg": "Email is required"}), 400

    active_members = AppUserTeamMember.query.filter_by(team_id=team.id, is_active=True).count()
    if active_members >= 5:
        return jsonify({"msg": "Team is at maximum capacity (5 members)"}), 400

    invited_user = AppUser.query.filter_by(email=email).first()
    if invited_user:
        # Check for existing membership (active or inactive)
        existing_membership = AppUserTeamMember.query.filter_by(
            team_id=team.id, 
            user_id=invited_user.id
        ).first()
        
        if existing_membership:
            # Reactivate and RESET invitation state
            existing_membership.is_active = True
            existing_membership.invited_at = datetime.datetime.now(datetime.timezone.utc)
            existing_membership.joined_at = None  # ← KEY FIX: Reset acceptance
        else:
            # Create new membership
            new_membership = AppUserTeamMember(
                team_id=team.id,
                user_id=invited_user.id,
                role='member'
            )
            db.session.add(new_membership)
        
        db.session.commit()
        return jsonify({"msg": "User invited successfully. They need to accept the invitation."}), 200
    else:
        return jsonify({"msg": "User not found. They need to create an account first."}), 404

@auth_bp.route('/teams/accept-invitation', methods=['POST'])
@jwt_required()
def accept_team_invitation():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    pending_membership = AppUserTeamMember.query.filter_by(
        user_id=user.id, 
        is_active=True,
        joined_at=None
    ).first()
    
    if not pending_membership:
        return jsonify({"msg": "No pending team invitation found"}), 404
    
    if user.subscription_plan == "Team":
        return jsonify({"msg": "You're already on a Team plan"}), 400

    # Ensure Stripe customer exists
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}",
            metadata={"user_id": str(user.id)}
        )
        user.stripe_customer_id = customer.id
        db.session.commit()

    if user.subscription_plan == "Basic":
        # Basic users join immediately
        user.subscription_plan = "Team"
        pending_membership.joined_at = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()
        return jsonify({
            "msg": "Successfully joined team!",
            "team_id": pending_membership.team_id
        }), 200

    else:  # Pro user
        try:
            subscriptions = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                status='active',
                limit=1
            )
            if subscriptions.data:
                sub = subscriptions.data[0]
                stripe.Subscription.modify(
                    sub.id,
                    cancel_at_period_end=True
                )
                current_app.logger.info(f"Cancelled subscription {sub.id} at period end for user {user.id}")
        except Exception as e:
            current_app.logger.error(f"Failed to cancel subscription for user {user.id}: {str(e)}")
            return jsonify({"msg": "Failed to process invitation. Please try again."}), 500

        # Set joined_at for Pro users
        pending_membership.joined_at = datetime.datetime.now(datetime.timezone.utc)
        db.session.commit()
        
        return jsonify({
            "msg": "Invitation accepted! You'll be upgraded to Team plan when your current subscription ends.",
            "team_id": pending_membership.team_id
        }), 200

@auth_bp.route('/teams/remove-member', methods=['POST'])
@jwt_required()
def remove_team_member():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.subscription_plan != 'Team':
        return jsonify({"msg": "Team plan required"}), 403

    # Check if user is team owner
    team = AppUserTeam.query.filter_by(owner_id=user.id).first()
    if not team:
        return jsonify({"msg": "Only team owners can remove members"}), 403

    data = request.get_json()
    member_user_id = data.get('user_id')
    if not member_user_id or member_user_id == user.id:
        return jsonify({"msg": "Cannot remove yourself or invalid user ID"}), 400

    membership = AppUserTeamMember.query.filter_by(
        team_id=team.id, 
        user_id=member_user_id
    ).first()
    
    if not membership:
        return jsonify({"msg": "Member not found in team"}), 404

    # Remove member and downgrade their plan
    member_user = AppUser.query.get(member_user_id)
    if member_user:
        member_user.subscription_plan = "Basic"
    
    membership.is_active = False
    db.session.commit()
    
    return jsonify({"msg": "Member removed successfully"}), 200

@auth_bp.route('/teams/leave', methods=['POST'])
@jwt_required()
def leave_team():
    user_id = get_jwt_identity()
    user = AppUser.query.get(int(user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.subscription_plan != 'Team':
        return jsonify({"msg": "You are not on a Team plan"}), 400

    # Check if user is a team owner → block leaving
    owned_team = AppUserTeam.query.filter_by(owner_id=user.id).first()
    if owned_team:
        return jsonify({"msg": "Team owners cannot leave their own team. Please delete the team or transfer ownership first."}), 403

    # Find active membership
    membership = AppUserTeamMember.query.filter_by(
        user_id=user.id,
        is_active=True
    ).first()

    if not membership:
        return jsonify({"msg": "You are not a member of any team"}), 404

    # Deactivate membership
    membership.is_active = False

    # Downgrade user to Basic
    user.subscription_plan = "Basic"

    try:
        db.session.commit()
        current_app.logger.info(f"User {user.id} left team {membership.team_id}")
        return jsonify({"msg": "You have successfully left the team and been downgraded to the Basic plan."}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error leaving team for user {user.id}: {str(e)}")
        return jsonify({"msg": "Failed to leave team"}), 500