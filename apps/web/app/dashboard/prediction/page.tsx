"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CloudRain,
  Database,
  Droplets,
  ExternalLink,
  Flame,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assessRisk,
  fetchCurrentRisk,
  fetchRiskExplanation,
  fetchRiskHistory,
} from "@/services/risk";
import {
  RiskAssessmentRequest,
  RiskAssessmentResponse,
  RiskExplanationResponse,
} from "@/types/risk";

const PRESET_ZONES = [
  {
    name: "Bengaluru Central (Zone 01)",
    zoneCode: "BLR-CENTRAL-01",
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    name: "Bellandur Lake Catchment (Zone 04)",
    zoneCode: "BLR-SOUTH-04",
    lat: 12.9352,
    lng: 77.6669,
  },
  {
    name: "Koramangala Culvert Belt (Zone 07)",
    zoneCode: "BLR-SOUTH-07",
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    name: "Whitefield Tech Corridor (Zone 12)",
    zoneCode: "BLR-EAST-12",
    lat: 12.9698,
    lng: 77.7499,
  },
];

export default function PredictionPage() {
  const [selectedZone, setSelectedZone] = useState(PRESET_ZONES[1]);
  const [currentAssessment, setCurrentAssessment] =
    useState<RiskAssessmentResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<RiskAssessmentResponse[]>([]);
  const [explanation, setExplanation] =
    useState<RiskExplanationResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [showExplanationModal, setShowExplanationModal] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation Overrides
  const [isSimulatingCustom, setIsSimulatingCustom] = useState<boolean>(false);
  const [rainfallIntensity, setRainfallIntensity] = useState<number>(45);
  const [forecast24hRain, setForecast24hRain] = useState<number>(85);
  const [temperature, setTemperature] = useState<number>(31);
  const [humidity, setHumidity] = useState<number>(75);
  const [aqi, setAqi] = useState<number>(110);
  const [drainageDeficit, setDrainageDeficit] = useState<number>(40);

  const loadRealTimeRisk = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, hist] = await Promise.all([
        fetchCurrentRisk({
          lat: selectedZone.lat,
          lng: selectedZone.lng,
        }),
        fetchRiskHistory({ pageSize: 5, zoneCode: selectedZone.zoneCode }),
      ]);
      setCurrentAssessment(res);
      setHistoryItems(hist.items);
      setIsSimulatingCustom(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load live predictive model results"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    loadRealTimeRisk();
  }, [loadRealTimeRisk]);

  const handleRunSimulation = async () => {
    setSimulating(true);
    setError(null);
    try {
      const payload: RiskAssessmentRequest = {
        lat: selectedZone.lat,
        lng: selectedZone.lng,
        zone_code: selectedZone.zoneCode,
        rainfall_intensity_mmh: rainfallIntensity,
        forecast_rainfall_sum_mm: forecast24hRain,
        temperature_c: temperature,
        humidity_pct: humidity,
        aqi: aqi,
        drainage_capacity_deficit_pct: drainageDeficit,
      };

      const result = await assessRisk(payload);
      setCurrentAssessment(result);
      setIsSimulatingCustom(true);

      // Refresh recent history
      const hist = await fetchRiskHistory({
        pageSize: 5,
        zoneCode: selectedZone.zoneCode,
      });
      setHistoryItems(hist.items);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Disaster simulation run failed. Check parameters."
      );
    } finally {
      setSimulating(false);
    }
  };

  const handleInspectExplanation = async (assessmentId: string) => {
    try {
      const expl = await fetchRiskExplanation(assessmentId);
      setExplanation(expl);
      setShowExplanationModal(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch model explanation breakdown"
      );
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          text: "text-rose-600",
          border: "border-rose-200",
        };
      case "HIGH":
        return {
          bg: "bg-amber-500",
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          text: "text-amber-600",
          border: "border-amber-200",
        };
      case "MODERATE":
        return {
          bg: "bg-blue-500",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          text: "text-blue-600",
          border: "border-blue-200",
        };
      default:
        return {
          bg: "bg-emerald-500",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          text: "text-emerald-600",
          border: "border-emerald-200",
        };
    }
  };

  const currentTheme = getRiskColor(currentAssessment?.risk_level || "LOW");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Multi-Hazard Predictive Intelligence Engine
                <Badge
                  variant="outline"
                  className="bg-cyan-50 text-cyan-700 border-cyan-200 text-[10px]"
                >
                  Scikit-Learn ML + XGBoost
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Predictive hydrological runoff modeling, NOAA heat stress, and EPA
                AQI risk aggregation
              </p>
            </div>
          </div>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <MapPin className="h-3.5 w-3.5 text-slate-500 ml-2" />
            <select
              value={selectedZone.zoneCode}
              onChange={(e) => {
                const z = PRESET_ZONES.find((x) => x.zoneCode === e.target.value);
                if (z) setSelectedZone(z);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 border-none outline-none pr-3 py-1 cursor-pointer"
            >
              {PRESET_ZONES.map((z) => (
                <option key={z.zoneCode} value={z.zoneCode}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadRealTimeRisk}
            disabled={loading || simulating}
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
            />
            Live Sync
          </Button>
        </div>
      </div>

      {/* Main Content Canvas */}
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Execution Diagnostic:</span> {error}
            </div>
          </div>
        )}

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Composite Threat Gauge */}
          <Card className="lg:col-span-2 border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Aggregated Threat Index
                </span>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Composite Urban Hazard Status
                  {isSimulatingCustom && (
                    <span className="text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                      Simulation Mode
                    </span>
                  )}
                </h2>
              </div>
              {currentAssessment && (
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1 font-bold ${currentTheme.badge}`}
                >
                  {currentAssessment.risk_level} ALERT
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="py-12 space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : currentAssessment ? (
              <div className="mt-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-baseline gap-3">
                    <span
                      className={`text-5xl font-black tracking-tight ${currentTheme.text}`}
                    >
                      {currentAssessment.composite_risk_score.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">/ 100 Threat Index</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-slate-400 font-medium">Primary Hazard</div>
                      <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-rose-500" />
                        {currentAssessment.primary_hazard}
                      </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <div className="text-slate-400 font-medium">Pipeline Confidence</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {(currentAssessment.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div>
                      <div className="text-slate-400 font-medium">Model Engine</div>
                      <div className="font-bold text-cyan-700 mt-0.5">
                        {currentAssessment.model_version}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Gauge */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Low (0-29)</span>
                    <span>Moderate (30-59)</span>
                    <span>High (60-79)</span>
                    <span>Critical (80-100)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${currentTheme.bg}`}
                      style={{
                        width: `${Math.min(
                          Math.max(currentAssessment.composite_risk_score, 3),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Hydrological/Atmospheric Explanation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                    Executive Multi-Hazard Synthesis
                  </div>
                  <p>{currentAssessment.explanation}</p>
                </div>

                {/* Mitigation Directives */}
                {currentAssessment.mitigation_directives?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />
                      Municipal Tactical Directives
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentAssessment.mitigation_directives.map((dir, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-slate-700">{dir}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </Card>

          {/* Model Transparency & Provenance Card */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Database className="h-4 w-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Model Integrity & Provenance
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Architecture</div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    Scikit-Learn GradientBoostingRegressor + EPA/NOAA Standards
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium">Evaluation Status</div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Hydrological Rational Method + Gradient Boosting
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-medium">Integrity Principle</div>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Zero fabricated disaster scenarios. When historical ground truth
                    data is missing, transparent physical hydrological formulas are
                    used and explicitly flagged.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-slate-400 font-medium">Telemetry Sources</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {currentAssessment?.data_sources?.map((ds) => (
                      <span
                        key={ds}
                        className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        {ds}
                      </span>
                    )) || (
                      <span className="text-slate-400 text-[11px]">
                        Open-Meteo, OpenAQ, OSM
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {currentAssessment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInspectExplanation(currentAssessment.id)}
                className="w-full mt-4 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
              >
                <Info className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                Inspect Factor Explainability
              </Button>
            )}
          </Card>
        </div>

        {/* Hazard Breakdown Tri-Grid */}
        {currentAssessment && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Flood Hazard Subscore */}
            <Card className="border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CloudRain className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Urban Inundation & Flood
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Topographical depression & runoff
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getRiskColor(currentAssessment.flood_risk.level).badge}
                >
                  {currentAssessment.flood_risk.score.toFixed(0)}/100
                </Badge>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {currentAssessment.flood_risk.explanation}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Rainfall Intensity</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.flood_risk.contributing_factors
                        ?.rainfall_intensity_mmh ?? 0}{" "}
                      mm/h
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>24h Forecast Sum</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.flood_risk.contributing_factors
                        ?.forecast_rainfall_sum_mm ?? 0}{" "}
                      mm
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Drainage Deficit</span>
                    <span className="font-semibold text-slate-900">
                      {(
                        (currentAssessment.flood_risk.contributing_factors
                          ?.drainage_capacity_deficit ?? 0) * 100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Heat Hazard Subscore */}
            <Card className="border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Extreme Heat & Thermal Stress
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      NOAA Steadman Heat Index
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getRiskColor(currentAssessment.heat_risk.level).badge}
                >
                  {currentAssessment.heat_risk.score.toFixed(0)}/100
                </Badge>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {currentAssessment.heat_risk.explanation}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>Ambient Temperature</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.heat_risk.contributing_factors
                        ?.temperature_c ?? "--"}
                      °C
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Relative Humidity</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.heat_risk.contributing_factors
                        ?.humidity_pct ?? "--"}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Heat Index Apparent</span>
                    <span className="font-semibold text-amber-600">
                      {currentAssessment.heat_risk.contributing_factors
                        ?.heat_index_c ?? "--"}
                      °C
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Air Quality Hazard Subscore */}
            <Card className="border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Wind className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Atmospheric & Air Quality
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      EPA / WHO Breakpoint Standard
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={getRiskColor(currentAssessment.air_quality_risk.level).badge}
                >
                  {currentAssessment.air_quality_risk.score.toFixed(0)}/100
                </Badge>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {currentAssessment.air_quality_risk.explanation}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-slate-500">
                    <span>EPA AQI Index</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.air_quality_risk.contributing_factors
                        ?.aqi_value ?? "--"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>PM2.5 Concentration</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.air_quality_risk.contributing_factors
                        ?.pm25 ?? "--"}{" "}
                      µg/m³
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>PM10 Concentration</span>
                    <span className="font-semibold text-slate-900">
                      {currentAssessment.air_quality_risk.contributing_factors
                        ?.pm10 ?? "--"}{" "}
                      µg/m³
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Interactive "What-If" Disaster Simulation Sandbox */}
        <Card className="border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Disaster Simulation Sandbox
                </h3>
                <p className="text-xs text-slate-500">
                  Perform catastrophic &ldquo;what-if&rdquo; stress testing by altering rainfall,
                  thermal conditions, and culvert stress
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadRealTimeRisk}
                disabled={simulating}
                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset Real-Time
              </Button>
              <Button
                size="sm"
                onClick={handleRunSimulation}
                disabled={simulating}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Run What-If Prediction
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {/* Rainfall Intensity Slider */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <CloudRain className="h-4 w-4 text-blue-600" />
                  Rainfall Intensity
                </span>
                <span className="text-blue-600 font-bold">
                  {rainfallIntensity} mm/h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={rainfallIntensity}
                onChange={(e) => setRainfallIntensity(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 mm (Clear)</span>
                <span>50 mm (Heavy)</span>
                <span>150 mm (Cloudburst)</span>
              </div>
            </div>

            {/* 24h Forecast Rainfall */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-cyan-600" />
                  24-Hour Cumulative Rain
                </span>
                <span className="text-cyan-600 font-bold">
                  {forecast24hRain} mm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="10"
                value={forecast24hRain}
                onChange={(e) => setForecast24hRain(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0 mm</span>
                <span>100 mm (Warning)</span>
                <span>300 mm (Flood Inundation)</span>
              </div>
            </div>

            {/* Drainage Deficit */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-purple-600" />
                  Drainage Culvert Choke
                </span>
                <span className="text-purple-600 font-bold">
                  {drainageDeficit}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={drainageDeficit}
                onChange={(e) => setDrainageDeficit(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0% (Clear storm drains)</span>
                <span>100% (Fully silted/choked)</span>
              </div>
            </div>

            {/* Ambient Temperature */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-600" />
                  Ambient Temperature
                </span>
                <span className="text-amber-600 font-bold">{temperature}°C</span>
              </div>
              <input
                type="range"
                min="15"
                max="50"
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>15°C (Cool)</span>
                <span>35°C (Hot)</span>
                <span>50°C (Heatwave Emergency)</span>
              </div>
            </div>

            {/* Humidity */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-teal-600" />
                  Relative Humidity
                </span>
                <span className="text-teal-600 font-bold">{humidity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10% (Arid)</span>
                <span>60% (Moderate)</span>
                <span>100% (Saturated)</span>
              </div>
            </div>

            {/* Air Quality Index */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Wind className="h-4 w-4 text-rose-600" />
                  Air Quality Index (AQI)
                </span>
                <span className="text-rose-600 font-bold">{aqi} AQI</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={aqi}
                onChange={(e) => setAqi(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>50 (Good)</span>
                <span>150 (Unhealthy)</span>
                <span>500 (Hazardous)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Historical Assessments Log */}
        {historyItems.length > 0 && (
          <Card className="border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Recent Prediction Logs for {selectedZone.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Chronological record of recent model inference runs stored in
                  MongoDB
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Hazard Category</th>
                    <th className="py-2.5 px-3">Threat Score</th>
                    <th className="py-2.5 px-3">Alert Level</th>
                    <th className="py-2.5 px-3">Model Provenance</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {item.primary_hazard}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {item.composite_risk_score.toFixed(1)} / 100
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={getRiskColor(item.risk_level).badge}
                        >
                          {item.risk_level}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-500">
                          {item.model_version}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInspectExplanation(item.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs h-7 px-2"
                        >
                          Explain
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Model Explainability Modal */}
      {showExplanationModal && explanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="max-w-2xl w-full bg-white border-slate-200 p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Detailed Model Feature Explainability
                </h3>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-900 mb-1">
                  Primary Threat Attribution
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {explanation.detailed_explanation}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Contributing Factors Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(explanation.contributing_factors_breakdown || {}).map(
                    ([k, v]) => (
                      <div
                        key={k}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between"
                      >
                        <span className="text-slate-500 font-medium">{k}:</span>
                        <span className="font-bold text-slate-800">
                          {typeof v === "number" ? v.toFixed(2) : String(v)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Model Provenance Metadata
                </h4>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>{JSON.stringify(explanation.model_provenance, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanationModal(false)}
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
