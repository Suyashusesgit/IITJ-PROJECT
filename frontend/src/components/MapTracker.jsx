import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Create a custom glowing radar-style divIcon for Leaflet
// This avoids default asset relative-path loading errors in bundled environments
const createPulsingIcon = (isAlert) => {
  const color = isAlert ? 'bg-red-500' : 'bg-indigo-500';
  const pingColor = isAlert ? 'bg-red-400' : 'bg-indigo-400';
  
  return L.divIcon({
    className: 'custom-gps-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75"></span>
        <span class="relative inline-flex rounded-full w-4 h-4 ${color} border-2 border-white shadow-lg"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10]
  });
};

// Component to dynamically adjust map center when coordinates change
function RecenterMap({ lat, lng }) {
  const map = useMap();
  
  useEffect(() => {
    if (lat && lng && lat !== 0 && lng !== 0) {
      map.setView([lat, lng], 15, {
        animate: true,
        duration: 1.0 // smooth pan duration
      });
    }
  }, [lat, lng, map]);
  
  return null;
}

export default function MapTracker({ lat, lng, alertStatus, timestamp }) {
  const position = (lat && lng && lat !== 0 && lng !== 0) ? [lat, lng] : [26.2892, 73.0220]; // Default to IIT Jodhpur
  const isDefault = !lat || !lng || (lat === 0 && lng === 0);
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

  return (
    <div className="glow-card rounded-2xl p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="text-indigo-400" size={22} />
          <h2 className="text-lg font-bold text-white tracking-wide">Live GPS Location Tracker</h2>
        </div>
        
        {/* GPS coordinates pill */}
        <div className="flex items-center gap-3">
          {isDefault ? (
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Waiting for GPS Fix
            </span>
          ) : (
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              GPS Fix: {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          )}
        </div>
      </div>

      {/* Map display box */}
      <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-800/80 shadow-inner">
        <MapContainer 
          center={position} 
          zoom={15} 
          scrollWheelZoom={true}
          zoomControl={true}
        >
          {/* Dark map theme tiles from CartoDB */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {!isDefault && (
            <Marker position={position} icon={createPulsingIcon(alertStatus)}>
              <Popup>
                <div className="p-1 font-sans">
                  <div className="font-bold text-sm flex items-center gap-1.5 text-indigo-400">
                    <Navigation size={12} />
                    Edge Device Loc
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Latitude: {lat.toFixed(6)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Longitude: {lng.toFixed(6)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 border-t border-slate-800 pt-1">
                    Updated: {formattedTime}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          <RecenterMap lat={position[0]} lng={position[1]} />
        </MapContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Map Provider: OpenStreetMap & CartoDB Dark</span>
        <span>Center: {isDefault ? 'IIT Jodhpur Campus' : 'Target Coordinates'}</span>
      </div>
    </div>
  );
}
