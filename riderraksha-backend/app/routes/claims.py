from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.claim import Claim

claims_bp = Blueprint('claims', __name__)

@claims_bp.route('/my', methods=['GET'])
@jwt_required()
def my_claims():
    worker_id = int(get_jwt_identity())
    claims = Claim.query.filter_by(worker_id=worker_id).all()
    return jsonify([c.to_dict() for c in claims]), 200


@claims_bp.route('/<int:claim_id>', methods=['GET'])
@jwt_required()
def get_claim(claim_id):
    worker_id = int(get_jwt_identity())
    claim = Claim.query.filter_by(id=claim_id, worker_id=worker_id).first()
    if not claim:
        return jsonify({'message': 'Claim not found'}), 404
    return jsonify(claim.to_dict()), 200