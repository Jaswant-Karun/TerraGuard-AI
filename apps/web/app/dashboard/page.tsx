"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { TopNav } from "@/components/dashboard/TopNav";
import { EnvironmentalStatusCards } from "@/features/dashboard/EnvironmentalStatusCards";
import { RiskTrendChart } from "@/features/dashboard/RiskTrendChart";
import { RiskDistributionCard } from "@/features/dashboard/RiskDistributionCard";
import { GeographicRiskTable } from "@/features/dashboard/GeographicRiskTable";
import { AIInsightsFeed } from "@/features/dashboard/AIInsightsFeed";
import { RecentAlertsList } from "@/features/dashboard/RecentAlertsList";
import { RecentReportsList } from "@/features/dashboard/RecentReportsList";
import {
  fetchDashboardLocations,
  fetchDashboardNotifications,
  fetchDashboardSummary,
} from "@/services/dashboard";
import {
  DashboardNotification,
  DashboardSummary,
  LocationOption,
} from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("ALL_METRO");
  const [timeRange, setTimeRange] = useState<string>("24h");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async (showFullLoader: boolean = true) => {
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [sumRes, locRes, notifRes] = await Promise.all([
          fetchDashboardSummary({
            locationId: selectedLocationId,
            timeRange,
          }),
          locations.length === 0 ? fetchDashboardLocations() : Promise.resolve(locations),
          fetchDashboardNotifications(),
        ]);

        setSummary(sumRes);
        if (locRes && locRes.length > 0) setLocations(locRes);
        setNotifications(notifRes);
      } catch (err: any) {
        console.error("Dashboard data load error:", err);
        setError(
          err.message || "Failed to establish telemetry link with TerraGuard backend."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedLocationId, timeRange, locations]
  );

  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation */}
      <TopNav
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationChange={(id) => setSelectedLocationId(id)}
        timeRange={timeRange}
        onTimeRangeChange={(range) => setTimeRange(range)}
        notifications={notifications}
        isSampleData={summary?.environmental_status.is_sample ?? true}
      />

      {/* Main Content Canvas */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 w-full rounded-xl bg-slate-200" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-200" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-72 rounded-xl bg-slate-200" />
              <div className="h-72 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 rounded-xl bg-slate-200" />
              <div className="h-64 rounded-xl bg-slate-200" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-rose-900 mb-1">
              Telemetry Connection Interrupted
            </h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto mb-4">
              {error}
            </p>
            <Button
              onClick={() => loadDashboardData(true)}
              variant="danger"
              size="sm"
              className="gap-2 font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              Reconnect Cockpit
            </Button>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && !error && summary && (
          <>
            {/* Sector Header & Quick Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                    {summary.location.name}
                  </h2>
                  <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                    {summary.location.zone_code || "METRO-COMMAND"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live situational telemetry, hazard distribution, and automated ML prevention workflows
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => loadDashboardData(false)}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="gap-1.5 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-cyan-600" : ""}`}
                  />
                  {refreshing ? "Syncing..." : "Refresh Feed"}
                </Button>
              </div>
            </div>

            {/* Benchmark Transparency Notice (No fake statistics rule) */}
            {summary.environmental_status.is_sample && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 p-3.5 text-xs text-amber-900 shadow-xs">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Benchmarking Telemetry Active:</span>{" "}
                  This dashboard view displays verified municipal benchmark stations. All spatial calculations and risk boundaries use real 2dsphere indexes. Live IoT sensors automatically override these values when transmitting.
                </div>
              </div>
            )}

            {/* 1. Environmental Telemetry & Core KPIs */}
            <EnvironmentalStatusCards
              data={summary.environmental_status}
              activeIncidentsCount={summary.active_incidents_count}
            />

            {/* 2. Visualizations Row: Risk Trend Chart + Risk Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RiskTrendChart
                  data={summary.risk_trends}
                  timeRange={timeRange}
                />
              </div>
              <div className="lg:col-span-1">
                <RiskDistributionCard data={summary.risk_distribution} />
              </div>
            </div>

            {/* 3. Operational Feeds: Active Alerts + Citizen Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentAlertsList alerts={summary.recent_alerts} />
              <RecentReportsList reports={summary.recent_citizen_reports} />
            </div>

            {/* 4. Geographic Sector Risk Summary */}
            <GeographicRiskTable zones={summary.geographic_risk_summary} />

            {/* 5. Explainable AI Insights Feed */}
            <AIInsightsFeed insights={summary.ai_insights} />
          </>
        )}
      </main>
    </div>
  );
}

