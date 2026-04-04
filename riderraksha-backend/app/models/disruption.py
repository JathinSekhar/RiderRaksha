from app import db
from datetime import datetime

class DisruptionEvent(db.Model):
    __tablename__ = 'disruption_events'

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # RAIN, HEAT, AQI, FLOOD, CURFEW
    zone = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)    # LOW, MEDIUM, HIGH
    hours_affected = db.Column(db.Float, nullable=False)
    triggered_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'zone': self.zone,
            'city': self.city,
            'severity': self.severity,
            'hours_affected': self.hours_affected,
            'triggered_at': self.triggered_at.isoformat(),
            'is_active': self.is_active
        }