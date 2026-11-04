"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GeographicRiskZone } from "@/types/dashboard";

interface Props {
  zones: GeographicRiskZone[];
}

export function GeographicRiskTable({ zones }: Props) {
  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return <Badge variant="danger" size="sm" className="font-bold">CRITICAL</Badge>;
      case "HIGH":
        return <Badge variant="warning" size="sm" className="font-bold">HIGH</Badge>;
      case "MODERATE":
        return <Badge variant="info" size="sm" className="font-bold">MODERATE</Badge>;
      default:
        return <Badge variant="success" size="sm" className="font-bold">LOW</Badge>;
    }
  };

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-600" />
            Geographic Risk Sector Summary
          </h2>
          <p className="text-xs text-slate-500">
            Spatial threat indices calculated across urban drainage basins and industrial sectors
          </p>
        </div>
        <Link
          href="/dashboard/map"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800 transition bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-lg w-fit"
        >
          <Compass className="h-3.5 w-3.5" />
          Open Live Map View
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/70">
              <th className="py-2.5 px-3">Zone Code</th>
              <th className="py-2.5 px-3">Sector Name</th>
              <th className="py-2.5 px-3">Risk Level</th>
              <th className="py-2.5 px-3">Score (0-100)</th>
              <th className="py-2.5 px-3">Primary Hazard</th>
              <th className="py-2.5 px-3">Population Impact</th>
              <th className="py-2.5 px-3 text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {zones.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No risk zones currently indexed for this location
                </td>
              </tr>
            ) : (
              zones.map((z) => (
                <tr key={z.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {z.zone_code}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {z.name}
                  </td>
                  <td className="py-3 px-3">{getRiskBadge(z.risk_level)}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    <span className="font-mono">{z.composite_risk_score}</span>
                    <span className="text-[10px] text-slate-400"> / 100</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {z.primary_hazard.replace("_", " ")}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {z.estimated_affected_population.toLocaleString()} citizens
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                        z.trend === "RISING"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}
                    >
                      {z.trend}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
