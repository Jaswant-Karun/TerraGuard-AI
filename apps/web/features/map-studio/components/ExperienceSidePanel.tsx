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
  Workflow,
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
  // Collapsed Launcher Pill (Compact, docked top-right)
  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        onClick={onOpen || onClose}
        className="absolute top-14 right-3 z-25 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-[#0B132B]/95 text-white shadow-xl backdrop-blur-md transition-all select-none group min-h-[34px] hover:bg-slate-800 hover:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400"
        title="Open Domain Intelligence Drawer (Key: ])"
        aria-label="Open Domain Intelligence Drawer"
      >
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
          {experienceMeta.index}
        </span>
        <span className="text-[11px] font-bold text-white tracking-wide">Domain Insights</span>
        <ArrowRight className="h-3 w-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>
    );
  }

  const data = experienceData?.side_panel_data || {};
  const metrics = experienceData?.metrics || {};
  const hasMetrics = Object.keys(metrics).length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 280 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 280 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="absolute top-14 right-3 z-25 w-[280px] sm:w-[290px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-8.5rem)] flex flex-col rounded-xl border border-cyan-500/40 bg-[#0A1128]/98 text-white shadow-2xl backdrop-blur-xl select-none overflow-hidden"
        role="region"
        aria-label="Domain Intelligence Panel"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/20 bg-[#070D1E]/90 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40">
              {experienceMeta.index}
            </span>
            <div className="truncate">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white truncate">
                {experienceMeta.name.replace(/^Map \d+ — /, "")}
              </h3>
              <span className="text-[10px] text-cyan-300 font-medium block truncate">
                {experienceMeta.category} Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 min-h-[26px] min-w-[26px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Close Intelligence Panel (Key: ])"
            aria-label="Close Intelligence Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 text-xs">
          {/* Focused Urban Sector Header */}
          <div className="p-2.5 rounded-lg border border-cyan-500/30 bg-[#0F1D38]/90">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9.5px] font-bold text-cyan-300 uppercase tracking-wider">
                Focused Location
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  activePreset.risk_level === "CRITICAL"
                    ? "bg-rose-500/30 text-rose-300 border-rose-500/60"
                    : "bg-amber-500/30 text-amber-300 border-amber-500/60"
                }`}
              >
                {activePreset.risk_level} SEVERITY
              </span>
            </div>
            <h4 className="font-bold text-xs text-white truncate">{activePreset.name}</h4>
            <p className="text-[10px] text-slate-300 mt-0.5 truncate">{activePreset.subtext}</p>
          </div>

          {/* Dynamic Key Metrics Grid */}
          {hasMetrics ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(metrics).map(([key, val]) => (
                <div
                  key={key}
                  className="p-2 rounded-lg border border-slate-700/80 bg-[#0F1D38]/95 flex flex-col"
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 truncate">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-bold tracking-tight text-cyan-300 font-mono mt-0.5 truncate">
                    {typeof val === "number" ? val.toLocaleString() : String(val)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="p-2.5 rounded-lg border border-slate-800 bg-[#0F1D38]/60 text-center">
              <ShieldCheck className="h-4 w-4 text-emerald-400 mx-auto mb-1 opacity-80" />
              <p className="text-[11px] font-bold text-white">Nominal Risk Index</p>
              <p className="text-[9.5px] text-slate-300 mt-0.5">
                No active municipal hazards or emergency anomalies recorded in this sector.
              </p>
            </div>
          )}

          {/* Experience-Specific Visual Telemetry Renderers */}
          {experienceMeta.id === "flood-risk-intelligence" && (
            <div className="space-y-2">
              {onOpenExplanation && (
                <button
                  onClick={onOpenExplanation}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-blue-950 via-slate-900 to-cyan-950 border border-cyan-400/50 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all shadow-md group min-h-[34px]"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30">
                      <Waves className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10.5px] font-bold text-white flex items-center gap-1.5">
                        <span>Explain Risk Rationale</span>
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
                          AI
                        </span>
                      </div>
                      <div className="text-[9px] text-cyan-300/90">
                        Why is this area High / Mod / Low risk?
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
              <div className="p-2 rounded-lg border border-slate-700/80 bg-[#0F1D38]/90">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 text-cyan-400" />
                    Observed Rain & ML Projection
                  </span>
                  <span className="text-[8px] text-cyan-300 font-mono">19:00 &rarr; 04:00</span>
                </div>
                <div className="h-14 w-full flex items-end gap-1 pt-1 px-1">
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
                      <span className="text-[7px] font-mono text-slate-400 mt-0.5">
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
                      <span className="text-[7px] font-mono text-purple-300 mt-0.5">
                        {pt.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {data.contributing_factors && (
                <div className="p-2 rounded-lg border border-slate-700/80 bg-[#0F1D38]/70">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-slate-200 block mb-1">
                    Contributing Risk Factors
                  </span>
                  <ul className="space-y-0.5 text-[9.5px] text-slate-300 list-disc list-inside">
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
            <div className="p-2 rounded-lg border border-emerald-500/40 bg-emerald-950/60 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[10.5px]">Recommended Safe Path Computed</span>
              </div>
              <p className="text-[9.5px] text-slate-200 leading-snug">
                Route safely avoids Koramangala 80ft Road Lowland Sump (Culvert 4B backup depth
                0.72m). Diverted via Inner Ring Road elevation ridge.
              </p>
            </div>
          )}

          {/* n8n Event-Driven Automation Sync Card (Prompt 9) */}
          <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/70 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Workflow className="h-3.5 w-3.5" />
                n8n Automation Sync
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-900 border border-emerald-500 text-emerald-200 font-mono text-[9px] font-bold">
                CONFIRMED
              </span>
            </div>
            <p className="text-emerald-100 text-[9.5px] leading-tight font-medium">
              {experienceMeta.id === "verified-incident"
                ? "Linked to WF_02_RISK_THRESHOLD & WF_05_RESPONSE_TASK_CREATION. Verified triage events promote to this map canvas within 30s."
                : experienceMeta.id === "citizen-hazard-report"
                ? "Linked to WF_03_CITIZEN_REPORT_PROCESSING. Ingests submissions with automated duplicate filtering."
                : experienceMeta.id === "live-rainfall-monitoring" || experienceMeta.id === "air-quality-intelligence"
                ? "Linked to WF_01_ENV_MONITORING. Ingests 5-minute telemetry intervals from Open-Meteo & OpenAQ."
                : experienceMeta.id === "infrastructure-emergency-facility"
                ? "Linked to WF_04_ALERT_NOTIFICATION. Dispatches priority warnings to hospitals and transit hubs."
                : "Synchronized with active n8n automation pipelines and MongoDB workflow_logs audit receipts."}
            </p>
          </div>

          {/* Provenance, Attribution & Data Freshness */}
          <div className="p-2.5 rounded-lg border border-slate-700/80 bg-[#070D1E]/95 text-[10px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold text-[9px]">Data Provenance</span>
              <span className="text-cyan-300 font-bold text-[9px]">{experienceMeta.freshness}</span>
            </div>
            <p className="text-slate-200 leading-tight text-[9.5px] font-medium">
              <strong className="text-slate-400">Source:</strong> {experienceMeta.attribution}
            </p>
            {experienceMeta.limitations && (
              <div className="pt-1 border-t border-slate-800 text-amber-200 text-[8.5px] flex items-start gap-1 font-medium">
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
