from app import db
from datetime import datetime

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
    # ── NEW FIELD FOR IDEMPOTENCY ──────────────────────────────────
    # This prevents duplicate claims for the same worker/event/day
    claim_hash = db.Column(db.String(64), unique=True, nullable=False) 
    # ───────────────────────────────────────────────────────────────
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'worker_id': self.worker_id,
            'policy_id': self.policy_id,
            'disruption_type': self.disruption_type,
            'hours_lost': self.hours_lost,
            'payout_amount': self.payout_amount,
            'status': self.status,
            'fraud_score': self.fraud_score,
            'created_at': self.created_at.isoformat()
        }