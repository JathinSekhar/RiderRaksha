import joblib
import numpy as np
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Zone risk scores — higher score = higher premium
ZONE_RISK = {
    'Zone-1': 1.2,  # high flood risk
    'Zone-2': 1.1,  # moderate rain risk
    'Zone-3': 1.0,  # baseline
    'Zone-4': 0.9,  # low risk
}

CITY_RISK = {
    'Hyderabad': 1.15,
    'Delhi': 1.20,
    'Mumbai': 1.25,
    'Bangalore': 1.10,
    'Chennai': 1.10,
}

# Global variable to load model only once
_xgboost_model = None

def _load_model():
    """Load XGBoost model from pickle file. Called once at startup."""
    global _xgboost_model
    if _xgboost_model is not None:
        return _xgboost_model
    
    try:
        from pathlib import Path
        model_path = Path(__file__).parent.parent / 'ml' / 'premium_model.pkl'
        _xgboost_model = joblib.load(str(model_path))
        logger.info(f"XGBoost model loaded from {model_path}")
        return _xgboost_model
    except Exception as e:
        logger.warning(f"Failed to load XGBoost model: {e}. Will use fallback formula.")
        _xgboost_model = None
        return None

def predict_premium(worker):
    """
    Predict premium using trained XGBoost model.
    Falls back to rule-based formula if model fails.
    
    Args:
        worker: Worker database object with required attributes
        
    Returns:
        float: Predicted premium rounded to 2 decimals
    """
    try:
        model = _load_model()
        
        if model is None:
            # Fallback to rule-based calculation
            return _calculate_premium_fallback(worker)
        
        # Extract features
        features = _extract_features(worker)
        
        # Convert to numpy array with shape (1, n_features)
        features_array = np.array([features], dtype=np.float32)
        
        # Predict premium
        predicted_premium = model.predict(features_array)[0]
        
        # Return rounded premium
        return round(float(predicted_premium), 2)
        
    except Exception as e:
        logger.warning(f"Model prediction failed for worker {worker.id}: {e}. Using fallback.")
        return _calculate_premium_fallback(worker)

def _extract_features(worker):
    """
    Extract features required by XGBoost model.
    
    Feature order (must match training order):
    [account_age, claim_freq, avg_payout, zone_risk, hourly_rate, weather_severity, platform_encoded]
    
    Args:
        worker: Worker database object
        
    Returns:
        list: List of 7 features in correct order
    """
    # 1. Account age in days (default 30 if missing)
    if hasattr(worker, 'created_at') and worker.created_at:
        account_age = (datetime.utcnow() - worker.created_at).days
    else:
        account_age = 30
    account_age = max(account_age, 1)  # Ensure at least 1 day
    
    # 2. Claim frequency (count of claims, default 2)
    claim_freq = 2
    if hasattr(worker, 'claims'):
        try:
            claim_freq = len(worker.claims) if worker.claims else 2
            claim_freq = max(claim_freq, 1)  # Minimum 1
        except Exception:
            claim_freq = 2
    
    # 3. Average payout (default 500)
    avg_payout = 500
    if hasattr(worker, 'claims') and worker.claims:
        try:
            total_payout = sum(claim.payout_amount for claim in worker.claims if hasattr(claim, 'payout_amount'))
            avg_payout = total_payout / len(worker.claims) if worker.claims else 500
            avg_payout = max(avg_payout, 100)  # Minimum 100
        except Exception:
            avg_payout = 500
    
    # 4. Zone risk multiplier (already available)
    zone_risk = ZONE_RISK.get(worker.zone, 1.0) if hasattr(worker, 'zone') else 1.0
    
    # 5. Hourly rate (from worker)
    hourly_rate = worker.hourly_rate if hasattr(worker, 'hourly_rate') else 300
    hourly_rate = max(hourly_rate, 50)  # Minimum 50
    
    # 6. Weather severity (default 0.5)
    weather_severity = 0.5
    
    # 7. Platform encoding (0=Zomato, 1=Swiggy)
    platform_encoded = 0
    if hasattr(worker, 'platform') and worker.platform:
        platform_str = worker.platform.upper().strip()
        platform_encoded = 1 if 'SWIGGY' in platform_str else 0
    
    return [account_age, claim_freq, avg_payout, zone_risk, hourly_rate, weather_severity, platform_encoded]

def _calculate_premium_fallback(worker):
    """
    Fallback rule-based premium calculation using zone and city multipliers.
    Used when XGBoost model is unavailable.
    
    Args:
        worker: Worker database object
        
    Returns:
        float: Calculated premium based on multipliers
    """
    base_premium = 500  # Default base premium
    zone = worker.zone if hasattr(worker, 'zone') else 'Zone-3'
    city = worker.city if hasattr(worker, 'city') else 'Bangalore'
    
    zone_multiplier = ZONE_RISK.get(zone, 1.0)
    city_multiplier = CITY_RISK.get(city, 1.0)
    dynamic_premium = round(base_premium * zone_multiplier * city_multiplier, 2)
    
    return dynamic_premium

def calculate_premium(base_premium, zone, city):
    """
    Original rule-based premium calculation.
    Kept for backward compatibility.
    
    Args:
        base_premium: Base premium amount
        zone: Zone code (e.g., 'Zone-1')
        city: City name (e.g., 'Mumbai')
        
    Returns:
        float: Premium with zone and city multipliers applied
    """
    zone_multiplier = ZONE_RISK.get(zone, 1.0)
    city_multiplier = CITY_RISK.get(city, 1.0)
    dynamic_premium = round(base_premium * zone_multiplier * city_multiplier, 2)
    return dynamic_premium