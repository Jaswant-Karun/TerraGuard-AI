"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Crosshair,
  MapPin,
  Minus,
  Plus,
  Search,
  Box,
  X,
  Compass,
  AlertTriangle,
  Building2,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter presets based on text query and optional quick category filter
  const filteredPresets = presets.filter((p) => {
    const textMatch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtext.toLowerCase().includes(searchQuery.toLowerCase());
    if (!textMatch) return false;
    if (activeFilter === "CRITICAL") return p.risk_level === "CRITICAL";
    if (activeFilter === "HIGH") return p.risk_level === "HIGH";
    return true;
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredPresets.length === 0) {
      if (e.key === "ArrowDown") {
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % filteredPresets.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? filteredPresets.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = highlightedIndex >= 0 ? filteredPresets[highlightedIndex] : filteredPresets[0];
      if (target) {
        onSearchSelect(target.name);
        setSearchQuery(target.name);
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <>
      {/* Top Center Search Bar & Autocomplete Suggestions */}
      <div
        ref={containerRef}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[92vw] max-w-xs sm:max-w-md md:w-96"
      >
        <div
          className={`relative flex items-center rounded-xl border shadow-xl backdrop-blur-md transition-all ${
            isDarkGIS
              ? "bg-slate-950/90 border-slate-700/80 text-white focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20"
              : "bg-white/95 border-slate-300 text-slate-900 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-slate-900/10"
          }`}
        >
          <Search className="h-4 w-4 ml-3 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-label="Search urban sector, culvert or emergency facility"
            placeholder="Search urban sector, culvert or hospital... (/)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent px-3 py-2.5 text-xs outline-hidden placeholder:text-slate-400"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter(null);
                setShowSuggestions(false);
                setHighlightedIndex(-1);
              }}
              className="mr-3 text-xs text-slate-400 hover:text-white p-1 rounded-md"
              aria-label="Clear search input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block mr-3 text-[10px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700">
              /
            </span>
          )}
        </div>

        {/* Quick Filter Chips (Visible when search is focused) */}
        {showSuggestions && (
          <div className="flex items-center gap-1.5 mt-1 px-1">
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "CRITICAL" ? null : "CRITICAL")}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition ${
                activeFilter === "CRITICAL"
                  ? "bg-rose-950 text-rose-300 border-rose-600"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              Critical Risk Only
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === "HIGH" ? null : "HIGH")}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition ${
                activeFilter === "HIGH"
                  ? "bg-amber-950 text-amber-300 border-amber-600"
                  : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              High Risk Only
            </button>
          </div>
        )}

        {/* Animated Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`absolute top-full mt-1.5 w-full rounded-xl border shadow-2xl backdrop-blur-md overflow-hidden z-30 ${
                isDarkGIS
                  ? "bg-slate-950/95 border-slate-800 text-slate-200 divide-y divide-slate-850"
                  : "bg-white border-slate-200 text-slate-800 divide-y divide-slate-100"
              }`}
            >
              {filteredPresets.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {filteredPresets.map((p, index) => {
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSearchSelect(p.name);
                          setSearchQuery(p.name);
                          setShowSuggestions(false);
                          setHighlightedIndex(-1);
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition ${
                          isHighlighted
                            ? isDarkGIS
                              ? "bg-cyan-950/70 text-cyan-200 border-l-2 border-cyan-400"
                              : "bg-emerald-50 text-emerald-900 border-l-2 border-emerald-600"
                            : isDarkGIS
                            ? "hover:bg-slate-900/80 text-slate-200"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <MapPin
                            className={`h-3.5 w-3.5 shrink-0 ${
                              p.risk_level === "CRITICAL" ? "text-rose-400" : "text-cyan-400"
                            }`}
                          />
                          <div className="min-w-0">
                            <span className="font-semibold block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {p.subtext}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 border ${
                            p.risk_level === "CRITICAL"
                              ? "bg-rose-950/80 text-rose-300 border-rose-700"
                              : "bg-amber-950/80 text-amber-300 border-amber-700"
                          }`}
                        >
                          {p.risk_level}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-semibold text-slate-300">No matching urban sector</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Try searching for &quot;Koramangala&quot;, &quot;Bellandur&quot;, or &quot;HSR Sector&quot;.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Right Map Zoom & Orientation Tools (Touch-friendly & Keyboard accessible) */}
      <div className="absolute top-16 right-3 z-25 flex flex-col gap-2 select-none">
        {/* Zoom Controls */}
        <div
          className={`flex flex-col rounded-xl border shadow-xl backdrop-blur-md overflow-hidden ${
            isDarkGIS
              ? "bg-slate-950/90 border-slate-800 text-slate-200"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10"
          }`}
        >
          <button
            onClick={onZoomIn}
            className={`p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center transition border-b focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-hidden ${
              isDarkGIS
                ? "border-slate-800 hover:bg-slate-900 hover:text-white"
                : "border-slate-200 hover:bg-slate-100"
            }`}
            title="Zoom In (Key: +)"
            aria-label="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onZoomOut}
            className={`p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-hidden ${
              isDarkGIS ? "hover:bg-slate-900 hover:text-white" : "hover:bg-slate-100"
            }`}
            title="Zoom Out (Key: -)"
            aria-label="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* 3D Perspective & Centroid Reset */}
        <div
          className={`flex flex-col rounded-xl border shadow-xl backdrop-blur-md overflow-hidden ${
            isDarkGIS
              ? "bg-slate-950/90 border-slate-800 text-slate-200"
              : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-900/10"
          }`}
        >
          <button
            onClick={onToggle3D}
            className={`p-2.5 min-w-[40px] min-h-[40px] transition border-b flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-hidden ${
              is3DActive
                ? "bg-cyan-600 text-white font-bold"
                : isDarkGIS
                ? "border-slate-800 hover:bg-slate-900 hover:text-white"
                : "border-slate-200 hover:bg-slate-100"
            }`}
            title="Toggle 3D Oblique Perspective (Key: 3)"
            aria-label="Toggle 3D Perspective"
          >
            <Box className="h-4 w-4" />
          </button>

          <button
            onClick={onResetView}
            className={`p-2.5 min-w-[40px] min-h-[40px] transition flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-hidden ${
              isDarkGIS ? "hover:bg-slate-900 hover:text-white" : "hover:bg-slate-100"
            }`}
            title="Recenter to City Command Centroid (Key: 0)"
            aria-label="Recenter Map View"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
