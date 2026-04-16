import json
import logging
from app import db
from datetime import datetime

logger = logging.getLogger(__name__)

class Claim(db.Model):
    __tablename__ = 'claims'

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    policy_id = db.Column(db.Integer, db.ForeignKey('policies.id'), nullable=False)
    disruption_type = db.Column(db.String(50), nullable=False)  # RAIN, HEAT, AQI, FLOOD, CURFEW
    hours_lost = db.Column(db.Float, nullable=False)
    payout_amount = db.Column(db.Float, nullable=False)  # hours_lost x hourly_rate x 0.8
    status = db.Column(db.String(20), default='PENDING')  # PENDING, APPROVED, REJECTED
    fraud_score = db.Column(db.Float, default=0.0)
    fraud_explanation = db.Column(db.JSON, nullable=True)  # Stores explain_fraud_score() dict
    # ── FIELD FOR IDEMPOTENCY ─────────────────────────────────────────
    # This prevents duplicate claims for the same worker/event/day
    claim_hash = db.Column(db.String(64), unique=True, nullable=False) 
    # ─────────────────────────────────────────────────────────────────
    # Weather conditions at the time of claim creation
    # Stored as JSON - handles both JSON and TEXT database types
    weather_snapshot = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def _parse_weather_snapshot(self):
        """
        Safely parse weather_snapshot from DB.
        
        Handles multiple data formats:
        - Dictionary: returned as-is
        - JSON string: parsed with json.loads()
        - None: returned as None
        - Malformed: logged and returned safely
        
        Returns:
            dict or None: Parsed weather data or None
        """
        try:
            if self.weather_snapshot is None:
                return None
            
            # If already a dictionary, return as-is
            if isinstance(self.weather_snapshot, dict):
                return self.weather_snapshot
            
            # If it's a string, parse it as JSON
            if isinstance(self.weather_snapshot, str):
                try:
                    parsed = json.loads(self.weather_snapshot)
                    logger.debug(f"[CLAIM #{self.id}] Parsed weather_snapshot from JSON string: {parsed}")
                    return parsed
                except json.JSONDecodeError as e:
                    logger.warning(f"[CLAIM #{self.id}] Failed to parse weather_snapshot string: {str(e)}")
                    # Return raw string if JSON parsing fails - better than losing data
                    return self.weather_snapshot
            
            # For any other type, return as-is and log
            logger.debug(f"[CLAIM #{self.id}] weather_snapshot is {type(self.weather_snapshot).__name__}: {self.weather_snapshot}")
            return self.weather_snapshot
            
        except Exception as e:
            logger.error(f"[CLAIM #{self.id}] Unexpected error parsing weather_snapshot: {str(e)}", exc_info=True)
            return None

    def to_dict(self):
        """
        Serialize Claim to dictionary for API responses.
        
        Properly handles weather_snapshot parsing to ensure it's
        returned as a dictionary regardless of database storage format.
        
        Returns:
            dict: Claim data suitable for JSON serialization
        """
        return {
            'id': self.id,
            'worker_id': self.worker_id,
            'policy_id': self.policy_id,
            'disruption_type': self.disruption_type,
            'hours_lost': self.hours_lost,
            'payout_amount': self.payout_amount,
            'status': self.status,
            'fraud_score': self.fraud_score,
            'fraud_explanation': self.fraud_explanation,  # ← Fraud score explanation
            'claim_hash': self.claim_hash,
            'weather_snapshot': self._parse_weather_snapshot(),  # ← Uses safe parser
            'created_at': self.created_at.isoformat()
        }