# 🎯 RiderRaksha Frontend

**RiderRaksha** is a real-time income protection platform designed for gig workers (delivery riders, drivers, etc.).
This frontend provides an intuitive and responsive interface for users and admins to manage policies, claims, and risk insights.

---

## 🚀 Key Features

### 👤 User Features

* Seamless onboarding & registration
* Real-time **policy purchase & premium calculation**
* Live dashboard with earnings, claims, and coverage
* Auto-triggered claim tracking (no paperwork)
* Transparent payout and fraud score visibility

### 🛡️ Admin Features

* Real-time **Admin Dashboard**
* AI-driven **fraud detection insights**
* High-risk claim monitoring & manual review panel
* Zone-based risk heatmaps
* Live alerts & analytics

---

## 🛠️ Tech Stack

* ⚛️ React 18
* ⚡ Vite
* 🎨 Tailwind CSS + Custom Theme
* 🔗 Fetch API (REST communication)
* 🔐 JWT Authentication

---

## ⚙️ Run Locally

```bash
cd riderraksha-app
npm install
npm run dev
```

👉 App runs at:
**http://localhost:5173**

---

## 🔗 Backend Dependency

* Backend must be running at: **http://localhost:5000**
* API base URL configured in:

```
src/api/api.js
```

---

## 🔐 Authentication & Roles

* JWT stored in `localStorage`
* Role-based UI rendering:

  * 👤 User → Dashboard, Claims, Policy
  * 🛡️ Admin → Analytics, Fraud Review, Monitoring

---

## 📂 Project Structure

```
src/
│── api/            # API integration
│── components/     # Reusable UI components
│── screens/        # Main pages (Dashboard, Admin, Claims)
│── hooks/          # Custom hooks
│── constants/      # Theme & configs
```

---

## 💡 Highlights

* Clean and modern UI (dark theme)
* Real-time analytics integration
* ML-powered fraud transparency
* Fully modular & scalable structure

---

## 👨‍💻 Team

**Team Elites**

---

## 📌 Note

This frontend is part of the full RiderRaksha system, including:

* Backend (Flask + ML)
* Real-time triggers (weather/events)
* Fraud detection models

---
