import geoip2.database
import os

# Load the MaxMind GeoLite2 database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'GeoLite2-City.mmdb')

reader = geoip2.database.Reader(DB_PATH)

def get_geo(ip):
    try:
        response = reader.city(ip)
        print(f"Geo lookup for {ip}: lat={response.location.latitude}, lon={response.location.longitude}")
        return {
            'lat': response.location.latitude,
            'lon': response.location.longitude,
            'city': response.city.name,
            'country': response.country.name
        }
    except Exception as e:
        print(f"Geo lookup failed for {ip}: {e}")
        return None
    
get_geo("8.8.8.8")