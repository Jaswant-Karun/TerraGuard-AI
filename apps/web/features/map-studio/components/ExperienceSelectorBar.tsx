"use client";

import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  ChevronDown,
  CloudRain,
  Compass,
  Flame,
  Grid,
  Layers,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { ExperienceId, ExperienceViewMeta } from "../types/studio";

interface ExperienceSelectorBarProps {
  experiences: ExperienceViewMeta[];
  activeExperienceId: ExperienceId;
  onSelectExperience: (id: ExperienceId) => void;
  isDarkGIS?: boolean;
}

const EXPERIENCE_ICONS: Record<ExperienceId, React.ComponentType<{ className?: string }>> = {
  "operational-satellite-gis": Layers,
  "flood-risk-intelligence": Waves,
  "live-rainfall-monitoring": CloudRain,
  "elevation-terrain": Mountain,
  "drainage-water-body": Waves,
  "extreme-heat-risk": Flame,
  "air-quality-intelligence": Wind,
  "citizen-hazard-report": AlertTriangle,
  "verified-incident": ShieldCheck,
  "infrastructure-emergency-facility": Building2,
  "safe-navigation-risk-aware": Navigation,
};

export function ExperienceSelectorBar({
  experiences,
  activeExperienceId,
  onSelectExperience,
  isDarkGIS = true,
}: ExperienceSelectorBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const activeExp = experiences.find((e) => e.id === activeExperienceId) || experiences[0];
  const ActiveIcon = EXPERIENCE_ICONS[activeExperienceId] || Layers;

  return (
    <>
      {/* Sleek Sub-Header Navigation Strip (Ref Image A & B) */}
      <div
        className={`w-full px-3 py-1.5 flex items-center justify-between border-b select-none text-xs z-25 transition-colors ${
          isDarkGIS
            ? "bg-[#040e17] border-slate-800/90 text-slate-300"
            : "bg-[#0c2e22] border-emerald-950 text-emerald-100 shadow-xs"
        }`}
      >
        {/* Left: Active Experience Badge & Switcher Button */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-bold transition shadow-sm shrink-0 ${
              isDarkGIS
                ? "bg-cyan-950/80 border-cyan-600/70 text-cyan-300 hover:bg-cyan-900/90 hover:border-cyan-400"
                : "bg-emerald-900/90 border-emerald-500/70 text-emerald-200 hover:bg-emerald-800"
            }`}
          >
            <ActiveIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-[10px] bg-cyan-500/20 px-1.5 py-0.2 rounded text-cyan-300 border border-cyan-500/30">
              MAP {activeExp?.index || 1} / 11
            </span>
            <span className="text-xs truncate max-w-[200px] sm:max-w-xs">{activeExp?.name}</span>
            <span
              className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded border ${
                activeExp?.badge === "REF IMAGE A"
                  ? "bg-emerald-900 text-emerald-300 border-emerald-500"
                  : activeExp?.badge === "REF IMAGE B"
                  ? "bg-purple-900 text-purple-300 border-purple-500"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {activeExp?.badge}
            </span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>

          {/* Quick-Scroll Horizontal Tabs for Fast Experience Switching */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-700/60">
            {experiences.map((exp) => {
              const isCurrent = exp.id === activeExperienceId;
              const Icon = EXPERIENCE_ICONS[exp.id] || Layers;
              return (
                <button
                  key={exp.id}
                  onClick={() => onSelectExperience(exp.id)}
                  title={`${exp.name} (${exp.subtitle})`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 ${
                    isCurrent
                      ? isDarkGIS
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                        : "bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 shadow-xs"
                      : isDarkGIS
                      ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                      : "text-emerald-300/80 hover:text-white hover:bg-emerald-900/60"
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="font-mono text-[9px] opacity-70">M{exp.index}</span>
                  <span className="truncate max-w-[110px]">{exp.name.replace(/^Map \d+ — /, "")}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Grid Catalogue Trigger */}
        <button
          onClick={() => setModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition shrink-0 ${
            isDarkGIS
              ? "bg-slate-900/70 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800"
              : "bg-emerald-900/70 border-emerald-700 text-emerald-200 hover:text-white hover:bg-emerald-800"
          }`}
        >
          <Grid className="h-3.5 w-3.5" />
          <span>All 11 Maps</span>
        </button>
      </div>

      {/* Full 11 Maps Explorer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
          <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white tracking-tight">
                    TerraGuard AI 2.0 — 11 Specialized Map Intelligence Views
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select an operational GIS layer canvas tailored for specific disaster prevention and civic safety domains.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Grid of All 11 Experiences */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {experiences.map((exp) => {
                const isSelected = exp.id === activeExperienceId;
                const Icon = EXPERIENCE_ICONS[exp.id] || Layers;
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      onSelectExperience(exp.id);
                      setModalOpen(false);
                    }}
                    className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-cyan-950/70 border-cyan-500 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-950/50"
                        : "bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                        <Icon className="h-3.5 w-3.5" />
                        MAP {exp.index}
                      </span>
                      <span
                        className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded border ${
                          exp.badge === "REF IMAGE A"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                            : exp.badge === "REF IMAGE B"
                            ? "bg-purple-950 text-purple-300 border-purple-700"
                            : "bg-slate-900 text-slate-300 border-slate-700"
                        }`}
                      >
                        {exp.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white leading-tight">
                      {exp.name.replace(/^Map \d+ — /, "")}
                    </h3>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {exp.subtitle}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{exp.category}</span>
                      <span className="font-mono uppercase text-cyan-300/80">{exp.default_basemap} basemap</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span>All 11 map views are powered by genuine backend GIS telemetry and verified datasets.</span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
              >
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

