import React from 'react';
import { ScientificMetrics, ProcessingParameters } from '../types/analysis';
import { HelpCircle, Info, ShieldCheck, Binary, Cpu } from 'lucide-react';

interface ScientificTransparencyProps {
  metrics: ScientificMetrics;
  parameters?: ProcessingParameters;
}

export const ScientificTransparency: React.FC<ScientificTransparencyProps> = ({ metrics, parameters }) => {
  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-electric-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            How was this detected?
          </h3>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Binary className="w-3.5 h-3.5 text-electric-400" />
          <span>Physics-Based Radar Metric</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        TerraScan compares radar observations collected at different times and identifies regions where radar backscatter changes significantly.
      </p>

      {/* Scientific Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="bg-black/60 p-3 rounded-xl border border-white/10">
          <div className="text-[10px] text-slate-400">Before (σ⁰)</div>
          <div className="text-sm font-bold text-white mt-1">
            {metrics.beforeBackscatterDb.toFixed(1)} dB
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Pre-event baseline mean</div>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-white/10">
          <div className="text-[10px] text-slate-400">After (σ⁰)</div>
          <div className="text-sm font-bold text-white mt-1">
            {metrics.afterBackscatterDb.toFixed(1)} dB
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Post-event scene mean</div>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-white/10">
          <div className="text-[10px] text-slate-400">Difference (Δσ⁰)</div>
          <div className="text-sm font-bold text-amber-400 mt-1">
            {metrics.differenceDb.toFixed(1)} dB
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Log-ratio delta</div>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-white/10">
          <div className="text-[10px] text-slate-400">Threshold Cutoff</div>
          <div className="text-sm font-bold text-electric-300 mt-1">
            &le; {metrics.thresholdDb.toFixed(1)} dB
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Bimodal Otsu filter</div>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-white/10 sm:col-span-2">
          <div className="text-[10px] text-slate-400">Classification Method</div>
          <div className="text-xs font-semibold text-acid-300 mt-1 truncate">
            {metrics.classificationMethod}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {metrics.radarBand} &bull; {metrics.polarization}
          </div>
        </div>
      </div>

      {/* Processing Parameters if local real pipeline was run */}
      {parameters && (
        <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold border-b border-white/10 pb-1.5">
            <Cpu className="w-3.5 h-3.5 text-acid-400" />
            <span>Local Pipeline Processing Parameters</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500">Pixel Resolution:</span>{' '}
              <span className="text-slate-200">{parameters.pixelResolutionMeters} m</span>
            </div>
            <div>
              <span className="text-slate-500">Processing Mode:</span>{' '}
              <span className="text-slate-200">{parameters.processingMode}</span>
            </div>
            <div>
              <span className="text-slate-500">Valid Pixels:</span>{' '}
              <span className="text-slate-200">{parameters.totalValidPixels.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Changed Pixels:</span>{' '}
              <span className="text-acid-400">{parameters.changedPixelCount.toLocaleString()}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500">NoData Handling:</span>{' '}
              <span className="text-slate-300 text-[10px]">{parameters.nodataHandling}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conservative Scientific Disclaimer */}
      <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
        <Info className="w-4 h-4 text-electric-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">Scientific Disclaimer:</strong>
          TerraScan identifies candidate surface-change regions. Results should be validated with complementary observations before operational use.
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Radar backscatter varies due to roughness, soil moisture permittivity, and look angle.</span>
      </div>
    </div>
  );
};
