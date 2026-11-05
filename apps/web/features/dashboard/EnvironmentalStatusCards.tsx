"use client";

import React from "react";
import {
  AlertCircle,
  CloudRain,
  Compass,
  Database,
  Flame,
  Mountain,
  Radio,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnvironmentalStatus } from "@/types/dashboard";
import { CurrentEnvironment } from "@/types/environment";

interface Props {
  data: EnvironmentalStatus;
  activeIncidentsCount: number;
  liveEnv?: CurrentEnvironment | null;
}

export function EnvironmentalStatusCards({
  data,
  activeIncidentsCount,
  liveEnv,
}: Props) {
  // Use live readings if available, otherwise fallback to summary data
  const rainfall = liveEnv?.rainfall_mm ?? data.rainfall_mm;
  const temp = liveEnv?.temperature_c ?? data.temperature_c;
  const aqi = liveEnv?.aqi ?? data.aqi;
  const pm25 = liveEnv?.pm25 ?? data.pm25;
  const pm10 = liveEnv?.pm10 ?? data.pm10;
  const humidity = liveEnv?.humidity_pct ?? data.humidity_pct;
  const windSpeed = liveEnv?.wind_speed_kmh ?? data.wind_speed_kmh;
  const weatherCond = liveEnv?.weather_condition ?? "Nominal Urban Baseline";
  const elevation = liveEnv?.elevation_m ?? null;
  const sourceName = liveEnv?.source || data.source;
  const syncTime = liveEnv?.observed_at || data.freshness_timestamp;

  const isAvailable = data.status !== "UNAVAILABLE" || liveEnv !== null;

  const getAQILabel = (val: number | null) => {
    if (val === null) return { label: "N/A", variant: "neutral" as const };
    if (val <= 50) return { label: "Good", variant: "low" as const };
    if (val <= 100) return { label: "Moderate", variant: "moderate" as const };
    if (val <= 150) return { label: "Unhealthy for Sensitive", variant: "high" as const };
    if (val <= 200) return { label: "Unhealthy", variant: "critical" as const };
    return { label: "Hazardous", variant: "critical" as const };
  };

  const getRainfallStatus = (mm: number | null) => {
    if (mm === null) return { text: "No Telemetry", color: "text-slate-500" };
    if (mm >= 50) return { text: "Flash Runoff Risk (Severe)", color: "text-rose-600 font-bold" };
    if (mm >= 25) return { text: "Heavy Inundation", color: "text-amber-600 font-bold" };
    if (mm >= 5) return { text: "Moderate Rain", color: "text-cyan-600 font-medium" };
    return { text: "Nominal / Dry", color: "text-emerald-600" };
  };

  const aqiInfo = getAQILabel(aqi);
  const rainInfo = getRainfallStatus(rainfall);

  return (
    <div className="space-y-3">
      {/* Freshness & Telemetry Source Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Source:</span>
          <Badge variant="outline" className="font-bold">
            {sourceName}
          </Badge>

          {weatherCond && (
            <span className="flex items-center gap-1 font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
              <Sun className="h-3 w-3 text-cyan-600" />
              {weatherCond}
            </span>
          )}

          {elevation !== null && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Mountain className="h-3 w-3 text-slate-400" />
              Elevation: {Math.round(elevation)}m
            </span>
          )}

          {data.is_sample && !liveEnv && (
            <Badge variant="moderate" className="font-semibold">
              Calibrated Benchmark
            </Badge>
          )}

          {liveEnv && (
            <Badge variant="low" className="font-bold">
              Live Open-Meteo Synced
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          {syncTime ? (
            <span className="flex items-center gap-1 text-[11px]">
              <Radio className="h-3 w-3 text-cyan-600" />
              Telemetry Sync: {new Date(syncTime).toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1 text-[11px]">
              <AlertCircle className="h-3 w-3" />
              Sensor offline (fallback active)
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
              {isAvailable && rainfall !== null ? `${rainfall}` : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-500">mm / hr</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className={rainInfo.color}>{rainInfo.text}</span>
            <span className="text-slate-400 text-[11px]">
              Wind: {windSpeed ?? "—"} km/h
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
              {isAvailable && temp !== null ? `${temp}` : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-500">°C</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-600 font-medium">
              Humidity: {humidity ?? "—"}%
            </span>
            <span className="text-emerald-600 font-medium">Thermal Nominal</span>
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
                {isAvailable && aqi !== null ? `${Math.round(aqi)}` : "—"}
              </span>
              <span className="text-xs font-semibold text-slate-500">AQI</span>
            </div>
            <Badge variant={aqiInfo.variant}>
              {aqiInfo.label}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>PM2.5: {pm25 ?? "—"} µg/m³</span>
            <span>PM10: {pm10 ?? "—"}</span>
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

      {/* Legal Source Attribution Footer */}
      {liveEnv?.attribution && (
        <div className="text-[10px] text-slate-400 text-right px-1 select-none">
          Data source: {liveEnv.attribution}
        </div>
      )}
    </div>
  );
}
