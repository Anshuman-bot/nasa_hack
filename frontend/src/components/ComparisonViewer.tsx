import React, { useState, useRef } from 'react';
import { Columns, SplitSquareVertical } from 'lucide-react';

interface ComparisonViewerProps {
  beforeDate: string;
  afterDate: string;
  locationName: string;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  beforeDate,
  afterDate,
  locationName,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clamped = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(clamped);
  };

  const renderSyntheticSAR = (isAfter: boolean) => (
    <div className="w-full h-full relative bg-black overflow-hidden select-none">
      <svg className="w-full h-full absolute inset-0 opacity-80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`speckle-${isAfter ? 'after' : 'before'}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" />
          </filter>
          <linearGradient id="terrainGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#terrainGrad)" filter={`url(#speckle-${isAfter ? 'after' : 'before'})`} />

        <path d="M 50 40 L 180 50 L 160 140 L 40 120 Z" fill="#64748b" opacity="0.25" />
        <path d="M 240 180 L 380 200 L 360 300 L 220 280 Z" fill="#64748b" opacity="0.2" />

        <path
          d="M -10 160 Q 120 180 220 140 T 420 180 T 650 150"
          fill="none"
          stroke="#000000"
          strokeWidth={isAfter ? "55" : "22"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {isAfter && (
          <>
            <path
              d="M 120 140 Q 180 220 260 210 Q 230 150 160 130 Z"
              fill="#030712"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <path
              d="M 320 170 Q 390 240 450 210 Q 420 160 360 160 Z"
              fill="#030712"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <path
              d="M 120 140 Q 180 220 260 210 Q 230 150 160 130 Z"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
          </>
        )}

        <line x1="20" y1="260" x2="80" y2="260" stroke="#a3e635" strokeWidth="2" />
        <text x="20" y="252" fill="#a3e635" fontSize="9" fontFamily="monospace">5 km NISAR L-band</text>
      </svg>

      <div className="absolute top-3.5 left-3.5 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
        <span className={isAfter ? 'text-acid-400 font-semibold' : 'text-white font-medium'}>
          {isAfter ? 'After Observation' : 'Before Observation'}
        </span>
        <span className="text-slate-400 ml-2 font-mono">({isAfter ? afterDate : beforeDate})</span>
      </div>

      <div className="absolute bottom-3 right-3 bg-black/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 border border-white/10">
        {isAfter ? 'HV Backscatter: -18.7 dB' : 'HV Backscatter: -11.2 dB'}
      </div>
    </div>
  );

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            SAR Backscatter Multi-Temporal Comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-event baseline vs post-event radar acquisition across {locationName}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10 text-xs">
          <button
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
              viewMode === 'slider' ? 'bg-electric-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Swipe Slider</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
              viewMode === 'side-by-side' ? 'bg-electric-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>
        </div>
      </div>

      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerUp}
          className="relative w-full h-72 rounded-xl overflow-hidden border border-white/10 cursor-ew-resize select-none touch-none"
        >
          <div className="absolute inset-0">
            {renderSyntheticSAR(true)}
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <div className="w-full h-full" style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}>
              {renderSyntheticSAR(false)}
            </div>
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-electric-400 shadow-electric-glow pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black border-2 border-electric-400 flex items-center justify-center text-electric-300 shadow-xl">
              <span className="text-xs font-mono select-none">&harr;</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-72">
          <div className="rounded-xl overflow-hidden border border-white/10">
            {renderSyntheticSAR(false)}
          </div>
          <div className="rounded-xl overflow-hidden border border-white/10">
            {renderSyntheticSAR(true)}
          </div>
        </div>
      )}

      <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
        <span>Dark regions on After observation denote specular reflection of standing floodwater.</span>
        <span className="text-electric-400 font-medium">Drag divider to inspect</span>
      </div>
    </div>
  );
};
