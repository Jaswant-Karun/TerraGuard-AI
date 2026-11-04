"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CloudRain, Flame, Plus, Wind, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CitizenReportItem } from "@/types/dashboard";

interface Props {
  reports: CitizenReportItem[];
}

export function RecentReportsList({ reports }: Props) {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "FLOOD":
        return <CloudRain className="h-4 w-4 text-cyan-600" />;
      case "AIR_POLLUTION":
        return <Wind className="h-4 w-4 text-blue-600" />;
      case "FIRE":
        return <Flame className="h-4 w-4 text-rose-600" />;
      default:
        return <Wrench className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge variant="low">Verified</Badge>;
      case "DISPATCHED":
        return <Badge variant="moderate">Dispatched</Badge>;
      case "AI_ANALYZED":
        return <Badge variant="cyan">AI Analyzed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Recent Public Hazard Submissions
          </h2>
          <Link
            href="/dashboard/report"
            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-800 transition bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg"
          >
            <Plus className="h-3 w-3" />
            File Report
          </Link>
        </div>

        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent hazard reports filed for this sector.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 shadow-xs">
                      {getCategoryIcon(rep.category)}
                    </div>
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {rep.title}
                    </span>
                  </div>
                  {getStatusBadge(rep.status)}
                </div>

                {rep.description && (
                  <p className="text-xs text-slate-600 line-clamp-1 mb-1.5">
                    {rep.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60">
                  <span className="truncate max-w-[200px] text-slate-600 font-medium">
                    {rep.address || "Location via GPS Coordinates"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[10px]">
                      Sev {rep.severity}/5
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rep.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
