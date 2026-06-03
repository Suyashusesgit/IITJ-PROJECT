import React from 'react';

export default function VitalCard({ title, value, unit, icon: Icon, status, threshold, colorClass }) {
  // Determine text and background colors based on status
  const isAlert = status === 'warning' || status === 'critical';
  
  return (
    <div className={`glow-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
      isAlert ? 'border-red-500/40 bg-red-950/20 hover:border-red-500/60 shadow-lg shadow-red-500/5' : ''
    }`}>
      {/* Background Accent glow */}
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-10 blur-2xl ${
        isAlert ? 'bg-red-500' : colorClass || 'bg-indigo-500'
      }`} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${
          isAlert 
            ? 'bg-red-500/15 text-red-400' 
            : 'bg-slate-800/80 text-indigo-400 border border-slate-700/50'
        }`}>
          <Icon size={20} className={isAlert ? 'animate-pulse' : ''} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-4xl font-extrabold tracking-tight text-white">
          {value !== undefined && value !== null ? value : '--'}
        </span>
        <span className="text-slate-400 font-medium text-sm">{unit}</span>
      </div>

      <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-slate-800/60">
        <span className={`w-2 h-2 rounded-full ${
          isAlert ? 'bg-red-500 animate-ping-slow' : 'bg-emerald-500'
        }`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          isAlert ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {isAlert ? 'Threshold Breached' : 'Normal State'}
        </span>
        <span className="text-xs text-slate-500 ml-auto font-mono">
          {threshold}
        </span>
      </div>
    </div>
  );
}
