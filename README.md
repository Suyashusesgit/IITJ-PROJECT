# IIT Jodhpur Healthcare and Location Tracking System

This repository contains the boilerplate code and project structure for a real-time IoT healthcare monitoring and location tracking dashboard. It integrates an ESP32 edge node (vitals + GPS) with a Firebase Realtime Database, a Python Flask backend for anomaly/alert processing, and a premium React.js frontend dashboard.

---

## Repository Structure

```
├── backend/
│   ├── app.py                # Flask server, RTDB listener, and alert evaluation engine
│   ├── requirements.txt      # Python backend packages
│   └── simulate_data.py      # Simulator script to push mock vitals to Firebase
├── frontend/
│   ├── index.html            # Main HTML entry with Google Fonts & Leaflet CSS
│   ├── tailwind.config.js    # Tailwind configuration (v4)
│   ├── package.json          # Frontend packages and scripts
│   └── src/
│       ├── main.jsx          # React app mounter
│       ├── App.jsx           # Real-time state coordinator & dashboard layout
│       ├── firebaseConfig.js # Firebase Web Client config
│       ├── index.css         # Styling, glassmorphic cards, and Leaflet overrides
│       └── components/
│           ├── AlertBanner.jsx  # Red/green system alert notifications
│           ├── MapTracker.jsx   # React-Leaflet component with dynamic pulsing marker
│           └── VitalCard.jsx    # Glassmorphism metric visualizer cards
└── README.md                 # Project instructions and architecture overview
```

---

## Prerequisites

1. **Python 3.8+**
2. **Node.js 18+ & npm**
3. **Firebase Project**:
   - Create a Firebase Project on the [Firebase Console](https://console.firebase.google.com/).
   - Initialize a **Realtime Database**. Make note of your database URL (e.g., `https://your-project-default-rtdb.firebaseio.com/`).
   - Create a Web Application in the project to obtain the Web Client credentials.
   - Go to Project Settings > Service Accounts and generate a new Private Key. Save it as `serviceAccountKey.json`.

---

## 1. Firebase Credentials Configuration

### Backend Credentials
1. Copy the downloaded service account private key JSON file into the `backend/` directory.
2. Rename it to `serviceAccountKey.json`.

### Frontend Credentials
Create a `.env` file in the `frontend/` directory with the following variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 2. Running the Flask Backend

1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Database URL environment variable and run the Flask server:
   ```bash
   export FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
   python app.py
   ```
   *The Flask backend will start a background listener that monitors `/vitals` in Firebase RTDB, prints console warnings if limits are breached, and manages the `/vitals/alert_status` state.*
4. Check health by calling: `http://localhost:5000/api/status`

---

## 3. Running the React Frontend Dashboard

1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the URL printed in terminal (usually `http://localhost:5173`).

> **💡 Pro-Tip for Demonstration/Testing**:
> The dashboard comes with a built-in **Simulation Mode** toggle at the top right header. If you do not have Firebase config files setup yet, toggling "Simulation" will decouple from the database and cycle through mock coordinates around the IIT Jodhpur campus, displaying full real-time vitals and simulating critical patient events so you can test transitions immediately.

---

## 4. Running the Firebase Simulator (Optional)

To test the full stream connection without an ESP32 hardware device connected:
1. Setup credentials in `backend/` as explained above.
2. Run the simulator:
   ```bash
   export FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
   python simulate_data.py
   ```
   *This pushes live coordinates and vitals directly to your database every 2 seconds, which your Flask backend will process and your React dashboard will render in real-time.*
