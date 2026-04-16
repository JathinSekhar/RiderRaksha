# 🛡️ RiderRaksha Backend

### AI-Powered Parametric Insurance Engine for Gig Workers

**Guidewire DEVTrails 2026 — Hackathon Submission**

---

## 🚀 Overview

The RiderRaksha backend is the **core intelligence engine** of the platform.
It powers **real-time claim automation, fraud detection, and predictive analytics** for gig worker income protection.

> 💡 Unlike traditional insurance, RiderRaksha eliminates manual claims by using **data-triggered payouts**.

---

## ⚡ Core Responsibilities

* 🌦️ Detect real-world disruptions (weather, AQI, curfew)
* ⚡ Auto-trigger claims without user input
* 🤖 Run ML models for fraud detection
* 📊 Provide admin analytics & insights
* 🔮 Predict future claims and risk trends

---

## 🧠 Key Features

* ⚡ **Auto Claim Engine** — Event → Claim → Payout
* 🌍 **Trigger Engine** — Weather, AQI, Heat, Flood, Curfew
* 🤖 **Fraud Detection (ML)** — Isolation Forest anomaly detection
* 🧠 **Explainable AI** — Risk reasons + confidence
* 📊 **Admin Analytics API** — Real-time insights
* 🔮 **Prediction API** — Forecast claims & fraud trends

---

## 🧩 System Architecture

```text
Frontend (React)
   ↓
Flask Backend (APIs)
   ↓
ML Layer (Fraud + Prediction + Pricing)
   ↓
Database + External APIs
```

---

## 🔌 API Modules

### 📄 Claims API

* Auto-generated claims
* Claim history & filtering
* Status tracking (approved / pending / blocked)

---

### 🛡️ Admin API

* Analytics dashboard data
* Fraud metrics
* Loss ratio & risk insights
* Alerts & monitoring data

---

### 🤖 ML API

* Fraud score prediction
* Risk explanation
* Feature importance

---

### 🔮 Prediction API

* Forecast future claims
* Identify high-risk zones
* Generate recommendations

---

## 🤖 Machine Learning

| Model            | Purpose                             |
| ---------------- | ----------------------------------- |
| Isolation Forest | Fraud detection (anomaly detection) |
| XGBoost          | Premium prediction                  |
| K-Means          | Zone-based risk segmentation        |
| Custom Engine    | Claim & fraud forecasting           |

---

## 🧠 Explainable AI Output

Each claim includes:

* Fraud Score (0–1)
* Risk Level (LOW / MEDIUM / HIGH)
* Confidence Score
* Risk Factors (e.g., payout ratio, behavior)
* Recommended Action

---

## 🔮 Prediction Engine (Sample Output)

```json
{
  "predicted_claims": 20,
  "predicted_fraud_score": 0.46,
  "risk_level": "MEDIUM",
  "top_risk_zone": "Zone-1",
  "recommended_action": "Increase monitoring and manual review"
}
```

---

## 🔐 Fraud Detection Logic

| Score Range | Action              |
| ----------- | ------------------- |
| < 0.3       | Auto-approve        |
| 0.3 – 0.6   | Monitor             |
| 0.6 – 0.8   | Manual review       |
| > 0.8       | Block & investigate |

---

## 🌦️ Trigger Engine Rules

| Event  | Threshold    |
| ------ | ------------ |
| Rain   | > 60 mm/hr   |
| Heat   | > 43°C       |
| AQI    | > 350        |
| Flood  | Alert issued |
| Curfew | Zone closure |

---

## 💰 Payout Logic

```text
Payout = Hours Lost × Hourly Rate × 80%
```

---

## 🛠️ Tech Stack

* **Backend Framework:** Flask
* **ORM:** SQLAlchemy
* **Database:** MySQL / SQLite
* **ML Libraries:** scikit-learn, XGBoost
* **Authentication:** JWT
* **External APIs:** OpenWeatherMap, AQI APIs
* **Payments:** Razorpay (sandbox)

---

## 📁 Project Structure

```text
riderraksha-backend/
│── app/
│   │── routes/        # API endpoints
│   │── services/      # Business logic
│   │── ml/            # ML models & logic
│   │── models/        # Database models
│── run.py
│── requirements.txt
```

---

## ⚙️ Run Backend Locally

```bash
cd riderraksha-backend
pip install -r requirements.txt
python run.py
```

👉 Runs at:
**http://localhost:5000**

---

## 📌 Key Innovation

* Fully automated **claimless insurance system**
* Real-time **event-driven payouts**
* Transparent **AI-driven fraud detection**
* Predictive **risk intelligence for insurers**

---

## 🚀 Future Scope

* WebSocket real-time streaming
* Advanced deep learning fraud models
* Cloud deployment (AWS/GCP)
* Integration with Swiggy/Zomato APIs

---

## 👥 Team

**Team Elites**

* Jathin Sekhar Nerella — Full Stack
* Naga Venkata Balaji — Backend
* Reshma Paavani — AI/ML
* Dhana Laxmi — UI/UX

KL University — Guidewire DEVTrails 2026

---
