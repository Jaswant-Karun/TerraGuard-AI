"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CloudRain,
  Compass,
  Crosshair,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  Globe2,
  HeartPulse,
  History,
  Info,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  Radio,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Thermometer,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { BasemapStyle, LayerConfig } from "../types/studio";
import { BASEMAP_STYLES } from "../services/map_studio";

interface StudioControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  basemapStyle: BasemapStyle;
  onSelectBasemapStyle: (style: BasemapStyle) => void;
  layers: LayerConfig[];
  onToggleLayer: (layerId: string) => void;
  onSetLayerOpacity: (layerId: string, opacity: number) => void;
  onShowAllLayers?: () => void;
  onHideAllLayers?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetOrientation?: () => void;
  onLocateMe?: () => void;
  onToggleFullscreen?: () => void;
  onToggleLegend?: () => void;
  isFullscreen?: boolean;
  legendOpen?: boolean;
  userRole?: string;
  isDarkGIS?: boolean;
}

const LAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flood_risk: Waves,
  rainfall: CloudRain,
  temperature: Thermometer,
  heat_risk: Flame,
  air_quality: Wind,
  roads: Compass,
  water_bodies: Droplets,
  drainage: Waves,
  hospitals: HeartPulse,
  emergency_facilities: ShieldAlert,
  shelters: Building2,
  citizen_reports: AlertTriangle,
  verified_incidents: ShieldCheck,
  historical_incidents: History,
};

export function StudioControlPanel({
  isOpen,
  onClose,
  onOpen,
  basemapStyle,
  onSelectBasemapStyle,
  layers,
  onToggleLayer,
  onSetLayerOpacity,
  onShowAllLayers,
  onHideAllLayers,
  onZoomIn,
  onZoomOut,
  onResetOrientation,
  onLocateMe,
  onToggleFullscreen,
  onToggleLegend,
  isFullscreen = false,
  legendOpen = true,
  userRole = "CITIZEN",
  isDarkGIS = true,
}: StudioControlPanelProps) {
  const [stylesExpanded, setStylesExpanded] = useState(true);
  const [environmentalExpanded, setEnvironmentalExpanded] = useState(true);
  const [infrastructureExpanded, setInfrastructureExpanded] = useState(true);
  const [incidentsExpanded, setIncidentsExpanded] = useState(true);
  const [selectedLayerInfo, setSelectedLayerInfo] = useState<LayerConfig | null>(null);

  // Group layers into the 3 Prompt-3 categories
  const environmentalLayers = layers.filter((l) => l.category === "environmental");
  const infrastructureLayers = layers.filter((l) => l.category === "infrastructure");
  const incidentLayers = layers.filter(
    (l) => l.category === "incidents" || l.category === "hazards" || l.category === "reports"
  );

  const activeCount = layers.filter((l) => l.visible).length;
  const isPrivilegedUser = ["ADMIN", "COORDINATOR", "ANALYST"].includes(userRole);

  // Collapsed State: Sleek floating launcher pill
  if (!isOpen) {
    return (
      <button
        onClick={onOpen || onClose}
        className={`absolute top-16 left-3 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xl border shadow-xl backdrop-blur-md transition-all select-none group ${
          isDarkGIS
            ? "bg-slate-950/90 border-slate-700/80 text-white hover:bg-slate-900 hover:border-cyan-500"
            : "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-emerald-600 shadow-slate-900/10"
        }`}
        title="Open Advanced Map Control Panel (Ref Image A)"
      >
        <Layers className="h-4 w-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold tracking-wide">Map Controls</span>
        <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-700">
          {activeCount}
        </span>
      </button>
    );
  }

  const renderLayerRow = (layer: LayerConfig) => {
    // RBAC: mask admin-only layers for normal citizens
    if (layer.adminOnly && !isPrivilegedUser) return null;

    const Icon = LAYER_ICONS[layer.id] || Sliders;

    return (
      <div
        key={layer.id}
        className={`p-2 rounded-lg border transition ${
          layer.visible
            ? isDarkGIS
              ? "bg-slate-900/80 border-slate-700/80"
              : "bg-slate-50 border-slate-200"
            : isDarkGIS
            ? "bg-slate-950/40 border-slate-800/40 opacity-55"
            : "bg-slate-100/50 border-slate-200/50 opacity-55"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onToggleLayer(layer.id)}
            className="flex items-center gap-2 flex-1 text-left min-w-0"
          >
            {layer.visible ? (
              <Eye className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <Icon className={`h-3.5 w-3.5 shrink-0 ${layer.visible ? "text-cyan-400" : "text-slate-500"}`} />
            <span
              className={`font-semibold truncate text-[11px] ${
                layer.visible ? (isDarkGIS ? "text-slate-100" : "text-slate-900") : "text-slate-400"
              }`}
            >
              {layer.name}
            </span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {layer.is_unavailable || layer.availability === "UNAVAILABLE" ? (
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-700">
                OFFLINE
              </span>
            ) : layer.availability === "RATE_LIMITED_CACHE" ? (
              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                CACHED
              </span>
            ) : layer.badge ? (
              <span
                className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                  layer.badge === "PREDICTIVE"
                    ? "bg-purple-900/50 text-purple-300 border border-purple-700"
                    : layer.badge === "VERIFIED"
                    ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                    : layer.badge === "LIVE"
                    ? "bg-rose-900/50 text-rose-300 border border-rose-700 animate-pulse"
                    : "bg-cyan-900/50 text-cyan-300 border border-cyan-700"
                }`}
              >
                {layer.badge}
              </span>
            ) : null}
            <button
              onClick={() => setSelectedLayerInfo(layer)}
              className="p-0.5 text-slate-400 hover:text-cyan-400 transition"
              title="Layer Provenance Info"
            >
              <Info className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Dynamic Opacity Slider */}
        {layer.visible && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-700/30 flex items-center gap-2 text-[10px]">
            <span className="text-slate-400 w-11 shrink-0">Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={layer.opacity}
              onChange={(e) => onSetLayerOpacity(layer.id, parseFloat(e.target.value))}
              aria-label={`${layer.name} opacity`}
              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-slate-400 font-mono w-7 text-right">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`absolute top-12 left-3 z-20 w-80 max-h-[calc(100vh-7.5rem)] flex flex-col rounded-xl border shadow-2xl backdrop-blur-md select-none transition-all duration-200 overflow-hidden ${
        isDarkGIS
          ? "bg-slate-950/92 border-slate-800 text-slate-100"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
      }`}
    >
      {/* Header with Quick Actions */}
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 border-b ${
          isDarkGIS ? "border-slate-800/80 bg-slate-900/40" : "border-slate-200/80 bg-slate-50/70"
        }`}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Map Control Panel
          </span>
          <span
            className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full ${
              isDarkGIS ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "bg-cyan-50 text-cyan-700 border border-cyan-200"
            }`}
          >
            {activeCount}/{layers.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Show / Hide All */}
          {onShowAllLayers && (
            <button
              onClick={onShowAllLayers}
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-cyan-400 hover:bg-slate-800 transition"
              title="Activate All Layers"
            >
              All
            </button>
          )}
          {onHideAllLayers && (
            <button
              onClick={onHideAllLayers}
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-400 hover:bg-slate-800 transition"
              title="Deactivate All Layers"
            >
              None
            </button>
          )}
          <button
            onClick={onClose}
            className={`p-1 rounded-md transition ml-1 ${
              isDarkGIS ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Collapse Map Control Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 text-xs">
        {/* SECTION 1: MAP STYLES (Street, Satellite, Satellite with Labels, Terrain) */}
        <div>
          <button
            onClick={() => setStylesExpanded(!stylesExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wide">
              <MapIcon className="h-3.5 w-3.5 text-cyan-500" />
              1. Basemap Imagery Style
            </span>
            {stylesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {stylesExpanded && (
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(BASEMAP_STYLES) as BasemapStyle[]).map((key) => {
                const style = BASEMAP_STYLES[key];
                const isSelected = basemapStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSelectBasemapStyle(key)}
                    className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? isDarkGIS
                          ? "bg-cyan-950/70 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500 shadow-sm"
                          : "bg-cyan-50 border-cyan-600 text-cyan-900 ring-1 ring-cyan-600 shadow-sm"
                        : isDarkGIS
                        ? "bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-base mb-0.5">{style.thumbnail}</span>
                    <span className="font-bold text-[11px] leading-tight truncate w-full">
                      {style.name}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                      {key === "satellite"
                        ? "Pure Optical"
                        : key === "satellite_labels"
                        ? "Optical + Labels"
                        : key === "street"
                        ? "OSM Streets"
                        : key === "topo"
                        ? "SRTM Contours"
                        : "Tactical Dark"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: ENVIRONMENTAL LAYERS */}
        <div>
          <button
            onClick={() => setEnvironmentalExpanded(!environmentalExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wide">
              <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
              2. Environmental Layers ({environmentalLayers.filter((l) => l.visible).length}/{environmentalLayers.length})
            </span>
            {environmentalExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {environmentalExpanded && (
            <div className="space-y-1.5">
              {environmentalLayers.map(renderLayerRow)}
            </div>
          )}
        </div>

        {/* SECTION 3: INFRASTRUCTURE LAYERS */}
        <div>
          <button
            onClick={() => setInfrastructureExpanded(!infrastructureExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wide">
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              3. Infrastructure Layers ({infrastructureLayers.filter((l) => l.visible).length}/{infrastructureLayers.length})
            </span>
            {infrastructureExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {infrastructureExpanded && (
            <div className="space-y-1.5">
              {infrastructureLayers.map(renderLayerRow)}
            </div>
          )}
        </div>

        {/* SECTION 4: INCIDENT LAYERS */}
        <div>
          <button
            onClick={() => setIncidentsExpanded(!incidentsExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              4. Incident Layers ({incidentLayers.filter((l) => l.visible).length}/{incidentLayers.length})
            </span>
            {incidentsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {incidentsExpanded && (
            <div className="space-y-1.5">
              {incidentLayers.map(renderLayerRow)}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: INTEGRATED MAP TOOLS STRIP */}
      <div
        className={`px-3 py-2 border-t flex items-center justify-between text-xs ${
          isDarkGIS ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
        }`}
      >
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tools</span>
        <div className="flex items-center gap-1 text-slate-300">
          {onLocateMe && (
            <button
              onClick={onLocateMe}
              className="p-1 rounded hover:bg-slate-800 hover:text-cyan-400 transition"
              title="Current GPS Location"
            >
              <Crosshair className="h-3.5 w-3.5" />
            </button>
          )}
          {onZoomIn && (
            <button
              onClick={onZoomIn}
              className="p-1 rounded hover:bg-slate-800 hover:text-cyan-400 transition"
              title="Zoom In (+)"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {onZoomOut && (
            <button
              onClick={onZoomOut}
              className="p-1 rounded hover:bg-slate-800 hover:text-cyan-400 transition"
              title="Zoom Out (-)"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          )}
          {onResetOrientation && (
            <button
              onClick={onResetOrientation}
              className="p-1 rounded hover:bg-slate-800 hover:text-cyan-400 transition"
              title="Reset Compass & Bearing (North Up)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {onToggleLegend && (
            <button
              onClick={onToggleLegend}
              className={`p-1 rounded hover:bg-slate-800 transition ${legendOpen ? "text-cyan-400 font-bold" : "text-slate-400"}`}
              title="Toggle Map Legend"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          )}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-1 rounded hover:bg-slate-800 hover:text-cyan-400 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Layer Info Modal / Drawer (Prompt 6 Real Data Provenance) */}
      {selectedLayerInfo && (
        <div
          className={`p-3 border-t text-xs max-h-64 overflow-y-auto ${
            isDarkGIS ? "bg-slate-900/95 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-300 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-cyan-400 text-[11px] truncate">
              {selectedLayerInfo.name}
            </span>
            <button onClick={() => setSelectedLayerInfo(null)} className="text-slate-400 hover:text-white p-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {(selectedLayerInfo.is_unavailable || selectedLayerInfo.availability === "UNAVAILABLE") && (
            <div className="mb-2 p-1.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[9px] leading-tight">
              ⚠️ <strong>Provider Offline / Rate-Limited:</strong> {selectedLayerInfo.unavailable_reason || "Displaying verified regional fallback."}
            </div>
          )}

          <p className="text-[10px] text-slate-300 mb-2 leading-snug">
            {selectedLayerInfo.description}
          </p>

          <div className="text-[9px] text-slate-300 space-y-1 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-400 font-semibold shrink-0">Source:</span>
              <span className="text-right text-cyan-300 font-medium">{selectedLayerInfo.source_name || selectedLayerInfo.source}</span>
            </div>
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-400 font-semibold shrink-0">Data Type:</span>
              <span className="text-right">{selectedLayerInfo.data_type || "Geospatial Vector / Telemetry"}</span>
            </div>
            {selectedLayerInfo.unit && (
              <div className="flex justify-between items-start gap-1">
                <span className="text-slate-400 font-semibold shrink-0">Unit:</span>
                <span className="text-right font-mono text-purple-300">{selectedLayerInfo.unit}</span>
              </div>
            )}
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-400 font-semibold shrink-0">Last Updated:</span>
              <span className="text-right font-mono">{selectedLayerInfo.last_updated || selectedLayerInfo.updateFrequency}</span>
            </div>
            <div className="flex justify-between items-start gap-1">
              <span className="text-slate-400 font-semibold shrink-0">Coverage:</span>
              <span className="text-right">{selectedLayerInfo.coverage || "Bengaluru Metropolitan Jurisdiction"}</span>
            </div>
            <div className="flex justify-between items-center gap-1">
              <span className="text-slate-400 font-semibold shrink-0">Availability:</span>
              <span
                className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                  selectedLayerInfo.availability === "LIVE_SYNCED"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : selectedLayerInfo.availability === "AVAILABLE"
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                    : selectedLayerInfo.availability === "RATE_LIMITED_CACHE"
                    ? "bg-amber-950 text-amber-300 border border-amber-700"
                    : "bg-rose-950 text-rose-300 border border-rose-700"
                }`}
              >
                {selectedLayerInfo.availability || "AVAILABLE"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-1 pt-0.5 border-t border-slate-800">
              <span className="text-slate-400 font-semibold shrink-0">Data Quality:</span>
              <span className="text-right text-[8.5px] text-slate-300">{selectedLayerInfo.data_quality || "Verified Ground Truth & Telemetry Standards"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
