"use client";

import React from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CloudRain,
  Compass,
  Droplets,
  Flame,
  Gauge,
  Info,
  Layers,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  Waves,
  Wind,
  X,
  FileQuestion,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExperienceId,
  ExperienceViewMeta,
  MapPreset,
  MapStudioExperienceResponse,
  SectorTelemetry,
} from "../types/studio";

interface ExperienceSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  experienceMeta: ExperienceViewMeta;
  experienceData: MapStudioExperienceResponse | null;
  telemetry: SectorTelemetry;
  activePreset: MapPreset;
  timeOffsetHours: number;
  isDarkGIS?: boolean;
  onOpenExplanation?: () => void;
}

export function ExperienceSidePanel({
  isOpen,
  onClose,
  onOpen,
  experienceMeta,
  experienceData,
  telemetry,
  activePreset,
  timeOffsetHours,
  isDarkGIS = true,
  onOpenExplanation,
}: ExperienceSidePanelProps) {
  // Collapsed Launcher Pill
  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        onClick={onOpen || onClose}
        className={`absolute top-16 right-3 z-25 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-xl backdrop-blur-md transition-all select-none group min-h-[44px] ${
          isDarkGIS
            ? "bg-slate-950/90 border-slate-700/80 text-white hover:bg-slate-900 hover:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
            : "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-emerald-600 shadow-slate-900/10 focus-visible:ring-2 focus-visible:ring-emerald-400"
        }`}
        title="Open Domain Intelligence Drawer (Key: ])"
        aria-label="Open Domain Intelligence Drawer"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/30">
          {experienceMeta.index}
        </span>
        <span className="text-xs font-bold tracking-wide">Domain Insights</span>
        <ArrowRight className="h-3.5 w-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    );
  }

  const data = experienceData?.side_panel_data || {};
  const metrics = experienceData?.metrics || {};
  const hasMetrics = Object.keys(metrics).length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 340 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 340 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className={`absolute top-12 right-3 z-25 w-[calc(100vw-1.5rem)] sm:w-84 md:w-88 max-h-[calc(100vh-7.5rem)] flex flex-col rounded-xl border shadow-2xl backdrop-blur-md select-none overflow-hidden ${
          isDarkGIS
            ? "bg-slate-950/92 border-slate-800 text-slate-100"
            : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/10"
        }`}
        role="region"
        aria-label="Domain Intelligence Panel"
      >
        {/* Panel Header */}
        <div
          className={`flex items-center justify-between px-3.5 py-3 border-b ${
            isDarkGIS ? "border-slate-800/80 bg-slate-900/40" : "border-slate-200/80 bg-slate-50/70"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
              {experienceMeta.index}
            </span>
            <div className="truncate">
              <h3 className="text-xs font-bold uppercase tracking-wider truncate">
                {experienceMeta.name.replace(/^Map \d+ — /, "")}
              </h3>
              <span className="text-[10px] text-slate-400 block truncate">
                {experienceMeta.category} Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md transition ${
              isDarkGIS
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Close Intelligence Panel (Key: ])"
            aria-label="Close Intelligence Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3.5 text-xs">
          {/* Focused Urban Sector Header */}
          <div
            className={`p-2.5 rounded-lg border ${
              isDarkGIS ? "bg-slate-900/80 border-slate-700/80" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Focused Location
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  activePreset.risk_level === "CRITICAL"
                    ? "bg-rose-900/60 text-rose-200 border-rose-600"
                    : "bg-amber-900/60 text-amber-200 border-amber-600"
                }`}
              >
                {activePreset.risk_level} SEVERITY
              </span>
            </div>
            <h4 className="font-bold text-sm text-white truncate">{activePreset.name}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{activePreset.subtext}</p>
          </div>

          {/* Dynamic Key Metrics Grid */}
          {hasMetrics ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(metrics).map(([key, val]) => (
                <div
                  key={key}
                  className={`p-2.5 rounded-lg border flex flex-col ${
                    isDarkGIS ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-base font-black tracking-tight text-white font-mono mt-0.5 truncate">
                    {typeof val === "number" ? val.toLocaleString() : String(val)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center">
              <ShieldCheck className="h-6 w-6 text-emerald-400 mx-auto mb-1.5 opacity-80" />
              <p className="text-xs font-semibold text-white">Nominal Risk Index</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                No active municipal hazards or emergency anomalies recorded in this sector.
              </p>
            </div>
          )}

          {/* Experience-Specific Visual Telemetry Renderers */}
          {experienceMeta.id === "flood-risk-intelligence" && (
            <div className="space-y-3">
              {onOpenExplanation && (
                <button
                  onClick={onOpenExplanation}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/50 text-cyan-200 hover:text-white hover:border-cyan-400 transition-all shadow-lg group min-h-[44px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30">
                      <Waves className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Explain Risk Rationale</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          AI RATIONALE
                        </span>
                      </div>
                      <div className="text-[10px] text-cyan-400/80">
                        Why is this area High / Mod / Low risk?
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              <div
                className={`p-2.5 rounded-lg border ${
                  isDarkGIS ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-cyan-400" />
                    Observed Rain & ML Projection
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">19:00 &rarr; 04:00</span>
                </div>
                <div className="h-20 w-full flex items-end gap-1.5 pt-2 px-1">
                  {telemetry.hyetograph_history.map((pt, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        style={{
                          height: `${Math.min(
                            100,
                            Math.round((pt.precipitation_mm / 55) * 100)
                          )}%`,
                        }}
                        className="w-full rounded-t bg-cyan-400"
                      />
                      <span className="text-[8px] font-mono text-slate-400 mt-1">
                        {pt.timestamp}
                      </span>
                    </div>
                  ))}
                  <div className="h-full w-px bg-slate-700/80 mx-0.5" />
                  {telemetry.forecast_progression.slice(0, 4).map((pt, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        style={{
                          height: `${Math.min(
                            100,
                            Math.round((pt.precipitation_mm / 55) * 100)
                          )}%`,
                        }}
                        className="w-full rounded-t bg-purple-400 border-dashed border-t border-purple-200"
                      />
                      <span className="text-[8px] font-mono text-purple-300 mt-1">
                        {pt.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {data.contributing_factors && (
                <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300 block mb-1.5">
                    Contributing Risk Factors
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                    {data.contributing_factors.map((f: string, idx: number) => (
                      <li key={idx} className="leading-tight">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* MAP 11: Route Risk Explanation */}
          {experienceMeta.id === "safe-navigation-risk-aware" && (
            <div className="p-2.5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Recommended Safe Path Computed</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Route safely avoids Koramangala 80ft Road Lowland Sump (Culvert 4B backup depth
                0.72m). Diverted via Inner Ring Road elevation ridge.
              </p>
            </div>
          )}

          {/* Provenance, Attribution & Data Freshness */}
          <div
            className={`p-2.5 rounded-lg border text-[10px] space-y-1.5 ${
              isDarkGIS
                ? "bg-slate-900/70 border-slate-800 text-slate-300"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Data Provenance</span>
              <span className="text-cyan-400 font-medium">{experienceMeta.freshness}</span>
            </div>
            <p className="text-slate-300 leading-tight">
              <strong>Source:</strong> {experienceMeta.attribution}
            </p>
            {experienceMeta.limitations && (
              <div className="pt-1.5 border-t border-slate-700/50 text-slate-400 text-[9px] flex items-start gap-1">
                <Info className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                <span>{experienceMeta.limitations}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
