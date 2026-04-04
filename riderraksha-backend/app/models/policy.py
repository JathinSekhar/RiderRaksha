from app import db
from datetime import datetime

class Policy(db.Model):
    __tablename__ = 'policies'

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    tier = db.Column(db.String(20), nullable=False)       # BASIC, STANDARD, PRO
    premium = db.Column(db.Float, nullable=False)
    coverage_cap = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='ACTIVE')   # ACTIVE, EXPIRED
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=False)

    claims = db.relationship('Claim', backref='policy', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'worker_id': self.worker_id,
            'tier': self.tier,
            'premium': self.premium,
            'coverage_cap': self.coverage_cap,
            'status': self.status,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat()
        }