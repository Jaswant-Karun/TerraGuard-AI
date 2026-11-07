"use client";

import React, { useState } from "react";
import { Info, X, ChevronDown, ChevronUp, Filter, Eye, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExperienceLegendItem } from "../types/studio";

interface MapStudioLegendProps {
  isOpen: boolean;
  onClose: () => void;
  legendItems?: ExperienceLegendItem[];
  title?: string;
  isDarkGIS?: boolean;
  onFilterCategory?: (category: string) => void;
}

export function MapStudioLegend({
  isOpen,
  onClose,
  legendItems,
  title = "GIS Intelligence Legend",
  isDarkGIS = true,
  onFilterCategory,
}: MapStudioLegendProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleFilter = (label: string) => {
    const nextFilter = activeFilter === label ? null : label;
    setActiveFilter(nextFilter);
    if (onFilterCategory) {
      onFilterCategory(nextFilter || "");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`absolute bottom-20 left-3 z-25 w-72 sm:w-80 rounded-xl border shadow-2xl backdrop-blur-md select-none overflow-hidden ${
          isDarkGIS
            ? "bg-slate-950/92 border-slate-800 text-slate-100"
            : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
        }`}
      >
        {/* Header with Minimize & Close Controls */}
        <div
          className={`flex items-center justify-between px-3 py-2 border-b ${
            isDarkGIS ? "border-slate-800/80 bg-slate-900/50" : "border-slate-200/80 bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider truncate pr-2">
            <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{title}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
              title={isMinimized ? "Expand Legend" : "Minimize Legend"}
              aria-label={isMinimized ? "Expand Legend" : "Minimize Legend"}
            >
              {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition"
              title="Close Legend (Key: L)"
              aria-label="Close Legend"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Legend Content */}
        {!isMinimized && (
          <div className="p-3 space-y-2 text-xs max-h-60 overflow-y-auto">
            {legendItems && legendItems.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                  <span>Layer Symbology</span>
                  <span className="text-[9px] font-mono text-cyan-400/80">Interactive</span>
                </span>
                {legendItems.map((item, idx) => {
                  const isFiltered = activeFilter === item.label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleFilter(item.label)}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-left transition ${
                        isFiltered
                          ? "bg-cyan-950/80 border border-cyan-500/50 text-cyan-200"
                          : "hover:bg-slate-900/60 text-slate-200"
                      }`}
                      title={`Click to highlight or filter: ${item.label}`}
                    >
                      <div className="flex items-center gap-2 text-[11px] min-w-0 pr-1">
                        {item.shape === "line" ? (
                          <span
                            style={{ backgroundColor: item.color }}
                            className="h-1 w-4 rounded-full shrink-0 shadow-xs"
                          />
                        ) : item.shape === "polygon" || item.shape === "square" ? (
                          <span
                            style={{ backgroundColor: item.color }}
                            className="h-2.5 w-2.5 rounded-xs shrink-0 border border-white/30 shadow-xs"
                          />
                        ) : (
                          <span
                            style={{ backgroundColor: item.color }}
                            className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/30 shadow-xs"
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isFiltered && (
                        <span className="text-[8px] font-bold px-1 rounded bg-cyan-500 text-slate-950">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Flood Inundation Severity (m)
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 p-1 rounded bg-rose-950/30 border border-rose-900/40">
                    <span className="h-2.5 w-2.5 rounded-xs bg-rose-500 border border-rose-300 shrink-0" />
                    <span className="truncate text-rose-200">Critical (&gt;0.65m)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded bg-amber-950/30 border border-amber-900/40">
                    <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 border border-amber-300 shrink-0" />
                    <span className="truncate text-amber-200">High (0.35-0.65m)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded bg-yellow-950/30 border border-yellow-900/40">
                    <span className="h-2.5 w-2.5 rounded-xs bg-yellow-400 border border-yellow-200 shrink-0" />
                    <span className="truncate text-yellow-200">Moderate (0.15-0.35m)</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded bg-emerald-950/30 border border-emerald-900/40">
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 border border-emerald-300 shrink-0" />
                    <span className="truncate text-emerald-200">Low (&lt;0.15m)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Micro Attribution & Disclaimer */}
            <div className="pt-2 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
              <span>GeoJSON & Sensor Bounds</span>
              <span className="font-mono text-cyan-400">WGS84 EPSG:4326</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
