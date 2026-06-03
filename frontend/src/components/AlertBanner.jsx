import React from 'react';
import { AlertOctagon, Heart, ShieldAlert } from 'lucide-react';

export default function AlertBanner({ active, spo2, bodyTemp }) {
  if (!active) {
    return (
      <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl w-full select-none transition-all duration-300">
        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
          <Heart size={18} className="fill-emerald-400 animate-pulse" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold text-sm tracking-wide">All Vitals Stable</span>
          <span className="text-xs opacity-75">Patient stats are currently within normal operating safety parameters.</span>
        </div>
        <div className="ml-auto text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono">
          SYSTEM NORMAL
        </div>
      </div>
    );
  }

  // Identify specific trigger reasons to display in UI
  const isSpO2Critical = spo2 > 0 && spo2 < 90;
  const isTempCritical = bodyTemp > 38.0;

  return (
    <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border border-red-500/40 text-red-100 rounded-2xl w-full shadow-lg shadow-red-500/10 animate-pulse">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
      
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 animate-bounce">
          <AlertOctagon size={24} />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-extrabold text-base tracking-wider uppercase flex items-center gap-1.5 text-red-200">
            <ShieldAlert size={16} />
            Medical Health Alert
          </span>
          <span className="text-sm font-medium text-red-300/90 mt-0.5">
            Critical health values detected. Immediate medical intervention advised.
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:ml-auto">
        {isSpO2Critical && (
          <span className="text-xs font-bold px-3 py-1.5 bg-red-500/20 text-red-200 border border-red-500/40 rounded-lg">
            CRITICAL SpO2: {spo2}% (&lt; 90%)
          </span>
        )}
        {isTempCritical && (
          <span className="text-xs font-bold px-3 py-1.5 bg-red-500/20 text-red-200 border border-red-500/40 rounded-lg">
            HIGH TEMP: {bodyTemp}°C (&gt; 38.0°C)
          </span>
        )}
        {!isSpO2Critical && !isTempCritical && (
          <span className="text-xs font-bold px-3 py-1.5 bg-red-500/20 text-red-200 border border-red-500/40 rounded-lg">
            Manual/External Trigger Active
          </span>
        )}
      </div>
    </div>
  );
}
