import requests
import os
import logging

logger = logging.getLogger(__name__)

API_KEY = os.getenv("OPENWEATHER_API_KEY")

def get_weather(city):
    """
    Fetch weather data from OpenWeatherMap API.
    
    Args:
        city (str): City name
        
    Returns:
        dict: Normalized weather data with keys:
            - rain: rainfall in mm/hr (1 hour rainfall)
            - temp: temperature in Celsius
            - humidity: humidity percentage
            - weather: weather description
            - aqi: air quality index (placeholder, currently 0)
            - flood: flood alert status (placeholder, currently 0)
            - curfew: curfew status (placeholder, currently 0)
    """
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
        logger.debug(f"[API CALL] Fetching weather from: {url}")
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.debug(f"[API RESPONSE] Raw response: {data}")

        # Normalize weather data with keys matching THRESHOLDS
        weather = {
            "rain": data.get("rain", {}).get("1h", 0),  # 1-hour rainfall in mm
            "temp": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "weather": data["weather"][0]["main"],
            "aqi": 0,      # Placeholder: would need separate AQI API call
            "flood": 0,    # Placeholder: would need separate flood alert API
            "curfew": 0,   # Placeholder: would need zone-specific data
        }
        
        logger.info(f"[WEATHER FETCHED] City: {city}, Rain: {weather['rain']} mm/hr, Temp: {weather['temp']}°C")
        return weather
        
    except requests.exceptions.RequestException as e:
        logger.error(f"[WEATHER ERROR] Failed to fetch weather for {city}: {str(e)}")
        return None
    except KeyError as e:
        logger.error(f"[WEATHER ERROR] Invalid API response format for {city}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"[WEATHER ERROR] Unexpected error fetching weather for {city}: {str(e)}", exc_info=True)
        return None