# app/routes/dashboard.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import UserLayout
import json

dashboard_bp = Blueprint('dashboard', __name__)

# ✅ Updated DEFAULT_LAYOUT to reflect three separate chart widgets
DEFAULT_LAYOUT = [
    {"i": "upload-controls", "x": 0, "y": 0, "w": 12, "h": 1},
    {"i": "chart-severity", "x": 0, "y": 2, "w": 4, "h": 4},
    {"i": "chart-protocol", "x": 4, "y": 2, "w": 4, "h": 4},
    {"i": "chart-time", "x": 8, "y": 2, "w": 4, "h": 4},
    {"i": "summary-metrics", "x": 0, "y": 8, "w": 12, "h": 3},
    {"i": "filters", "x": 0, "y": 12, "w": 12, "h": 2},
    {"i": "alerts-table", "x": 0, "y": 15, "w": 12, "h": 10},
]

@dashboard_bp.route('/user-layout', methods=['GET', 'PUT'])
@jwt_required()
def user_layout():
    user_id = get_jwt_identity()
    if request.method == 'GET':
        layout_entry = UserLayout.query.filter_by(user_id=user_id).first()
        if layout_entry:
            try:
                layout = json.loads(layout_entry.layout)
                if not isinstance(layout, list):
                    layout = DEFAULT_LAYOUT
                else:
                    clean_layout = []
                    for item in layout:
                        if isinstance(item, dict) and all(k in item for k in ['i', 'x', 'y', 'w', 'h']):
                            clean_layout.append({
                                "i": str(item["i"]),
                                "x": int(float(item["x"])),
                                "y": int(float(item["y"])),
                                "w": int(float(item["w"])),
                                "h": int(float(item["h"])),
                            })
                        else:
                            raise ValueError("Invalid layout item")
                    layout = clean_layout
            except Exception as e:
                print(f"Layout parse error: {e}")
                layout = DEFAULT_LAYOUT
        else:
            layout = DEFAULT_LAYOUT
        return jsonify({"layout": layout})

    elif request.method == 'PUT':
        data = request.get_json()
        raw_layout = data.get('layout', DEFAULT_LAYOUT)
        layout_json_str = json.dumps(raw_layout)
        layout_entry = UserLayout.query.filter_by(user_id=user_id).first()
        if layout_entry:
            layout_entry.layout = layout_json_str
        else:
            layout_entry = UserLayout(user_id=user_id, layout=layout_json_str)
            db.session.add(layout_entry)
        db.session.commit()
        return '', 204