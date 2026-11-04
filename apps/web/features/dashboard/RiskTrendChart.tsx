"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { RiskTrendPoint } from "@/types/dashboard";

interface Props {
  data: RiskTrendPoint[];
  timeRange: string;
}

export function RiskTrendChart({ data, timeRange }: Props) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-white border-slate-200 flex flex-col items-center justify-center min-h-[320px] text-slate-400">
        <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm font-semibold">No Risk Trend Telemetry Available</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-600" />
            Predictive Multi-Hazard Threat Indices
          </h2>
          <p className="text-xs text-slate-500">
            Real-time ML risk projection comparing flood runoff vs particulate trap indices ({timeRange.toUpperCase()} window)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-cyan-700">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" /> Flood Runoff
          </span>
          <span className="flex items-center gap-1.5 text-blue-800">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Air Pollution
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Composite Threat
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0B132B",
                borderColor: "#1E293B",
                borderRadius: "8px",
                color: "#F8FAFC",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number, name: string) => {
                const labelMap: Record<string, string> = {
                  flood_risk: "Flood Risk Index",
                  air_risk: "Air Quality Risk",
                  composite_risk: "Composite Severity",
                };
                return [`${value} / 100`, labelMap[name] || name];
              }}
            />
            <Area
              type="monotone"
              dataKey="flood_risk"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#floodGrad)"
            />
            <Area
              type="monotone"
              dataKey="air_risk"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#airGrad)"
            />
            <Area
              type="monotone"
              dataKey="composite_risk"
              stroke="#F43F5E"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#compGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
