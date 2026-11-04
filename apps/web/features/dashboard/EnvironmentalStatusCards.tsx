"use client";

import React from "react";
import {
  AlertCircle,
  CloudRain,
  Database,
  Flame,
  Radio,
  Thermometer,
  Wind,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnvironmentalStatus } from "@/types/dashboard";

interface Props {
  data: EnvironmentalStatus;
  activeIncidentsCount: number;
}

export function EnvironmentalStatusCards({ data, activeIncidentsCount }: Props) {
  const isAvailable = data.status !== "UNAVAILABLE";

  const getAQILabel = (aqi: number | null) => {
    if (aqi === null) return { label: "N/A", variant: "neutral" as const };
    if (aqi <= 50) return { label: "Good", variant: "low" as const };
    if (aqi <= 100) return { label: "Moderate", variant: "moderate" as const };
    if (aqi <= 150) return { label: "Unhealthy for Sensitive", variant: "high" as const };
    if (aqi <= 200) return { label: "Unhealthy", variant: "critical" as const };
    return { label: "Hazardous", variant: "critical" as const };
  };

  const getRainfallStatus = (mm: number | null) => {
    if (mm === null) return { text: "No Telemetry", color: "text-slate-500" };
    if (mm >= 50) return { text: "Flash Flood Risk (Severe)", color: "text-rose-600 font-bold" };
    if (mm >= 25) return { text: "Heavy Inundation", color: "text-amber-600 font-bold" };
    if (mm >= 5) return { text: "Moderate Rain", color: "text-cyan-600" };
    return { text: "Nominal / Dry", color: "text-emerald-600" };
  };

  const aqiInfo = getAQILabel(data.aqi);
  const rainInfo = getRainfallStatus(data.rainfall_mm);

  return (
    <div className="space-y-3">
      {/* Freshness & Telemetry Source Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Sensor Station:</span>
          <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold">
            {data.station_id || "REGIONAL_AGGREGATE"}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">Source:</span>
          <Badge variant="outline" className="font-bold">
            {data.source}
          </Badge>
          {data.is_sample && (
            <Badge variant="moderate" className="font-semibold">
              Calibrated Benchmark
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          {data.freshness_timestamp ? (
            <span className="flex items-center gap-1 text-[11px]">
              <Radio className="h-3 w-3 text-cyan-600" />
              Telemetry Sync: {new Date(data.freshness_timestamp).toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1 text-[11px]">
              <AlertCircle className="h-3 w-3" />
              Live sensor offline (fallback active)
            </span>
          )}
          {data.anomaly_detected && (
            <Badge variant="critical" pulse className="font-bold">
              Outlier Spike Detected
            </Badge>
          )}
        </div>
      </div>

      {/* 4 Core KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rainfall Readings */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Precipitation (Live)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <CloudRain className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isAvailable && data.rainfall_mm !== null ? `${data.rainfall_mm}` : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-500">mm / hr</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className={rainInfo.color}>{rainInfo.text}</span>
            <span className="text-slate-400 text-[11px]">
              Wind: {data.wind_speed_kmh ?? "—"} km/h
            </span>
          </div>
        </Card>

        {/* Ambient Temperature & Thermal Index */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Temperature
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Thermometer className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isAvailable && data.temperature_c !== null ? `${data.temperature_c}` : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-500">°C</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-600 font-medium">
              Humidity: {data.humidity_pct ?? "—"}%
            </span>
            <span className="text-emerald-600 font-medium">Thermal Safe</span>
          </div>
        </Card>

        {/* Air Quality Index (AQI) */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Air Quality (AQI)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Wind className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {isAvailable && data.aqi !== null ? `${Math.round(data.aqi)}` : "—"}
              </span>
              <span className="text-xs font-semibold text-slate-500">AQI</span>
            </div>
            <Badge variant={aqiInfo.variant} size="sm">
              {aqiInfo.label}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>PM2.5: {data.pm25 ?? "—"} µg/m³</span>
            <span>PM10: {data.pm10 ?? "—"}</span>
          </div>
        </Card>

        {/* Active Verified Incidents */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Incidents
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-extrabold text-rose-600 tracking-tight">
                {activeIncidentsCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">verified</span>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="text-rose-600 font-semibold">Priority Dispatches Active</span>
            <span className="text-slate-400">Response Team 100%</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
