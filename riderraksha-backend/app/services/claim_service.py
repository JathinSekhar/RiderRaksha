import hashlib
import logging
import joblib
import numpy as np
from app import db
from app.models.claim import Claim
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm.attributes import flag_modified

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Global variable to load fraud model once
_fraud_model = None

# Zone risk mapping for fraud scoring (Isolation Forest)
ZONE_RISK_FRAUD = {
    'Zone-1': 1.0,
    'Zone-2': 1.2,
    'Zone-3': 1.5,
}

# Payout limits to maintain sustainable loss ratio (0.6 - 0.9 range)
MAX_PAYOUT = 600   # cap per claim to control payouts
MIN_PAYOUT = 100   # minimum payout to ensure worker compensation

def _load_fraud_model():
    """Load Isolation Forest fraud model from pickle file. Called once at startup."""
    global _fraud_model
    if _fraud_model is not None:
        return _fraud_model
    
    try:
        model_path = Path(__file__).parent.parent / 'ml' / 'fraud_model.pkl'
        _fraud_model = joblib.load(str(model_path))
        logger.info(f"Isolation Forest fraud model loaded from {model_path}")
        print("USING ML FRAUD MODEL")
        return _fraud_model
    except Exception as e:
        logger.warning(f"Failed to load Isolation Forest fraud model: {e}. Will use fallback formula.")
        _fraud_model = None
        return None

def predict_fraud_score(worker, claim):
    """
    Predict fraud score using Isolation Forest model.
    Falls back to rule-based formula if model fails.
    
    Args:
        worker: Worker database object
        claim: Claim object with payout_amount
        
    Returns:
        float: Fraud score between 0 and 1, rounded to 2 decimals
    """
    try:
        model = _load_fraud_model()
        
        if model is None:
            # Fallback to rule-based calculation
            return _calculate_fraud_score_fallback(worker, claim)
        
        # Extract features
        features = _extract_fraud_features(worker, claim)
        
        # Convert to numpy array with shape (1, n_features)
        features_array = np.array([features], dtype=np.float32)
        
        # Get anomaly decision function (lower values = more anomalous = higher fraud)
        decision_score = model.decision_function(features_array)[0]
        
        # Normalize score: (1 - score) / 2 to convert to 0-1 range
        # Clamp between 0 and 1
        fraud_score = (1 - decision_score) / 2
        fraud_score = max(0.0, min(fraud_score, 1.0))
        
        return round(fraud_score, 2)
        
    except Exception as e:
        logger.warning(f"Model prediction failed for worker {worker.id}: {e}. Using fallback.")
        return _calculate_fraud_score_fallback(worker, claim)

def _extract_fraud_features(worker, claim):
    """
    Extract features required by Isolation Forest fraud model.
    
    Feature order (must match training order):
    [account_age, claim_freq, avg_payout, zone_risk, hourly_rate, weather_severity, time_of_day, claim_amount_ratio]
    
    Args:
        worker: Worker database object
        claim: Claim object with payout_amount and created_at
        
    Returns:
        list: List of 8 features in correct order
    """
    # 1. Account age in days (default 30 if missing)
    if hasattr(worker, 'created_at') and worker.created_at:
        account_age = (datetime.utcnow() - worker.created_at).days
    else:
        account_age = 30
    account_age = max(account_age, 1)
    
    # 2. Claim frequency (count of claims, default 2)
    claim_freq = 2
    if hasattr(worker, 'claims'):
        try:
            claim_freq = len(worker.claims) if worker.claims else 2
            claim_freq = max(claim_freq, 1)
        except Exception:
            claim_freq = 2
    
    # 3. Average payout (default 500)
    avg_payout = 500
    if hasattr(worker, 'claims') and worker.claims:
        try:
            total_payout = sum(c.payout_amount for c in worker.claims if hasattr(c, 'payout_amount'))
            avg_payout = total_payout / len(worker.claims) if worker.claims else 500
            avg_payout = max(avg_payout, 100)
        except Exception:
            avg_payout = 500
    
    # 4. Zone risk (mapped to fraud model values)
    zone_risk = ZONE_RISK_FRAUD.get(worker.zone, 1.0) if hasattr(worker, 'zone') else 1.0
    
    # 5. Hourly rate (from worker)
    hourly_rate = worker.hourly_rate if hasattr(worker, 'hourly_rate') else 300
    hourly_rate = max(hourly_rate, 50)
    
    # 6. Weather severity (default 0.5 for now)
    weather_severity = 0.5
    
    # 7. Time of day (0-23 from claim.created_at)
    time_of_day = 12  # Default to noon
    if hasattr(claim, 'created_at') and claim.created_at:
        time_of_day = claim.created_at.hour
    
    # 8. Claim amount ratio (payout / hourly_rate)
    payout_amount = claim.payout_amount if hasattr(claim, 'payout_amount') else 0
    claim_amount_ratio = payout_amount / hourly_rate if hourly_rate > 0 else 0
    
    return [account_age, claim_freq, avg_payout, zone_risk, hourly_rate, weather_severity, time_of_day, claim_amount_ratio]

def _calculate_fraud_score_fallback(worker, claim):
    """
    Fallback rule-based fraud scoring using original logic.
    Used when Isolation Forest model is unavailable.
    
    Args:
        worker: Worker database object
        claim: Claim object with payout_amount
        
    Returns:
        float: Fraud score between 0 and 1
    """
    score = 0.0
    
    # Penalty for new accounts (account age)
    if hasattr(worker, 'created_at') and worker.created_at:
        days_old = (datetime.utcnow() - worker.created_at).days
        if days_old < 7:
            score += 0.2
        elif days_old < 30:
            score += 0.1
    
    # Penalty for high claim frequency
    if hasattr(worker, 'claims'):
        today_claims = len(worker.claims) if worker.claims else 0
        if today_claims >= 5:
            score += 0.4
        elif today_claims >= 3:
            score += 0.35
    
    # Penalty for high payout relative to coverage cap
    if hasattr(claim, 'payout_amount'):
        # Simplified check - penalty if payout is very high
        if claim.payout_amount > 5000:
            score += 0.15
    
    return round(min(score, 1.0), 2)

def _calculate_fraud_feature_importance(model, features, feature_names):
    """
    Calculate dynamic feature importance using perturbation method.
    
    For each feature:
    1. Get base score
    2. Perturb the feature (set to 0)
    3. Calculate new score
    4. Importance = abs(base_score - new_score)
    5. Ensure minimum importance of 0.01
    6. Normalize all importance values to sum = 1
    
    Returns: dict of feature_name -> importance_score
    """
    try:
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

def explain_fraud_score(worker, claim, features, feature_importance=None):
    """
    Generate human-readable explanation for fraud score using dynamic feature importance.
    
    Explanation is based on the model's top 2-3 most important features and their values.
    
    Args:
        worker: Worker database object
        claim: Claim object with payout_amount and created_at
        features: List of 8 features from _extract_fraud_features()
                  [account_age, claim_freq, avg_payout, zone_risk, hourly_rate, weather_severity, time_of_day, payout_ratio]
        feature_importance: dict of feature_name -> importance_score
    
    Returns:
        dict: Fraud explanation with top_factors and dynamic risk_reason aligned with model priorities
    """
    # Extract feature values
    account_age = int(features[0])
    claim_freq = int(features[1])
    avg_payout = float(features[2])
    zone_risk = float(features[3])
    hourly_rate = float(features[4])
    weather_severity = float(features[5])
    time_of_day = int(features[6])
    payout_ratio = float(features[7])
    
    # Feature names in order
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
    
    # If importance not provided, use equal weighting
    if feature_importance is None:
        feature_importance = {name: round(1.0 / len(feature_names), 4) for name in feature_names}
    
    # Sort by importance (descending) and pick top 3 most influential features
    sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    top_features = sorted_features[:3]
    top_factor_names = [fname for fname, _ in top_features]
    
    explanation = {
        "top_factors": top_factor_names,
        "feature_importance": feature_importance,
        "risk_reason": []
    }
    
    # Generate dynamic risk reasons based on rules aligned with top features
    for feature_name, importance in top_features:
        
        # Rule 1: payout_ratio
        if feature_name == "payout_ratio":
            explanation["risk_reason"].append("High payout relative to earnings")
        
        # Rule 2: claim_frequency
        elif feature_name == "claim_frequency":
            explanation["risk_reason"].append("Frequent claim activity detected")
        
        # Rule 3: account_age (only if new account)
        elif feature_name == "account_age":
            if account_age < 7:
                explanation["risk_reason"].append("New account with limited history")
        
        # Rule 4: time_of_day (only if night hours)
        elif feature_name == "time_of_day":
            if time_of_day >= 22 or time_of_day <= 5:
                explanation["risk_reason"].append("Unusual claim timing pattern")
        
        # Rule 5: avg_payout
        elif feature_name == "avg_payout":
            explanation["risk_reason"].append("High average payout behavior")
    
    # If no risk reasons were added, add a fallback explanation
    if not explanation["risk_reason"]:
        explanation["risk_reason"].append(
            f"Model prioritized: {', '.join(top_factor_names)}"
        )
    
    return explanation

def calculate_payout(hourly_rate, hours_lost, coverage_cap):
    # Payout capped to ensure platform sustainability and maintain healthy loss ratio
    # Calculate base payout (60% of actual loss - reduced from 80% for sustainability)
    base_payout = hours_lost * hourly_rate * 0.6
    
    # Apply coverage cap
    capped_payout = min(base_payout, coverage_cap)
    
    # Apply system-wide maximum to ensure loss ratio stays between 0.6-0.9
    capped_payout = min(capped_payout, MAX_PAYOUT)
    
    # Apply minimum to ensure worker gets compensated
    payout_amount = max(capped_payout, MIN_PAYOUT)
    
    # Debug logging for payout tracking
    print(f"[PAYOUT] Base: ₹{base_payout:.2f}, Coverage-capped: ₹{capped_payout:.2f}, Final (min/max-capped): ₹{payout_amount:.2f}")
    
    return round(payout_amount, 2)

def create_claim(worker, policy, disruption_event, weather=None):
    """
    Create a claim when a weather disruption is detected.
    
    Args:
        worker: Worker object who experienced the disruption
        policy: Active policy for the worker
        disruption_event: DisruptionEvent that triggered the claim
        weather: Weather data dict with keys: rain, temp, source
        
    Returns:
        Claim object if created successfully, None if duplicate or error
        
    Raises:
        Exception: On database errors (handled internally with rollback)
    """
    try:
        logger.info(f"[CLAIM CREATE] Starting claim creation for worker: {worker.full_name} (ID: {worker.id})")
        
        # ── IDEMPOTENCY CHECK ──────────────────────────────────────────
        # Generate a unique key: WorkerID + EventType + Date (YYYY-MM-DD)
        event_date = disruption_event.triggered_at.strftime('%Y-%m-%d')
        hash_payload = f"{worker.id}-{disruption_event.event_type}-{event_date}"
        unique_hash = hashlib.sha256(hash_payload.encode()).hexdigest()
        logger.debug(f"[HASH] Generated claim hash: {unique_hash}")

        # Check for duplicate within same day
        existing = Claim.query.filter_by(claim_hash=unique_hash).first()
        if existing:
            logger.warning(f"[DUPLICATE] Skipping duplicate claim for {worker.full_name} ({disruption_event.event_type}) on {event_date}")
            return None
        
        # Additional check: No claims for same worker/event type within last 6 hours
        time_threshold = datetime.utcnow() - timedelta(hours=6)
        recent_claims = Claim.query.filter(
            Claim.worker_id == worker.id,
            Claim.disruption_type == disruption_event.event_type,
            Claim.created_at >= time_threshold
        ).first()
        
        if recent_claims:
            logger.warning(f"[DUPLICATE TIME] Skipping - claim exists within last 6 hours for {worker.full_name} ({disruption_event.event_type})")
            return None
        # ───────────────────────────────────────────────────────────────

        # Calculate payout and fraud score
        payout = calculate_payout(
            worker.hourly_rate,
            disruption_event.hours_affected,
            policy.coverage_cap
        )
        logger.debug(f"[PAYOUT] Calculated payout: ₹{payout}")
        
        # Create a temporary claim object for fraud score prediction only
        temp_claim = Claim(
            worker_id=worker.id,
            policy_id=policy.id,
            disruption_type=disruption_event.event_type,
            hours_lost=disruption_event.hours_affected,
            payout_amount=payout,
            created_at=datetime.utcnow()
        )
        
        fraud_score = predict_fraud_score(worker, temp_claim)
        logger.debug(f"[FRAUD SCORE] Calculated fraud score: {fraud_score}")

        # Determine status based on fraud score
        if fraud_score < 0.3:
            status = 'APPROVED'
        elif fraud_score < 0.55:
            status = 'PENDING'
        else:
            status = 'UNDER_REVIEW'
        logger.info(f"[STATUS] Claim status determined: {status} (fraud_score: {fraud_score})")

        # Prepare weather snapshot if available
        weather_snapshot = None
        if weather:
            weather_snapshot = {
                "rain": weather.get("rain", 0),
                "temp": weather.get("temp", 0),
                "humidity": weather.get("humidity"),
                "weather_type": weather.get("weather"),
                "source": "OpenWeatherMap"
            }
            logger.debug(f"[WEATHER] Stored weather snapshot: {weather_snapshot}")
        else:
            logger.debug(f"[WEATHER] No weather data provided for snapshot")

        # Create final claim object
        claim = Claim(
            worker_id=worker.id,
            policy_id=policy.id,
            disruption_type=disruption_event.event_type,
            hours_lost=disruption_event.hours_affected,
            payout_amount=payout,
            status=status,
            fraud_score=fraud_score,
            claim_hash=unique_hash,
            weather_snapshot=weather_snapshot
        )
        
        # Extract features and calculate feature importance
        fraud_features = _extract_fraud_features(worker, claim)
        
        # Calculate feature importance for fraud explanation
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
        feature_importance = None
        try:
            model = _load_fraud_model()
            if model is not None:
                feature_importance = _calculate_fraud_feature_importance(model, fraud_features, feature_names)
        except Exception as e:
            logger.warning(f"Failed to calculate feature importance: {e}. Using default.")
        
        # Generate fraud explanation with feature importance
        fraud_explanation = explain_fraud_score(worker, claim, fraud_features, feature_importance=feature_importance)
        logger.debug(f"[FRAUD EXPLANATION] {fraud_explanation}")
        
        # Assign fraud explanation to claim
        print("BEFORE ASSIGN:", claim.fraud_explanation)
        claim.fraud_explanation = fraud_explanation
        print("AFTER ASSIGN:", claim.fraud_explanation)
        
        # Force SQLAlchemy to detect the change (important for JSON fields)
        flag_modified(claim, "fraud_explanation")
        
        # Save to database
        db.session.add(claim)
        db.session.commit()
        print("SAVED:", claim.fraud_explanation)
        logger.info(f"✅ [CLAIM SAVED] Claim #{claim.id} successfully saved for {worker.full_name}")
        logger.info(f"   Worker: {worker.full_name}, Event: {disruption_event.event_type}, Payout: ₹{payout}, Status: {status}")

        # Trigger payout if approved
        if status == 'APPROVED':
            try:
                from app.services.payout_service import simulate_upi_payout
                result = simulate_upi_payout(worker, payout)
                logger.info(f"✅ [PAYOUT] {result['message']} | Ref: {result['ref_id']}")
            except Exception as payout_error:
                logger.error(f"❌ [PAYOUT ERROR] Failed to process payout: {str(payout_error)}")
                # Note: Claim is still saved even if payout fails

        return claim

    except Exception as e:
        logger.error(f"❌ [CLAIM ERROR] Exception creating claim for {worker.full_name}: {str(e)}", exc_info=True)
        db.session.rollback()
        logger.warning(f"[DB ROLLBACK] Database rolled back due to error")
        return None