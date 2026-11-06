"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Map as MapIcon,
  Radio,
  Sliders,
  Sparkles,
  X,
  Info,
} from "lucide-react";
import { BasemapStyle, LayerConfig } from "../types/studio";
import { BASEMAP_STYLES } from "../services/map_studio";

interface StudioControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  basemapStyle: BasemapStyle;
  onSelectBasemapStyle: (style: BasemapStyle) => void;
  layers: LayerConfig[];
  onToggleLayer: (layerId: string) => void;
  onSetLayerOpacity: (layerId: string, opacity: number) => void;
  isDarkGIS?: boolean;
}

export function StudioControlPanel({
  isOpen,
  onClose,
  basemapStyle,
  onSelectBasemapStyle,
  layers,
  onToggleLayer,
  onSetLayerOpacity,
  isDarkGIS = false,
}: StudioControlPanelProps) {
  const [stylesExpanded, setStylesExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [selectedLayerInfo, setSelectedLayerInfo] = useState<LayerConfig | null>(null);

  if (!isOpen) return null;

  const activeCount = layers.filter((l) => l.visible).length;

  return (
    <div
      className={`absolute top-3 left-3 z-20 w-80 max-h-[calc(100vh-5.5rem)] flex flex-col rounded-xl border shadow-2xl backdrop-blur-md select-none transition-all duration-200 overflow-hidden ${
        isDarkGIS
          ? "bg-slate-950/90 border-slate-800 text-slate-100"
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
          <Layers className="h-4 w-4 text-cyan-500" />
          <span className="text-xs font-bold uppercase tracking-wider">
            GIS Layer Studio
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isDarkGIS ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "bg-cyan-50 text-cyan-700 border border-cyan-200"
            }`}
          >
            {activeCount}/{layers.length} Active
          </span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition ${
            isDarkGIS ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="Close Layers Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 text-xs">
        {/* Section 1: Basemap Style Selector (Reference Image A) */}
        <div>
          <button
            onClick={() => setStylesExpanded(!stylesExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
              <MapIcon className="h-3.5 w-3.5 text-cyan-500" />
              Basemap Imagery Style
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
                          ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500 shadow-sm"
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
                      {key === "satellite" ? "Esri World" : key === "dark" ? "Carto Tactical" : key === "topo" ? "Contours" : "OSM Roads"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Interactive Operational Layers */}
        <div>
          <button
            onClick={() => setLayersExpanded(!layersExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
          >
            <span className="flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
              <Sliders className="h-3.5 w-3.5 text-cyan-500" />
              Operational GIS Layers
            </span>
            {layersExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {layersExpanded && (
            <div className="space-y-2.5">
              {layers.map((layer) => {
                return (
                  <div
                    key={layer.id}
                    className={`p-2.5 rounded-lg border transition ${
                      layer.visible
                        ? isDarkGIS
                          ? "bg-slate-900/80 border-slate-700/80"
                          : "bg-slate-50 border-slate-200"
                        : isDarkGIS
                        ? "bg-slate-950/40 border-slate-800/40 opacity-60"
                        : "bg-slate-100/50 border-slate-200/50 opacity-60"
                    }`}
                  >
                    {/* Layer Header with Eye Toggle */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => onToggleLayer(layer.id)}
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                      >
                        {layer.visible ? (
                          <Eye className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        )}
                        <span
                          className={`font-semibold truncate text-[11px] ${
                            layer.visible ? (isDarkGIS ? "text-slate-100" : "text-slate-900") : "text-slate-400"
                          }`}
                        >
                          {layer.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        {layer.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              layer.badge === "PREDICTIVE"
                                ? "bg-purple-900/40 text-purple-300 border border-purple-700/50"
                                : layer.badge === "CRITICAL"
                                ? "bg-rose-900/40 text-rose-300 border border-rose-700/50"
                                : layer.badge === "LIVE"
                                ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
                                : "bg-cyan-900/40 text-cyan-300 border border-cyan-700/50"
                            }`}
                          >
                            {layer.badge}
                          </span>
                        )}
                        <button
                          onClick={() => setSelectedLayerInfo(layer)}
                          className="p-0.5 text-slate-400 hover:text-cyan-400 transition"
                          title="Layer Metadata"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Opacity Slider (When visible) */}
                    {layer.visible && (
                      <div className="mt-2 pt-2 border-t border-slate-700/30 flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400 w-11 shrink-0">Opacity</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={layer.opacity}
                          onChange={(e) => onSetLayerOpacity(layer.id, parseFloat(e.target.value))}
                          aria-label={`${layer.name} opacity`}
                          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-slate-400 font-mono w-7 text-right">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Layer Info Modal / Drawer (if selected) */}
      {selectedLayerInfo && (
        <div
          className={`p-3 border-t text-xs ${
            isDarkGIS ? "bg-slate-900/90 border-slate-800 text-slate-200" : "bg-slate-100 border-slate-300 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-cyan-400 text-[11px] truncate">
              {selectedLayerInfo.name}
            </span>
            <button onClick={() => setSelectedLayerInfo(null)} className="text-slate-400 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[10px] text-slate-300 mb-1.5 leading-snug">
            {selectedLayerInfo.description}
          </p>
          <div className="text-[9px] text-slate-400 flex flex-col gap-0.5">
            <span><strong>Source:</strong> {selectedLayerInfo.source}</span>
            <span><strong>Cadence:</strong> {selectedLayerInfo.updateFrequency}</span>
          </div>
        </div>
      )}
    </div>
  );
}
