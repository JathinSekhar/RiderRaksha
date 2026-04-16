from flask import Blueprint, jsonify
import logging
import joblib
import os
from datetime import datetime
from app import db
from app.models.claim import Claim
from app.models.worker import Worker

# Set up logging
logger = logging.getLogger(__name__)

ml_bp = Blueprint('ml', __name__)

# ==============================
# Helper Functions
# ==============================

def _load_fraud_model():
    """Load the trained Isolation Forest fraud model from disk."""
    model_path = "app/ml/fraud_model.pkl"
    
    if not os.path.exists(model_path):
        logger.warning(f"Fraud model not found at {model_path}")
        raise FileNotFoundError(f"Fraud model not found at {model_path}")
    
    model = joblib.load(model_path)
    logger.debug("Fraud model loaded successfully")
    return model


def _extract_fraud_features(worker, claim):
    """
    Extract fraud detection features from worker and claim data.
    
    Returns a list of 8 features in this order:
    [account_age, claim_frequency, avg_payout, zone_risk, 
     hourly_rate, weather_severity, time_of_day, payout_ratio]
    """
    try:
        # Calculate account age in days
        account_age = (datetime.utcnow() - worker.created_at).days
        account_age = max(1, account_age)  # Ensure it's at least 1 to avoid zero division
        
        # Calculate claim frequency (number of claims by this worker)
        claim_frequency = Claim.query.filter_by(worker_id=worker.id).count()
        
        # Calculate average payout for this worker
        worker_claims = Claim.query.filter_by(worker_id=worker.id).all()
        if worker_claims:
            avg_payout = sum(c.payout_amount for c in worker_claims) / len(worker_claims)
        else:
            avg_payout = claim.payout_amount
        
        # Zone risk mapping (heuristic based on zone);
        zone_risk_map = {
            "south": 1.2, "north": 1.0, "east": 1.3, "west": 1.1,
            "central": 0.9, "suburban": 0.8, "high_risk": 1.5
        }
        zone_risk = zone_risk_map.get(worker.zone.lower(), 1.0)
        
        # Hourly rate (real value - no normalization)
        hourly_rate = worker.hourly_rate
        
        # Weather severity from claim snapshot (0.5 if not available)
        weather_severity = 0.5
        if claim.weather_snapshot:
            if isinstance(claim.weather_snapshot, dict):
                weather_severity = claim.weather_snapshot.get("severity", 0.5)
            elif isinstance(claim.weather_snapshot, str):
                try:
                    import json
                    ws_dict = json.loads(claim.weather_snapshot)
                    weather_severity = ws_dict.get("severity", 0.5)
                except:
                    weather_severity = 0.5
        
        # Time of day (hour when claim was made - real value: 0-23)
        claim_hour = claim.created_at.hour if claim.created_at else 12
        time_of_day = claim_hour
        
        # Payout ratio (payout / hourly_rate - real value, no normalization)
        payout_ratio = claim.payout_amount / hourly_rate if hourly_rate > 0 else 0
        
        features = [
            account_age,
            claim_frequency,
            avg_payout,
            zone_risk,
            hourly_rate,
            weather_severity,
            time_of_day,
            payout_ratio
        ]
        
        logger.debug(f"Extracted features for claim {claim.id}: {features}")
        return features
        
    except Exception as e:
        logger.error(f"Error extracting fraud features for claim {claim.id}: {str(e)}", exc_info=True)
        raise


def _calculate_feature_importance(model, features, feature_names):
    """
    Calculate dynamic feature importance using perturbation method.
    
    For each feature:
    1. Get base score
    2. Perturb the feature (set to feature mean)
    3. Calculate new score
    4. Importance = abs(base_score - new_score)
    5. Normalize all importance values to sum = 1
    
    Returns: dict of feature_name -> importance_score
    """
    try:
        import numpy as np
        
        # Get base score
        base_score = model.decision_function([features])[0]
        logger.debug(f"Base model score: {base_score}")
        
        # Calculate importance for each feature
        importance_scores = {}
        
        for i, feature_name in enumerate(feature_names):
            # Create a copy of features
            perturbed_features = features.copy()
            
            # Perturb the feature by setting it to 0 (neutral value)
            perturbed_features[i] = 0.0
            
            # Get new score
            new_score = model.decision_function([perturbed_features])[0]
            
            # Calculate importance as absolute difference
            importance = abs(base_score - new_score)
            importance_scores[feature_name] = importance
            
            logger.debug(f"Feature '{feature_name}' (idx={i}): importance={importance:.4f}")
        
        # Ensure no feature has zero importance (minimum 0.01)
        importance_scores = {
            name: max(score, 0.01)
            for name, score in importance_scores.items()
        }
        
        # Normalize to sum = 1
        total_importance = sum(importance_scores.values())
        if total_importance > 0:
            normalized_importance = {
                name: round(score / total_importance, 4)
                for name, score in importance_scores.items()
            }
        else:
            normalized_importance = {name: round(0.125, 4) for name in feature_names}  # Equal split for 8 features
        
        logger.debug(f"Normalized importance: {normalized_importance}")
        return normalized_importance
        
    except Exception as e:
        logger.error(f"Error calculating feature importance: {str(e)}", exc_info=True)
        # Fallback to equal importance if calculation fails
        return {name: round(1.0 / len(feature_names), 4) for name in feature_names}


# ==============================
# API Endpoints
# ==============================

@ml_bp.route('/explain/<int:claim_id>', methods=['GET'])
def explain_claim(claim_id):
    """
    GET /api/ml/explain/<claim_id>
    
    Returns a detailed ML explanation for a claim using the Isolation Forest model.
    
    Response:
    {
        "claim_id": int,
        "fraud_score": float (0-1),
        "risk_level": str (LOW/MEDIUM/HIGH),
        "model_raw_score": float,
        "features": dict (feature names to values),
        "feature_importance": dict (feature to importance score),
        "explanation": dict or null (fraud_explanation from claim)
    }
    """
    try:
        # Step 1: Fetch claim
        claim = Claim.query.get(claim_id)
        if not claim:
            logger.warning(f"Claim {claim_id} not found")
            return jsonify({"error": "Claim not found"}), 404
        
        # Fetch associated worker
        worker = Worker.query.get(claim.worker_id)
        if not worker:
            logger.error(f"Worker {claim.worker_id} not found for claim {claim_id}")
            return jsonify({"error": "Worker not found"}), 404
        
        logger.debug(f"Processing explain request for claim {claim_id}")
        
        # Step 2: Extract features
        features = _extract_fraud_features(worker, claim)
        
        # Step 3: Load model
        try:
            model = _load_fraud_model()
        except FileNotFoundError as e:
            logger.error(f"Failed to load fraud model: {str(e)}")
            return jsonify({"error": "Fraud model not available"}), 500
        
        # Step 4: Get anomaly score
        raw_score = model.decision_function([features])[0]
        
        # Normalize to 0–1 range (lower anomaly score = more normal = lower fraud probability)
        fraud_score = round((1 - raw_score) / 2, 2)
        fraud_score = max(0, min(1.0, fraud_score))  # Clamp to [0, 1]
        
        # Step 5: Feature mapping
        feature_names = [
            "account_age",
            "claim_frequency",
            "avg_payout",
            "zone_risk",
            "hourly_rate",
            "weather_severity",
            "time_of_day",
            "payout_ratio"
        ]
        
        feature_dict = dict(zip(feature_names, features))
        
        # Step 6: Calculate dynamic feature importance using perturbation
        importance = _calculate_feature_importance(model, features, feature_names)
        
        # Step 7: Compute top factors (top 3 most important features)
        top_factors = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:3]
        top_factor_names = [f[0] for f in top_factors]
        
        # Step 8: Generate dynamic risk_reason based on top factors
        risk_reason = []
        for feature, _ in top_factors:
            if feature == "avg_payout":
                risk_reason.append("High average payout behavior")
            
            elif feature == "claim_frequency":
                risk_reason.append("Frequent claim activity detected")
            
            elif feature == "payout_ratio":
                risk_reason.append("High payout relative to earnings")
            
            elif feature == "account_age" and feature_dict["account_age"] < 7:
                risk_reason.append("New account with limited history")
            
            elif feature == "time_of_day" and (feature_dict["time_of_day"] < 6 or feature_dict["time_of_day"] > 22):
                risk_reason.append("Unusual claim timing pattern")
            
            elif feature == "hourly_rate":
                risk_reason.append("Inconsistent earnings pattern")
            
            elif feature == "weather_severity":
                risk_reason.append("High disruption severity")
            
            elif feature == "zone_risk":
                risk_reason.append("High-risk geographic zone")
        
        # Step 9: Calculate confidence score (0.5-1.0 range)
        # Higher confidence = lower anomaly magnitude
        confidence = round(1 - abs(raw_score), 2)
        confidence = max(0.5, confidence)  # Ensure minimum confidence of 0.5
        
        # Step 10: Risk classification
        if fraud_score < 0.3:
            risk_level = "LOW"
        elif fraud_score < 0.55:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        logger.info(f"Fraud analysis for claim {claim_id}: fraud_score={fraud_score}, risk_level={risk_level}, confidence={confidence}, top_factors={top_factor_names}")
        
        # Step 11: Clean production-quality response
        return jsonify({
            "claim_id": claim.id,
            "fraud_score": fraud_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "top_factors": top_factor_names,
            "risk_reason": risk_reason,
            "feature_importance": importance,
            "features": feature_dict
        }), 200
        
    except Exception as e:
        logger.error(f"Error explaining claim {claim_id}: {str(e)}", exc_info=True)
        return jsonify({"error": "Error processing request", "details": str(e)}), 500
