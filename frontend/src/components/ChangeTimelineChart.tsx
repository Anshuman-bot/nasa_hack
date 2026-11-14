import React from 'react';
import { TimelinePoint } from '../types/analysis';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';

interface ChangeTimelineChartProps {
  timeline: TimelinePoint[];
}

export const ChangeTimelineChart: React.FC<ChangeTimelineChartProps> = ({ timeline }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: TimelinePoint = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl text-xs font-mono">
          <div className="font-semibold text-white">{label}</div>
          <div className="text-[10px] text-slate-400 mb-1">Acquisition: {data.date}</div>
          <div className="text-acid-400 font-bold">
            Extent: {data.affectedAreaKm2.toFixed(1)} km²
          </div>
          <div className="text-slate-300">
            Baseline Deviation: {data.baselineDiffPercent > 0 ? `+${data.baselineDiffPercent}%` : `${data.baselineDiffPercent}%`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-electric-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Multi-Temporal Change Progression
          </h3>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          12-Day Orbit Passes
        </div>
      </div>

      <div className="h-48 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="observationName"
              stroke="#64748b"
              fontSize={11}
              fontFamily="inherit"
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              unit=" km²"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="affectedAreaKm2"
              stroke="#60a5fa"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#areaGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
        <span>Baseline: <strong className="text-white font-mono">{timeline[0]?.affectedAreaKm2 || 0} km²</strong></span>
        <span>Latest: <strong className="text-acid-400 font-mono">{timeline[timeline.length - 1]?.affectedAreaKm2 || 0} km²</strong></span>
      </div>
    </div>
  );
};
