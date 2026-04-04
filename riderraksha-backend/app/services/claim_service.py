import hashlib
from app import db
from app.models.claim import Claim
from datetime import datetime

def calculate_payout(hourly_rate, hours_lost, coverage_cap):
    raw_payout = hours_lost * hourly_rate * 0.8
    return round(min(raw_payout, coverage_cap), 2)

def calculate_fraud_score(worker, policy, payout_amount):
    score = 0.0
    days_old = (datetime.utcnow() - worker.created_at).days
    if days_old < 7:
        score += 0.2
    elif days_old < 30:
        score += 0.1

    today_claims = Claim.query.filter_by(worker_id=worker.id).count()
    if today_claims >= 5:
        score += 0.4
    elif today_claims >= 3:
        score += 0.35

    if policy.coverage_cap and payout_amount > policy.coverage_cap * 0.9:
        score += 0.15

    return round(min(score, 1.0), 2)

def create_claim(worker, policy, disruption_event):
    # ── IDEMPOTENCY CHECK ──────────────────────────────────────────
    # Generate a unique key: WorkerID + EventType + Date (YYYY-MM-DD)
    event_date = disruption_event.triggered_at.strftime('%Y-%m-%d')
    hash_payload = f"{worker.id}-{disruption_event.event_type}-{event_date}"
    unique_hash = hashlib.sha256(hash_payload.encode()).hexdigest()

    # If this specific claim already exists in the DB, skip creation
    existing = Claim.query.filter_by(claim_hash=unique_hash).first()
    if existing:
        print(f"[IDEMPOTENCY] Skipping duplicate claim for {worker.full_name} ({disruption_event.event_type})")
        return None
    # ───────────────────────────────────────────────────────────────

    payout = calculate_payout(
        worker.hourly_rate,
        disruption_event.hours_affected,
        policy.coverage_cap
    )
    fraud_score = calculate_fraud_score(worker, policy, payout)

    if fraud_score < 0.3:
        status = 'APPROVED'
    elif fraud_score < 0.55:
        status = 'PENDING'
    else:
        status = 'UNDER_REVIEW'

    claim = Claim(
        worker_id=worker.id,
        policy_id=policy.id,
        disruption_type=disruption_event.event_type,
        hours_lost=disruption_event.hours_affected,
        payout_amount=payout,
        status=status,
        fraud_score=fraud_score,
        claim_hash=unique_hash # Save the hash to the DB
    )

    db.session.add(claim)
    db.session.commit()

    if status == 'APPROVED':
        from app.services.payout_service import simulate_upi_payout
        result = simulate_upi_payout(worker, payout)
        print(f"[PAYOUT ✅] {result['message']} | Ref: {result['ref_id']}")

    return claim