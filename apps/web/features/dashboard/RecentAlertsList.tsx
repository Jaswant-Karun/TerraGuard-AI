"use client";

import React from "react";
import { AlertCircle, Radio, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertItem } from "@/types/dashboard";

interface Props {
  alerts: AlertItem[];
}

export function RecentAlertsList({ alerts }: Props) {
  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            Active Emergency Broadcasts
          </h2>
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <Radio className="h-3 w-3 animate-pulse" />
            Siren Ready
          </span>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active emergency sirens or civic hazard advisories.
            </div>
          ) : (
            alerts.map((al) => (
              <div
                key={al.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        al.severity === "CRITICAL"
                          ? "critical"
                          : al.severity === "HIGH"
                          ? "high"
                          : "cyan"
                      }
                      className="font-bold uppercase text-[9px]"
                    >
                      {al.severity}
                    </Badge>
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {al.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(al.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">
                  {al.message}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono">
                  <span>Zone: {al.target_zone}</span>
                  <div className="flex items-center gap-1">
                    {al.channels?.map((ch) => (
                      <span
                        key={ch}
                        className="bg-white border border-slate-200 px-1.5 py-0.2 rounded text-[9px] font-semibold text-slate-600"
                      >
                        {ch}
                      </span>
                    ))}
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
