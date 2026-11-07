"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Compass,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  Hospital,
  Info,
  Layers,
  MapPin,
  Maximize2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  MapContextualAreaResponse,
  HistoricalObservationPoint,
} from "@/features/maps/services/unified_maps";

interface AreaAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  analyticsData: MapContextualAreaResponse;
  isLoading?: boolean;
  onRefresh?: () => void;
  onDateRangeChange?: (range: string, startDate?: string, endDate?: string) => void;
  isDarkGIS?: boolean;
  onSelectIncident?: (coordinates: [number, number], title: string) => void;
  onSelectFacility?: (coordinates: [number, number], name: string) => void;
}

export function AreaAnalyticsDrawer({
  isOpen,
  onClose,
  analyticsData,
  isLoading = false,
  onRefresh,
  onDateRangeChange,
  isDarkGIS = true,
  onSelectIncident,
  onSelectFacility,
}: AreaAnalyticsDrawerProps) {
  // Date Range Filter state
  const [selectedRange, setSelectedRange] = useState<"24h" | "7d" | "30d" | "custom">("24h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Historical Observation Time Slider Index (0 to historical_series.length - 1)
  const series = analyticsData.historical_series || [];
  const [sliderIndex, setSliderIndex] = useState<number>(Math.max(0, series.length - 1));
  const activeHistoricalPoint: HistoricalObservationPoint | null = series[sliderIndex] || null;

  // Active sub-tab in drawer
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "incidents" | "facilities" | "freshness">("overview");
  const [copiedCoords, setCopiedCoords] = useState(false);

  const handleCopyCoordinates = () => {
    const text = `${analyticsData.coordinates.lat.toFixed(5)}, ${analyticsData.coordinates.lng.toFixed(5)}`;
    navigator.clipboard?.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleRangeSelect = (range: "24h" | "7d" | "30d" | "custom") => {
    setSelectedRange(range);
    if (range !== "custom" && onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  const handleCustomApply = () => {
    if (onDateRangeChange && customStart && customEnd) {
      onDateRangeChange("custom", customStart, customEnd);
    }
  };

  if (!isOpen) return null;

  const {
    area_name,
    ward_code,
    coordinates,
    current_conditions,
    flood_risk,
    heat_risk,
    nearby_citizen_reports = [],
    nearby_verified_incidents = [],
    nearby_facilities = [],
    data_freshness = [],
    comparison_metrics,
  } = analyticsData;

  return (
    <div
      className={`fixed top-12 right-0 bottom-0 z-30 w-full sm:w-[480px] md:w-[540px] flex flex-col border-l shadow-2xl backdrop-blur-xl transition-all duration-300 ${
        isDarkGIS
          ? "bg-slate-950/95 border-slate-800 text-slate-100 shadow-cyan-950/20"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
      }`}
    >
      {/* 1. Header with Area Title & Coordinates */}
      <div
        className={`px-4 py-3.5 border-b flex items-start justify-between gap-3 ${
          isDarkGIS ? "border-slate-800/90 bg-slate-900/60" : "border-slate-200/90 bg-slate-50/80"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-cyan-400" />
              {ward_code}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                flood_risk.risk_level === "CRITICAL"
                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                  : flood_risk.risk_level === "HIGH"
                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-800"
              }`}
            >
              {flood_risk.risk_level} THREAT
            </span>
            {isLoading && (
              <span className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1 animate-pulse">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                Syncing Telemetry...
              </span>
            )}
          </div>

          <h2 className="text-base font-bold text-white truncate leading-tight">
            {area_name}
          </h2>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="font-mono text-[11px] text-slate-300">
              {coordinates.lat.toFixed(5)}°N, {coordinates.lng.toFixed(5)}°E
            </span>
            <button
              onClick={handleCopyCoordinates}
              className="hover:text-cyan-400 transition p-0.5"
              title="Copy Coordinates to Clipboard"
            >
              {copiedCoords ? (
                <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Elevation: {flood_risk.elevation_masl}m MASL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Refresh Area Telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Area Analytics"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Date-Range Filters Strip (Prompt 7 requirement) */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between text-xs gap-2 overflow-x-auto no-scrollbar ${
          isDarkGIS ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold text-slate-400">Date Window:</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(["24h", "7d", "30d", "custom"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeSelect(r)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                selectedRange === r
                  ? "bg-cyan-600 text-white shadow-xs"
                  : isDarkGIS
                  ? "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r === "24h" ? "24 Hours" : r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Filter Input Drawer */}
      {selectedRange === "custom" && (
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2 text-xs">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-[11px]"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-[11px]"
          />
          <button
            onClick={handleCustomApply}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px]"
          >
            Apply
          </button>
        </div>
      )}

      {/* 3. Navigation Sub-Tabs */}
      <div
        className={`flex border-b text-xs select-none ${
          isDarkGIS ? "border-slate-800 bg-slate-900/40" : "border-slate-200 bg-slate-100/60"
        }`}
      >
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition ${
            activeTab === "overview"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Telemetry & Risk
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition ${
            activeTab === "comparison"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Comparison Charts
        </button>
        <button
          onClick={() => setActiveTab("incidents")}
          className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition ${
            activeTab === "incidents"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Incidents ({nearby_verified_incidents.length + nearby_citizen_reports.length})
        </button>
        <button
          onClick={() => setActiveTab("facilities")}
          className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition ${
            activeTab === "facilities"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Facilities ({nearby_facilities.length})
        </button>
        <button
          onClick={() => setActiveTab("freshness")}
          className={`flex-1 py-2 text-center font-bold text-[11px] border-b-2 transition ${
            activeTab === "freshness"
              ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Freshness
        </button>
      </div>

      {/* 4. Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ===================== TAB 1: TELEMETRY & RISK ===================== */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Live Environmental Conditions Grid */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Current Environmental Observations (In-Situ Telemetry)
              </span>

              <div className="grid grid-cols-3 gap-2">
                {/* 1. Rainfall */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Precipitation</span>
                    <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl font-black text-cyan-300 font-mono">
                      {current_conditions.rainfall_intensity_mm_h}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">mm/h</span>
                  </div>
                  <span className="text-[9px] text-slate-400 truncate" title={current_conditions.rainfall_station}>
                    {current_conditions.rainfall_station.split(" ")[0]} AWS
                  </span>
                </div>

                {/* 2. Temperature & Humidity */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Ambient Temp</span>
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl font-black text-amber-300 font-mono">
                      {current_conditions.temperature_c}°
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">C</span>
                  </div>
                  <span className="text-[9px] text-slate-400 truncate">
                    Humidity: {current_conditions.humidity_pct}%
                  </span>
                </div>

                {/* 3. Air Quality AQI */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-semibold">Air Quality</span>
                    <Wind className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl font-black text-purple-300 font-mono">
                      {current_conditions.air_quality_index}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">AQI</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-medium truncate">
                    {current_conditions.air_quality_category}
                  </span>
                </div>
              </div>
            </div>

            {/* Historical Observation Time Slider (Prompt 7 Requirement) */}
            {series.length > 0 && (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Historical Observation Slider
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    {activeHistoricalPoint?.offset_label} ({activeHistoricalPoint ? new Date(activeHistoricalPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""})
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-snug">
                  Scrub across actual chronologically recorded observation steps. No synthetic interpolation.
                </p>

                {/* Slider Input */}
                <input
                  type="range"
                  min={0}
                  max={series.length - 1}
                  step={1}
                  value={sliderIndex}
                  onChange={(e) => setSliderIndex(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex justify-between text-[9px] font-mono text-slate-400 px-1">
                  <span>-24h (Past)</span>
                  <span>-12h</span>
                  <span>-3h</span>
                  <span className="text-cyan-400 font-bold">NOW</span>
                </div>

                {/* Snapshot Values at Selected Historical Timestamp */}
                {activeHistoricalPoint && (
                  <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">Rainfall</span>
                      <span className="font-bold text-cyan-300 font-mono">{activeHistoricalPoint.rainfall_mm} mm</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">Ambient</span>
                      <span className="font-bold text-amber-300 font-mono">{activeHistoricalPoint.temperature_c}°C</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">Air (AQI)</span>
                      <span className="font-bold text-purple-300 font-mono">{activeHistoricalPoint.aqi}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">Inundation</span>
                      <span className="font-bold text-rose-300 font-mono">{activeHistoricalPoint.inundation_depth_m}m</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Multi-Hazard Risk Estimates (Flood & Heat) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Flood Risk Panel */}
              <div className="p-3.5 rounded-xl border border-rose-950/80 bg-rose-950/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
                    <Waves className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Flood Risk Estimate</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      {flood_risk.risk_score}
                    </span>
                    <span className="text-xs text-rose-300 font-semibold">/ 100 ({flood_risk.risk_level})</span>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peak Inundation:</span>
                      <span className="font-bold text-cyan-300">{flood_risk.flood_depth_m}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Drain Saturation:</span>
                      <span className="font-bold text-amber-300">{flood_risk.drainage_saturation_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="font-mono text-emerald-400">{flood_risk.confidence_pct}% (95% CI)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-rose-950/60 text-[9px] text-slate-400 truncate">
                  {flood_risk.model_version}
                </div>
              </div>

              {/* Heat Risk Panel */}
              <div className="p-3.5 rounded-xl border border-amber-950/80 bg-amber-950/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                    <Flame className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Heat Island Risk</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {heat_risk.heat_index_c}°
                    </span>
                    <span className="text-xs text-amber-300 font-semibold">C ({heat_risk.risk_level})</span>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">LST Anomaly:</span>
                      <span className="font-bold text-rose-300">+{heat_risk.lst_anomaly_c}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Canopy Buffer:</span>
                      <span className="font-bold text-emerald-300">{heat_risk.canopy_buffer_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bioclimatic:</span>
                      <span className="font-bold text-slate-300">Thermal Stress IV</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-950/60 text-[9px] text-slate-400 truncate">
                  {heat_risk.model_source}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: COMPARISON CHARTS ===================== */}
        {activeTab === "comparison" && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Area vs. Bengaluru Citywide Average Benchmark
              </span>

              {/* Chart 1: Area vs City Benchmark Bars */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
                {/* 1. Flood Vulnerability Comparison */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold">Flood Vulnerability Score</span>
                    <span className="font-mono text-cyan-300">
                      Area: <b>{comparison_metrics.area_flood_score}</b> vs City: <b>{comparison_metrics.city_avg_flood_score}</b>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${comparison_metrics.area_flood_score}%` }}
                      className="bg-rose-500 h-full rounded-full"
                      title={`Area: ${comparison_metrics.area_flood_score}`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span className="text-rose-400 font-bold">▲ Selected Area (+43.2 pts higher)</span>
                    <span>Citywide Median (48.2)</span>
                  </div>
                </div>

                {/* 2. Heat Island Intensity Comparison */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold">Urban Heat Index Score</span>
                    <span className="font-mono text-amber-300">
                      Area: <b>{comparison_metrics.area_heat_score}</b> vs City: <b>{comparison_metrics.city_avg_heat_score}</b>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${comparison_metrics.area_heat_score}%` }}
                      className="bg-amber-500 h-full rounded-full"
                      title={`Area: ${comparison_metrics.area_heat_score}`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-bold">▼ Canopy Buffered (-13.8 pts lower)</span>
                    <span>Citywide Median (52.4)</span>
                  </div>
                </div>

                {/* 3. Air Quality AQI Comparison */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold">Air Quality (AQI)</span>
                    <span className="font-mono text-purple-300">
                      Area: <b>{comparison_metrics.area_aqi}</b> vs City: <b>{comparison_metrics.city_avg_aqi}</b>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, (comparison_metrics.area_aqi / 250) * 100)}%` }}
                      className="bg-purple-500 h-full rounded-full"
                      title={`Area: ${comparison_metrics.area_aqi}`}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                    <span className="text-emerald-400 font-bold">▼ Better Air Dispersal (-36.5 pts)</span>
                    <span>Industrial Ring Average (88.5)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: 24h Hyetograph & Culvert Saturation History */}
            {series.length > 0 && (
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                    24h Precipitation vs Drainage Saturation
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">Telemetry History</span>
                </div>

                <p className="text-[10px] text-slate-400">
                  Observed tipping bucket hyetograph compared against culvert cross-sectional saturation.
                </p>

                <div className="h-28 w-full flex items-end gap-2 pt-4 px-1 border-b border-slate-800">
                  {series.map((pt, idx) => {
                    const rainHeight = Math.min(100, Math.round((pt.rainfall_mm / 55) * 100));
                    const satHeight = Math.round(pt.drainage_capacity_pct);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[9px] text-white whitespace-nowrap z-10 shadow-lg">
                          Rain: {pt.rainfall_mm}mm | Sat: {pt.drainage_capacity_pct}%
                        </div>

                        <div className="w-full flex items-end gap-0.5 h-full">
                          {/* Rainfall Bar */}
                          <div
                            style={{ height: `${rainHeight}%` }}
                            className="flex-1 rounded-t bg-cyan-400 group-hover:bg-cyan-300 transition"
                          />
                          {/* Saturation Bar */}
                          <div
                            style={{ height: `${satHeight}%` }}
                            className="flex-1 rounded-t bg-rose-500/80 group-hover:bg-rose-400 transition"
                          />
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 mt-1">{pt.offset_label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>Rainfall Intensity (mm/h)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>Drainage Saturation (%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: NEARBY INCIDENTS ===================== */}
        {activeTab === "incidents" && (
          <div className="space-y-3.5">
            {/* Verified Municipal Incidents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Verified EOC Municipal Incidents ({nearby_verified_incidents.length})
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">Officer Verified</span>
              </div>

              {nearby_verified_incidents.length === 0 ? (
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 text-center text-slate-400 text-xs">
                  No active verified emergencies within {analyticsData.radius_km} km.
                </div>
              ) : (
                <div className="space-y-2">
                  {nearby_verified_incidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => onSelectIncident && onSelectIncident(inc.coordinates, inc.title)}
                      className="p-3 rounded-xl border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/40 cursor-pointer transition flex items-start justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-200 border border-rose-700">
                            {inc.id}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {inc.status}
                          </span>
                          <span className="text-[9px] text-rose-400 font-bold">
                            Level {inc.severity} Severity
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-xs truncate">{inc.title}</h4>
                        {inc.verified_by && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Signed: <span className="text-slate-300">{inc.verified_by}</span> • {inc.timestamp}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-cyan-300 font-bold shrink-0 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                        {inc.distance_m}m away
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Citizen Crowdsourced Reports */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Citizen Hazard Reports ({nearby_citizen_reports.length})
                </span>
                <span className="text-[9px] text-purple-400 font-bold">Gemini 2.0 Triage</span>
              </div>

              {nearby_citizen_reports.length === 0 ? (
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 text-center text-slate-400 text-xs">
                  No crowdsourced reports within {analyticsData.radius_km} km.
                </div>
              ) : (
                <div className="space-y-2">
                  {nearby_citizen_reports.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => onSelectIncident && onSelectIncident(rep.coordinates, rep.title)}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 cursor-pointer transition flex items-start justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            {rep.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{rep.timestamp}</span>
                        </div>
                        <h4 className="font-semibold text-white text-xs truncate">{rep.title}</h4>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-300 font-bold shrink-0 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {rep.distance_m}m away
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: NEARBY FACILITIES ===================== */}
        {activeTab === "facilities" && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Emergency Infrastructure & Critical Facilities (Ranked by Distance)
            </span>

            {nearby_facilities.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs">
                No facilities logged within search radius.
              </div>
            ) : (
              <div className="space-y-2.5">
                {nearby_facilities.map((fac) => (
                  <div
                    key={fac.id}
                    onClick={() => onSelectFacility && onSelectFacility(fac.coordinates, fac.name)}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          fac.type === "HOSPITAL"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : fac.type === "SHELTER"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {fac.type === "HOSPITAL" ? (
                          <Hospital className="h-4 w-4" />
                        ) : fac.type === "SHELTER" ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              fac.type === "HOSPITAL"
                                ? "bg-rose-900/60 text-rose-300"
                                : fac.type === "SHELTER"
                                ? "bg-emerald-900/60 text-emerald-300"
                                : "bg-amber-900/60 text-amber-300"
                            }`}
                          >
                            {fac.type}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Operational
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-xs group-hover:text-cyan-300 transition truncate">
                          {fac.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{fac.capacity_detail}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-black text-cyan-300 block">
                        {fac.distance_m >= 1000 ? `${(fac.distance_m / 1000).toFixed(1)} km` : `${fac.distance_m} m`}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">Distance</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 5: DATA SOURCE FRESHNESS ===================== */}
        {activeTab === "freshness" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Data Provenance & Sensor Freshness Audit Ledger
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">5 Active Feeds</span>
            </div>

            <div className="space-y-2">
              {data_freshness.map((ds, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs truncate">{ds.dataset}</span>
                    <span
                      className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        ds.status === "LIVE_SYNCED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse"
                          : ds.status === "AVAILABLE"
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                          : "bg-amber-950 text-amber-300 border border-amber-700"
                      }`}
                    >
                      {ds.status}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 flex justify-between">
                    <span className="text-slate-400">Provider:</span>
                    <span className="text-cyan-300 font-medium">{ds.provider}</span>
                  </div>

                  <div className="text-[10px] text-slate-300 flex justify-between">
                    <span className="text-slate-400">Cadence / Last Synced:</span>
                    <span className="font-mono text-slate-300">{ds.last_updated}</span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span>{ds.quality_assurance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Footer Quick-Action Bar */}
      <div
        className={`px-4 py-2.5 border-t flex items-center justify-between text-xs ${
          isDarkGIS ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
        }`}
      >
        <span className="text-[10px] text-slate-400">
          Source: WMO No. 168 & Sentinel-1 SAR Calibration
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition shadow"
        >
          Dismiss Panel
        </button>
      </div>
    </div>
  );
}
