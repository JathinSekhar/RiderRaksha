import logging
from app import db
from app.models.disruption import DisruptionEvent
from app.models.policy import Policy
from app.models.worker import Worker
from app.services.claim_service import create_claim
from app.services.weather_service import get_weather
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ╔════════════════════════════════════════════════════════════════════════════╗
# ║ TEST MODE CONFIGURATION                                                    ║
# ║ Set to True to simulate weather conditions and test triggers + claims      ║
# ║ Set to False for production (real OpenWeatherMap data)                    ║
# ╚════════════════════════════════════════════════════════════════════════════╝
TEST_MODE = True  # ← TOGGLE THIS: True = Test, False = Production
# ════════════════════════════════════════════════════════════════════════════

THRESHOLDS = {
    'RAIN':   {'value': 60,  'unit': 'mm/hr',          'hours': 4.0},
    'HEAT':   {'value': 43,  'unit': 'degrees C',      'hours': 3.0},
    'AQI':    {'value': 350, 'unit': 'AQI index',      'hours': 5.0},
    'FLOOD':  {'value': 1,   'unit': 'alert issued',   'hours': 6.0},
    'CURFEW': {'value': 1,   'unit': 'zone closed',    'hours': 5.0},
}

def check_rain_trigger(worker):
    """
    Check if heavy rain trigger conditions are met for a worker.
    
    In TEST_MODE: Simulates rain at 80 mm/hr for testing.
    In PRODUCTION: Uses real OpenWeatherMap API data.
    
    Returns:
        dict: {
            "triggered": bool,
            "reason": str,
            "weather": {"rain": float, "temp": float},
            "test_mode_active": bool
        }
    """
    try:
        weather = get_weather(worker.city)
        logger.debug(f"[API RESPONSE] Raw weather data for {worker.city}: {weather}")
        
        # ── TEST MODE: OVERRIDE WITH SIMULATED DATA ────────────────────────────
        if TEST_MODE:
            logger.warning(f"⚠️  TEST_MODE ENABLED - Simulating rain conditions for {worker.city}")
            weather["rain"] = 80  # Simulate heavy rain
            logger.debug(f"[TEST MODE] Overridden rain value to: {weather['rain']} mm/hr")
        # ───────────────────────────────────────────────────────────────────────

        rain_value = weather.get("rain", 0)
        temp_value = weather.get("temp", 0)
        
        triggered = rain_value > 60
        
        response = {
            "triggered": triggered,
            "reason": f"Heavy rain detected: {rain_value} mm/hr" if triggered else f"No heavy rain: {rain_value} mm/hr",
            "weather": {
                "rain": rain_value,
                "temp": temp_value
            },
            "test_mode_active": TEST_MODE
        }
        
        logger.info(f"[RAIN TRIGGER] Worker: {worker.full_name}, City: {worker.city}, Triggered: {triggered}, Rain: {rain_value} mm/hr, Test Mode: {TEST_MODE}")
        return response
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to check rain trigger for {worker.city}: {str(e)}", exc_info=True)
        return {
            "triggered": False,
            "reason": "Error fetching weather data",
            "weather": {"rain": 0, "temp": 0},
            "test_mode_active": TEST_MODE
        }

def check_and_fire_triggers(city, zone):
    """
    Check all weather thresholds and fire claims if conditions are met.
    
    In TEST_MODE: Simulates weather conditions for testing (RAIN=80, HEAT=45, etc.)
    In PRODUCTION: Uses real OpenWeatherMap API data.
    
    Args:
        city (str): City name
        zone (str): Zone/area identifier
        
    Returns:
        dict: Trigger check result with:
            - city, zone, status
            - triggers_fired: count of fired triggers
            - details: list of fired trigger details
            - weather: actual weather data used
            - test_mode_active: boolean
    """
    try:
        logger.info(f"\n{'='*80}")
        logger.info(f"[TRIGGER CHECK] Starting weather check for city={city}, zone={zone}")
        logger.info(f"{'='*80}")
        
        weather = get_weather(city)
        logger.debug(f"[WEATHER API] Raw weather response: {weather}")
        
        # ── EXCEPTION HANDLING: API FAILURE ────────────────────────────────────
        if weather is None:
            logger.error(f"[ERROR] Weather API returned None for {city}")
            return {
                'city': city,
                'zone': zone,
                'status': 'ERROR',
                'message': 'Environmental data source currently unavailable. Retrying in 5 mins.',
                'test_mode_active': TEST_MODE
            }
        # ──────────────────────────────────────────────────────────────────────

        # ── TEST MODE: OVERRIDE WITH SIMULATED DATA ───────────────────────────
        if TEST_MODE:
            logger.warning(f"\n⚠️  TEST_MODE ENABLED - Simulating weather conditions")
            weather.update({
                "rain": 80,      # Heavy rain (threshold: 60)
                "temp": 45,      # Extreme heat (threshold: 43)
                "aqi": 380,      # Poor air quality (threshold: 350)
                "flood": 1,      # Flood alert (threshold: 1)
                "curfew": 1      # Curfew zone (threshold: 1)
            })
            logger.warning(f"[TEST MODE] Overridden weather values: {weather}\n")
        # ──────────────────────────────────────────────────────────────────────

        fired_triggers = []
        weather_snapshot = weather.copy()  # Keep copy for response

        # Check each weather threshold
        for event_type, threshold in THRESHOLDS.items():
            try:
                reading = weather.get(event_type.lower(), 0)  # Convert to lowercase for key lookup
                threshold_value = threshold['value']
                
                logger.debug(f"[CHECK] {event_type}: {reading} vs threshold {threshold_value}")
                
                if reading >= threshold_value:
                    logger.warning(f"\n🔥 [TRIGGER FIRED] {event_type}: {reading} >= {threshold_value}")
                    
                    # Create disruption event in DB
                    event = DisruptionEvent(
                        event_type=event_type,
                        zone=zone,
                        city=city,
                        severity='HIGH',
                        hours_affected=threshold['hours'],
                        triggered_at=datetime.utcnow(),
                        is_active=True
                    )
                    db.session.add(event)
                    db.session.commit()
                    logger.info(f"[DB] Disruption event saved for {event_type}")

                    # Find all active workers in this zone and fire claims
                    workers = Worker.query.filter_by(zone=zone, city=city).all()
                    logger.info(f"[WORKERS] Found {len(workers)} workers in zone {zone}")
                    
                    for worker in workers:
                        logger.debug(f"[CLAIM CHECK] Checking active policy for worker: {worker.full_name}")
                        active_policy = Policy.query.filter_by(
                            worker_id=worker.id, 
                            status='ACTIVE'
                        ).first()
                        
                        if active_policy:
                            logger.info(f"[CLAIM CREATE] Creating claim for {worker.full_name}")
                            claim = create_claim(worker, active_policy, event, weather)
                            if claim:
                                logger.info(f"✅ [CLAIM CREATED] Claim #{claim.id} for {worker.full_name}")
                        else:
                            logger.debug(f"[NO POLICY] No active policy for worker {worker.full_name}")

                    fired_triggers.append({
                        'event_type': event_type,
                        'reading': reading,
                        'threshold': threshold_value,
                        'unit': threshold['unit'],
                        'hours_affected': threshold['hours'],
                        'zone': zone
                    })
                else:
                    logger.debug(f"[NO FIRE] {event_type}: {reading} < {threshold_value} (no trigger)")
                    
            except Exception as e:
                logger.error(f"[ERROR] Error processing {event_type} trigger: {str(e)}", exc_info=True)
                db.session.rollback()

        # Build response
        response = {
            'city': city,
            'zone': zone,
            'status': 'SUCCESS',
            'triggers_fired': len(fired_triggers),
            'details': fired_triggers,
            'weather': {
                'rain': weather.get('rain', 0),
                'temp': weather.get('temp', 0),
                'humidity': weather.get('humidity', 0),
                'weather_type': weather.get('weather', 'Unknown')
            },
            'test_mode_active': TEST_MODE,
            'last_check': datetime.utcnow().isoformat()
        }
        
        logger.info(f"[SUMMARY] Triggers fired: {len(fired_triggers)}, Test mode: {TEST_MODE}")
        logger.info(f"{'='*80}\n")
        
        return response
        
    except Exception as e:
        logger.error(f"[CRITICAL ERROR] Unexpected error in check_and_fire_triggers: {str(e)}", exc_info=True)
        db.session.rollback()
        return {
            'city': city,
            'zone': zone,
            'status': 'ERROR',
            'message': f'Unexpected error: {str(e)}',
            'test_mode_active': TEST_MODE
        }