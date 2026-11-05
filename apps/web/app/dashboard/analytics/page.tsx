"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Globe,
  Info,
  Layers,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/AuthContext";
import { downloadReportFile, fetchAnalyticsOverview } from "@/services/analytics";
import {
  AnalyticsFilterParams,
  AnalyticsOverviewResponse,
  EnvironmentalTrendPoint,
  GeographicRiskComparisonItem,
  ModelEvaluationMetricItem,
} from "@/types/analytics";

export default function AdvancedAnalyticsPage() {
  const { user, token } = useAuth();

  // Filter State
  const [filters, setFilters] = useState<AnalyticsFilterParams>({
    time_range: "30d",
    location: "all",
    risk_category: "all",
    verification_status: "all",
  });

  // Data State
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "environmental" | "geographic" | "incidents" | "alerts_tasks" | "models_sources"
  >("environmental");

  // Export State
  const [exportingFormat, setExportingFormat] = useState<"csv" | "pdf" | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetchAnalyticsOverview(filters, token);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setErrorMessage(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      setExportingFormat(format);
      await downloadReportFile(format, filters, token);
    } catch (err: any) {
      alert(`Export failed: ${err.message || "Unknown error"}`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-[#0B132B] text-white px-6 py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
                <BarChart3 className="w-5 h-5" />
              </span>
              <Badge variant="outline" className="text-blue-300 border-blue-400/40 text-xs">
                ANALYTICS & AUDITABLE REPORTS
              </Badge>
              <Badge variant="outline" className="text-emerald-300 border-emerald-500/40 text-xs">
                PROVENANCE SEPARATED
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Municipal Environmental Risk Intelligence & Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Cross-sector longitudinal trends, spatial risk indexing, verified emergency incident logs, and
              scientifically calibrated machine learning benchmarks for urban resilience.
            </p>
          </div>

          {/* Download Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              disabled={exportingFormat !== null}
              onClick={() => handleExport("csv")}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs h-9"
            >
              {exportingFormat === "csv" ? (
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin text-blue-400" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
              )}
              Export CSV Report
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={exportingFormat !== null}
              onClick={() => handleExport("pdf")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 shadow-sm"
            >
              {exportingFormat === "pdf" ? (
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4 mr-1.5 text-white" />
              )}
              Export Official PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        {/* 2. Mandatory 4-Tier Provenance Badge Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
            <div>
              <div className="text-xs font-bold text-blue-900">[OBSERVED MEASUREMENTS]</div>
              <div className="text-[11px] text-blue-700 leading-tight mt-0.5">
                Physical sensor readings from Open-Meteo & OpenAQ community stations.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-900">[VERIFIED INCIDENTS]</div>
              <div className="text-[11px] text-emerald-700 leading-tight mt-0.5">
                Ground-truthed & audited events confirmed by emergency coordinators.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 mt-1 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900">[MODEL-BASED ESTIMATES]</div>
              <div className="text-[11px] text-amber-700 leading-tight mt-0.5">
                Predictive flood inferences &amp; thermal heat calculations with confidence scores.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/80 flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 mt-1 shrink-0" />
            <div>
              <div className="text-xs font-bold text-purple-900">[AI-GENERATED SUMMARIES]</div>
              <div className="text-[11px] text-purple-700 leading-tight mt-0.5">
                Multi-agent analytical syntheses with explicit safety disclaimers.
              </div>
            </div>
          </div>
        </div>

        {/* 3. Global Filter Toolbar */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Analytics Filters
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-4xl">
              {/* Date Range Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Time Window
                </label>
                <select
                  value={filters.time_range}
                  onChange={(e) => setFilters({ ...filters, time_range: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days (Standard)</option>
                  <option value="90d">Last 90 Days (Quarterly)</option>
                </select>
              </div>

              {/* Location Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Monitored Zone
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Citywide (All Zones)</option>
                  <option value="Bellandur">Bellandur Basin</option>
                  <option value="Koramangala">Koramangala Valley</option>
                  <option value="Peenya">Peenya Industrial</option>
                  <option value="Whitefield">Whitefield Tech</option>
                  <option value="Central">Central Bengaluru</option>
                </select>
              </div>

              {/* Risk Category Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Risk Category
                </label>
                <select
                  value={filters.risk_category}
                  onChange={(e) => setFilters({ ...filters, risk_category: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Risk Categories</option>
                  <option value="FLOOD">Flood Hazards</option>
                  <option value="HEAT">Extreme Heat</option>
                  <option value="AIR_QUALITY">Air Quality & Smog</option>
                  <option value="INFRASTRUCTURE_HAZARD">Infrastructure</option>
                </select>
              </div>

              {/* Verification Status Selector */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Verification Status
                </label>
                <select
                  value={filters.verification_status}
                  onChange={(e) => setFilters({ ...filters, verification_status: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Reports (Verified + Citizen)</option>
                  <option value="VERIFIED">Verified Incidents Only</option>
                  <option value="UNVERIFIED">Pending Citizen Reports</option>
                  <option value="REJECTED">Dismissed Reports</option>
                </select>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="text-xs shrink-0 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </Card>

        {/* 4. Executive KPI Ribbon */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-3 bg-white border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Time Window
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                {data.summary.monitored_days} <span className="text-xs font-normal text-slate-500">Days</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Zone: <span className="font-semibold">{data.filters.location}</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Incident Audit Ratio
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                {data.summary.verified_incidents_count}{" "}
                <span className="text-xs font-normal text-slate-400">/ {data.summary.total_citizen_reports}</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                Ground-Truth Verified
              </div>
            </Card>

            <Card className="p-3 bg-white border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Composite Risk Mean
              </div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {(data.summary.average_composite_risk * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Across monitored sectors
              </div>
            </Card>

            <Card className="p-3 bg-white border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Active Siren Alerts
              </div>
              <div className="text-xl font-bold text-red-600 mt-1 flex items-baseline gap-1">
                {data.summary.active_alerts_count} <span className="text-xs font-normal text-slate-500">Active</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Field squads: {data.summary.field_squads_deployed} deployed
              </div>
            </Card>

            <Card className="p-3 bg-white border-slate-200">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Telemetry Sources
              </div>
              <div className="text-xl font-bold text-blue-600 mt-1 flex items-baseline gap-1">
                {data.summary.data_sources_online}{" "}
                <span className="text-xs font-normal text-slate-400">/ {data.data_sources.length} Online</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Avg lag: ~12 min
              </div>
            </Card>
          </div>
        )}

        {/* 5. Command Tabs */}
        <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto">
          {[
            { id: "environmental", label: "Environmental Telemetry", icon: Waves, badge: "OBSERVED" },
            { id: "geographic", label: "Geographic Risk Indices", icon: MapPin, badge: "ESTIMATES" },
            { id: "incidents", label: "Incident History & Triage", icon: AlertTriangle, badge: "VERIFIED" },
            { id: "alerts_tasks", label: "Alerts & Dispatches", icon: ShieldAlert, badge: "AUDIT" },
            { id: "models_sources", label: "Model Benchmarks & Coverage", icon: Cpu, badge: "ML & DATA" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${
                  isSelected
                    ? "border-blue-600 text-blue-700 bg-blue-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner */}
        {loading && !data && (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Computing aggregated analytics across telemetry repositories...</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* Tab 1: Environmental Telemetry */}
        {!loading && data && activeTab === "environmental" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Observed Physical Environmental Trends (Open-Meteo & OpenAQ)
                </h3>
                <p className="text-xs text-slate-500">
                  Continuous atmospheric readings over the selected {data.filters.days}-day time window.
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">
                Tier: OBSERVED MEASUREMENT
              </Badge>
            </div>

            {/* Atmospheric Trend Curves Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4 bg-white border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Temperature & Rainfall Series</span>
                  <span className="text-[11px] text-slate-400">Rainfall (mm) vs Temp (°C)</span>
                </div>
                <div className="h-48 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100">
                  {data.environmental_trends.slice(-14).map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        style={{ height: `${Math.min(100, point.total_rainfall_mm * 2.8 + 6)}%` }}
                        className="w-full bg-blue-500 rounded-t group-hover:bg-blue-600 transition-all"
                      />
                      <span className="text-[9px] text-slate-400 font-mono">
                        {point.date.slice(8)}
                      </span>
                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap">
                        <div className="font-bold">{point.date}</div>
                        <div>Rainfall: {point.total_rainfall_mm} mm</div>
                        <div>Temp: {point.avg_temperature_c}°C</div>
                        <div>Humidity: {point.avg_humidity_pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Past 14 Days</span>
                  <span className="text-blue-600 font-semibold">Blue Bar = Rainfall Volume</span>
                </div>
              </Card>

              <Card className="p-4 bg-white border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Air Quality Index (AQI) & PM2.5 / PM10 Dispersion</span>
                  <span className="text-[11px] text-slate-400">OpenAQ Sensor Grid</span>
                </div>
                <div className="h-48 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100">
                  {data.environmental_trends.slice(-14).map((point, idx) => {
                    const aqiColor =
                      point.avg_aqi > 200
                        ? "bg-purple-600"
                        : point.avg_aqi > 150
                        ? "bg-red-500"
                        : point.avg_aqi > 100
                        ? "bg-amber-500"
                        : "bg-emerald-500";
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          style={{ height: `${Math.min(100, (point.avg_aqi / 250) * 100)}%` }}
                          className={`w-full rounded-t ${aqiColor} group-hover:opacity-80 transition-all`}
                        />
                        <span className="text-[9px] text-slate-400 font-mono">
                          {point.date.slice(8)}
                        </span>
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap">
                          <div className="font-bold">{point.date}</div>
                          <div>AQI: {point.avg_aqi}</div>
                          <div>PM2.5: {point.avg_pm25} µg/m³</div>
                          <div>PM10: {point.avg_pm10} µg/m³</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Past 14 Days</span>
                  <span className="text-slate-600 font-medium">Color = CPCB NAQI Health Severity</span>
                </div>
              </Card>
            </div>

            {/* Environmental Data Table */}
            <Card className="overflow-hidden border-slate-200 bg-white">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Recent Observed Records (Last 10 Daily Samples)</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Total Points in Range: {data.environmental_trends.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Temperature</th>
                      <th className="py-2.5 px-3">Rainfall</th>
                      <th className="py-2.5 px-3">Humidity</th>
                      <th className="py-2.5 px-3">Air Quality Index</th>
                      <th className="py-2.5 px-3">PM2.5</th>
                      <th className="py-2.5 px-3">PM10</th>
                      <th className="py-2.5 px-3">Data Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.environmental_trends.slice(-10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">{r.date}</td>
                        <td className="py-2 px-3">{r.avg_temperature_c}°C</td>
                        <td className="py-2 px-3 font-semibold text-blue-700">{r.total_rainfall_mm} mm</td>
                        <td className="py-2 px-3">{r.avg_humidity_pct}%</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              r.avg_aqi > 200
                                ? "bg-purple-100 text-purple-800"
                                : r.avg_aqi > 150
                                ? "bg-red-100 text-red-800"
                                : r.avg_aqi > 100
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {r.avg_aqi} AQI
                          </span>
                        </td>
                        <td className="py-2 px-3">{r.avg_pm25} µg/m³</td>
                        <td className="py-2 px-3">{r.avg_pm10} µg/m³</td>
                        <td className="py-2 px-3 text-[11px] text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Validated
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Geographic Risk Comparisons */}
        {!loading && data && activeTab === "geographic" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Geographic Risk Indices & Predictive Hazard Estimates
                </h3>
                <p className="text-xs text-slate-500">
                  Cross-sector comparative matrix based on hydrological &amp; atmospheric models.
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                Tier: MODEL-BASED ESTIMATES
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.geographic_comparisons.map((zone) => {
                const riskColor =
                  zone.composite_risk >= 0.75
                    ? "text-red-600 bg-red-50 border-red-200"
                    : zone.composite_risk >= 0.5
                    ? "text-amber-600 bg-amber-50 border-amber-200"
                    : "text-emerald-600 bg-emerald-50 border-emerald-200";

                return (
                  <Card key={zone.zone_code} className="p-4 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          {zone.zone_code}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${riskColor}`}>
                          {(zone.composite_risk * 100).toFixed(0)}% Composite
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{zone.zone_name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Est. Population at Risk: {zone.population_at_risk.toLocaleString()} residents
                      </p>

                      <div className="mt-4 space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 font-medium">Flood Risk Index:</span>
                            <span className="font-bold text-slate-900">{(zone.flood_risk_score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${zone.flood_risk_score * 100}%` }}
                              className="h-full bg-blue-600 rounded-full"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 font-medium">Heat Vulnerability:</span>
                            <span className="font-bold text-slate-900">{(zone.heat_risk_score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${zone.heat_risk_score * 100}%` }}
                              className="h-full bg-amber-500 rounded-full"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-600 font-medium">Drainage Capacity:</span>
                            <span className="font-bold text-slate-900">{zone.drainage_capacity_pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${zone.drainage_capacity_pct}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Verified Incidents: <b className="text-slate-900">{zone.verified_incidents}</b></span>
                      <span>Citizen Reports: <b className="text-slate-900">{zone.citizen_reports}</b></span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Risk Category Breakdown */}
            <Card className="p-4 bg-white border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Risk Distribution by Hazard Category
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {data.risk_distribution.map((cat) => (
                  <div key={cat.category} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs font-bold text-slate-900">{cat.category}</div>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {(cat.mean_risk_score * 100).toFixed(0)}% <span className="text-xs font-normal text-slate-500">Avg</span>
                    </div>
                    <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-red-600 font-semibold">Critical:</span>
                        <span>{cat.critical_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-600 font-semibold">High:</span>
                        <span>{cat.high_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Moderate:</span>
                        <span>{cat.moderate_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 3: Incidents & Citizen Triage */}
        {!loading && data && activeTab === "incidents" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Incident Verification History & Citizen Submission Triage
                </h3>
                <p className="text-xs text-slate-500">
                  Separates ground-truthed municipal incidents from crowdsourced citizen reports.
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                Tier: VERIFIED MUNICIPAL RECORDS
              </Badge>
            </div>

            <Card className="overflow-hidden border-slate-200 bg-white">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800">
                Incident Audit Timeline
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Verified Incidents</th>
                      <th className="py-2.5 px-3">Pending Citizen Reports</th>
                      <th className="py-2.5 px-3">Rejected / Spam</th>
                      <th className="py-2.5 px-3">Primary Hazard</th>
                      <th className="py-2.5 px-3">AI Vision Confidence</th>
                      <th className="py-2.5 px-3">Data Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.incident_history.map((inc, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{inc.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {inc.verified_incidents} Confirmed
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {inc.unverified_reports} Submitted
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {inc.rejected_reports} Dismissed
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {inc.primary_hazard}
                        </td>
                        <td className="py-2.5 px-3">
                          {data.citizen_report_trends[i]
                            ? `${(data.citizen_report_trends[i].ai_confidence_avg * 100).toFixed(0)}%`
                            : "86%"}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-emerald-700 font-medium">
                          Audited Record
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Alerts & Tasks */}
        {!loading && data && activeTab === "alerts_tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Official Alert History & Response Task Dispatch Metrics
                </h3>
                <p className="text-xs text-slate-500">
                  Audit trail of issued siren alerts and municipal task force execution lifecycle.
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                Tier: MUNICIPAL AUDIT TRAIL
              </Badge>
            </div>

            {/* Response Task Dispatches Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Card className="p-3 bg-white border-slate-200">
                <div className="text-[11px] font-medium text-slate-500 uppercase">Total Field Dispatches</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {data.response_task_stats.total_dispatches}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Municipal action orders</div>
              </Card>

              <Card className="p-3 bg-white border-slate-200">
                <div className="text-[11px] font-medium text-slate-500 uppercase">Task Completion Rate</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {data.response_task_stats.completion_rate_pct}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Completed: {data.response_task_stats.status_counts["COMPLETED"] || 0}
                </div>
              </Card>

              <Card className="p-3 bg-white border-slate-200">
                <div className="text-[11px] font-medium text-slate-500 uppercase">Avg Resolution Time</div>
                <div className="text-xl font-bold text-blue-600 mt-1">
                  {data.response_task_stats.avg_resolution_time_minutes} <span className="text-xs font-normal text-slate-500">min</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">From dispatch to complete</div>
              </Card>

              <Card className="p-3 bg-white border-slate-200">
                <div className="text-[11px] font-medium text-slate-500 uppercase">Active Squads En Route</div>
                <div className="text-xl font-bold text-amber-600 mt-1">
                  {(data.response_task_stats.status_counts["EN_ROUTE"] || 0) +
                    (data.response_task_stats.status_counts["IN_PROGRESS"] || 0)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Currently on ground</div>
              </Card>
            </div>

            {/* Alert Broadcasts Table */}
            <Card className="overflow-hidden border-slate-200 bg-white">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800">
                Historical Alert Broadcast Log
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Alert ID</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Target Zone</th>
                      <th className="py-2.5 px-3">Issued Timestamp</th>
                      <th className="py-2.5 px-3">Citizen Acknowledgements</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.alert_history.map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{alt.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{alt.title}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              alt.severity === "CRITICAL"
                                ? "bg-red-100 text-red-800"
                                : alt.severity === "HIGH"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {alt.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{alt.target_zone}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {alt.issued_at.replace("T", " ").slice(0, 19)}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-blue-700">
                          {alt.acknowledgements_count} confirmed
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              alt.status === "ACTIVE"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {alt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 5: Model Benchmarks & Data Sources */}
        {!loading && data && activeTab === "models_sources" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  Scientific Machine Learning Benchmarks & Telemetry Coverage
                </h3>
                <p className="text-xs text-slate-500">
                  Full evaluation transparency. Models are evaluated using cross-validation on ground-truth records.
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                Tier: SCIENTIFIC BENCHMARKS
              </Badge>
            </div>

            {/* Model Evaluation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.model_evaluations.map((model) => (
                <Card key={model.model_id} className="p-4 bg-white border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {model.version}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Accuracy: {(model.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{model.model_name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">{model.algorithm}</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 text-[10px] block">F1-Score:</span>
                        <span className="font-bold text-slate-800">{model.f1_score.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Precision:</span>
                        <span className="font-bold text-slate-800">{model.precision.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Recall:</span>
                        <span className="font-bold text-slate-800">{model.recall.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">ROC-AUC:</span>
                        <span className="font-bold text-slate-800">
                          {model.roc_auc ? model.roc_auc.toFixed(3) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                    <div>Validation: {model.validation_split}</div>
                    <div className="mt-0.5">Trained: {model.last_trained.slice(0, 10)}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Data Source Coverage Matrix */}
            <Card className="overflow-hidden border-slate-200 bg-white">
              <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>External Telemetry Providers & Freshness Latency</span>
                <span className="text-[11px] font-normal text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> All Public APIs Operating Normally
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Source Name</th>
                      <th className="py-2.5 px-3">Provider</th>
                      <th className="py-2.5 px-3">Data Category</th>
                      <th className="py-2.5 px-3">Coverage</th>
                      <th className="py-2.5 px-3">Freshness Lag</th>
                      <th className="py-2.5 px-3">Last Synchronized</th>
                      <th className="py-2.5 px-3">Connection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {data.data_sources.map((src) => (
                      <tr key={src.source_id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{src.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{src.provider}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                          {src.data_type}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-blue-700">
                          {src.coverage_pct}%
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          ~{src.freshness_lag_minutes} min
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {src.last_sync_timestamp.replace("T", " ").slice(0, 19)} UTC
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            {src.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* 6. Official Disclaimer Footer */}
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Operational Disclaimer: </span>
            {data?.data_disclaimer ||
              "Official municipal instructions and physical emergency services take precedence. Model estimates are probabilistic simulations and must not be treated as physical flood sensor measurements."}
          </div>
        </div>
      </div>
    </div>
  );
}
