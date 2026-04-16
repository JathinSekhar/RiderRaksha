# 🧪 TEST MODE GUIDE - RiderRaksha Weather Trigger System

## Quick Start

### ✅ ENABLE TEST MODE (Development)
Edit `app/services/trigger_engine.py` line 21:
```python
TEST_MODE = True  # ← Set to True for testing
```

### ❌ DISABLE TEST MODE (Production)
Edit `app/services/trigger_engine.py` line 21:
```python
TEST_MODE = False  # ← Set to False for production (real weather)
```

---

## 🔄 Complete Flow Explained

### When TEST_MODE = True:
```
1. POST /api/triggers/check
   ↓
2. Fetch weather from OpenWeatherMap API
   ↓
3. TEST_MODE OVERRIDE: Set rain = 80 mm/hr (triggers at > 60)
   ↓
4. TRIGGER FIRES for RAIN event
   ↓
5. Find all workers in zone
   ↓
6. For each worker with ACTIVE policy:
   → Create DisruptionEvent in DB
   → Call create_claim() with weather data
   → Save Claim with weather_snapshot (JSON)
   ↓
7. Return response with test_mode_active: true
```

---

## 📊 API Endpoint Examples

### Request:
```bash
POST /api/triggers/check
Content-Type: application/json

{
  "city": "Hyderabad",
  "zone": "Zone-1"
}
```

### Response (TEST_MODE = True):
```json
{
  "city": "Hyderabad",
  "zone": "Zone-1",
  "status": "SUCCESS",
  "triggers_fired": 5,
  "test_mode_active": true,
  "weather": {
    "rain": 80,
    "temp": 45,
    "humidity": 75,
    "weather_type": "Rainy"
  },
  "details": [
    {
      "event_type": "RAIN",
      "reading": 80,
      "threshold": 60,
      "unit": "mm/hr",
      "hours_affected": 4.0,
      "zone": "Zone-1"
    },
    {
      "event_type": "HEAT",
      "reading": 45,
      "threshold": 43,
      "unit": "degrees C",
      "hours_affected": 3.0,
      "zone": "Zone-1"
    }
    // ... more triggers
  ],
  "last_check": "2026-04-12T10:30:45.123456"
}
```

---

## 💾 Database - Claims Created

### Check created claims:
```bash
GET /api/claims/my
Authorization: Bearer <jwt_token>
```

### Response:
```json
[
  {
    "id": 42,
    "worker_id": 5,
    "policy_id": 12,
    "disruption_type": "RAIN",
    "hours_lost": 4.0,
    "payout_amount": 2400,
    "status": "APPROVED",
    "fraud_score": 0.2,
    "weather_snapshot": {
      "rain": 80,
      "temp": 45,
      "humidity": 75,
      "weather_type": "Rainy",
      "source": "OpenWeatherMap"
    },
    "created_at": "2026-04-12T10:30:45.123456"
  }
]
```

---

## 🔍 Console Logs (DEBUG Mode)

When you run the trigger, you'll see logs like:

```
================================================================================
[TRIGGER CHECK] Starting weather check for city=Hyderabad, zone=Zone-1
================================================================================
[WEATHER API] Raw weather response: {'rain': 2, 'temp': 28, 'humidity': 65, ...}
⚠️  TEST_MODE ENABLED - Simulating weather conditions
[TEST MODE] Overridden weather values: {'rain': 80, 'temp': 45, ...}

🔥 [TRIGGER FIRED] RAIN: 80 >= 60
[DB] Disruption event saved for RAIN
[WORKERS] Found 3 workers in zone Zone-1
[CLAIM CREATE] Creating claim for John Doe
[CLAIM CREATE] Starting claim creation for worker: John Doe (ID: 5)
[PAYOUT] Calculated payout: ₹2400
[STATUS] Claim status determined: APPROVED (fraud_score: 0.2)
[WEATHER] Stored weather snapshot: {'rain': 80, 'temp': 45, ...}
✅ [CLAIM SAVED] Claim #42 successfully saved for John Doe
✅ [PAYOUT] UPI Payout initiated | Ref: PAY-2026-000042

[SUMMARY] Triggers fired: 5, Test mode: True
================================================================================
```

---

## 🛠️ Troubleshooting

### Issue: triggers_fired = 0
**Solution:** Check logs for:
- "No active policy for worker" → Worker needs ACTIVE policy
- "Found 0 workers" → No workers in that zone
- Check THRESHOLDS dictionary - key names must match weather keys

### Issue: weather_snapshot is null
**Solution:**
- Verify `get_weather()` returns dict with keys: rain, temp, humidity, weather
- Check Claim model has `weather_snapshot = db.Column(db.JSON, nullable=True)`
- Ensure weather dict is passed to `create_claim()`

### Issue: Claims not created
**Solution:** 
- Verify `TEST_MODE = True` in trigger_engine.py
- Check that workers exist in zone with ACTIVE policies
- Review logs for "Creating claim for worker X"
- Manually check DB with: `SELECT * FROM claims WHERE created_at > NOW() - INTERVAL 5 MINUTE;`

### Issue: Duplicate claims not prevented
**Solution:**
- Check claim_hash in DB is unique
- Time window is 6 hours (same worker/event = skip)
- View logs for "[DUPLICATE]" messages

---

## 📝 Code Files Modified

| File | Changes |
|------|---------|
| `app/services/weather_service.py` | Added logging, normalized keys (rain, temp, aqi, flood, etc) |
| `app/services/trigger_engine.py` | TEST_MODE toggle, weather override, logging, claim creation |
| `app/services/claim_service.py` | Enhanced logging, duplicate prevention (6-hour window) |
| `app/models/claim.py` | Added `weather_snapshot` field, updated `to_dict()` |
| `app/routes/claims.py` | Added logging for debugging |
| `app/routes/triggers.py` | Trigger endpoint (unchanged) |

---

## 🚀 Production Checklist

Before going to production:

- [ ] Set `TEST_MODE = False` in trigger_engine.py
- [ ] Verify OpenWeatherMap API key is set: `OPENWEATHER_API_KEY=your_key`
- [ ] Test with real weather data (rain < 60 mm/hr)
- [ ] Monitor logs for any errors
- [ ] Run claims verification: `SELECT COUNT(*) FROM claims WHERE created_at > NOW() - INTERVAL 1 DAY;`
- [ ] Check payout processing is working

---

## 📞 Support

For issues or questions, check:
1. Console logs (look for [ERROR] or [CRITICAL ERROR])
2. Database logs (check claim_hash uniqueness)
3. Verify workers table has entries with active policies
4. Ensure zone/city values match between request and DB
