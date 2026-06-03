import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebaseConfig';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  CloudSun, 
  RefreshCw, 
  Radio, 
  Database,
  Eye
} from 'lucide-react';
import VitalCard from './components/VitalCard';
import MapTracker from './components/MapTracker';
import AlertBanner from './components/AlertBanner';

export default function App() {
  // State for all vitals and device settings
  const [beatAvg, setBeatAvg] = useState(null);
  const [spo2, setSpo2] = useState(null);
  const [bodyTemp, setBodyTemp] = useState(null);
  const [ambientTemp, setAmbientTemp] = useState(null);
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [alertStatus, setAlertStatus] = useState(false);
  const [timestamp, setTimestamp] = useState(null);
  
  // Connection / source states
  const [isSimulating, setIsSimulating] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [lastUpdatedText, setLastUpdatedText] = useState('Never');

  // Format last updated duration
  useEffect(() => {
    if (!timestamp) return;
    
    const interval = setInterval(() => {
      const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
      if (secondsAgo < 5) {
        setLastUpdatedText('Just now');
      } else if (secondsAgo < 60) {
        setLastUpdatedText(`${secondsAgo}s ago`);
      } else {
        const mins = Math.floor(secondsAgo / 60);
        setLastUpdatedText(`${mins}m ago`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [timestamp]);

  // Firebase Live Sync Listener
  useEffect(() => {
    if (isSimulating) return;

    setFirebaseStatus('connecting');
    const vitalsRef = ref(db, 'vitals');

    // Subscribe to RTDB database reference
    const unsubscribe = onValue(
      vitalsRef, 
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setBeatAvg(data.beatAvg ?? 0);
          setSpo2(data.spo2 ?? 0);
          setBodyTemp(data.bodyTemp ?? 0.0);
          setAmbientTemp(data.ambientTemp ?? 0.0);
          setLat(data.lat ?? 0);
          setLng(data.lng ?? 0);
          setAlertStatus(data.alert_status ?? false);
          
          // Use absolute system time or device uptime timestamp
          setTimestamp(data.timestamp ? Date.now() : Date.now());
          setFirebaseStatus('connected');
        } else {
          setFirebaseStatus('error');
        }
      },
      (error) => {
        console.error("Firebase Database error:", error);
        setFirebaseStatus('error');
      }
    );

    return () => unsubscribe();
  }, [isSimulating]);

  // Simulation mode loop
  useEffect(() => {
    if (!isSimulating) return;

    setFirebaseStatus('connected');
    setTimestamp(Date.now());
    
    // IIT Jodhpur base coordinates
    const iitjLat = 26.2892;
    const iitjLng = 73.0220;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      
      // Simulating healthy values with occasional anomalous events every 8 steps
      const simulateAlert = step % 8 === 0;
      
      const simBpm = Math.floor(70 + Math.random() * 15 + (simulateAlert ? 25 : 0));
      const simSpo2 = simulateAlert ? Math.floor(85 + Math.random() * 4) : Math.floor(95 + Math.random() * 5);
      const simBodyTemp = simulateAlert ? parseFloat((38.1 + Math.random() * 0.8).toFixed(1)) : parseFloat((36.2 + Math.random() * 0.8).toFixed(1));
      const simAmbientTemp = parseFloat((25.5 + Math.random() * 1.5).toFixed(1));
      
      // Orbit coordinate offsets slightly around IIT Jodhpur
      const offsetLat = Math.sin(step * 0.1) * 0.002;
      const offsetLng = Math.cos(step * 0.1) * 0.002;

      setBeatAvg(simBpm);
      setSpo2(simSpo2);
      setBodyTemp(simBodyTemp);
      setAmbientTemp(simAmbientTemp);
      setLat(iitjLat + offsetLat);
      setLng(iitjLng + offsetLng);
      setTimestamp(Date.now());

      // Evaluate alert locally under simulation
      const hasAlert = (simSpo2 > 0 && simSpo2 < 90) || (simBodyTemp > 38.0);
      setAlertStatus(hasAlert);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="min-h-screen bg-slate-950 grid-bg text-slate-100 flex flex-col font-sans antialiased">
      {/* Premium Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-extrabold tracking-tight text-white m-0 leading-none">
                IIT Jodhpur Edge Node Tracker
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Research Project: IoT Healthcare & Dynamic GPS Telemetry
              </p>
            </div>
          </div>

          {/* Configuration / Live Controls */}
          <div className="flex items-center gap-3">
            {/* Source selector */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1">
              <button
                onClick={() => setIsSimulating(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  !isSimulating 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database size={13} />
                Live Firebase
              </button>
              <button
                onClick={() => setIsSimulating(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  isSimulating 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={13} />
                Simulation
              </button>
            </div>

            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${
                firebaseStatus === 'connected' ? 'bg-emerald-500' :
                firebaseStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                {isSimulating ? 'Sim Active' : 
                 firebaseStatus === 'connected' ? 'Connected' :
                 firebaseStatus === 'connecting' ? 'Connecting' : 'Db Error'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Dynamic Alert Banner */}
        <AlertBanner active={alertStatus} spo2={spo2} bodyTemp={bodyTemp} />

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Top Side: Vitals Grid */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" />
                Live Vitals
              </h2>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin-slow" />
                Updated: {lastUpdatedText}
              </span>
            </div>

            {/* BPM Card */}
            <VitalCard 
              title="Heart Rate (BPM)"
              value={beatAvg}
              unit="bpm"
              icon={Heart}
              status={beatAvg > 100 || beatAvg < 50 ? 'warning' : 'safe'}
              threshold="Normal: 60-100"
              colorClass="bg-red-500"
            />

            {/* SpO2 Card */}
            <VitalCard 
              title="Oxygen Level (SpO2)"
              value={spo2}
              unit="%"
              icon={Activity}
              status={spo2 > 0 && spo2 < 90 ? 'critical' : 'safe'}
              threshold="Critical: < 90%"
              colorClass="bg-blue-500"
            />

            {/* Temperatures (Grid layout inside col) */}
            <div className="grid grid-cols-2 gap-4">
              <VitalCard 
                title="Body Temp"
                value={bodyTemp}
                unit="°C"
                icon={Thermometer}
                status={bodyTemp > 38.0 ? 'warning' : 'safe'}
                threshold="High: > 38.0°C"
                colorClass="bg-amber-500"
              />
              <VitalCard 
                title="Ambient Temp"
                value={ambientTemp}
                unit="°C"
                icon={CloudSun}
                status="safe"
                threshold="Sensor environment"
                colorClass="bg-emerald-500"
              />
            </div>
          </div>

          {/* Right / Bottom Side: GPS Map */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <MapTracker 
              lat={lat} 
              lng={lng} 
              alertStatus={alertStatus} 
              timestamp={timestamp} 
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} IIT Jodhpur Health IoT Tracker. All rights reserved.</p>
          <div className="flex gap-4 font-medium text-slate-400">
            <a href="https://firebase.google.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Firebase RTDB</a>
            <span>•</span>
            <a href="https://flask.palletsprojects.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Flask Backend</a>
            <span>•</span>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">React Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
