import random
import logging
from app import db
from app.models.disruption import DisruptionEvent
from app.models.policy import Policy
from app.models.worker import Worker
from app.services.claim_service import create_claim
from datetime import datetime

# Set up logging to track API failures
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

THRESHOLDS = {
    'RAIN':   {'value': 60,  'unit': 'mm/hr',      'hours': 4.0},
    'HEAT':   {'value': 43,  'unit': 'degrees C',   'hours': 3.0},
    'AQI':    {'value': 350, 'unit': 'AQI index',   'hours': 5.0},
    'FLOOD':  {'value': 1,   'unit': 'alert issued', 'hours': 6.0},
    'CURFEW': {'value': 1,   'unit': 'zone closed',  'hours': 5.0},
}

def fetch_mock_weather(city):
    """
    Simulates a real API call. In Phase 3, this will use 'requests.get()'.
    We wrap this in a try-except to handle network timeouts or bad responses.
    """
    try:
        # Simulate a potential network error (1 in 10 chance)
        if random.random() < 0.1:
            raise Exception("API Connection Timeout")

        return {
            'RAIN':   random.uniform(40, 90),
            'HEAT':   random.uniform(38, 47),
            'AQI':    random.uniform(200, 420),
            'FLOOD':  random.choice([0, 1]),
            'CURFEW': random.choice([0, 1]),
        }
    except Exception as e:
        logger.error(f"Failed to fetch weather for {city}: {str(e)}")
        # Return None to indicate the data is currently unavailable
        return None

def check_and_fire_triggers(city, zone):
    readings = fetch_mock_weather(city)
    
    # ── EXCEPTION HANDLING FALLBACK ────────────────────────────────
    if readings is None:
        return {
            'city': city,
            'zone': zone,
            'status': 'ERROR',
            'message': 'Environmental data source currently unavailable. Retrying in 5 mins.'
        }
    # ───────────────────────────────────────────────────────────────

    fired_triggers = []

    for event_type, threshold in THRESHOLDS.items():
        try:
            reading = readings.get(event_type)
            if reading is not None and reading >= threshold['value']:
                
                # Save disruption event
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

                # Find all active workers and fire claims
                workers = Worker.query.filter_by(zone=zone, city=city).all()
                for worker in workers:
                    active_policy = Policy.query.filter_by(
                        worker_id=worker.id, status='ACTIVE'
                    ).first()
                    if active_policy:
                        # Idempotency in create_claim will handle duplicates here
                        create_claim(worker, active_policy, event)

                fired_triggers.append({
                    'event_type': event_type,
                    'reading': reading,
                    'threshold': threshold['value'],
                    'hours_affected': threshold['hours'],
                    'zone': zone
                })
        except Exception as e:
            logger.error(f"Error processing {event_type} trigger for {zone}: {str(e)}")
            db.session.rollback() # Ensure DB stays clean on error

    return {
        'city': city,
        'zone': zone,
        'triggers_fired': len(fired_triggers),
        'details': fired_triggers,
        'status': 'SUCCESS',
        'last_check': datetime.utcnow().isoformat()
    }