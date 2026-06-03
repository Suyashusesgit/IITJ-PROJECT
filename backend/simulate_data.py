import os
import time
import random
import sys
import firebase_admin
from firebase_admin import credentials, db

# Fallback configurations
cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "serviceAccountKey.json")
database_url = os.environ.get("FIREBASE_DATABASE_URL")

if not database_url:
    print("❌ ERROR: FIREBASE_DATABASE_URL environment variable is not set.")
    print("Example: export FIREBASE_DATABASE_URL='https://your-project.firebaseio.com'")
    sys.exit(1)

if not os.path.exists(cred_path):
    print(f"❌ ERROR: Firebase Service Account Key not found at '{cred_path}'.")
    print("Please download serviceAccountKey.json from your Firebase Console and place it in the backend folder.")
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': database_url
    })
    print("✅ Successfully initialized Firebase Admin.")
except Exception as e:
    print(f"❌ Failed to initialize Firebase: {e}")
    sys.exit(1)

ref = db.reference('/vitals')

# Baseline parameters (centered around IIT Jodhpur)
lat = 26.2892
lng = 73.0220
step = 0

print("🚀 Starting ESP32 Data Simulation. Pushing data to Firebase RTDB every 2 seconds...")
print("Press Ctrl+C to terminate.")

try:
    while True:
        step += 1
        
        # Every 8 updates, simulate a critical anomaly (low SpO2 or fever)
        simulate_anomaly = (step % 8 == 0)
        
        bpm = random.randint(110, 130) if simulate_anomaly else random.randint(65, 85)
        spo2 = random.randint(84, 88) if simulate_anomaly else random.randint(95, 99)
        body_temp = round(random.uniform(38.2, 39.4), 1) if simulate_anomaly else round(random.uniform(36.2, 37.0), 1)
        ambient_temp = round(random.uniform(24.5, 27.5), 1)
        
        # Walking movement simulation: change coordinates slightly
        lat += random.uniform(-0.00015, 0.00015)
        lng += random.uniform(-0.00015, 0.00015)
        
        payload = {
            "beatAvg": bpm,
            "spo2": spo2,
            "bodyTemp": body_temp,
            "ambientTemp": ambient_temp,
            "lat": lat,
            "lng": lng,
            "timestamp": int(time.time() * 1000)
        }
        
        # Push update to Firebase RTDB
        ref.update(payload)
        
        print(f"\n📡 Pushed update #{step}:")
        print(f"   - Heart Rate: {bpm} bpm")
        print(f"   - SpO2 Level: {spo2}%")
        print(f"   - Body Temp : {body_temp} °C")
        print(f"   - Location  : {lat:.6f}, {lng:.6f}")
        if simulate_anomaly:
            print("   ⚠️  [ANOMALY PUSHED]")
            
        time.sleep(2)
except KeyboardInterrupt:
    print("\n👋 Simulation stopped by user.")
