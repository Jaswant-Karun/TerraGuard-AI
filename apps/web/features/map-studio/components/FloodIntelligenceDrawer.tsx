"use client";

import React from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CloudRain,
  Droplets,
  Gauge,
  TrendingUp,
  Users,
  X,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { FloodRiskGeoJSON, MapPreset, SectorTelemetry } from "../types/studio";

interface FloodIntelligenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: SectorTelemetry;
  floodZones: FloodRiskGeoJSON;
  activePreset: MapPreset;
  isDarkGIS?: boolean;
}

export function FloodIntelligenceDrawer({
  isOpen,
  onClose,
  telemetry,
  floodZones,
  activePreset,
  isDarkGIS = true,
}: FloodIntelligenceDrawerProps) {
  if (!isOpen) return null;

  const totalAtRisk = floodZones.metadata.total_population_at_risk.toLocaleString();
  const criticalCount = floodZones.metadata.critical_zones_count;
  const highCount = floodZones.metadata.high_zones_count;

  return (
    <div
      className={`absolute top-3 right-3 z-20 w-84 max-h-[calc(100vh-5.5rem)] flex flex-col rounded-xl border shadow-2xl backdrop-blur-md select-none transition-all duration-200 overflow-hidden ${
        isDarkGIS
          ? "bg-slate-950/92 border-slate-800 text-slate-100"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3.5 py-3 border-b ${
          isDarkGIS ? "border-slate-800/80 bg-slate-900/40" : "border-slate-200/80 bg-slate-50/70"
        }`}
      >
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-rose-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Flood Risk Intelligence
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
            REF B
          </span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition ${
            isDarkGIS ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Close Telemetry Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 text-xs">
        {/* Active Inspection Sector Banner */}
        <div
          className={`p-2.5 rounded-lg border ${
            isDarkGIS ? "bg-slate-900/80 border-slate-700/80" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Focused Urban Sector
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                activePreset.risk_level === "CRITICAL"
                  ? "bg-rose-900/60 text-rose-200 border border-rose-600"
                  : "bg-amber-900/60 text-amber-200 border border-amber-600"
              }`}
            >
              {activePreset.risk_level} SEVERITY
            </span>
          </div>
          <h3 className="font-bold text-sm text-white truncate">
            {activePreset.name}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
            {activePreset.subtext}
          </p>
        </div>

        {/* Primary Metrics Grid (Reference Image B) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Rainfall Telemetry */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col ${
              isDarkGIS ? "bg-slate-900/50 border-slate-800" : "bg-blue-50/50 border-blue-200"
            }`}
          >
            <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
              <CloudRain className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Precipitation
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black tracking-tight text-white font-mono">
                {telemetry.live_rainfall_rate_mm_h}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">mm/h</span>
            </div>
            <span className="text-[9px] text-rose-400 font-semibold mt-1">
              Convective Cloud Burst
            </span>
          </div>

          {/* Drainage Saturation */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col ${
              isDarkGIS ? "bg-slate-900/50 border-slate-800" : "bg-amber-50/50 border-amber-200"
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-400 mb-1">
              <Gauge className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Drain Saturation
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black tracking-tight text-amber-400 font-mono">
                {telemetry.drainage_saturation_pct}%
              </span>
            </div>
            <span className="text-[9px] text-amber-400 font-semibold mt-1">
              Culvert 4B Surcharged
            </span>
          </div>

          {/* Population At Risk (Reference Image B) */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col ${
              isDarkGIS ? "bg-slate-900/50 border-slate-800" : "bg-rose-50/50 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-1.5 text-rose-400 mb-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Citizens At Risk
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black tracking-tight text-white font-mono">
                {totalAtRisk}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium mt-1">
              Across 5 Urban Catchments
            </span>
          </div>

          {/* Critical Hazard Zones */}
          <div
            className={`p-2.5 rounded-lg border flex flex-col ${
              isDarkGIS ? "bg-slate-900/50 border-slate-800" : "bg-purple-50/50 border-purple-200"
            }`}
          >
            <div className="flex items-center gap-1.5 text-purple-400 mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Threat Zones
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black tracking-tight text-purple-400 font-mono">
                {criticalCount + highCount}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Zones</span>
            </div>
            <span className="text-[9px] text-purple-300 font-medium mt-1">
              {criticalCount} Critical • {highCount} High
            </span>
          </div>
        </div>

        {/* 3-Hour Hyetograph History & +6h ML Projection (Visual Hydrograph Bar Chart) */}
        <div
          className={`p-2.5 rounded-lg border ${
            isDarkGIS ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-cyan-400" />
              Precipitation Hyetograph & ML Projection
            </span>
            <span className="text-[9px] text-slate-400 font-mono">19:00 &rarr; 04:00</span>
          </div>

          <div className="h-24 w-full flex items-end gap-1.5 pt-2 px-1">
            {/* History Bars */}
            {telemetry.hyetograph_history.map((pt, i) => {
              const heightPct = Math.min(100, Math.round((pt.precipitation_mm / 55) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:brightness-125 transition-all"
                  />
                  <span className="text-[8px] font-mono text-slate-400 mt-1 truncate w-full text-center">
                    {pt.timestamp}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute -top-7 bg-slate-900 text-white text-[9px] font-mono px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none whitespace-nowrap z-30">
                    {pt.precipitation_mm}mm
                  </div>
                </div>
              );
            })}

            {/* Vertical Divider */}
            <div className="h-full w-px bg-slate-700/80 mx-0.5" />

            {/* Forecast Bars */}
            {telemetry.forecast_progression.map((pt, i) => {
              const heightPct = Math.min(100, Math.round((pt.precipitation_mm / 55) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-purple-700 to-purple-400 opacity-80 group-hover:opacity-100 transition-all border-dashed border-t border-purple-300"
                  />
                  <span className="text-[8px] font-mono text-purple-300 mt-1 truncate w-full text-center">
                    {pt.timestamp}
                  </span>
                  <div className="absolute -top-7 bg-purple-950 text-purple-200 text-[9px] font-mono px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow pointer-events-none whitespace-nowrap z-30 border border-purple-700">
                    {pt.precipitation_mm}mm ML
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Observed Rain
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              AI Forecast (-24h &rarr; +6h)
            </span>
          </div>
        </div>

        {/* Flood Risk Catchment Breakdown Table */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Catchment Inundation Severity
          </span>
          <div className="space-y-1">
            {floodZones.features.map((feature) => {
              const p = feature.properties;
              return (
                <div
                  key={feature.id}
                  className={`p-2 rounded-lg border flex items-center justify-between transition ${
                    isDarkGIS ? "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          p.risk_level === "CRITICAL"
                            ? "bg-rose-500 animate-ping"
                            : p.risk_level === "HIGH"
                            ? "bg-amber-500"
                            : p.risk_level === "MODERATE"
                            ? "bg-yellow-400"
                            : "bg-emerald-400"
                        }`}
                      />
                      <span className="font-semibold text-[11px] truncate text-slate-200">
                        {p.sector_name}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                      Depth: {p.flood_depth_m}m · {p.population_at_risk.toLocaleString()} citizens
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        p.risk_score >= 80 ? "text-rose-400" : p.risk_score >= 60 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {p.risk_score.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

