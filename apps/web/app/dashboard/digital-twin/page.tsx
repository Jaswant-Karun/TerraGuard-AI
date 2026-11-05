"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  Database,
  Eye,
  FastForward,
  Flame,
  Globe,
  History,
  Info,
  Layers,
  MapPin,
  Pause,
  Play,
  Radio,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DigitalTwin3DMap } from "@/components/map/DigitalTwin3DMap";
import {
  fetch3DBuildings,
  fetchDigitalTwinSummary,
} from "@/services/digital_twin";
import {
  DigitalTwinSummaryResponse,
  HistoricalBenchmark,
  SectorComparison,
  TimelineSlice,
} from "@/types/digital_twin";

export default function DigitalTwinPage() {
  const [summaryData, setSummaryData] = useState<DigitalTwinSummaryResponse | null>(null);
  const [buildingsData, setBuildingsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timeline Control State
  const [activeSliceIndex, setActiveSliceIndex] = useState<number>(2); // Default to Current Live State (index 2)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sector Selection & Comparison State
  const [selectedSectorId, setSelectedSectorId] = useState<string>("SEC-BELLANDUR");
  const [compareSectorId, setCompareSectorId] = useState<string>("SEC-WHITEFIELD");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [summary, buildings] = await Promise.all([
        fetchDigitalTwinSummary(),
        fetch3DBuildings(),
      ]);
      setSummaryData(summary);
      setBuildingsData(buildings);
    } catch (err: any) {
      console.error("Failed to load digital twin data:", err);
      setErrorMessage(err.message || "Failed to load Digital Twin model");
    } finally {
      setLoading(false);
    }
  };

  // Automated Timeline Player Loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && summaryData?.timeline_slices?.length) {
      timer = setInterval(() => {
        setActiveSliceIndex((prev) => (prev + 1) % summaryData.timeline_slices.length);
      }, 3500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, summaryData]);

  const activeSlice: TimelineSlice | null =
    summaryData?.timeline_slices?.[activeSliceIndex] || null;

  const sectors = summaryData?.sectors || [];
  const selectedSector =
    sectors.find((s) => s.sector_id === selectedSectorId) || sectors[0] || null;
  const compareSector =
    sectors.find((s) => s.sector_id === compareSectorId) || sectors[2] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Building2 className="w-6 h-6" />
                </span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                  Urban Simulation & Visual Analytics
                </span>
                <Badge
                  variant="outline"
                  className="text-cyan-400 border-cyan-500/40 bg-cyan-950/40 font-mono text-[11px]"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  3D Extrusion Engine
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                City Digital Twin & Historical Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Multi-temporal spatial intelligence platform. Compare empirical sensor observations,
                hydrological recession curves, and historical cloudburst benchmarks across urban sectors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh 3D Twin
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Scientific Integrity Disclaimer Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm flex items-start space-x-3.5">
          <span className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </span>
          <div className="text-xs text-blue-900 leading-relaxed">
            <div className="font-bold uppercase tracking-wider text-[11px] text-blue-800 mb-0.5">
              Scientific Integrity & Digital Twin Transparency Notice
            </div>
            3D building heights, elevation offsets, and spatial hazard volumes are computed from
            empirical sensor stations and validated hydrological regression models.
            <strong>
              {" "}This platform does not present decorative 3D animations as certified sub-surface geotechnical simulations.
            </strong>{" "}
            All time-slices reference verifiable timestamps with traceable provenance.
          </div>
        </div>

        {/* TIMELINE CONTROLLER & TIME-LAPSE PLAYER */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Multi-Temporal Observation & Projection Timeline
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Slide across historical baselines, live sensor telemetry, and 24-hour predictive models.
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveSliceIndex((prev) =>
                    prev > 0 ? prev - 1 : (summaryData?.timeline_slices?.length || 1) - 1
                  )
                }
                className="h-8 px-2 text-xs bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant={isPlaying ? "outline" : "primary"}
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1.5" />
                    Pause Time-Lapse
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Play Time-Lapse
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveSliceIndex(
                    (prev) => (prev + 1) % (summaryData?.timeline_slices?.length || 1)
                  )
                }
                className="h-8 px-2 text-xs bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveSliceIndex(2); // Reset to Live State
                }}
                className="h-8 px-2 text-xs bg-slate-50 text-slate-700 hover:bg-slate-100"
                title="Reset to Live State (T = 0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Timeline Step Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {summaryData?.timeline_slices?.map((sl, idx) => {
              const isSelected = idx === activeSliceIndex;
              return (
                <button
                  key={sl.slice_id}
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveSliceIndex(idx);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs"
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        sl.is_live
                          ? "bg-emerald-100 text-emerald-800"
                          : sl.is_projection
                          ? "bg-cyan-100 text-cyan-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sl.phase.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sl.label.split(" ")[0]}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-slate-900 truncate">
                    {sl.label}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(sl.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-600">{sl.precipitation_mm}mm rain</span>
                    <span
                      className={`font-bold ${
                        sl.composite_risk_score >= 70
                          ? "text-red-600"
                          : sl.composite_risk_score >= 40
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {sl.composite_risk_score}/100
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Slice In-Depth Telemetry Bar */}
          {activeSlice && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 leading-snug">
                <strong>Situation Synthesis:</strong> {activeSlice.summary}
              </div>
              <div className="text-[11px] font-mono text-slate-500 shrink-0">
                Provenance: <em>{activeSlice.data_provenance}</em>
              </div>
            </div>
          )}
        </div>

        {/* MAIN 3D DIGITAL TWIN VISUALIZATION CANVAS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-8">
          <div className="flex items-center justify-between px-2 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Compass className="w-4 h-4 mr-1.5 text-blue-600" />
                Bengaluru 3D Digital Twin Canvas
              </h3>
              <p className="text-[11px] text-slate-500">
                Interactive pitch ($48^\circ$) with extruded landmark infrastructure, flood inundation gradients, and historical cloudburst markers.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              Coordinates: [77.6245°E, 12.9352°N]
            </div>
          </div>

          <DigitalTwin3DMap
            buildingsData={buildingsData}
            activeSlice={activeSlice}
            selectedSector={selectedSector}
            historicalBenchmarks={summaryData?.historical_benchmarks || []}
            onSelectSector={(s) => setSelectedSectorId(s.sector_id)}
          />
        </div>

        {/* GEOGRAPHIC SECTOR COMPARISONS & AREA-LEVEL STATISTICS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Comparative Vulnerability & Topographical Analytics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Side-by-side area level statistics contrasting lowland runoff basins against natural high-ground ridges.
              </p>
            </div>

            {/* Sector Selector Buttons */}
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {sectors.map((sec) => (
                <button
                  key={sec.sector_id}
                  onClick={() => setSelectedSectorId(sec.sector_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedSectorId === sec.sector_id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {sec.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Two-Column Side-by-Side Comparative Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Selected Sector Card */}
            {selectedSector && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                      Target Focus Sector
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedSector.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Zone: {selectedSector.zone_code}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      selectedSector.current_risk_level === "CRITICAL"
                        ? "bg-red-100 text-red-800 border-red-300 font-bold"
                        : selectedSector.current_risk_level === "HIGH"
                        ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    {selectedSector.current_risk_level} ({selectedSector.current_risk_score}/100)
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Topography & Elevation
                    </div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      {selectedSector.elevation_meters}m MSL
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedSector.topography_type}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Drainage Adequacy Index
                    </div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      {selectedSector.drainage_infrastructure_index} / 100
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Impervious: {selectedSector.impervious_surface_pct}%
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Affected Population
                    </div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      ~{selectedSector.estimated_affected_population.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedSector.population_density_sqkm.toLocaleString()} / km²
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Civic Support Units
                    </div>
                    <div className="font-bold text-emerald-700 font-mono mt-0.5">
                      {selectedSector.safe_facilities_nearby} Verified Shelters
                    </div>
                    <div className="text-[11px] text-red-600 mt-0.5">
                      {selectedSector.active_incidents} active hazards
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Sector Card */}
            {compareSector && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                        Comparison Sector (Benchmark)
                      </span>
                      <select
                        value={compareSectorId}
                        onChange={(e) => setCompareSectorId(e.target.value)}
                        className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
                      >
                        {sectors.map((s) => (
                          <option key={s.sector_id} value={s.sector_id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {compareSector.name}
                    </h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Zone: {compareSector.zone_code}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      compareSector.current_risk_level === "CRITICAL"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : compareSector.current_risk_level === "HIGH"
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    {compareSector.current_risk_level} ({compareSector.current_risk_score}/100)
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Topography & Elevation
                    </div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      {compareSector.elevation_meters}m MSL
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {compareSector.topography_type}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Drainage Adequacy Index
                    </div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      {compareSector.drainage_infrastructure_index} / 100
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Impervious: {compareSector.impervious_surface_pct}%
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Affected Population
                    </div>
                    <div className="font-bold text-slate-900 font-mono mt-0.5">
                      ~{compareSector.estimated_affected_population.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {compareSector.population_density_sqkm.toLocaleString()} / km²
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Civic Support Units
                    </div>
                    <div className="font-bold text-emerald-700 font-mono mt-0.5">
                      {compareSector.safe_facilities_nearby} Verified Shelters
                    </div>
                    <div className="text-[11px] text-red-600 mt-0.5">
                      {compareSector.active_incidents} active hazards
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HISTORICAL DISASTER BENCHMARKS MODULE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Verified Historical Disaster Benchmarks
              </h2>
              <p className="text-xs text-slate-500">
                Real catastrophic weather events archived in MongoDB collection <code className="text-blue-700 font-mono">historical_events</code> used to baseline predictive ML models.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {summaryData?.historical_benchmarks?.map((bench) => (
              <div
                key={bench.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wide">
                      Severity {bench.peak_severity} / 5
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(bench.occurred_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {bench.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {bench.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-slate-700 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Rainfall
                      </span>
                      <strong>{bench.peak_rainfall_mm || 0} mm</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Damage
                      </span>
                      <strong>
                        ${((bench.damage_estimate_usd || 0) / 1e6).toFixed(1)}M USD
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Inundation
                      </span>
                      <strong>{bench.inundation_depth_meters || 0} m</strong>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Municipal Action:</strong>{" "}
                    {bench.lessons_learned}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

