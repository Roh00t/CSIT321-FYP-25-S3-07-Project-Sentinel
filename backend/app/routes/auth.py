# app/routes/auth.py
from re import sub
from flask import Blueprint, request, jsonify, current_app
from app.models import User, AppUser, Admin, AppUserTeam, AppUserTeamMember
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

    # ✅ REMOVED: Stripe subscription check during login
    # Let webhooks handle subscription state

    # Create JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user_type": user.user_type,
        "username": user.username,
        "subscription_plan": getattr(user, 'subscription_plan', 'Basic')  # Optional: send plan to frontend
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

# Helper function to cancel user's subscription
def cancel_user_subscription(user):
    """Cancel user's Stripe subscription if it exists"""
    if user.subscription_plan == "Basic" or not user.stripe_customer_id:
        return None
    
    try:
        # Get all subscriptions (active, trialing, past_due, etc.)
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            limit=1
        )
        
        if subscriptions.data:
            sub = subscriptions.data[0]
            # Only cancel if it's not already canceled
            if sub.status != 'canceled':
                stripe.Subscription.delete(sub.id)
                current_app.logger.info(f"Cancelled Stripe subscription {sub.id} for deleted user {user.id}")
                return sub.id
    except Exception as e:
        current_app.logger.error(f"Error cancelling subscription for user {user.id}: {str(e)}")
        # Don't raise exception - account deletion should proceed even if Stripe fails
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

    if user.subscription_plan in ['Pro', 'Team'] and user.stripe_customer_id:
        try:
            subscriptions = stripe.Subscription.list(
                customer=user.stripe_customer_id,
                status='active',
                limit=1
            )
            if subscriptions.data:
                sub = stripe.Subscription.retrieve(subscriptions.data[0].id)
                
                # Check if subscription is set to cancel at period end
                is_cancelling = bool(sub.get('cancel_at_period_end', False))
                
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
        "pending_team_invitation": pending_team_invitation
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

        # 🔴 CRITICAL: Check for existing active subscription
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

            # Optional: Allow upgrade/downgrade by canceling current at period end
            # Then proceed to create new subscription
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

            # Check if this is a trial subscription
            trial_end = subscription.get('trial_end')
            if trial_end:
                user.free_trial_used = True
                user.free_trial_started_at = datetime.datetime.now(datetime.timezone.utc)
                trial_end_datetime = datetime.datetime.fromtimestamp(trial_end, tz=datetime.timezone.utc)
                user.free_trial_ends_at = trial_end_datetime
            
            # Finally, upgrade the user's plan
            user.subscription_plan = plan

            # Create team if upgrading to Team plan and doesn't already have one
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

            # ✅ Check if user has ACCEPTED a team invitation
            active_membership = AppUserTeamMember.query.filter(
                AppUserTeamMember.user_id == user.id,
                AppUserTeamMember.is_active == True,
                AppUserTeamMember.joined_at.isnot(None)  # Must have accepted
            ).first()

            # ✅ Check if user owns a team
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
        
        if not subscriptions.data:
            return jsonify({"msg": "No active subscription found"}), 400

        sub = subscriptions.data[0]
        
        # CANCEL AT PERIOD END (not immediately)
        updated_sub = stripe.Subscription.modify(
            sub.id,
            cancel_at_period_end=True
        )
        
        current_app.logger.info(f"Set subscription {sub.id} to cancel at period end")

        # Handle team plan cancellation logic
        was_team_plan = (user.subscription_plan == "Team")
        
        # SAFELY ACCESS FIELDS USING .get() METHOD
        cancel_at_period_end = updated_sub.get('cancel_at_period_end', False)
        current_period_end = updated_sub.get('current_period_end')
        
        # Convert timestamp to ISO format if it exists
        current_period_end_iso = None
        if current_period_end:
            if isinstance(current_period_end, int):
                current_period_end_iso = datetime.datetime.utcfromtimestamp(current_period_end).isoformat() + "Z"
            elif isinstance(current_period_end, datetime.datetime):
                current_period_end_iso = current_period_end.isoformat().replace('+00:00', 'Z')

        # If this is a team owner cancelling, we need to handle team members
        # Note: We don't downgrade team members immediately since the subscription
        # is only cancelled at period end. The webhook will handle the actual downgrade
        # when the subscription status changes to 'canceled'
        
        # However, we should inform the user about team implications
        message = "Subscription cancelled. You'll keep access until the end of your billing period."
        if was_team_plan:
            message += " All team members will lose access to Team plan features when your subscription ends."

        return jsonify({
            "msg": message,
            "cancel_at_period_end": cancel_at_period_end,
            "current_period_end": current_period_end_iso
        }), 200

    except Exception as e:
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

    # ✅ ENSURE STRIPE CUSTOMER EXISTS
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

        # ✅ MUST SET joined_at for Pro users too!
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