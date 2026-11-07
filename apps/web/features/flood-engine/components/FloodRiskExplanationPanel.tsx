'use client';

import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  X,
  Waves,
  CloudRain,
  Database,
  Cpu,
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { FloodZoneExplanationData } from '../services/flood_visualization';

interface FloodRiskExplanationPanelProps {
  explanation: FloodZoneExplanationData | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectZone?: (zoneId: string) => void;
  availableZones?: Array<{
    zone_id: string;
    sector_name: string;
    risk_category: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  }>;
}

export const FloodRiskExplanationPanel: React.FC<FloodRiskExplanationPanelProps> = ({
  explanation,
  isOpen,
  onClose,
  onSelectZone,
  availableZones,
}) => {
  if (!isOpen || !explanation) return null;

  const {
    zone_id,
    sector_name,
    risk_category,
    risk_score,
    flood_depth_m,
    area_sqkm,
    timestamp,
    data_source,
    model_version,
    confidence_pct,
    uncertainty_range,
    explanation: rationale,
  } = explanation;

  const getBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    }
  };

  const getImpactBadge = (level: string) => {
    switch (level) {
      case 'SEVERE':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'ELEVATED':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-950/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col text-slate-200 animate-in slide-in-from-right duration-300">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                Hydrological Explanation Engine
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${getBadgeStyle(
                  risk_category
                )}`}
              >
                {risk_category} RISK
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight line-clamp-1">
              {sector_name}
            </h2>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Close Rationale Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm custom-scrollbar">
        {/* Core Question & Answer Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800 shadow-inner">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold">
                Why is this area displayed as {risk_category} risk?
              </h3>
              <p className="text-sm font-semibold text-white leading-snug">
                {rationale.headline}
              </p>
              <p className="text-xs text-slate-400 pt-1">
                <span className="text-cyan-400 font-medium">Primary Driver: </span>
                {rationale.primary_driver}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Risk Score</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5 flex items-baseline gap-1">
              <span>{risk_score.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-normal">/100</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Inundation Depth</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5 flex items-baseline gap-1">
              <span>{flood_depth_m.toFixed(2)}m</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Surface Area</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-baseline gap-1">
              <span>{area_sqkm.toFixed(2)}</span>
              <span className="text-xs text-slate-500 font-normal">km²</span>
            </div>
          </div>
        </div>

        {/* Detailed Hydrological Rationale */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hydrological & Topographic Rationale</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {rationale.hydrological_rationale}
          </p>
        </div>

        {/* Contributing Factors Weighted Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Contributing Physical Risk Factors
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Weighted Hydro Model</span>
          </div>

          <div className="space-y-2.5">
            {rationale.contributing_factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {factor.factor_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${getImpactBadge(
                        factor.impact_level
                      )}`}
                    >
                      {factor.impact_level}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {factor.weight_pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      factor.impact_level === 'SEVERE'
                        ? 'bg-red-500'
                        : factor.impact_level === 'ELEVATED'
                        ? 'bg-orange-500'
                        : factor.impact_level === 'MODERATE'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(factor.weight_pct * 2.5, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300">{factor.metric_value}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Municipal Mitigation Protocol */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Recommended Municipal Mitigation Protocol</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {rationale.mitigation_protocol}
          </p>
        </div>

        {/* Scientific Provenance & Data Quality */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Layer Provenance & Scientific Quality</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block font-mono">Data Source</span>
              <span className="text-slate-300 font-medium">{data_source}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-mono">Model Version</span>
              <span className="text-slate-300 font-mono">{model_version}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-mono">Confidence Level</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {confidence_pct}% Verified
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-mono">Uncertainty Bounds</span>
              <span className="text-cyan-400 font-mono">{uncertainty_range}</span>
            </div>
            <div className="col-span-2 pt-1">
              <span className="text-slate-500 block font-mono">Telemetry Timestamp</span>
              <span className="text-slate-400 font-mono">{new Date(timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Zone Quick Switcher */}
        {availableZones && availableZones.length > 1 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Compare Other Basins
            </span>
            <div className="grid grid-cols-2 gap-2">
              {availableZones.map((z) => (
                <button
                  key={z.zone_id}
                  onClick={() => onSelectZone && onSelectZone(z.zone_id)}
                  className={`p-2 rounded-lg text-left text-xs transition-colors border flex flex-col justify-between ${
                    z.zone_id === zone_id
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="font-semibold line-clamp-1">{z.sector_name}</span>
                  <span
                    className={`text-[9px] font-mono mt-1 font-bold ${
                      z.risk_category === 'CRITICAL'
                        ? 'text-red-400'
                        : z.risk_category === 'HIGH'
                        ? 'text-orange-400'
                        : z.risk_category === 'MODERATE'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {z.risk_category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Close */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>Zone ID: {zone_id}</span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-sans text-xs font-medium"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
};

