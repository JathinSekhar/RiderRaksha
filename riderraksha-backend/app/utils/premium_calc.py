# Zone risk scores — higher score = higher premium
ZONE_RISK = {
    'Zone-1': 1.2,  # high flood risk
    'Zone-2': 1.1,  # moderate rain risk
    'Zone-3': 1.0,  # baseline
    'Zone-4': 0.9,  # low risk
}

CITY_RISK = {
    'Hyderabad': 1.15,
    'Delhi': 1.20,
    'Mumbai': 1.25,
    'Bangalore': 1.10,
    'Chennai': 1.10,
}

def calculate_premium(base_premium, zone, city):
    zone_multiplier = ZONE_RISK.get(zone, 1.0)
    city_multiplier = CITY_RISK.get(city, 1.0)
    dynamic_premium = round(base_premium * zone_multiplier * city_multiplier, 2)
    return dynamic_premium