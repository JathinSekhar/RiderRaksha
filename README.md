# RiderRaksha

> Real-Time Income Protection for Gig Workers

**Parametric insurance that pays instantly during disruptions**
*Guidewire DEVTrails 2026 — Phase 1 Submission*

---

##  Problem

Gig delivery partners (Zomato, Swiggy) earn only when they ride.
When rain, extreme heat, pollution, or curfews stop them from working, they lose their daily income.

* ₹800–₹1,400 lost per disruption day
* No insurance product covers daily income loss
* Disruptions are increasing due to climate conditions

---

##  Solution

RiderRaksha is a **parametric insurance platform** that:

* Detects disruptions using real-world data (weather, AQI, civic alerts)
* Automatically calculates income loss
* Sends **instant payouts via UPI**
* Requires **no claims, no paperwork**

---

##  Target User

RiderRaksha is built for full-time gig delivery workers.

**Typical user profile:**

* Works 6–10 hours/day
* Earns ₹800–₹1,200 daily
* Depends entirely on daily earnings

**Example:**
Rahul, 26, Hyderabad — loses ₹300–₹500 whenever disruptions hit peak hours.

---

##  How It Works

```
Register → Risk Profile (AI) → Buy Weekly Plan → Monitor Zone → Trigger → Auto Payout → UPI
```

**Payout Example:**

```
4 hrs × ₹119/hr × 80% = ₹380 credited instantly
```

---

##  Pricing

| Plan     | Weekly Premium | Coverage |
| -------- | -------------- | -------- |
| Basic    | ₹29/week       | ₹1,000   |
| Standard | ₹59/week       | ₹2,500   |
| Pro      | ₹99/week       | ₹5,000   |

**Dynamic pricing based on:**

* Zone risk
* Weather forecast
* Claim history

---

##  AI System Design

### 1. Risk Profiling — K-Means Clustering

**Features:**

* Zone disruption frequency
* Weather volatility
* AQI levels
* Worker active hours

**Output:** Risk segment (Low / Medium / High / Very High)

---

### 2. Dynamic Pricing — XGBoost Regressor

**Inputs:**

* Worker income
* Risk segment
* 7-day weather forecast
* Zone claim frequency
* Time-of-day exposure

**Output:** Weekly premium adjustment

**Constraints:** ₹29 ≤ Premium ≤ ₹500

---

### 3. Fraud Detection — Isolation Forest

**Feature vector:**

* GPS variance (last 30 min)
* Distance from historical activity centroid
* Claim timing vs trigger
* Claim frequency (30 days)
* Device fingerprint similarity
* Network type

**Output:** Fraud score (0–1)

**Decision logic:**

* < 0.3 → Auto approve
* 0.3–0.7 → Review
* > 0.7 → Block

---

##  System Architecture

```
React PWA (Client)
        ↓
Spring Boot API (Core Backend)
        ↓
MySQL (User + Policy Data)
        ↓
FastAPI ML Service
        ↓
External APIs (Weather, AQI, Civic)
        ↓
Razorpay (UPI Payouts)
```

**Components:**

* Frontend: UI, onboarding, simulation
* Backend: Policy management, trigger engine
* ML Service: Risk, pricing, fraud scoring
* Database: User + claims data

---

##  Claim Flow

1. External APIs polled every 15 minutes

2. Threshold breach triggers event

3. Backend maps event to affected users

4. Payout calculated

   Payout = Hours Lost × Hourly Rate × Coverage %

5. Claim sent to ML fraud model

6. Fraud score returned

7. Decision engine routes claim:

   * Approve → Razorpay payout
   * Review → Queue
   * Block → Flag

8. Database updated and dashboard refreshed

---

##  Market Crash Handling

Large-scale disruptions (e.g., floods) can trigger thousands of claims simultaneously.

### Mitigation Strategy:

* **Exposure control:** Weekly payout caps per user
* **Batch processing:** Queue-based claim handling
* **Dynamic repricing:** Adjust premiums post-event
* **Forecasting:** Prophet model predicts claim volume
* **Reinsurance (future):** External insurers absorb tail risk

Ensures system stability and financial sustainability.

---

##  Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React, Tailwind CSS                             |
| Backend  | Spring Boot *(Phase 2)*                         |
| Database | MySQL                                           |
| AI / ML  | Python, FastAPI, XGBoost, scikit-learn, Prophet |
| APIs     | Weather, AQI, Civic Alerts                      |
| Payments | Razorpay (UPI)                                  |

---


##  Future Scope

* Integration with Zomato / Swiggy APIs
* Expansion to Uber, Rapido
* Real-time ML deployment
* Insurance partnerships

---

##  Team

**Team RiderRaksha**

| Name                  | Role       |
| --------------------- | ---------- |
| Jathin Sekhar Nerella | Full Stack |
| Naga Venkata Balaji   | Backend    |
| Reshma Paavani        | AI / ML    |
| Dhana Laxmi           | UI / UX    |

---
