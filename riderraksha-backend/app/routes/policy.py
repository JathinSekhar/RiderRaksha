from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.policy import Policy
from app.models.worker import Worker
from app.utils.premium_calc import calculate_premium
from datetime import datetime, timedelta

policy_bp = Blueprint('policy', __name__)

TIERS = {
    'BASIC':    {'base_premium': 29, 'coverage_cap': 1000},
    'STANDARD': {'base_premium': 59, 'coverage_cap': 2500},
    'PRO':      {'base_premium': 99, 'coverage_cap': 5000}
}

@policy_bp.route('/buy', methods=['POST'])
@jwt_required()
def buy_policy():
    worker_id = int(get_jwt_identity())
    data = request.get_json()
    tier = data.get('tier', 'STANDARD').upper()

    if tier not in TIERS:
        return jsonify({'message': 'Invalid tier. Choose BASIC, STANDARD, or PRO'}), 400

    worker = Worker.query.get(worker_id)

    # Check for existing active policy
    existing = Policy.query.filter_by(worker_id=worker_id, status='ACTIVE').first()
    if existing:
        return jsonify({'message': 'You already have an active policy'}), 409

    # Dynamic premium calculation
    base = TIERS[tier]['base_premium']
    premium = calculate_premium(base, worker.zone, worker.city)

    policy = Policy(
        worker_id=worker_id,
        tier=tier,
        premium=premium,
        coverage_cap=TIERS[tier]['coverage_cap'],
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(weeks=1)
    )

    db.session.add(policy)
    db.session.commit()

    return jsonify({'message': 'Policy purchased successfully', 'policy': policy.to_dict()}), 201


@policy_bp.route('/my', methods=['GET'])
@jwt_required()
def my_policies():
    worker_id = int(get_jwt_identity())
    policies = Policy.query.filter_by(worker_id=worker_id).all()
    return jsonify([p.to_dict() for p in policies]), 200


@policy_bp.route('/active', methods=['GET'])
@jwt_required()
def active_policy():
    worker_id = int(get_jwt_identity())
    policy = Policy.query.filter_by(worker_id=worker_id, status='ACTIVE').first()
    if not policy:
        return jsonify({'message': 'No active policy found'}), 404
    return jsonify(policy.to_dict()), 200

@policy_bp.route('/preview', methods=['GET'])
def preview_premium():
    tier = request.args.get('tier', 'STANDARD').upper()
    zone = request.args.get('zone', 'METRO')
    city = request.args.get('city', 'Delhi')

    if tier not in TIERS:
        return jsonify({'message': 'Invalid tier. Choose BASIC, STANDARD, or PRO'}), 400

    base = TIERS[tier]['base_premium']
    dynamic = calculate_premium(base, zone, city)

    # Zone and city risk labels
    from app.utils.premium_calc import ZONE_RISK, CITY_RISK
    zone_multiplier = ZONE_RISK.get(zone, 1.0)
    city_multiplier = CITY_RISK.get(city, 1.0)

    return jsonify({
        'tier': tier,
        'base_premium': base,
        'dynamic_premium': dynamic,
        'coverage_cap': TIERS[tier]['coverage_cap'],
        'zone': zone,
        'city': city,
        'zone_risk_multiplier': zone_multiplier,
        'city_risk_multiplier': city_multiplier,
        'zone_risk_level': 'HIGH' if zone_multiplier >= 1.2 else 'MEDIUM' if zone_multiplier >= 1.1 else 'LOW',
        'city_risk_level': 'HIGH' if city_multiplier >= 1.15 else 'MEDIUM' if city_multiplier >= 1.1 else 'LOW',
        'savings_vs_high_risk': None,
        'breakdown': f"Rs {base} base × {zone_multiplier} zone risk × {city_multiplier} city risk = Rs {dynamic}"
    }), 200