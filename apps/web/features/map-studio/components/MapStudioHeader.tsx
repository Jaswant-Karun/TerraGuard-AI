"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  Radio,
  RefreshCw,
  Sun,
  SlidersHorizontal,
  Activity,
  BarChart3,
  Info,
} from "lucide-react";
import { MapPreset, StudioViewMode } from "../types/studio";

interface MapStudioHeaderProps {
  viewMode: StudioViewMode;
  onViewModeChange: (mode: StudioViewMode) => void;
  presets: MapPreset[];
  activePreset: MapPreset;
  onSelectPreset: (preset: MapPreset) => void;
  leftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  legendOpen: boolean;
  onToggleLegend: () => void;
  isAreaAnalyticsOpen?: boolean;
  onToggleAreaAnalytics?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onResetView: () => void;
}

export function MapStudioHeader({
  viewMode,
  onViewModeChange,
  presets,
  activePreset,
  onSelectPreset,
  leftPanelOpen,
  onToggleLeftPanel,
  rightPanelOpen,
  onToggleRightPanel,
  legendOpen,
  onToggleLegend,
  isAreaAnalyticsOpen,
  onToggleAreaAnalytics,
  isFullscreen,
  onToggleFullscreen,
  onResetView,
}: MapStudioHeaderProps) {
  const isDarkGIS = viewMode === "flood-intelligence";

  return (
    <header
      className={`h-14 shrink-0 flex items-center justify-between px-3 md:px-5 border-b select-none transition-colors duration-300 z-30 ${
        isDarkGIS
          ? "bg-[#06121e] border-slate-800 text-white"
          : "bg-[#0f382a] border-emerald-950 text-emerald-50 shadow-md"
      }`}
    >
      {/* Left: Back Link & Command Branding */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
            isDarkGIS
              ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800"
              : "border-emerald-700/60 bg-emerald-900/50 text-emerald-200 hover:text-white hover:bg-emerald-800"
          }`}
          title="Return to Dashboard Overview"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${
              isDarkGIS
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
            }`}
          >
            <Compass className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                TerraGuard <span className={isDarkGIS ? "text-cyan-400" : "text-emerald-400"}>Studio</span>
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                  isDarkGIS
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/40"
                    : "bg-emerald-950/80 text-emerald-300 border-emerald-600/40"
                }`}
              >
                2.0 GIS
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-300/80 font-medium">
              <span className="flex items-center gap-1">
                <Radio className="h-2 w-2 text-rose-400 animate-pulse" />
                Live Telemetry
              </span>
              <span>•</span>
              <span className="text-slate-400">IMD Radar Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: View Mode Switch & Sector Quick-Fly Selector */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Experience Mode Toggle (Reference Image A vs B) */}
        <div
          className={`flex items-center p-1 rounded-lg border text-xs font-semibold ${
            isDarkGIS
              ? "bg-slate-900/80 border-slate-700"
              : "bg-emerald-950/70 border-emerald-800"
          }`}
        >
          <button
            onClick={() => onViewModeChange("operational-gis")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              viewMode === "operational-gis"
                ? "bg-emerald-600 text-white shadow-xs font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Operational GIS (Ref A)
          </button>
          <button
            onClick={() => onViewModeChange("flood-intelligence")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
              viewMode === "flood-intelligence"
                ? "bg-cyan-600 text-white shadow-xs font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark Flood Risk (Ref B)
          </button>
        </div>

        {/* Quick Hotspot Sector Jumper */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <select
            value={activePreset.id}
            onChange={(e) => {
              const match = presets.find((p) => p.id === e.target.value);
              if (match) onSelectPreset(match);
            }}
            aria-label="Target sector"
            className={`text-xs font-medium rounded-lg border px-2.5 py-1.5 transition outline-none cursor-pointer ${
              isDarkGIS
                ? "bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-500"
                : "bg-emerald-900/80 border-emerald-700 text-emerald-100 hover:border-emerald-400"
            }`}
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-slate-900 text-white">
                {preset.name} ({preset.risk_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Toggle Panels & Fullscreen */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLeftPanel}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
            leftPanelOpen
              ? isDarkGIS
                ? "bg-cyan-600 text-white border-cyan-500"
                : "bg-emerald-600 text-white border-emerald-500"
              : isDarkGIS
              ? "bg-slate-900/60 text-slate-300 border-slate-700 hover:text-white"
              : "bg-emerald-900/50 text-emerald-200 border-emerald-700 hover:text-white"
          }`}
          title="Toggle Layers Control Panel (Ref Image A)"
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Layers</span>
        </button>

        <button
          onClick={onToggleRightPanel}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
            rightPanelOpen
              ? isDarkGIS
                ? "bg-cyan-600 text-white border-cyan-500"
                : "bg-emerald-600 text-white border-emerald-500"
              : isDarkGIS
              ? "bg-slate-900/60 text-slate-300 border-slate-700 hover:text-white"
              : "bg-emerald-900/50 text-emerald-200 border-emerald-700 hover:text-white"
          }`}
          title="Toggle Flood Intelligence Panel (Ref Image B)"
        >
          <Activity className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Telemetry</span>
        </button>

        {onToggleAreaAnalytics && (
          <button
            onClick={onToggleAreaAnalytics}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              isAreaAnalyticsOpen
                ? isDarkGIS
                  ? "bg-cyan-600 text-white border-cyan-400 shadow-sm"
                  : "bg-emerald-600 text-white border-emerald-400 shadow-sm"
                : isDarkGIS
                ? "bg-slate-900/60 text-slate-300 border-slate-700 hover:text-white"
                : "bg-emerald-900/50 text-emerald-200 border-emerald-700 hover:text-white"
            }`}
            title="Toggle Contextual Area Analytics & Information Panel (Prompt 7)"
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Area Analytics</span>
          </button>
        )}

        <button
          onClick={onToggleLegend}
          className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
            legendOpen
              ? isDarkGIS
                ? "bg-slate-800 text-cyan-300 border-cyan-600/50"
                : "bg-emerald-800 text-emerald-200 border-emerald-600"
              : isDarkGIS
              ? "bg-slate-900/60 text-slate-300 border-slate-700"
              : "bg-emerald-900/50 text-emerald-200 border-emerald-700"
          }`}
          title="Toggle Map Legend"
        >
          <Info className="h-3.5 w-3.5" />
          <span>Legend</span>
        </button>

        <div className="h-4 w-px bg-slate-700/60 mx-1" />

        <button
          onClick={onResetView}
          className={`p-1.5 rounded-lg border transition ${
            isDarkGIS
              ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
              : "border-emerald-700 bg-emerald-900/50 text-emerald-200 hover:text-white"
          }`}
          title="Reset to City Centroid"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className={`p-1.5 rounded-lg border transition ${
            isDarkGIS
              ? "border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
              : "border-emerald-700 bg-emerald-900/50 text-emerald-200 hover:text-white"
          }`}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
}

