# RiderRaksha
### Real-Time Income Protection for Gig Workers

Guidewire DEVTrails 2026 — University Hackathon Submission

When rain, heat, or a curfew stops a delivery partner from working, RiderRaksha detects it automatically and pays their lost income to UPI within minutes. No claim form. No waiting.

---

## The Problem

India has over 8 million food delivery partners on Zomato and Swiggy. They earn only when they ride. A single disruption day costs Rs 800 to Rs 1,400 in lost wages. No insurance product in India covers this gap.

Studies show gig delivery workers lose 20 to 30 percent of monthly income due to weather and civic disruptions outside their control. Hyderabad averages 14 significant rain disruption days per year. Delhi records more than 22 hazardous AQI days annually.

**Coverage scope:** Income loss only. Not health, life, accidents, or vehicle repairs.

---

## Persona — Rahul

**Rahul, 26** — Swiggy partner, Hyderabad. 8 hrs/day. Rs 950/day average. Verified hourly rate: Rs 119/hr.

Rahul loses Rs 380 on a 4-hour rain disruption. That is 40 percent of his day. Over a monsoon month with 6 disruption days, that is Rs 2,280 in lost income — nearly his rent. He has no savings buffer and no insurance. RiderRaksha closes that gap automatically.

---

## How It Works

```
Register -> Risk Profile (AI) -> Buy Weekly Plan -> System Monitors -> Trigger Detected -> Auto Payout via UPI
```

**Example — Heavy Rain**
```
4 hours lost x Rs 119/hr x 80% = Rs 380 to UPI
```
Rahul never opened the app. The money arrived before the rain stopped.

---

## Adversarial Defense and Anti-Spoofing Strategy

A coordinated ring of 500 GPS-spoofers can fake disruption zone locations and drain the payout pool in minutes. Simple GPS verification is not enough. Here is how RiderRaksha responds.

**Differentiating a real worker from a spoofer**

Real stranded workers show weeks of consistent zone delivery history, progressive movement slowdown before stopping, active platform orders right up until the disruption hit, and intermittent connectivity loss consistent with being outdoors in bad weather.

Spoofers show perfect GPS stability with no natural drift, no delivery history in the zone before the trigger, zero order activity in the two hours before claiming, and device connectivity patterns matching a home broadband connection, not mobile outdoor data.

**Catching a coordinated ring at aggregate level**

Individual spoofers can look plausible in isolation. A ring only becomes visible in patterns across hundreds of claims simultaneously.

| Signal | What a fraud ring looks like |
| ------ | ---------------------------- |
| Timing spike | 500 claims filed within 5 minutes. Genuine workers spread across 2 to 3 hours. |
| Device fingerprints | Hundreds of claims share the same spoofing app version and OS build. |
| Network clustering | 200 claims from the same residential ISP block, impossible across a 10km delivery zone. |
| New account surge | Accounts under 14 days old filing on their first ever disruption event. |
| Income mismatch | Declared Rs 1,400/day but platform history shows Rs 200/day actual activity. |

**Graduated response — no claim is binary-rejected**

| Fraud Score | Action |
| ----------- | ------ |
| Below 0.3   | Auto-approve. Instant UPI payout. Worker never knows a check ran. |
| 0.3 to 0.6  | Silent hold. Paid in 2 hours after data gathering. Worker sees "processing." |
| 0.6 to 0.8  | Human review within 4 hours. Worker notified. Can submit one proof. |
| Above 0.8   | Blocked. Specific reason given. 48-hour appeal window opens automatically. |

Honest workers in the same zone as a fraud ring are never blocked. Only ring-identified accounts are frozen. All other claims in the zone continue processing normally.

---

## Weekly Pricing

| Tier     | Premium  | Coverage Cap |
| -------- | -------- | ------------ |
| Basic    | Rs 29/wk | Rs 1,000     |
| Standard | Rs 59/wk | Rs 2,500     |
| Pro      | Rs 99/wk | Rs 5,000     |

Premium adjusts dynamically based on zone risk, weather forecast, and claim history. Every factor is shown to the worker before purchase.

**Payout formula:** `Hours Lost x Verified Hourly Rate x 80%`

The hourly rate is declared at onboarding, confirmed by the worker, and locked in for the policy period. The insurer cannot change it after a disruption occurs.

---

## Actuarial Analysis

**Disruption frequency assumptions (Hyderabad baseline)**

| Disruption Type  | Avg days/year | Avg hours affected/day |
| ---------------- | ------------- | ---------------------- |
| Heavy Rain       | 14            | 4.2                    |
| Extreme Heat     | 8             | 3.0                    |
| Severe AQI       | 6             | 5.0                    |
| Flood Alert      | 3             | 6.0                    |
| Curfew / Strike  | 4             | 5.0                    |
| **Total**        | **35 days**   | —                      |

**Expected annual payout per Standard tier worker (Rs 59/week)**

```
Annual premium collected:   Rs 59 x 52 weeks = Rs 3,068
Expected disruption days:   35 days/year
Average payout per day:     4 hrs x Rs 119/hr x 80% = Rs 381
Expected annual payout:     35 x Rs 381 = Rs 13,335

Adjusted for not all workers claiming all days:
Claim participation rate:   estimated 40% (workers often push through minor disruptions)
Realistic annual payout:    Rs 13,335 x 40% = Rs 5,334

Loss ratio (Standard tier): Rs 5,334 / Rs 3,068 = 1.74
```

This loss ratio confirms the Standard tier pricing needs actuarial backing from an insurer partner. The platform margin model works as a distribution layer — a licensed general insurer underwrites the claims reserve, and RiderRaksha retains 12 to 15 percent as an intermediary fee.

**Path to sustainable loss ratio**

The loss ratio improves significantly with two levers: dynamic premium adjustment (already in the model — high-risk zones pay more) and the 80 percent replacement cap (prevents full moral hazard). With accurate zone-level pricing and a 60 percent average claim participation rate cap per event, target loss ratio falls to 0.85 to 1.1, which is within industry norms for parametric products.

*These figures are indicative. Full actuarial validation using historical CPCB, IMD, and Zomato disruption data is required before production deployment.*

---

## Coverage Exclusions

**Covered**
- Income loss due to heavy rainfall above 60mm/hr
- Income loss during extreme heat advisories above 43 degrees C
- Income loss during severe AQI events above 350
- Income loss during flood alerts and zone closures
- Income loss during civic curfews and transport strikes above 2 hours

**Excluded — Standard insurance exclusions**
- War, armed conflict, or military operations
- Pandemic or government-declared public health emergency shutdowns
- Government-mandated lockdowns beyond the covered civic trigger types
- Nuclear, biological, or chemical event closures
- Losses arising from the worker's own negligence or policy fraud

**Excluded — Product scope limitations**
- Health or medical expenses
- Accidents or personal injuries
- Vehicle damage or repair costs
- Platform order cancellations unrelated to a covered event
- Income loss when the worker's policy is not active for that week

---

## Triggers

| Event            | Source      | Threshold              |
| ---------------- | ----------- | ---------------------- |
| Heavy Rain       | Weather API | Above 60mm/hr          |
| Extreme Heat     | Weather API | Above 43 degrees C     |
| Severe Pollution | AQI API     | AQI above 350          |
| Flood Alert      | Civic Feed  | Warning issued         |
| Curfew / Strike  | Civic Feed  | Zone closed above 2hrs |

Claims fire on the zone-level event, not on individual inactivity. Workers who push through bad conditions are not penalised.

---

## Business Model

Platform keeps 12 to 15 percent of each premium as an intermediary fee.

```
10,000 workers x Rs 59/wk x 52 weeks = Rs 3 crore premium volume
13% margin = Rs 40 lakh revenue per city per year
```

Future: B2B embedding with Zomato and Swiggy, white-label to insurers.

---

## AI and ML

| Model              | Purpose                          |
| ------------------ | -------------------------------- |
| K-Means            | Risk segmentation at onboarding  |
| XGBoost Regressor  | Dynamic premium calculation      |
| Isolation Forest   | Fraud detection on every claim   |
| Prophet            | Weekly payout forecasting        |

---

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, Recharts
- **Backend:** Python, Flask, SQLAlchemy, MySQL
- **Auth:** JWT (Flask-JWT-Extended)
- **ML:** XGBoost, scikit-learn, Prophet
- **APIs:** OpenWeatherMap, CPCB, OpenAQ, Mock Civic Feed
- **Payments:** Razorpay sandbox
- **Infra:** Docker, Vercel, Railway

---

## Development Plan

**Phase 1 — Mar 4 to 20**
- [x] Persona, scenarios, premium model, trigger design
- [x] React prototype — all screens complete
- [x] GitHub setup and demo video

**Phase 2 — Mar 21 to Apr 4**
- [x] Flask backend, MySQL, JWT auth, policy APIs
- [x] 5 live triggers, auto claim engine, Razorpay payouts
- [x] Frontend connected to backend

**Phase 3 — Apr 5 to 17**
- [ ] ML models, worker and admin dashboards
- [ ] Full demo, pitch deck, walkthrough video

---

## Team

| Name                            | Role                          |
| ------------------------------- | ----------------------------- |
| Jathin Sekhar Nerella           | Team Lead — Full Stack        |
| Naga Venkata Balaji Nimmalapudi | Backend — APIs and Database   |
| Reshma Paavani Manchem          | AI / ML                       |
| Dhana Laxmi Andhavarapu         | UI / UX                       |

Institution: KL University — Guidewire DEVTrails 2026
