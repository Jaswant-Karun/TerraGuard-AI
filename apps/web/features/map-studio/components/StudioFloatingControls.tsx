"use client";

import React, { useState } from "react";
import {
  Compass,
  Crosshair,
  MapPin,
  Minus,
  Plus,
  Search,
  RotateCw,
  Box,
} from "lucide-react";
import { MapPreset } from "../types/studio";

interface StudioFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggle3D: () => void;
  is3DActive: boolean;
  onSearchSelect: (query: string) => void;
  presets: MapPreset[];
  isDarkGIS?: boolean;
}

export function StudioFloatingControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggle3D,
  is3DActive,
  onSearchSelect,
  presets,
  isDarkGIS = true,
}: StudioFloatingControlsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredPresets = presets.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.subtext.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Top Center Search Bar (Reference Image A) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-80 md:w-96">
        <div
          className={`relative flex items-center rounded-xl border shadow-xl backdrop-blur-md transition-all ${
            isDarkGIS
              ? "bg-slate-950/85 border-slate-700/80 text-white focus-within:border-cyan-500"
              : "bg-white/95 border-slate-300 text-slate-900 focus-within:border-emerald-600 shadow-slate-900/10"
          }`}
        >
          <Search className="h-4 w-4 ml-3 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search urban sector, culvert or hospital..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full bg-transparent px-3 py-2 text-xs outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSuggestions(false);
              }}
              className="mr-3 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && searchQuery.length > 0 && (
          <div
            className={`absolute top-full mt-1.5 w-full rounded-xl border shadow-2xl backdrop-blur-md overflow-hidden z-30 ${
              isDarkGIS
                ? "bg-slate-950/95 border-slate-800 text-slate-200"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            {filteredPresets.length > 0 ? (
              filteredPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSearchSelect(p.name);
                    setSearchQuery(p.name);
                    setShowSuggestions(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition border-b last:border-0 ${
                    isDarkGIS
                      ? "border-slate-800/60 hover:bg-slate-900 text-slate-200"
                      : "border-slate-100 hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="font-semibold truncate">{p.name}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      p.risk_level === "CRITICAL"
                        ? "bg-rose-900/50 text-rose-300"
                        : "bg-amber-900/50 text-amber-300"
                    }`}
                  >
                    {p.risk_level}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching sectors found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Right Map Zoom & Orientation Tools */}
      <div className="absolute top-16 right-3 z-20 flex flex-col gap-1.5 select-none">
        <div
          className={`flex flex-col rounded-xl border shadow-xl backdrop-blur-md overflow-hidden ${
            isDarkGIS
              ? "bg-slate-950/90 border-slate-800 text-slate-200"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10"
          }`}
        >
          <button
            onClick={onZoomIn}
            className={`p-2 transition border-b ${
              isDarkGIS ? "border-slate-800 hover:bg-slate-900 hover:text-white" : "border-slate-200 hover:bg-slate-100"
            }`}
            title="Zoom In (+)"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onZoomOut}
            className={`p-2 transition ${
              isDarkGIS ? "hover:bg-slate-900 hover:text-white" : "hover:bg-slate-100"
            }`}
            title="Zoom Out (-)"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* 3D Tilt & Reset Centroid */}
        <div
          className={`flex flex-col rounded-xl border shadow-xl backdrop-blur-md overflow-hidden ${
            isDarkGIS
              ? "bg-slate-950/90 border-slate-800 text-slate-200"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10"
          }`}
        >
          <button
            onClick={onToggle3D}
            className={`p-2 transition border-b flex items-center justify-center ${
              is3DActive
                ? "bg-cyan-600 text-white font-bold"
                : isDarkGIS
                ? "border-slate-800 hover:bg-slate-900 hover:text-white"
                : "border-slate-200 hover:bg-slate-100"
            }`}
            title="Toggle 3D Oblique Perspective"
          >
            <Box className="h-4 w-4" />
          </button>

          <button
            onClick={onResetView}
            className={`p-2 transition flex items-center justify-center ${
              isDarkGIS ? "hover:bg-slate-900 hover:text-white" : "hover:bg-slate-100"
            }`}
            title="Recenter to Central Command Centroid"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

