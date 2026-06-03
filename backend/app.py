import os
import sys
import threading
from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for React frontend

# Global state to track listener and device status
system_status = {
    "firebase_connected": False,
    "last_received_data": None,
    "current_alerts": [],
    "listener_running": False
}

# Resolve the service account key path
# Fallback order: env variable -> local file in backend directory -> project root
cred_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "serviceAccountKey.json")
database_url = os.environ.get("FIREBASE_DATABASE_URL")

# If no environment variable is set for URL, you can configure it manually or guide the user
if not database_url:
    print("WARNING: FIREBASE_DATABASE_URL environment variable is not set.")
    print("Please set it before running, e.g., export FIREBASE_DATABASE_URL='https://your-app.firebaseio.com/'")

# Initialize Firebase Admin SDK
try:
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': database_url
        })
        system_status["firebase_connected"] = True
        print(f"INFO: Firebase successfully initialized using credentials from: {cred_path}")
    else:
        # Fallback to default credentials or mock mode if credentials file is missing
        print(f"WARNING: Service account key not found at '{cred_path}'.")
        print("Backend running in MOCK / LOCAL-ONLY mode for Firebase integration.")
        print("To fix this, download your serviceAccountKey.json from Firebase Console and place it in this folder.")
except Exception as e:
    print(f"ERROR: Failed to initialize Firebase SDK: {e}")

# Prevent infinite recursion inside RTDB listener by caching current alert state locally
last_known_alert_status = None

def vitals_stream_callback(event):
    """
    Callback function that triggers on any database update under the '/vitals' path.
    """
    global last_known_alert_status
    
    # event.data contains the updated value at the path
    # If the path changed is a subpath (e.g. update to '/vitals/spo2'), event.path indicates the subpath
    # We fetch the absolute state of vitals to evaluate thresholds correctly
    try:
        ref = db.reference('/vitals')
        vitals_data = ref.get()
        
        if not vitals_data:
            return
            
        system_status["last_received_data"] = vitals_data
        
        # Safely extract vitals with defaults
        spo2 = vitals_data.get("spo2", 100)
        body_temp = vitals_data.get("bodyTemp", 36.5)
        beat_avg = vitals_data.get("beatAvg", 75)
        current_alert_status = vitals_data.get("alert_status", False)
        
        # Alert thresholds: SpO2 < 90% (but > 0 to filter out sensor disconnected states) or Body Temp > 38.0°C
        spo2_alert = (0 < spo2 < 90)
        temp_alert = (body_temp > 38.0)
        
        alerts = []
        if spo2_alert:
            alerts.append(f"CRITICAL SpO2: {spo2}% (Below 90%)")
        if temp_alert:
            alerts.append(f"HIGH BODY TEMPERATURE: {body_temp}°C (Above 38.0°C)")
            
        system_status["current_alerts"] = alerts
        should_alert = len(alerts) > 0
        
        # Log critical warnings to console
        if should_alert:
            print("\n🚨 WARNING: Critical health threshold breached! 🚨")
            for alert in alerts:
                print(f" - {alert}")
            print(f"Current Vitals -> BPM: {beat_avg} | SpO2: {spo2}% | Temp: {body_temp}°C")
            
        # Update Firebase alert flag only if it has changed to prevent infinite write loop
        if should_alert != current_alert_status:
            print(f"INFO: Updating Firebase alert_status flag to: {should_alert}")
            ref.child("alert_status").set(should_alert)
            last_known_alert_status = should_alert

    except Exception as e:
        print(f"ERROR: Error processing vitals stream change: {e}", file=sys.stderr)

# Start background Firebase stream listener if connected
def start_firebase_listener():
    if system_status["firebase_connected"] and database_url:
        try:
            print("INFO: Launching background RTDB stream listener for '/vitals'...")
            # Listen to the node
            db.reference('/vitals').listen(vitals_stream_callback)
            system_status["listener_running"] = True
        except Exception as e:
            print(f"ERROR: Failed to launch stream listener: {e}", file=sys.stderr)
    else:
        print("WARNING: Stream listener skipped. Verify credentials and FIREBASE_DATABASE_URL.")

# Start listener in a background daemon thread
listener_thread = threading.Thread(target=start_firebase_listener, daemon=True)
listener_thread.start()

@app.route('/api/status', methods=['GET'])
def get_status():
    """
    Health check endpoint.
    """
    status = {
        "status": "online",
        "firebase_connected": system_status["firebase_connected"],
        "listener_running": system_status["listener_running"],
        "active_alerts": system_status["current_alerts"],
        "last_received_vitals": system_status["last_received_data"]
    }
    return jsonify(status), 200

if __name__ == '__main__':
    # Listen on all interfaces, default port 5000
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
