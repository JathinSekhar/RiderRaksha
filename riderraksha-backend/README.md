# RiderRaksha Backend

Flask-based API server powering RiderRaksha.

## 🚀 Features

* JWT Authentication (login/register)
* Policy management APIs
* Dynamic premium calculation
* Claims processing engine
* Trigger-based automation system
* Fraud detection support (extensible)

## 🛠️ Tech Stack

* Python (Flask)
* SQLAlchemy ORM
* MySQL
* Flask-JWT-Extended
* REST APIs

## ▶️ Run Locally

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Server runs at: http://127.0.0.1:5000

## 🔑 Environment Variables (.env)

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
DATABASE_URL=mysql+pymysql://user:password@localhost/db_name
```

## 📡 API Endpoints

### Auth

* POST /api/auth/register
* POST /api/auth/login
* GET /api/auth/me

### Policies

* GET /api/policies/preview
* POST /api/policies/buy
* GET /api/policies/my
* GET /api/policies/active

### Claims

* GET /api/claims/my

## 🧠 Notes

* All protected routes require JWT
* Role-based access (admin/user)
* Uses mock triggers for disruptions

## 👨‍💻 Author

Team Elites
