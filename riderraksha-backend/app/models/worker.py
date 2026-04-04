from app import db
from datetime import datetime

class Worker(db.Model):
    __tablename__ = 'workers'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    platform = db.Column(db.String(10), nullable=False)  # ZOMATO or SWIGGY
    city = db.Column(db.String(50), nullable=False)
    zone = db.Column(db.String(50), nullable=False)
    hourly_rate = db.Column(db.Float, nullable=False)
    role = db.Column(db.String(20), default="user")  # 👈 ADD THIS
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    policies = db.relationship('Policy', backref='worker', lazy=True)
    claims = db.relationship('Claim', backref='worker', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'phone': self.phone,
            'platform': self.platform,
            'city': self.city,
            'zone': self.zone,
            'hourly_rate': self.hourly_rate,
            'role': self.role
        }