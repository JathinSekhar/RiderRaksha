# app/ml/ml_service.py

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor


# -------------------------------
# 1. GENERATE SYNTHETIC DATA
# -------------------------------

def generate_data(n=1000):
    np.random.seed(42)

    data = pd.DataFrame({
        "account_age": np.random.randint(1, 365, n),
        "claim_freq": np.random.randint(0, 10, n),
        "avg_payout": np.random.uniform(100, 1000, n),
        "zone_risk": np.random.uniform(0.8, 1.5, n),
        "hourly_rate": np.random.uniform(80, 200, n),
        "weather_severity": np.random.uniform(0, 1, n),
        "platform": np.random.choice([0, 1], n),  # 0=Zomato, 1=Swiggy
    })

    # Target for premium (fake realistic formula)
    data["premium"] = (
        data["zone_risk"] * data["hourly_rate"] * 0.5 +
        data["weather_severity"] * 50 +
        data["claim_freq"] * 5
    )

    return data


# -------------------------------
# 1B. GENERATE FRAUD TRAINING DATA (8 FEATURES)
# -------------------------------

def generate_fraud_training_data(n=1000):
    """Generate 8-feature training data for Isolation Forest fraud detection."""
    np.random.seed(42)
    
    X = []
    
    for _ in range(n):
        account_age = np.random.randint(1, 365)
        claim_freq = np.random.randint(0, 10)
        avg_payout = np.random.uniform(100, 1000)
        zone_risk = np.random.choice([1.0, 1.2, 1.5])
        hourly_rate = np.random.uniform(100, 300)
        weather_severity = np.random.uniform(0.1, 1.0)
        time_of_day = np.random.randint(0, 23)
        
        # NEW FEATURE: payout_ratio
        payout_ratio = avg_payout / hourly_rate
        
        X.append([
            account_age,
            claim_freq,
            avg_payout,
            zone_risk,
            hourly_rate,
            weather_severity,
            time_of_day,
            payout_ratio
        ])
    
    return np.array(X)


# -------------------------------
# 2. TRAIN PREMIUM MODEL (XGBoost)
# -------------------------------

def train_premium_model(data):
    X = data.drop(columns=["premium"])
    y = data["premium"]

    model = XGBRegressor(n_estimators=100, max_depth=4)
    model.fit(X, y)

    joblib.dump(model, "app/ml/premium_model.pkl")
    print("✅ Premium model saved")


# -------------------------------
# 3. TRAIN FRAUD MODEL (Isolation Forest)
# -------------------------------

def train_fraud_model():
    """Train Isolation Forest with 8 fraud detection features."""
    # Generate 8-feature training data
    X = generate_fraud_training_data(n=1000)
    
    print(f"📊 Training Isolation Forest with {len(X)} samples")
    print(f"🎯 Model trained with features: {len(X[0])}")
    
    # Verify feature count
    if len(X[0]) != 8:
        raise ValueError(f"Expected 8 features but got {len(X[0])}")
    
    # Train model
    model = IsolationForest(
        n_estimators=100,
        contamination=0.1,
        random_state=42
    )
    model.fit(X)
    
    # Save model
    joblib.dump(model, "app/ml/fraud_model.pkl")
    print("✅ Fraud model retrained with 8 features and saved")
    print(f"   Features: [account_age, claim_freq, avg_payout, zone_risk, hourly_rate, weather_severity, time_of_day, payout_ratio]")


# -------------------------------
# 4. MAIN TRAIN FUNCTION
# -------------------------------

def train_all():
    print("\n🚀 Starting model training...\n")
    
    data = generate_data(1000)
    
    print("📈 Training Premium Model (XGBoost)...")
    train_premium_model(data)
    
    print("\n🔍 Training Fraud Model (Isolation Forest)...")
    train_fraud_model()
    
    print("\n✨ All models trained successfully!\n")


if __name__ == "__main__":
    train_all() 