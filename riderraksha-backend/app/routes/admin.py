from flask import Blueprint, jsonify
import logging
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.policy import Policy
from app.models.claim import Claim

# Set up logging
logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """
    GET /api/admin/analytics
    
    Returns comprehensive analytics dashboard with flattened structure:
    - Operational metrics (policies, claims, statuses)
    - Financial metrics (premiums, payouts, loss ratio with risk label)
    - Fraud analysis (average fraud score, high-risk claims)
    - Trigger insights (top disruption type and count)
    - Weekly forecast with method description
    
    Loss Ratio Risk Levels:
    - Healthy: < 0.75
    - Moderate Risk: 0.75 - 0.99
    - High Risk: >= 1.0
    
    Response (flat JSON):
    {
        "total_policies": int,
        "total_claims": int,
        "approved_claims": int,
        "under_review": int,
        "total_premium": float,
        "total_payout": float,
        "loss_ratio": float,
        "loss_ratio_risk": str,
        "avg_fraud_score": float,
        "high_risk_claims": int,
        "approval_rate": float,
        "top_trigger": str,
        "top_trigger_count": int,
        "weekly_forecast": float,
        "forecast_method": "7-day rolling average"
    }
    """
    try:
        # ========== OPERATIONAL METRICS ==========
        # 1. Count total policies
        total_policies = Policy.query.count()
        logger.debug(f"Total policies: {total_policies}")
        
        # 2. Count total claims
        total_claims = Claim.query.count()
        logger.debug(f"Total claims: {total_claims}")
        
        # 3. Count approved claims
        approved_claims = Claim.query.filter_by(status='APPROVED').count()
        logger.debug(f"Approved claims: {approved_claims}")
        
        # 4. Count under review claims
        under_review = Claim.query.filter_by(status='UNDER_REVIEW').count()
        logger.debug(f"Under review claims: {under_review}")
        
        # ========== FINANCIAL METRICS ==========
        # 5. Sum all policy premiums
        total_premium_result = db.session.query(func.sum(Policy.premium)).scalar()
        total_premium = float(total_premium_result) if total_premium_result else 0.0
        logger.debug(f"Total premium: {total_premium}")
        
        # 6. Sum approved claim payouts
        approved_payouts = db.session.query(
            func.sum(Claim.payout_amount)
        ).filter_by(status='APPROVED').scalar()
        total_payout = float(approved_payouts) if approved_payouts else 0.0
        logger.debug(f"Total payout (approved): {total_payout}")
        
        # 7. Calculate loss ratio and risk label
        loss_ratio = 0.0
        loss_ratio_risk = "Healthy"
        if total_premium > 0:
            loss_ratio = round(total_payout / total_premium, 2)
            # Determine risk level
            if loss_ratio < 0.75:
                loss_ratio_risk = "Healthy"
            elif loss_ratio < 1.0:
                loss_ratio_risk = "Moderate Risk"
            else:
                loss_ratio_risk = "High Risk"
        logger.debug(f"Loss ratio: {loss_ratio} ({loss_ratio_risk})")
        
        # ========== FRAUD METRICS ==========
        # 8. Average fraud score across all claims
        avg_fraud_score_result = db.session.query(func.avg(Claim.fraud_score)).scalar()
        avg_fraud_score = round(float(avg_fraud_score_result), 2) if avg_fraud_score_result else 0.0
        logger.debug(f"Average fraud score: {avg_fraud_score}")
        
        # 9. Count high-risk claims (fraud_score > 0.55)
        high_risk_claims = Claim.query.filter(Claim.fraud_score > 0.55).count()
        logger.debug(f"High-risk claims: {high_risk_claims}")
        
        # 10. Calculate approval rate (approved_claims / total_claims)
        approval_rate = 0.0
        if total_claims > 0:
            approval_rate = round(approved_claims / total_claims, 2)
        logger.debug(f"Approval rate: {approval_rate}")
        
        # ========== TRIGGER INSIGHTS ==========
        # 11. Top trigger (most frequent disruption_type) with count
        top_trigger_result = db.session.query(
            Claim.disruption_type,
            func.count(Claim.id).label('count')
        ).group_by(Claim.disruption_type).order_by(func.count(Claim.id).desc()).first()
        
        top_trigger = None
        top_trigger_count = 0
        if top_trigger_result:
            top_trigger = top_trigger_result[0]
            top_trigger_count = top_trigger_result[1]
        logger.debug(f"Top trigger: {top_trigger} ({top_trigger_count} occurrences)")
        
        # ========== FORECAST ==========
        # 12. Weekly forecast (last 7 days average payout * 7)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        last_7_days_payout = db.session.query(
            func.sum(Claim.payout_amount)
        ).filter(
            Claim.created_at >= seven_days_ago,
            Claim.status == 'APPROVED'
        ).scalar()
        
        last_7_days_total = float(last_7_days_payout) if last_7_days_payout else 0.0
        last_7_days_avg = last_7_days_total / 7.0
        weekly_forecast = round(last_7_days_avg * 7, 2)
        logger.debug(f"Weekly forecast: {weekly_forecast} (based on last 7 days avg)")
        
        # ========== BUILD FLAT RESPONSE ==========
        response = {
            # Operational Metrics
            "total_policies": total_policies,
            "total_claims": total_claims,
            "approved_claims": approved_claims,
            "under_review": under_review,
            
            # Financial Metrics
            "total_premium": round(total_premium, 2),
            "total_payout": round(total_payout, 2),
            "loss_ratio": loss_ratio,
            "loss_ratio_risk": loss_ratio_risk,
            
            # Fraud Metrics
            "avg_fraud_score": avg_fraud_score,
            "high_risk_claims": high_risk_claims,
            "approval_rate": approval_rate,
            
            # Trigger Insights
            "top_trigger": top_trigger,
            "top_trigger_count": top_trigger_count,
            
            # Forecast
            "weekly_forecast": weekly_forecast,
            "forecast_method": "7-day rolling average"
        }
        
        logger.info(f"Analytics dashboard generated successfully - Loss Ratio: {loss_ratio} ({loss_ratio_risk})")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}", exc_info=True)
        return jsonify({"error": "Error generating analytics", "details": str(e)}), 500


@admin_bp.route('/alerts', methods=['GET'])
def get_alerts():
    """
    Generate live alerts from recent claims.
    
    Analyzes recent claims and generates alerts for:
    - HIGH FRAUD: Claims with fraud_score > 0.7
    - WEATHER TRIGGERS: Claims caused by RAIN disruptions
    
    Returns top 10 alerts sorted by severity.
    
    Returns:
        JSON object with alerts list containing:
        - type: Alert category (FRAUD, WEATHER)
        - message: Human-readable alert message
        - score: Fraud score (for FRAUD alerts)
    """
    try:
        claims = Claim.query.order_by(Claim.created_at.desc()).limit(50).all()
        print(f"[ADMIN] Analyzing {len(claims)} claims for alerts")
        logger.info(f"[ADMIN ALERTS] Analyzing {len(claims)} recent claims for alerts")
        
        alerts = []
        
        for c in claims:
            # Fraud Alert - High fraud detected
            if c.fraud_score and c.fraud_score > 0.7:
                fraud_alert = {
                    "type": "FRAUD",
                    "message": f"High fraud detected (Claim #{c.id})",
                    "score": round(c.fraud_score, 2),
                    "claim_id": c.id,
                    "severity": "HIGH"
                }
                alerts.append(fraud_alert)
                logger.warning(f"[FRAUD ALERT] Claim #{c.id} - fraud_score: {c.fraud_score}")
            
            # Weather Trigger Alert - Rain-based claims
            if c.disruption_type == "RAIN":
                weather_alert = {
                    "type": "WEATHER",
                    "message": f"Rain disruption triggered claim #{c.id}",
                    "claim_id": c.id,
                    "disruption_type": c.disruption_type,
                    "severity": "MEDIUM"
                }
                alerts.append(weather_alert)
                logger.info(f"[WEATHER ALERT] Claim #{c.id} - Rain disruption")
        
        # Sort by type and limit to 10 most recent
        alerts_limited = alerts[:10]
        logger.info(f"[ADMIN ALERTS] Generated {len(alerts_limited)} alerts from {len(claims)} claims")
        
        return jsonify({
            "alerts": alerts_limited,
            "total_alerts": len(alerts),
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"[ADMIN ALERTS ERROR] Failed to generate alerts: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Failed to generate alerts",
            "details": str(e)
        }), 500
