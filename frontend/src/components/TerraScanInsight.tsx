import React from 'react';
import { AnalysisResult } from '../types/analysis';
import { Sparkles, Terminal } from 'lucide-react';

interface TerraScanInsightProps {
  data: AnalysisResult;
}

export const TerraScanInsight: React.FC<TerraScanInsightProps> = ({ data }) => {
  const generateDeterministicInsight = (): string => {
    if (data.summary) {
      return data.summary;
    }

    const modeText =
      data.analysisMode === 'flood'
        ? 'inundation and surface water expansion'
        : 'surface roughness and moisture variation';

    const deltaSign = data.changePercent >= 0 ? `+${data.changePercent.toFixed(1)}%` : `${data.changePercent.toFixed(1)}%`;

    return `Radar observations indicate substantial surface change concentrated around low-lying areas near the ${data.location}. Approximately ${data.affectedAreaKm2.toFixed(
      1
    )} km² has been flagged as candidate ${modeText}, representing a ${deltaSign} deviation relative to pre-event baseline observations.`;
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-acid-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            TerraScan Insight
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[10px] font-mono text-slate-400 border border-white/10">
          <Terminal className="w-3 h-3 text-electric-400" />
          <span>Deterministic Synthesizer</span>
        </div>
      </div>

      <div className="bg-black/60 rounded-xl p-4 border border-white/10 text-sm text-slate-200 leading-relaxed">
        <p className="border-l-2 border-acid-400 pl-3.5 font-normal">
          &ldquo;{generateDeterministicInsight()}&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>Engine: Rule-Based SAR Synthesizer</span>
        <span className="text-acid-400 font-mono text-[11px]">Zero Cloud / API Cost</span>
      </div>
    </div>
  );
};
