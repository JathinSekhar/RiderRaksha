from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models.worker import Worker
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if Worker.query.filter_by(phone=data['phone']).first():
        return jsonify({'message': 'Phone number already registered'}), 409

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    worker = Worker(
        full_name=data['full_name'],
        phone=data['phone'],
        password=hashed_password,
        platform=data['platform'],
        city=data['city'],
        zone=data['zone'],
        hourly_rate=data['hourly_rate']
    )

    db.session.add(worker)
    db.session.commit()

    return jsonify({'message': 'Worker registered successfully', 'worker': worker.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    worker = Worker.query.filter_by(phone=data['phone']).first()

    if not worker or not bcrypt.check_password_hash(worker.password, data['password']):
        return jsonify({'message': 'Invalid phone or password'}), 401

    token = create_access_token(
    identity=str(worker.id),
    additional_claims={"role": worker.role},
    expires_delta=timedelta(hours=24)
)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'worker': worker.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    worker_id = get_jwt_identity()

    # ✅ SAFE CHECK
    if not worker_id:
        return jsonify({'message': 'Invalid token'}), 422

    try:
        worker_id = int(worker_id)
    except:
        return jsonify({'message': 'Invalid token format'}), 422

    worker = Worker.query.get(worker_id)

    if not worker:
        return jsonify({'message': 'Worker not found'}), 404

    return jsonify(worker.to_dict()), 200