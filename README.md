# RiderRaksha 🚴‍♂️

### AI-Powered Parametric Insurance for Gig Workers

**Guidewire DEVTrails 2026 — Hackathon Submission**

---

## 🚀 Overview

RiderRaksha is a real-time, AI-driven parametric insurance platform designed for gig delivery workers.
It automatically detects external disruptions such as weather, pollution, and civic restrictions, and compensates income loss instantly—without requiring a manual claim.

> **Core Idea:**
> Replace traditional claim-based insurance with automated, data-triggered payouts.

---

## ⚡ Key Features

* ⚡ **Instant Auto Payouts** — No claim filing required
* 🌦️ **Real-Time Trigger Engine** — Rain, AQI, Heat, Flood, Curfew
* 🤖 **AI Fraud Detection** — Isolation Forest anomaly detection
* 🧠 **Explainable AI** — Transparent risk scoring & reasoning
* 📊 **Admin Dashboard** — Live analytics, alerts, and insights
* 🔮 **Prediction Engine** — Forecasts claims, fraud, and risk zones

---

## 📊 Product Preview

### 👤 User Dashboard

Shows worker earnings, policy coverage, and payout tracking
![User Dashboard](./screenshots/user-dashboard.png)

---

### 📄 Claims & Auto Payout System

Demonstrates auto-triggered claims, fraud scoring, and payout processing
![Claims](./screenshots/claims.png)

---

### 🧠 Admin Dashboard

Central system view with analytics, alerts, and operational insights
![Admin Dashboard](./screenshots/admin-dashboard.png)

---

### 🚨 AI Insights & Risk Monitoring

Highlights fraud spikes, alerts, and recommended actions
![AI Insights](./screenshots/ai-insights.png)

---

### 🔍 Fraud Detection & Claim Review

Detailed claim-level analysis with ML explanation and risk factors
![Fraud Review](./screenshots/fraud-review.png)

---

## 🎥 Demo

👉 [Add your demo video link here]

**Demo includes:**

* Real-time disruption → claim generation
* Fraud detection using ML
* AI insights and recommendations
* Prediction-based risk analysis

---

## 🧠 System Architecture

```text
Frontend (React)
   ↓
Backend (Flask APIs)
   ↓
ML Layer (Fraud + Pricing + Prediction)
   ↓
Database + External APIs (Weather, AQI)
```

---

## 🤖 AI & Machine Learning

| Model             | Purpose                                |
| ----------------- | -------------------------------------- |
| Isolation Forest  | Fraud detection (behavioral anomalies) |
| XGBoost           | Dynamic premium calculation            |
| K-Means           | Risk segmentation                      |
| Prediction Engine | Claim & fraud forecasting              |

### Explainability Layer

Each claim includes:

* Fraud score
* Risk factors (account age, payout ratio, behavior)
* AI-generated explanation
* Recommended action

---

## 🔮 Prediction Engine

The system forecasts future system behavior using historical and real-time data:

* Predicted claim volume
* Fraud risk trends
* High-risk zones
* Recommended operational actions

**Example Output:**

```text
Predicted Claims: 20
Fraud Risk: 46% (MEDIUM)
Top Risk Zone: Zone-1
Recommendation: Increase monitoring and manual review
```

---

## 🔐 Fraud Detection Strategy

* Behavioral pattern analysis
* Device/network anomaly detection
* Zone-based clustering
* Real-time fraud scoring

| Score Range | Action                |
| ----------- | --------------------- |
| < 0.3       | Auto-approve          |
| 0.3 – 0.6   | Delayed verification  |
| 0.6 – 0.8   | Manual review         |
| > 0.8       | Block + investigation |

---

## 🌦️ Trigger System

| Event  | Threshold    |
| ------ | ------------ |
| Rain   | > 60 mm/hr   |
| Heat   | > 43°C       |
| AQI    | > 350        |
| Flood  | Alert issued |
| Curfew | Zone closure |

---

## 💰 Pricing Model

| Tier     | Premium  | Coverage |
| -------- | -------- | -------- |
| Basic    | ₹29/week | ₹1,000   |
| Standard | ₹59/week | ₹2,500   |
| Pro      | ₹99/week | ₹5,000   |

**Payout Formula:**

```text
Payout = Hours Lost × Hourly Rate × 80%
```

---

## 📊 Actuarial Insight

* Avg disruption days/year → 35
* Avg payout/day → ₹381
* Estimated payout/year → ₹5,334

Dynamic pricing and risk segmentation help maintain sustainable loss ratios.

---

## 💼 Business Model

* Platform fee: **12–15% of premiums**

Example:

```text
10,000 users → ₹3 Cr premium
~13% margin → ₹40 lakh/year
```

Future expansion:

* B2B integration with delivery platforms
* White-label insurance solutions

---

## 🛠️ Tech Stack

* **Frontend:** React, Tailwind CSS, Recharts
* **Backend:** Flask, SQLAlchemy
* **Database:** MySQL / SQLite
* **ML:** scikit-learn, XGBoost
* **Auth:** JWT
* **APIs:** OpenWeatherMap, AQI APIs
* **Payments:** Razorpay (sandbox)

---

## 📁 Project Structure

```text
riderraksha-backend/
riderraksha-app/
screenshots/
README.md
```

---

## ⚙️ Setup Instructions

### Backend

```bash
cd riderraksha-backend
pip install -r requirements.txt
python run.py
```

### Frontend

```bash
cd riderraksha-app
npm install
npm run dev
```

---

## 📌 Future Scope

* Real-time streaming (WebSockets)
* Advanced predictive models
* Cloud deployment (AWS/GCP)
* Integration with delivery platforms

---

## 👥 Team

* Jathin Sekhar Nerella — Full Stack
* Naga Venkata Balaji — Backend
* Reshma Paavani — AI/ML
* Dhana Laxmi — UI/UX

KL University — Guidewire DEVTrails 2026
