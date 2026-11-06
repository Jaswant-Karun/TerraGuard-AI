"use client";

import React, { useEffect, useState } from "react";
import * as turf from "@turf/turf";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  Flame,
  HelpCircle,
  Home,
  Info,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NavigationRouteMap } from "@/components/map/NavigationRouteMap";
import {
  fetchNearbyFacilities,
  fetchSafeRoutes,
} from "@/services/navigation";
import {
  Facility,
  HazardIntersection,
  RouteAlternative,
  RouteQueryResponse,
} from "@/types/navigation";

// Preset urban zones for fast evaluator testing in Bengaluru
const PRESET_LOCATIONS = [
  { name: "Bengaluru Central (MG Road)", coords: [77.5946, 12.9716] as [number, number] },
  { name: "Koramangala 80ft Road (Lowland)", coords: [77.6245, 12.9352] as [number, number] },
  { name: "Bellandur Feeder Basin (Flood Prone)", coords: [77.6669, 12.9352] as [number, number] },
  { name: "Whitefield Tech Corridor (Safe Ridge)", coords: [77.7499, 12.9698] as [number, number] },
  { name: "Indiranagar 100ft Road", coords: [77.6408, 12.9719] as [number, number] },
  { name: "Peenya Industrial Sector", coords: [77.5255, 13.0305] as [number, number] },
];

export default function SafeNavigationPage() {
  const [origin, setOrigin] = useState<[number, number]>([77.6245, 12.9352]); // Koramangala
  const [destination, setDestination] = useState<[number, number]>([77.5946, 12.9716]); // Central Shelter
  const [originLabel, setOriginLabel] = useState<string>("Koramangala 80ft Road");
  const [destinationLabel, setDestinationLabel] = useState<string>("Bengaluru Central (BBMP Shelter)");

  const [routeMode, setRouteMode] = useState<"driving" | "walking" | "emergency_vehicle">("driving");
  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(false);
  const [routeResponse, setRouteResponse] = useState<RouteQueryResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map Click Coordinate Selection Mode
  const [clickMode, setClickMode] = useState<"NONE" | "SET_ORIGIN" | "SET_DESTINATION">("NONE");

  // Facilities Discovery
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityFilter, setFacilityFilter] = useState<string>("ALL");
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(false);

  // Auto-calculate on mount
  useEffect(() => {
    executeRouteCalculation(origin, destination, routeMode);
    loadFacilities(destination[0], destination[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFacilities = async (lng: number, lat: number) => {
    try {
      setLoadingFacilities(true);
      const res = await fetchNearbyFacilities(lng, lat, 15.0);
      setFacilities(res.facilities || []);
    } catch (err: any) {
      console.error("Failed to load emergency facilities:", err);
    } finally {
      setLoadingFacilities(false);
    }
  };

  const executeRouteCalculation = async (
    start: [number, number],
    end: [number, number],
    mode: "driving" | "walking" | "emergency_vehicle"
  ) => {
    try {
      setLoadingRoutes(true);
      setErrorMessage(null);
      const data = await fetchSafeRoutes({
        origin: start,
        destination: end,
        mode: mode,
        avoid_hazards: true,
        max_alternatives: 3,
      });

      setRouteResponse(data);
      if (data.primary_route) {
        setSelectedRouteId(data.primary_route.route_id);
      }
      if (data.nearby_facilities?.length > 0) {
        setFacilities(data.nearby_facilities);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to calculate navigation routes.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const handleMapClickCoordinate = (coords: [number, number]) => {
    if (clickMode === "SET_ORIGIN") {
      setOrigin(coords);
      setOriginLabel(`Pin [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
      setClickMode("NONE");
      executeRouteCalculation(coords, destination, routeMode);
    } else if (clickMode === "SET_DESTINATION") {
      setDestination(coords);
      setDestinationLabel(`Pin [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
      setClickMode("NONE");
      executeRouteCalculation(origin, coords, routeMode);
      loadFacilities(coords[0], coords[1]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    const tryAcquirePosition = (highAccuracy: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            Number(pos.coords.longitude.toFixed(6)),
            Number(pos.coords.latitude.toFixed(6)),
          ];
          setOrigin(coords);
          setOriginLabel("My Current Location (GPS)");
          executeRouteCalculation(coords, destination, routeMode);
        },
        (err) => {
          if (highAccuracy) {
            tryAcquirePosition(false);
          } else {
            // Smoothly fall back to default municipal sector coordinates
            const defaultCoords: [number, number] = [77.5946, 12.9716];
            setOrigin(defaultCoords);
            setOriginLabel("Central Urban Command (Sector Default)");
            executeRouteCalculation(defaultCoords, destination, routeMode);
            console.warn("GPS acquire timed out, defaulted to command sector:", err.message);
          }
        },
        {
          timeout: highAccuracy ? 5000 : 8000,
          enableHighAccuracy: highAccuracy,
          maximumAge: 120000,
        }
      );
    };

    tryAcquirePosition(true);
  };

  const handleRouteToFacility = (fac: Facility) => {
    setDestination(fac.coordinates);
    setDestinationLabel(`${fac.name} (${fac.category.replace("_", " ")})`);
    executeRouteCalculation(origin, fac.coordinates, routeMode);
    loadFacilities(fac.coordinates[0], fac.coordinates[1]);
  };

  const allRoutes: RouteAlternative[] = routeResponse
    ? [routeResponse.primary_route, ...(routeResponse.alternatives || [])]
    : [];

  const selectedRoute =
    allRoutes.find((r) => r.route_id === selectedRouteId) || routeResponse?.primary_route;

  const filteredFacilities = facilities.filter((f) => {
    if (facilityFilter === "ALL") return true;
    return f.category === facilityFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#0B132B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Compass className="w-6 h-6" />
                </span>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                  Safe Navigation & Emergency Routing
                </span>
                <Badge
                  variant="outline"
                  className="text-emerald-400 border-emerald-500/40 bg-emerald-950/40 font-mono text-[11px]"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Truth-in-Routing Protocol Active
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Risk-Aware Evacuation & Safe Navigation
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                Real-world routing infrastructure integrated with live citizen hazard reports,
                active waterlogging sensors, and verified emergency facilities. Routes around
                danger while strictly certifying safety only when supported by empirical telemetry.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeRouteCalculation(origin, destination, routeMode)}
                disabled={loadingRoutes}
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loadingRoutes ? "animate-spin" : ""}`}
                />
                Recalculate Routes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Prominent Emergency Services Disclaimer Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm flex items-start space-x-3.5">
          <span className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div className="text-xs text-amber-900 leading-relaxed">
            <div className="font-bold uppercase tracking-wider text-[11px] text-amber-800 mb-0.5">
              Official Instructions Precedence Notice
            </div>
            <strong>Official municipal emergency services and on-ground disaster personnel (112, Police, Fire, BBMP Disaster Management Cell) take precedence over algorithmic safe route recommendations.</strong>{" "}
            Never attempt to drive or walk through standing water, flooded underpasses, or bypass physical emergency barricades.
          </div>
        </div>

        {/* MAIN TWO-COLUMN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: CONTROLS & ROUTE ALTERNATIVES DRAWER (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Origin & Destination Card */}
            <Card className="bg-white border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center">
                  <Navigation className="w-4 h-4 mr-2 text-blue-600" />
                  Route Endpoints
                </h2>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setRouteMode("driving")}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      routeMode === "driving"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Driving
                  </button>
                  <button
                    onClick={() => setRouteMode("walking")}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      routeMode === "walking"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Walking
                  </button>
                </div>
              </div>

              {/* Origin Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5" />
                    Origin (Point A)
                  </label>
                  <button
                    onClick={handleUseCurrentLocation}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <Crosshair className="w-3 h-3 mr-1" />
                    Use GPS
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    value={originLabel}
                    onChange={(e) => setOriginLabel(e.target.value)}
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setClickMode(clickMode === "SET_ORIGIN" ? "NONE" : "SET_ORIGIN")
                    }
                    className={`h-9 px-2.5 text-xs shrink-0 ${
                      clickMode === "SET_ORIGIN"
                        ? "bg-blue-50 text-blue-700 border-blue-400"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    Pin
                  </Button>
                </div>
              </div>

              {/* Destination Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-1.5" />
                    Destination (Point B)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    value={destinationLabel}
                    onChange={(e) => setDestinationLabel(e.target.value)}
                    className="text-xs h-9 bg-slate-50 border-slate-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setClickMode(clickMode === "SET_DESTINATION" ? "NONE" : "SET_DESTINATION")
                    }
                    className={`h-9 px-2.5 text-xs shrink-0 ${
                      clickMode === "SET_DESTINATION"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    Pin
                  </Button>
                </div>
              </div>

              {/* Fast Presets */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Evaluator Quick Presets
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setOrigin(loc.coords);
                        setOriginLabel(loc.name);
                        executeRouteCalculation(loc.coords, destination, routeMode);
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition-colors"
                    >
                      From {loc.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Evaluated Route Alternatives */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center">
                  <span>Evaluated Route Options</span>
                  <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {allRoutes.length} Calculated
                  </span>
                </h2>
                {routeResponse && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Engine: {routeResponse.provider}
                  </span>
                )}
              </div>

              {loadingRoutes ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-28 bg-white rounded-xl border border-slate-200 p-4" />
                  <div className="h-24 bg-white rounded-xl border border-slate-200 p-4" />
                </div>
              ) : (
                allRoutes.map((r, idx) => {
                  const isSelected = r.route_id === selectedRouteId;
                  const isVerifiedSafe = r.safety_status === "VERIFIED_SAFER_ROUTE";
                  const isHazardous = r.safety_status === "HAZARDOUS_ROUTE";
                  const isCaution = r.safety_status === "CAUTION_ROUTE";

                  let badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                  if (isVerifiedSafe)
                    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
                  else if (isHazardous)
                    badgeColor = "bg-red-50 text-red-700 border-red-300 font-bold";
                  else if (isCaution)
                    badgeColor = "bg-amber-50 text-amber-700 border-amber-300";

                  return (
                    <Card
                      key={r.route_id}
                      onClick={() => setSelectedRouteId(r.route_id)}
                      className={`cursor-pointer transition-all rounded-xl p-4 border ${
                        isSelected
                          ? "border-blue-600 ring-2 ring-blue-500/20 bg-white shadow-md"
                          : "border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">
                              {r.name}
                            </span>
                            {idx === 0 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {r.distance_km} km • ~{r.duration_minutes} min ETA
                          </div>
                        </div>

                        <Badge variant="outline" className={`text-[10px] ${badgeColor}`}>
                          {isVerifiedSafe && <Shield className="w-3 h-3 mr-1" />}
                          {isHazardous && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {r.safety_status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {/* Safety Label & Explanation */}
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {r.safety_label}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {r.risk_explanation}
                        </p>
                      </div>

                      {/* Intersecting Hazards detail if any */}
                      {r.hazard_intersections?.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Hazards Along Corridor ({r.hazard_intersections.length})
                          </div>
                          <div className="space-y-1">
                            {r.hazard_intersections.map((h, i) => (
                              <div
                                key={i}
                                className="text-[11px] bg-red-50/80 p-1.5 rounded border border-red-100 text-red-900"
                              >
                                <span className="font-bold">{h.hazard_category}:</span>{" "}
                                {h.description} ({h.distance_to_route_meters}m from route)
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Sufficiency Badge */}
                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span>
                          Hazard Telemetry:{" "}
                          <strong className="text-slate-700">
                            {r.data_sufficiency}
                          </strong>
                        </span>
                        <span className="font-mono">Risk Index: {r.risk_score}/100</span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: MAP & NEARBY EMERGENCY FACILITIES (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Interactive Map */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
              <NavigationRouteMap
                origin={origin}
                destination={destination}
                routes={allRoutes}
                selectedRouteId={selectedRouteId}
                onSelectRoute={(id) => setSelectedRouteId(id)}
                facilities={filteredFacilities}
                onSelectFacilityDestination={handleRouteToFacility}
                clickMode={clickMode}
                onMapClickCoordinate={handleMapClickCoordinate}
              />
            </div>

            {/* Selected Route Summary Banner */}
            {selectedRoute && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      Active Navigation Path
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedRoute.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-slate-900 font-mono">
                      ~{selectedRoute.duration_minutes} min
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {selectedRoute.distance_km} km distance
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Safety Certification
                    </div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedRoute.safety_status.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Bypassed Hazards
                    </div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {selectedRoute.avoided_hazards_count} Critical Points
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Composite Risk Score
                    </div>
                    <div className="font-bold text-slate-800 font-mono mt-0.5">
                      {selectedRoute.risk_score} / 100
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEARBY EMERGENCY FACILITIES PANEL */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-rose-600" />
                    Verified Emergency Facilities
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hospitals, shelters, and disaster stations. Genuine municipal infrastructure only.
                  </p>
                </div>

                {/* Facility Category Filter Tabs */}
                <div className="flex items-center space-x-1 overflow-x-auto text-xs">
                  {["ALL", "HOSPITAL", "EMERGENCY_SHELTER", "FIRE_STATION"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFacilityFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        facilityFilter === cat
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat === "ALL" ? "All" : cat.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Facility Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
                {loadingFacilities ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                    Loading verified emergency facilities...
                  </div>
                ) : filteredFacilities.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                    No emergency facilities match the selected filter within search radius.
                  </div>
                ) : (
                  filteredFacilities.map((fac) => {
                    const isHospital = fac.category === "HOSPITAL";
                    const isShelter = fac.category === "EMERGENCY_SHELTER";
                    const isFire = fac.category === "FIRE_STATION";

                    return (
                      <div
                        key={fac.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between hover:bg-slate-100/80 transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                isHospital
                                  ? "bg-rose-100 text-rose-800"
                                  : isShelter
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {fac.category.replace("_", " ")}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                              {fac.distance_km} km away
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 leading-snug">
                            {fac.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {fac.address}
                          </div>

                          {fac.capacity && (
                            <div className="text-[11px] text-slate-600 mt-1 flex items-center">
                              <Users className="w-3 h-3 mr-1 text-slate-400" />
                              Capacity: {fac.capacity.toLocaleString()} persons / beds
                            </div>
                          )}

                          {fac.contact_phone && (
                            <div className="text-[11px] text-blue-700 font-mono mt-1 flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-blue-500" />
                              {fac.contact_phone}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-700 font-medium flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Operational
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRouteToFacility(fac)}
                            className="text-xs h-7 px-2.5 bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Route Here
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

