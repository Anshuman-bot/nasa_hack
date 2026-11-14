import React from 'react';
import { Flame, Layers } from 'lucide-react';

interface ChangeHeatmapViewerProps {
  locationName: string;
  affectedAreaKm2: number;
}

export const ChangeHeatmapViewer: React.FC<ChangeHeatmapViewerProps> = ({
  locationName,
  affectedAreaKm2,
}) => {
  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Detected Disturbance Heatmap & Intensity
          </h3>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/[0.04] text-acid-400 border border-white/10">
          {affectedAreaKm2} km² flagged
        </div>
      </div>

      <div className="relative w-full h-60 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 600 240">
          <defs>
            <radialGradient id="highHeat1" cx="35%" cy="50%" r="28%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#f97316" stopOpacity="0.65" />
              <stop offset="75%" stopColor="#eab308" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="highHeat2" cx="65%" cy="55%" r="22%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="85%" stopColor="#eab308" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="moderateRibbon" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.1" />
              <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#f97316" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          <rect width="600" height="240" fill="#000000" />

          <g stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="4 4">
            <line x1="100" y1="0" x2="100" y2="240" />
            <line x1="200" y1="0" x2="200" y2="240" />
            <line x1="300" y1="0" x2="300" y2="240" />
            <line x1="400" y1="0" x2="400" y2="240" />
            <line x1="500" y1="0" x2="500" y2="240" />
            <line x1="0" y1="60" x2="600" y2="60" />
            <line x1="0" y1="120" x2="600" y2="120" />
            <line x1="0" y1="180" x2="600" y2="180" />
          </g>

          <path
            d="M 20 140 Q 150 180 280 120 T 560 140"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeOpacity="0.4"
          />

          <path
            d="M 120 110 Q 230 190 340 130 T 480 150"
            fill="none"
            stroke="url(#moderateRibbon)"
            strokeWidth="45"
            strokeLinecap="round"
          />

          <ellipse cx="210" cy="120" rx="90" ry="55" fill="url(#highHeat1)" />
          <ellipse cx="390" cy="130" rx="75" ry="45" fill="url(#highHeat2)" />

          <circle cx="205" cy="120" r="14" fill="#ffffff" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="390" cy="130" r="10" fill="#ffffff" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5" />
        </svg>

        <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] font-mono flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/20"></span>
            <span className="text-slate-400">Unchanged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-amber-300">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="text-red-400 font-semibold">High Intensity</span>
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-black/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 border border-white/10 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-electric-400" />
          <span>Log-Ratio Difference ($\Delta\sigma^0$)</span>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Monitored Sector: <span className="text-white font-medium">{locationName}</span> &bull; Crimson indicates significant backscatter attenuation (&gt; 6.0 dB) indicative of standing open water.
      </div>
    </div>
  );
};
