from flask import Blueprint, jsonify
import logging
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.claim import Claim
from app.models.worker import Worker

# Set up logging
logger = logging.getLogger(__name__)

predict_bp = Blueprint('predict', __name__)


@predict_bp.route('/risk', methods=['GET'])
def predict_risk():
    """
    GET /api/predict/risk
    
    Predicts risk metrics based on historical claims data with trend analysis.
    
    Analyzes the last 50 claims to calculate:
    - Average claims per day
    - Average fraud score (current and trend)
    - High-risk claim count
    - Zone distribution and dominance
    - Top risk zone with percentage
    
    Uses predictive formulas:
    - predicted_claims = avg_claims_per_day * 1.2 (20% growth factor)
    - predicted_fraud_score = avg_fraud_score * 1.1 (10% growth factor)
    
    Risk levels:
    - HIGH: fraud_score > 0.5
    - MEDIUM: fraud_score 0.3 - 0.5
    - LOW: fraud_score < 0.3
    
    Insights generated from:
    - Zone dominance analysis (% of claims from top zone)
    - Fraud score trend (comparing recent to historical)
    - Claim volume variance from baseline
    
    Returns:
        JSON object with:
        - predicted_claims: int (forecasted claim count)
        - predicted_fraud_score: float (forecasted avg fraud score)
        - risk_level: str (HIGH/MEDIUM/LOW)
        - top_risk_zone: str (zone with highest claims)
        - confidence: float (0-1 confidence score)
        - insights: list[str] (actionable insights)
        - recommended_action: str (targeted action for admin)
        - supporting_data: dict (detailed analytics)
    """
    try:
        logger.info("[PREDICT] Starting risk prediction analysis")
        
        # ========== FETCH LAST 50 CLAIMS ==========
        claims = Claim.query.order_by(Claim.created_at.desc()).limit(50).all()
        total_claims_analyzed = len(claims)
        
        if total_claims_analyzed == 0:
            logger.warning("[PREDICT] No claims found in database")
            return jsonify({
                "predicted_claims": 0,
                "predicted_fraud_score": 0.0,
                "risk_level": "LOW",
                "top_risk_zone": "N/A",
                "confidence": 0.0,
                "insights": ["Insufficient claim data for analysis"],
                "recommended_action": "System requires historical data to generate predictions",
                "supporting_data": {
                    "claims_analyzed": 0,
                    "high_risk_count": 0,
                    "avg_fraud_score": 0.0,
                    "avg_claims_per_day": 0.0,
                    "zone_distribution": {}
                }
            }), 200
        
        print(f"[PREDICT] Analyzing {total_claims_analyzed} claims for risk assessment")
        logger.info(f"[PREDICT] Retrieved {total_claims_analyzed} claims for analysis")
        
        # ========== CALCULATE METRICS ==========
        
        # 1. Calculate average claims per day
        if total_claims_analyzed > 0:
            oldest_claim = claims[-1]  # Last claim in ordered list (oldest)
            newest_claim = claims[0]   # First claim in ordered list (newest)
            
            date_range = (newest_claim.created_at - oldest_claim.created_at).days
            date_range = max(date_range, 1)  # Avoid division by zero
            
            avg_claims_per_day = total_claims_analyzed / date_range
            logger.debug(f"[PREDICT] Date range: {date_range} days, Avg claims/day: {avg_claims_per_day:.2f}")
        else:
            avg_claims_per_day = 0.0
        
        # 2. Calculate average fraud score and trend
        fraud_scores = [c.fraud_score for c in claims if c.fraud_score is not None]
        avg_fraud_score = sum(fraud_scores) / len(fraud_scores) if fraud_scores else 0.0
        
        # Split fraud scores into recent (first half) vs historical (second half) for trend
        midpoint = len(fraud_scores) // 2
        recent_fraud_scores = fraud_scores[:midpoint] if midpoint > 0 else fraud_scores
        historical_fraud_scores = fraud_scores[midpoint:] if midpoint > 0 else fraud_scores
        
        recent_avg_fraud = sum(recent_fraud_scores) / len(recent_fraud_scores) if recent_fraud_scores else 0.0
        historical_avg_fraud = sum(historical_fraud_scores) / len(historical_fraud_scores) if historical_fraud_scores else 0.0
        fraud_trend = recent_avg_fraud - historical_avg_fraud
        
        logger.debug(f"[PREDICT] Avg fraud score: {avg_fraud_score:.2f}, Trend: {fraud_trend:+.2f}")
        
        # 3. Count high-risk claims (fraud_score > 0.55)
        high_risk_count = sum(1 for c in claims if c.fraud_score and c.fraud_score > 0.55)
        logger.debug(f"[PREDICT] High-risk claims (fraud > 0.55): {high_risk_count}")
        
        # 4. Zone distribution - group by zone and count
        zone_distribution = {}
        worker_ids = set(c.worker_id for c in claims)
        
        workers = Worker.query.filter(Worker.id.in_(worker_ids)).all()
        worker_zones = {w.id: w.zone for w in workers}
        
        for claim in claims:
            zone = worker_zones.get(claim.worker_id, "Unknown")
            zone_distribution[zone] = zone_distribution.get(zone, 0) + 1
        
        logger.debug(f"[PREDICT] Zone distribution: {zone_distribution}")
        
        # ========== PREDICT FUTURE METRICS ==========
        
        # Predicted claims (20% growth factor)
        predicted_claims = round(avg_claims_per_day * 1.2)
        logger.debug(f"[PREDICT] Predicted claims (1.2x): {predicted_claims}")
        
        # Predicted fraud score (10% growth factor)
        predicted_fraud_score = round(avg_fraud_score * 1.1, 2)
        logger.debug(f"[PREDICT] Predicted fraud score (1.1x): {predicted_fraud_score}")
        
        # ========== DETERMINE RISK LEVEL ==========
        
        if predicted_fraud_score > 0.5:
            risk_level = "HIGH"
        elif predicted_fraud_score >= 0.3:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        logger.info(f"[PREDICT] Risk level determined: {risk_level} (fraud: {predicted_fraud_score})")
        
        # ========== TOP RISK ZONE ==========
        
        top_risk_zone = max(zone_distribution.items(), key=lambda x: x[1])[0] if zone_distribution else "N/A"
        top_zone_count = zone_distribution.get(top_risk_zone, 0)
        top_zone_percentage = round((top_zone_count / total_claims_analyzed) * 100, 1) if total_claims_analyzed > 0 else 0
        logger.debug(f"[PREDICT] Top risk zone: {top_risk_zone} ({top_zone_count} claims, {top_zone_percentage}%)")
        
        # ========== CONFIDENCE SCORE ==========
        
        # Higher confidence if we have more claims analyzed
        # Formula: min(claims_analyzed / 50, 1.0) * 0.9 + 0.1
        confidence = min(total_claims_analyzed / 50, 1.0) * 0.9 + 0.1
        confidence = round(confidence, 2)
        logger.debug(f"[PREDICT] Confidence score: {confidence}")
        
        # ========== GENERATE INSIGHTS ==========
        
        insights = []
        
        # Insight 1: Zone dominance
        if top_zone_percentage > 50:
            insights.append(f"{top_risk_zone} accounts for {top_zone_percentage}% of recent claims")
        
        # Insight 2: Fraud trend
        if fraud_trend > 0.05:
            insights.append(f"Fraud score trending upward ({historical_avg_fraud:.2f} → {recent_avg_fraud:.2f})")
        elif fraud_trend < -0.05:
            insights.append(f"Fraud score trending downward ({historical_avg_fraud:.2f} → {recent_avg_fraud:.2f})")
        
        # Insight 3: Claim volume
        baseline_claims = 15  # Assumed baseline
        if avg_claims_per_day > baseline_claims * 1.1:
            insights.append("Claim volume higher than normal baseline")
        elif avg_claims_per_day < baseline_claims * 0.9:
            insights.append("Claim volume lower than normal baseline")
        
        # Insight 4: High-risk presence
        high_risk_percentage = (high_risk_count / total_claims_analyzed * 100) if total_claims_analyzed > 0 else 0
        if high_risk_percentage > 10:
            insights.append(f"{high_risk_percentage:.1f}% of claims classified as high-risk")
        
        if not insights:
            insights.append("System operating within normal parameters")
        
        logger.debug(f"[PREDICT] Generated {len(insights)} insights")
        
        # ========== RECOMMENDED ACTION ==========
        
        if predicted_fraud_score > 0.6:
            recommended_action = f"URGENT: Increase manual verification - Fraud risk elevated. Focus on {top_risk_zone}"
        elif predicted_fraud_score > 0.5:
            recommended_action = f"Increase manual verification for medium-risk claims, especially in {top_risk_zone}"
        elif predicted_claims > 40:
            recommended_action = f"Increase monitoring in {top_risk_zone} and enable manual review for medium-risk claims"
        elif risk_level == "MEDIUM":
            recommended_action = f"Increase monitoring in {top_risk_zone} and watch fraud trends closely"
        else:
            recommended_action = "Continue standard monitoring - System operating normally"
        
        logger.info(f"[PREDICT] Recommended action: {recommended_action}")
        
        # ========== BUILD RESPONSE ==========
        
        response = {
            "predicted_claims": predicted_claims,
            "predicted_fraud_score": predicted_fraud_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "top_risk_zone": top_risk_zone,
            "insights": insights,
            "recommended_action": recommended_action,
            "supporting_data": {
                "avg_claims_per_day": round(avg_claims_per_day, 2),
                "avg_fraud_score": round(avg_fraud_score, 2),
                "claims_analyzed": total_claims_analyzed,
                "high_risk_count": high_risk_count,
                "zone_distribution": zone_distribution
            }
        }
        
        logger.info("[PREDICT] Risk prediction completed successfully")
        print(f"[PREDICT] Risk Assessment: {risk_level} | Fraud: {predicted_fraud_score} | Confidence: {confidence}")
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"[PREDICT ERROR] Failed to generate risk prediction: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Failed to generate risk prediction",
            "details": str(e)
        }), 500
