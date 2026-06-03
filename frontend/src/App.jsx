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

// Default vitals object — single source of truth
const DEFAULT_VITALS = {
  beatAvg:     null,
  spo2:        null,
  bodyTemp:    null,
  ambientTemp: null,
  lat:         0,
  lng:         0,
  alertStatus: false,
  timestamp:   null,
};

// IIT Jodhpur base coordinates for simulation
const IITJ_LAT = 26.2892;
const IITJ_LNG = 73.0220;

export default function App() {
  const [vitals, setVitals]           = useState(DEFAULT_VITALS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState('connecting');
  const [lastUpdatedText, setLastUpdatedText] = useState('Never');

  // ─── Last-updated ticker ───────────────────────────────────────────────────
  useEffect(() => {
    if (!vitals.timestamp) return;
    const interval = setInterval(() => {
      const s = Math.floor((Date.now() - vitals.timestamp) / 1000);
      if (s < 5)        setLastUpdatedText('Just now');
      else if (s < 60)  setLastUpdatedText(`${s}s ago`);
      else              setLastUpdatedText(`${Math.floor(s / 60)}m ago`);
    }, 2000);
    return () => clearInterval(interval);
  }, [vitals.timestamp]);

  // ─── Firebase Live Listener ────────────────────────────────────────────────
  useEffect(() => {
    if (isSimulating) return;

    setFirebaseStatus('connecting');
    const vitalsRef = ref(db, 'vitals');

    const unsubscribe = onValue(
      vitalsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setVitals({
            beatAvg:     data.beatAvg     ?? 0,
            spo2:        data.spo2        ?? 0,
            bodyTemp:    data.bodyTemp    ?? 0,
            ambientTemp: data.ambientTemp ?? 0,
            lat:         data.lat         ?? 0,
            lng:         data.lng         ?? 0,
            alertStatus: data.alert_status ?? false,
            timestamp:   Date.now(),
          });
          setFirebaseStatus('connected');
        } else {
          setFirebaseStatus('error');
        }
      },
      (error) => {
        console.error('[Firebase] Database error:', error);
        setFirebaseStatus('error');
      }
    );

    return () => unsubscribe();
  }, [isSimulating]);

  // ─── Simulation Mode ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSimulating) return;

    setFirebaseStatus('connected');
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const simulateAlert = step % 8 === 0;
      const offsetLat = Math.sin(step * 0.1) * 0.002;
      const offsetLng = Math.cos(step * 0.1) * 0.002;

      const newVitals = {
        beatAvg:     Math.floor(70 + Math.random() * 15 + (simulateAlert ? 25 : 0)),
        spo2:        simulateAlert ? Math.floor(85 + Math.random() * 4) : Math.floor(95 + Math.random() * 5),
        bodyTemp:    simulateAlert ? parseFloat((38.1 + Math.random() * 0.8).toFixed(1)) : parseFloat((36.2 + Math.random() * 0.8).toFixed(1)),
        ambientTemp: parseFloat((25.5 + Math.random() * 1.5).toFixed(1)),
        lat:         IITJ_LAT + offsetLat,
        lng:         IITJ_LNG + offsetLng,
        timestamp:   Date.now(),
      };

      newVitals.alertStatus = (newVitals.spo2 > 0 && newVitals.spo2 < 90) || newVitals.bodyTemp > 38.0;
      setVitals(newVitals);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // ─── Loading state ─────────────────────────────────────────────────────────
  const isLoading = !isSimulating && firebaseStatus === 'connecting';

  return (
    <div className="min-h-screen bg-slate-950 grid-bg text-slate-100 flex flex-col font-sans antialiased">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
                Research Project: IoT Healthcare &amp; Dynamic GPS Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Source selector */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1">
              <button
                id="btn-live-firebase"
                onClick={() => setIsSimulating(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  !isSimulating ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database size={13} /> Live Firebase
              </button>
              <button
                id="btn-simulation"
                onClick={() => setIsSimulating(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  isSimulating ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={13} /> Simulation
              </button>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${
                firebaseStatus === 'connected'  ? 'bg-emerald-500' :
                firebaseStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                {isSimulating ? 'Sim Active' :
                 firebaseStatus === 'connected'  ? 'Connected'  :
                 firebaseStatus === 'connecting' ? 'Connecting' : 'DB Error'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">

        {/* Alert banner */}
        <AlertBanner
          active={vitals.alertStatus}
          spo2={vitals.spo2}
          bodyTemp={vitals.bodyTemp}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Vitals column ─────────────────────────────────────────────── */}
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

            {/* Loading shimmer */}
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="glow-card rounded-2xl p-6 animate-pulse"
                  >
                    <div className="flex justify-between mb-4">
                      <div className="h-3 w-24 bg-slate-700 rounded" />
                      <div className="h-8 w-8 bg-slate-700 rounded-xl" />
                    </div>
                    <div className="h-10 w-20 bg-slate-700 rounded mb-2" />
                    <div className="h-2 w-full bg-slate-800 rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <VitalCard
                  title="Heart Rate (BPM)"
                  value={vitals.beatAvg}
                  unit="bpm"
                  icon={Heart}
                  status={vitals.beatAvg > 100 || vitals.beatAvg < 50 ? 'warning' : 'safe'}
                  threshold="Normal: 60–100"
                  colorClass="bg-red-500"
                />
                <VitalCard
                  title="Oxygen Level (SpO2)"
                  value={vitals.spo2}
                  unit="%"
                  icon={Activity}
                  status={vitals.spo2 > 0 && vitals.spo2 < 90 ? 'critical' : 'safe'}
                  threshold="Critical: < 90%"
                  colorClass="bg-blue-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <VitalCard
                    title="Body Temp"
                    value={vitals.bodyTemp}
                    unit="°C"
                    icon={Thermometer}
                    status={vitals.bodyTemp > 38.0 ? 'warning' : 'safe'}
                    threshold="High: > 38.0°C"
                    colorClass="bg-amber-500"
                  />
                  <VitalCard
                    title="Ambient"
                    value={vitals.ambientTemp}
                    unit="°C"
                    icon={CloudSun}
                    status="safe"
                    threshold="Environment"
                    colorClass="bg-emerald-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* ── Map column ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <MapTracker
              lat={vitals.lat}
              lng={vitals.lng}
              alertStatus={vitals.alertStatus}
              timestamp={vitals.timestamp}
            />
          </div>

        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
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
