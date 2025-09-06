# app/routes/main.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

main_bp = Blueprint('main', __name__)

@main_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user:
        return jsonify({
            "username": user.username,
            "user_id": user.id
        }), 200
    return jsonify({"msg": "User not found"}), 404

@main_bp.route('/upload-json', methods=['POST'])
def upload_json():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        data = json.load(file)  # Parse JSON to verify
        save_path = os.path.join(current_app.root_path, 'data', 'thing.json')
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, 'w') as f:
            json.dump(data, f, indent=2)
        return jsonify({"message": "File uploaded successfully!"})
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON file"}), 400