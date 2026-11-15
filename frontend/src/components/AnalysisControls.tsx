import React from 'react';
import { MONITORED_LOCATIONS } from '../data/mockAnalysisData';
import { AnalysisMode } from '../types/analysis';
import { MapPin, Calendar, SlidersHorizontal, Play, AlertCircle } from 'lucide-react';

interface AnalysisControlsProps {
  location: string;
  onLocationChange: (loc: string) => void;
  beforeDate: string;
  onBeforeDateChange: (date: string) => void;
  afterDate: string;
  onAfterDateChange: (date: string) => void;
  analysisMode: AnalysisMode;
  onAnalysisModeChange: (mode: AnalysisMode) => void;
  onRunAnalysis: () => void;
  isLoading: boolean;
  dateError: string | null;
  dataSource: 'DEMO' | 'SYNTHETIC' | 'REAL_NISAR' | 'LIVE_CMR';
}

const BADGE = {
  DEMO:       ['NASA DATA TESTBED',   'text-yellow border-yellow/40 bg-yellow/10'],
  SYNTHETIC:  ['SYNTHETIC TEST DATA', 'text-royal-300 border-royal-400/40 bg-royal-950/40'],
  REAL_NISAR: ['REAL NISAR DATA',     'text-yellow border-yellow/40 bg-yellow/10'],
  LIVE_CMR:   ['LIVE NASA NISAR DATA','text-yellow border-yellow/40 bg-yellow/10'],
} as const;

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  location,
  onLocationChange,
  beforeDate,
  onBeforeDateChange,
  afterDate,
  onAfterDateChange,
  analysisMode,
  onAnalysisModeChange,
  onRunAnalysis,
  isLoading,
  dateError,
  dataSource,
}) => {
  return (
    <div className="bg-black/95 backdrop-blur-md border-b border-white/10 px-4 py-3.5 sticky top-20 sm:top-24 z-[1050]">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          {/* Target Region */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-electric-400" />
              <span>Target Region</span>
            </label>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-electric-500 transition-colors cursor-pointer"
              >
                {MONITORED_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-midnight-900 text-white">
                    {loc.name} &bull; {loc.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pre-event Baseline Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-electric-400" />
              <span>Pre-Event Baseline (t₀)</span>
            </label>
            <input
              type="date"
              value={beforeDate}
              onChange={(e) => onBeforeDateChange(e.target.value)}
              className="bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-500 transition-colors"
            />
          </div>

          {/* Post-event Observation Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-acid-400" />
              <span>Post-Event Scene (t₁)</span>
            </label>
            <input
              type="date"
              value={afterDate}
              onChange={(e) => onAfterDateChange(e.target.value)}
              className="bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-electric-500 transition-colors"
            />
          </div>

          {/* Analysis Mode */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-electric-400" />
              <span>Analysis Mode</span>
            </label>
            <select
              value={analysisMode}
              onChange={(e) => onAnalysisModeChange(e.target.value as AnalysisMode)}
              className="bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-electric-500 transition-colors cursor-pointer"
            >
              <option value="flood" className="bg-midnight-900 text-white">Flood Inundation (Specular Drop)</option>
              <option value="agriculture" className="bg-midnight-900 text-white">Agriculture (Biomass & Soil Saturation)</option>
              <option value="cryosphere" className="bg-midnight-900 text-white">Cryosphere (Glacier Retreat & Ice Velocity)</option>
              <option value="deformation" className="bg-midnight-900 text-white">Deformation (InSAR Seismic & Subsidence)</option>
              <option value="surface_change" className="bg-midnight-900 text-white">General Surface Disturbance</option>
            </select>
          </div>
        </div>

        {/* Action Button & Demo Label */}
        <div className="flex items-center gap-3 self-end xl:self-center">
          {/* Data Source Badge */}
          <div className={`px-3 py-1.5 rounded-full border bg-white/[0.04] font-mono text-[11px] font-semibold ${BADGE[dataSource][1]}`}>
            {BADGE[dataSource][0]}
          </div>

          <button
            onClick={onRunAnalysis}
            disabled={isLoading || Boolean(dateError)}
            className="w-full xl:w-auto px-7 py-2.5 rounded-full bg-royal-600 hover:bg-royal-500 disabled:bg-white/10 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-anton tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(23,73,216,0.5)] transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
                <span className="text-yellow">PROCESSING RADAR...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-yellow text-yellow" />
                <span>RUN ANALYSIS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date Validation Alert if invalid */}
      {dateError && (
        <div className="mt-2.5 max-w-7xl mx-auto flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3.5 py-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{dateError}</span>
        </div>
      )}
    </div>
  );
};
