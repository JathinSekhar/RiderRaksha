# RiderRaksha
### Real-Time Income Protection for Gig Workers

Guidewire DEVTrails 2026 — University Hackathon Submission

When rain, heat, or a curfew stops a delivery partner from working, RiderRaksha detects it automatically and pays their lost income to UPI within minutes. No claim form. No waiting.

---

## The Problem

India has over 8 million food delivery partners on Zomato and Swiggy. They earn only when they ride. A single disruption day costs Rs 800 to Rs 1,400 in lost wages. No insurance product in India covers this gap.

**Coverage:** Income loss only. Not health, accidents, or vehicle repairs.

---

## Persona

**Rahul, 26** — Swiggy partner, Hyderabad. 8 hrs/day. Rs 950/day average. Paid per delivery. One bad week wipes out his rent.

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

## Weekly Pricing

| Tier     | Premium  | Coverage Cap |
| -------- | -------- | ------------ |
| Basic    | Rs 29/wk | Rs 1,000     |
| Standard | Rs 59/wk | Rs 2,500     |
| Pro      | Rs 99/wk | Rs 5,000     |

Premium adjusts dynamically based on zone risk, weather forecast, and claim history. Every factor is shown to the worker before purchase.

**Payout formula:** `Hours Lost x Verified Hourly Rate x 80%`

The hourly rate is declared at onboarding, confirmed by the worker, and locked in for the policy period.

---

## Triggers

| Event            | Source      | Threshold              |
| ---------------- | ----------- | ---------------------- |
| Heavy Rain       | Weather API | Above 60mm/hr          |
| Extreme Heat     | Weather API | Above 43 degrees C     |
| Severe Pollution | AQI API     | AQI above 350          |
| Flood Alert      | Civic Feed  | Warning issued         |
| Curfew / Strike  | Civic Feed  | Zone closed above 2hrs |

Claims fire on the zone-level event, not on individual inactivity. Workers who push through are not penalised.

---

## Business Model

Platform keeps 12 to 15 percent of each premium.

```
10,000 workers x Rs 59/wk x 52 weeks = Rs 3 crore premium volume
13% margin = Rs 40 lakh revenue per city per year
```

Future: B2B embedding with Zomato and Swiggy, white-label to insurers.

---

## Adversarial Defense

A coordinated ring of 500 GPS-spoofers can fake disruption zone locations and drain the payout pool. We detect them using behavioural signals, not just GPS.

**Real workers show:** weeks of zone history, progressive movement slowdown, active orders before the event, and outdoor connectivity patterns.

**Spoofers show:** perfect GPS stability, no zone history, zero orders before the claim, and residential WiFi.

**At ring level we detect:** a timing spike where 500 claims file within 5 minutes instead of spreading over 2 hours, identical device fingerprints across hundreds of claims, and network origin clustering from the same ISP block.

**Graduated response — no claim is binary-rejected:**

| Score      | Action                                        |
| ---------- | --------------------------------------------- |
| Below 0.3  | Auto-approve. Instant payout.                 |
| 0.3 to 0.6 | Silent hold. Paid in 2 hours.                 |
| 0.6 to 0.8 | Human review within 4 hours. Worker can appeal.|
| Above 0.8  | Blocked. Reason given. 48-hour appeal window. |

Honest workers in the same zone as a fraud ring are never affected.

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
- **Backend:** Java Spring Boot, Spring Security, MySQL
- **ML:** Python, FastAPI, XGBoost, scikit-learn, Prophet
- **APIs:** OpenWeatherMap, CPCB, OpenAQ, Mock Civic Feed
- **Payments:** Razorpay sandbox
- **Infra:** Docker, Vercel, Railway

---

## Development Plan

**Phase 1 — Mar 4 to 20**
- [x] Persona, scenarios, premium model, trigger design
- [x] React prototype — all screens complete
- [ ] GitHub setup and 2-minute strategy video

**Phase 2 — Mar 21 to Apr 4**
- [ ] Spring Boot backend, MySQL, auth, policy APIs
- [ ] 5 live triggers, auto claim engine, Razorpay payouts
- [ ] Frontend connected to backend

**Phase 3 — Apr 5 to 17**
- [ ] ML models, worker and admin dashboards
- [ ] Full demo, pitch deck, walkthrough video

---

## Team

| Name                          | Role                          |
| ----------------------------- | ----------------------------- |
| Jathin Sekhar Nerella         | Team Lead — Full Stack        |
| Naga Venkata Balaji Nimmalapudi | Backend — APIs and Database |
| Reshma Paavani Manchem        | AI / ML                       |
| Dhana Laxmi Andhavarapu       | UI / UX                       |

Institution: KL University — Guidewire DEVTrails 2026
