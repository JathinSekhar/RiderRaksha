from flask import Blueprint, jsonify
import logging
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.claim import Claim

# Set up logging
logger = logging.getLogger(__name__)

claims_bp = Blueprint('claims', __name__)

@claims_bp.route('/my', methods=['GET'])
@jwt_required()
def my_claims():
    """Retrieve all claims for the authenticated worker."""
    try:
        worker_id = int(get_jwt_identity())
        logger.debug(f"[CLAIMS FETCH] Retrieving claims for worker_id: {worker_id}")
        
        claims = Claim.query.filter_by(worker_id=worker_id).all()
        logger.info(f"[CLAIMS FETCH] Found {len(claims)} claims for worker_id: {worker_id}")
        logger.debug(f"[CLAIMS DATA] Claims: {[c.to_dict() for c in claims]}")
        
        return jsonify([c.to_dict() for c in claims]), 200
    except Exception as e:
        logger.error(f"[CLAIMS ERROR] Error retrieving claims: {str(e)}", exc_info=True)
        return jsonify({'message': 'Error retrieving claims', 'error': str(e)}), 500


@claims_bp.route('/<int:claim_id>', methods=['GET'])
@jwt_required()
def get_claim(claim_id):
    """Retrieve a specific claim for the authenticated worker."""
    try:
        worker_id = int(get_jwt_identity())
        logger.debug(f"[CLAIM FETCH] Retrieving claim_id: {claim_id} for worker_id: {worker_id}")
        
        claim = Claim.query.filter_by(id=claim_id, worker_id=worker_id).first()
        if not claim:
            logger.warning(f"[CLAIM NOT FOUND] claim_id: {claim_id} not found for worker_id: {worker_id}")
            return jsonify({'message': 'Claim not found'}), 404
        
        logger.info(f"[CLAIM FETCH] Successfully retrieved claim_id: {claim_id}")
        logger.debug(f"[CLAIM DATA] {claim.to_dict()}")
        
        return jsonify(claim.to_dict()), 200
    except Exception as e:
        logger.error(f"[CLAIM ERROR] Error retrieving claim: {str(e)}", exc_info=True)
        return jsonify({'message': 'Error retrieving claim', 'error': str(e)}), 500


@claims_bp.route('/all', methods=['GET'])
def get_all_claims():
    """
    Retrieve ALL claims (admin-only access - no JWT required for MVP).
    
    Returns the 50 most recent claims with full details including:
    - Fraud scores and explanations
    - Weather snapshots
    - Worker and policy IDs
    - Status and disruption types
    
    Returns:
        JSON list of claim dictionaries sorted by created_at (newest first)
    """
    try:
        claims = Claim.query.order_by(Claim.created_at.desc()).limit(50).all()
        print(f"[ADMIN] Fetching {len(claims)} claims")
        logger.info(f"[ADMIN CLAIMS] Retrieved {len(claims)} claims for admin dashboard")
        
        return jsonify([c.to_dict() for c in claims]), 200
    
    except Exception as e:
        logger.error(f"[ADMIN CLAIMS ERROR] Failed to fetch claims: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Failed to fetch claims",
            "details": str(e)
        }), 500