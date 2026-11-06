"use client";

import React from "react";
import { Info, X } from "lucide-react";
import { ExperienceLegendItem } from "../types/studio";

interface MapStudioLegendProps {
  isOpen: boolean;
  onClose: () => void;
  legendItems?: ExperienceLegendItem[];
  title?: string;
  isDarkGIS?: boolean;
}

export function MapStudioLegend({
  isOpen,
  onClose,
  legendItems,
  title = "GIS Intelligence Legend",
  isDarkGIS = true,
}: MapStudioLegendProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute bottom-20 left-3 z-20 w-72 p-3 rounded-xl border shadow-xl backdrop-blur-md select-none transition-all duration-200 ${
        isDarkGIS
          ? "bg-slate-950/90 border-slate-800 text-slate-100"
          : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          <span className="truncate">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5"
          title="Minimize Legend"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {legendItems && legendItems.length > 0 ? (
          <div className="space-y-1.5">
            {legendItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                {item.shape === "line" ? (
                  <span
                    style={{ backgroundColor: item.color }}
                    className="h-1 w-4 rounded-full shrink-0"
                  />
                ) : item.shape === "polygon" || item.shape === "square" ? (
                  <span
                    style={{ backgroundColor: item.color }}
                    className="h-2.5 w-2.5 rounded-sm shrink-0 border border-white/20"
                  />
                ) : (
                  <span
                    style={{ backgroundColor: item.color }}
                    className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/20"
                  />
                )}
                <span className="truncate text-slate-200">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
              Flood Risk Severity Polygons
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-500 border border-rose-300 shrink-0" />
                <span className="truncate">Critical (&gt;0.65m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 border border-amber-300 shrink-0" />
                <span className="truncate">High (0.35-0.65m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-yellow-400 border border-yellow-200 shrink-0" />
                <span className="truncate">Moderate (0.15-0.35m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 border border-emerald-300 shrink-0" />
                <span className="truncate">Low (&lt;0.15m)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
