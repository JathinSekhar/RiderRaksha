from flask import Blueprint, request, jsonify
from app.services.trigger_engine import check_and_fire_triggers

triggers_bp = Blueprint('triggers', __name__)

@triggers_bp.route('/check', methods=['POST'])
def check_triggers():
    data = request.get_json()
    city = data.get('city', 'Hyderabad')
    zone = data.get('zone', 'Zone-1')

    result = check_and_fire_triggers(city, zone)
    return jsonify(result), 200