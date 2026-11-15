import React from 'react';
import { AnalysisResult } from '../types/analysis';
import { AlertTriangle, TrendingUp, Gauge, CheckCircle, Calendar, MapPin } from 'lucide-react';

interface AnalysisSummaryCardsProps {
  data: AnalysisResult;
}

export const AnalysisSummaryCards: React.FC<AnalysisSummaryCardsProps> = ({ data }) => {
  return (
    <div className="space-y-3.5">
      {/* Top Main Status Banner */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-subtle-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-acid-400 animate-pulse"></span>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-white font-sans">
                Surface Change Detected
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-electric-400" />
              <span>{data.location}</span>
            </p>
          </div>

          {/* Observation Dates Badge */}
          <div className="flex items-center gap-2 text-xs font-mono bg-white/[0.04] px-3 py-1.5 rounded-full border border-white/10">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">{data.beforeDate}</span>
            <span className="text-electric-400">&rarr;</span>
            <span className="text-acid-300 font-semibold">{data.afterDate}</span>
          </div>
        </div>

        {/* Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block font-mono">CHANGE TYPE</span>
            <span className="text-sm font-semibold text-white flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow" />
              {data.changeType}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 block font-mono">AFFECTED AREA</span>
            <span className="text-2xl font-anton text-yellow tracking-wide mt-0.5 block">
              {data.affectedAreaKm2.toFixed(1)} <span className="text-xs font-mono text-slate-300">KM²</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 block font-mono">VARIANCE</span>
            <span className="text-xl font-anton text-royal-400 tracking-wide flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-4 h-4 text-royal-400" />
              +{data.changePercent.toFixed(1)}%
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 block font-mono">CONFIDENCE</span>
            <span className="text-sm font-semibold text-yellow font-mono flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-3.5 h-3.5 text-yellow" />
              {data.confidence}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Dedicated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Detected Change */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Physical Signal</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-white">
            {data.changeType === 'Possible Flooding' ? 'Specular Attenuation' : 'Roughness Anomaly'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Backscatter loss &gt; 6 dB</div>
        </div>

        {/* Card 2: Affected Area */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium font-mono uppercase">INUNDATED ZONE</span>
            <TrendingUp className="w-3.5 h-3.5 text-royal-400" />
          </div>
          <div className="text-2xl font-anton text-white tracking-wide">
            {data.affectedAreaKm2} <span className="text-xs font-mono text-slate-400">KM²</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Connected component cluster</div>
        </div>

        {/* Card 3: Change Intensity */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Intensity</span>
            <Gauge className="w-3.5 h-3.5 text-acid-400" />
          </div>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${data.changeIntensity === 'High' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
            <span>{data.changeIntensity}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Δ {data.scientificMetrics.differenceDb} dB variance</div>
        </div>

        {/* Card 4: Confidence */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Validation</span>
            <CheckCircle className="w-3.5 h-3.5 text-electric-400" />
          </div>
          <div className="text-sm font-semibold text-white">
            {data.confidence}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Multi-pass co-registered</div>
        </div>
      </div>
    </div>
  );
};
