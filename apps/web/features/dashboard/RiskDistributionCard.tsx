"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RiskDistribution } from "@/types/dashboard";

interface Props {
  data: RiskDistribution;
}

export function RiskDistributionCard({ data }: Props) {
  const total = data.total_zones || 1;

  const sectors = [
    {
      level: "CRITICAL",
      count: data.CRITICAL,
      color: "bg-rose-500",
      textColor: "text-rose-600",
      bgLight: "bg-rose-50 border-rose-200",
      pct: Math.round((data.CRITICAL / total) * 100),
    },
    {
      level: "HIGH",
      count: data.HIGH,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgLight: "bg-amber-50 border-amber-200",
      pct: Math.round((data.HIGH / total) * 100),
    },
    {
      level: "MODERATE",
      count: data.MODERATE,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgLight: "bg-blue-50 border-blue-200",
      pct: Math.round((data.MODERATE / total) * 100),
    },
    {
      level: "LOW",
      count: data.LOW,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgLight: "bg-emerald-50 border-emerald-200",
      pct: Math.round((data.LOW / total) * 100),
    },
  ];

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            Zone Risk Distribution
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {data.total_zones} Monitored Zones
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Municipal administrative sectors categorized by current AI threat index.
        </p>

        {/* Multi-segment Progress Bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 mb-5">
          {sectors.map(
            (s) =>
              s.count > 0 && (
                <div
                  key={s.level}
                  style={{ width: `${s.pct}%` }}
                  className={`${s.color} transition-all duration-500`}
                  title={`${s.level}: ${s.count} zones (${s.pct}%)`}
                />
              )
          )}
        </div>

        {/* Zone Breakdown Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {sectors.map((s) => (
            <div
              key={s.level}
              className={`flex flex-col p-2.5 rounded-lg border ${s.bgLight}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${s.textColor}`}>
                  {s.level}
                </span>
                <span className="text-xs font-bold text-slate-700">{s.pct}%</span>
              </div>
              <span className="text-xl font-extrabold text-slate-900 mt-0.5">
                {s.count}{" "}
                <span className="text-[10px] font-normal text-slate-500">zones</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Active Mitigation In Progress</span>
        <span className="font-semibold text-cyan-600">Automated Siren Armed</span>
      </div>
    </Card>
  );
}

