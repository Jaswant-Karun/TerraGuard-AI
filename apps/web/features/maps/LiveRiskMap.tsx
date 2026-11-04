"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GeocodingResult,
  fetchMapLayers,
  searchLocations,
} from "@/services/map";
import {
  LayerVisibilityState,
  MapLayersData,
  SelectedFeatureInfo,
} from "@/types/map";

interface LiveRiskMapProps {
  className?: string;
  height?: string;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

const DEFAULT_LAYERS: LayerVisibilityState = {
  floodZones: true,
  heatIndicators: true,
  airQuality: true,
  citizenReports: true,
  verifiedIncidents: true,
  facilities: true,
  safeRoutes: true,
  heatmapMode: false,
};

export function LiveRiskMap({
  className = "",
  height = "calc(100vh - 4rem)",
  initialCenter = [77.5946, 12.9716],
  initialZoom = 12.2,
}: LiveRiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const popupRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [layersData, setLayersData] = useState<MapLayersData | null>(null);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>(DEFAULT_LAYERS);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeatureInfo | null>(null);

  // Search & Geolocation
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocationLocating, setUserLocationLocating] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d" | "all">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. Fetch map data layers from FastAPI backend
  const loadLayers = useCallback(async () => {
    try {
      const data = await fetchMapLayers();
      setLayersData(data);
      return data;
    } catch (err: any) {
      console.error("GIS map layer load error:", err);
      setMapError("Failed to load geospatial feature layers from TerraGuard API.");
      return null;
    }
  }, []);

  // 2. Initialize MapLibre GL instance
  useEffect(() => {
    let isMounted = true;
    let map: any = null;

    async function initMap() {
      if (!mapContainer.current) return;

      try {
        const maplibregl = (await import("maplibre-gl")).default;

        // Verify WebGL availability
        if (typeof window !== "undefined" && (maplibregl as any).supported && !(maplibregl as any).supported()) {
          if (isMounted) setMapError("WebGL is disabled or unsupported on this graphics device.");
          return;
        }

        // Professional Command-Center Carto Positron basemap (OSM-compatible tiles)
        map = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              "osm-tiles": {
                type: "raster",
                tiles: [
                  "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                  "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                  "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors, © CARTO",
              },
            },
            layers: [
              {
                id: "osm-layer",
                type: "raster",
                source: "osm-tiles",
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: initialCenter,
          zoom: initialZoom,
          pitch: 20,
          bearing: 0,
          attributionControl: false,
        });

        // Add standard navigation controls
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

        map.on("load", async () => {
          if (!isMounted) return;
          mapInstance.current = map;
          setMapLoaded(true);

          // Fetch layer GeoJSON data and attach to MapLibre sources
          const data = await loadLayers();
          if (data && map) {
            setupMapLayers(map, data, maplibregl);
          }
        });

        map.on("error", (e: any) => {
          console.warn("MapLibre tile event:", e);
        });
      } catch (err: any) {
        if (isMounted) {
          setMapError("Could not initialize MapLibre GL engine: " + err.message);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (map) map.remove();
    };
  }, [initialCenter, initialZoom, loadLayers]);

  // 3. Register sources, cluster rules, and visualization layers
  const setupMapLayers = (map: any, data: MapLayersData, maplibregl: any) => {
    // A. Risk Assessment Zones (Polygons)
    map.addSource("risk-zones-source", {
      type: "geojson",
      data: data.risk_zones,
    });

    map.addLayer({
      id: "risk-zones-fill",
      type: "fill",
      source: "risk-zones-source",
      paint: {
        "fill-color": [
          "match",
          ["get", "risk_level"],
          "CRITICAL", "#EF4444",
          "HIGH", "#F97316",
          "MODERATE", "#EAB308",
          "#3B82F6", // LOW
        ],
        "fill-opacity": 0.28,
      },
    });

    map.addLayer({
      id: "risk-zones-outline",
      type: "line",
      source: "risk-zones-source",
      paint: {
        "line-color": [
          "match",
          ["get", "risk_level"],
          "CRITICAL", "#DC2626",
          "HIGH", "#EA580C",
          "MODERATE", "#CA8A04",
          "#2563EB",
        ],
        "line-width": 2,
        "line-dasharray": [2, 1],
      },
    });

    // B. Safe Evacuation Routes (LineString)
    map.addSource("safe-routes-source", {
      type: "geojson",
      data: data.safe_routes,
    });

    map.addLayer({
      id: "safe-routes-line",
      type: "line",
      source: "safe-routes-source",
      paint: {
        "line-color": "#06B6D4",
        "line-width": 4,
        "line-opacity": 0.85,
      },
    });

    // C. Heatmap Layer for Hazard Density
    // Combines citizen reports and verified incidents
    const combinedFeatures = [
      ...data.citizen_reports.features,
      ...data.verified_incidents.features,
    ];

    map.addSource("hazard-density-source", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: combinedFeatures,
      },
    });

    map.addLayer({
      id: "hazard-heatmap",
      type: "heatmap",
      source: "hazard-density-source",
      maxzoom: 15,
      layout: {
        visibility: "none", // Toggled via UI
      },
      paint: {
        "heatmap-weight": ["interpolate", ["linear"], ["get", "severity"], 1, 0.2, 5, 1.0],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0, "rgba(6,182,212,0)",
          0.2, "rgba(6,182,212,0.4)",
          0.4, "rgba(234,179,8,0.6)",
          0.7, "rgba(249,115,22,0.8)",
          1.0, "rgba(239,68,68,0.9)",
        ],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 15, 30],
        "heatmap-opacity": 0.75,
      },
    });

    // D. Citizen Reports (Clustered Points)
    map.addSource("citizen-reports-source", {
      type: "geojson",
      data: data.citizen_reports,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Cluster circles
    map.addLayer({
      id: "citizen-clusters",
      type: "circle",
      source: "citizen-reports-source",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#F59E0B",
        "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 30],
        "circle-opacity": 0.85,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    });

    // Cluster count label
    map.addLayer({
      id: "citizen-cluster-count",
      type: "symbol",
      source: "citizen-reports-source",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
        "text-font": ["Open Sans Bold"],
      },
      paint: {
        "text-color": "#FFFFFF",
      },
    });

    // Unclustered citizen report points
    map.addLayer({
      id: "citizen-unclustered",
      type: "circle",
      source: "citizen-reports-source",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#F59E0B",
        "circle-radius": 7,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    });

    // E. Verified Municipal Incidents (Points)
    map.addSource("verified-incidents-source", {
      type: "geojson",
      data: data.verified_incidents,
    });

    map.addLayer({
      id: "verified-incidents-circle",
      type: "circle",
      source: "verified-incidents-source",
      paint: {
        "circle-color": "#EF4444",
        "circle-radius": 9,
        "circle-stroke-width": 2.5,
        "circle-stroke-color": "#FFFFFF",
      },
    });

    // F. Safe Facilities & Hospitals (Points)
    map.addSource("facilities-source", {
      type: "geojson",
      data: data.facilities,
    });

    map.addLayer({
      id: "facilities-circle",
      type: "circle",
      source: "facilities-source",
      paint: {
        "circle-color": "#10B981", // Emerald green for safe facilities
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    });

    // G. Environmental Sensor Stations (Points)
    map.addSource("sensors-source", {
      type: "geojson",
      data: data.environmental_sensors,
    });

    map.addLayer({
      id: "sensors-circle",
      type: "circle",
      source: "sensors-source",
      paint: {
        "circle-color": "#0284C7", // Cyan/Blue for informational sensor observation
        "circle-radius": 7,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    });

    // 4. Register Interactive Click & Popup Listeners
    setupClickHandlers(map, maplibregl);
  };

  const setupClickHandlers = (map: any, maplibregl: any) => {
    // A. Click on risk polygons
    map.on("click", "risk-zones-fill", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const props = feat.properties;

      setSelectedFeature({
        title: props.name || "Risk Zone",
        category: props.primary_hazard || "MULTI_HAZARD",
        dataClassification: "MODEL_GENERATED_RISK_ESTIMATE",
        dataClassificationLabel: props.data_classification_label || "Model-Generated Risk Estimate",
        severityOrScore: `${props.composite_risk_score} / 100 (${props.risk_level})`,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        description: `Calculated urban drainage threat zone. High correlation with precipitation index.`,
        actionDirective: "Deploy stormwater suction pumps and prepare traffic rerouting.",
      });
    });

    // B. Click on verified incidents
    map.on("click", "verified-incidents-circle", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const props = e.features[0].properties;

      setSelectedFeature({
        title: props.title,
        category: props.category,
        dataClassification: "VERIFIED_INCIDENT",
        dataClassificationLabel: "Verified Municipal Incident",
        severityOrScore: `Severity ${props.severity} / 5`,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        address: props.address,
        description: props.description,
        actionDirective: "Dispatched municipal emergency crews on-site.",
      });
    });

    // C. Click on citizen reports
    map.on("click", "citizen-unclustered", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const props = e.features[0].properties;

      setSelectedFeature({
        title: props.title,
        category: props.category,
        dataClassification: "CITIZEN_REPORTED_HAZARD",
        dataClassificationLabel: "Citizen-Reported Hazard (Unverified)",
        severityOrScore: `Reported Severity ${props.severity} / 5`,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        address: props.address,
        description: props.description,
        actionDirective: "Awaiting field officer visual triage and verification.",
      });
    });

    // D. Click on emergency facilities
    map.on("click", "facilities-circle", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const props = e.features[0].properties;

      setSelectedFeature({
        title: props.name,
        category: props.category,
        dataClassification: "SAFE_AVAILABLE_FACILITY",
        dataClassificationLabel: "Safe / Verified Emergency Facility",
        severityOrScore: props.is_operational ? "Operational" : "Limited Capacity",
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        address: props.address,
        contactPhone: props.contact_phone,
        capacity: props.capacity,
        actionDirective: "Approved civilian triage & evacuation muster point.",
      });
    });

    // E. Click on environmental sensors
    map.on("click", "sensors-circle", (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const props = e.features[0].properties;

      setSelectedFeature({
        title: `Telemetry Station: ${props.station_id}`,
        category: "RAW_IOT_SENSOR",
        dataClassification: "OBSERVED_ENVIRONMENTAL_CONDITION",
        dataClassificationLabel: "Observed Environmental Condition (Raw Sensor)",
        severityOrScore: `Rainfall: ${props.rainfall_mm} mm/h | AQI: ${props.aqi}`,
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        description: `Direct calibrated sensor observation. Does not guarantee street flooding without topological runoff verification.`,
        actionDirective: "Continuous municipal telemetry stream.",
      });
    });

    // Cursor pointer styling
    ["risk-zones-fill", "verified-incidents-circle", "citizen-unclustered", "facilities-circle", "sensors-circle"].forEach((layerId) => {
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });
    });
  };

  // 4. Toggle layer visibility
  const toggleLayer = (layerKey: keyof LayerVisibilityState) => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    const nextState = !layerVisibility[layerKey];
    setLayerVisibility((prev) => ({ ...prev, [layerKey]: nextState }));

    const visibilityVal = nextState ? "visible" : "none";

    switch (layerKey) {
      case "floodZones":
        if (map.getLayer("risk-zones-fill")) map.setLayoutProperty("risk-zones-fill", "visibility", visibilityVal);
        if (map.getLayer("risk-zones-outline")) map.setLayoutProperty("risk-zones-outline", "visibility", visibilityVal);
        break;
      case "safeRoutes":
        if (map.getLayer("safe-routes-line")) map.setLayoutProperty("safe-routes-line", "visibility", visibilityVal);
        break;
      case "heatmapMode":
        if (map.getLayer("hazard-heatmap")) map.setLayoutProperty("hazard-heatmap", "visibility", visibilityVal);
        break;
      case "citizenReports":
        if (map.getLayer("citizen-clusters")) map.setLayoutProperty("citizen-clusters", "visibility", visibilityVal);
        if (map.getLayer("citizen-cluster-count")) map.setLayoutProperty("citizen-cluster-count", "visibility", visibilityVal);
        if (map.getLayer("citizen-unclustered")) map.setLayoutProperty("citizen-unclustered", "visibility", visibilityVal);
        break;
      case "verifiedIncidents":
        if (map.getLayer("verified-incidents-circle")) map.setLayoutProperty("verified-incidents-circle", "visibility", visibilityVal);
        break;
      case "facilities":
        if (map.getLayer("facilities-circle")) map.setLayoutProperty("facilities-circle", "visibility", visibilityVal);
        break;
      case "airQuality":
      case "heatIndicators":
        if (map.getLayer("sensors-circle")) map.setLayoutProperty("sensors-circle", "visibility", visibilityVal);
        break;
    }
  };

  // 5. Search Location Handler
  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchLocations(val);
    setSearchResults(results);
    setIsSearching(false);
  };

  const jumpToLocation = (coords: [number, number]) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo({
      center: coords,
      zoom: 14.5,
      pitch: 30,
      essential: true,
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  // 6. User Geolocation Handler
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setUserLocationLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocationLocating(false);
        const { longitude, latitude } = pos.coords;
        if (mapInstance.current) {
          mapInstance.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            pitch: 25,
            essential: true,
          });
        }
      },
      (err) => {
        setUserLocationLocating(false);
        alert("Location access denied or timed out: " + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 7. Reset Compass Bearing
  const handleResetBearing = () => {
    if (mapInstance.current) {
      mapInstance.current.resetNorthPitch({ duration: 800 });
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-900 border border-slate-200 shadow-sm ${className}`}
      style={{ height }}
    >
      {/* MapLibre DOM Node */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Offline / Error Fallback State */}
      {mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center backdrop-blur-md">
          <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            GIS Map Engine Temporarily Unavailable
          </h3>
          <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
            {mapError}
          </p>
          <Button
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
            variant="primary"
            size="sm"
            className="gap-2 font-bold"
          >
            <RefreshCw className="h-4 w-4" />
            Reload GIS Basemap
          </Button>
        </div>
      )}

      {/* Top Floating Bar: Location Search & Sector Presets */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-sm sm:max-w-md w-full">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search urban sector, hospital, or coordinates..."
            className="h-10 w-full rounded-xl border border-slate-200/80 bg-white/95 pl-9 pr-9 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur-md focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => jumpToLocation(res.coordinates)}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs hover:bg-slate-50 transition"
                >
                  <MapPin className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col truncate">
                    <span className="font-bold text-slate-900 truncate">{res.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">
                      {res.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Controls: Geolocation, Reset North, Layers Toggle, Legend */}
      <div className="absolute top-4 right-14 z-20 flex items-center gap-2">
        {/* Current Location Button */}
        <button
          onClick={handleLocateUser}
          disabled={userLocationLocating}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md hover:bg-cyan-50 hover:text-cyan-700 transition"
          title="Zoom to current location"
        >
          <Crosshair className={`h-4 w-4 ${userLocationLocating ? "animate-spin text-cyan-600" : ""}`} />
        </button>

        {/* Reset Bearing (North) */}
        <button
          onClick={handleResetBearing}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur-md hover:bg-slate-50 transition"
          title="Reset map orientation (North)"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Layers Manager Toggle */}
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex h-10 items-center gap-1.5 px-3 rounded-xl border shadow-lg backdrop-blur-md text-xs font-bold transition ${
            showLayerPanel
              ? "bg-[#0B132B] text-white border-slate-800"
              : "bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Layers className="h-4 w-4 text-cyan-500" />
          <span className="hidden sm:inline">GIS Layers</span>
        </button>
      </div>

      {/* Floating Layers Selection Panel */}
      {showLayerPanel && (
        <div className="absolute top-16 right-4 z-30 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-600" />
              GIS Layer Controls
            </span>
            <button
              onClick={() => setShowLayerPanel(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* Flood Risk Zones */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className="h-3 w-3 rounded bg-rose-500/80 border border-rose-600" />
                Flood Risk Zones (AI Model)
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.floodZones}
                onChange={() => toggleLayer("floodZones")}
                className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            {/* Verified Incidents */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className="h-3 w-3 rounded-full bg-rose-600" />
                Verified Incidents (Active)
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.verifiedIncidents}
                onChange={() => toggleLayer("verifiedIncidents")}
                className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            {/* Citizen Reported Hazards */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                Citizen Reports (Unverified)
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.citizenReports}
                onChange={() => toggleLayer("citizenReports")}
                className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            {/* Hospitals & Shelters */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Hospitals & Shelters (Safe)
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.facilities}
                onChange={() => toggleLayer("facilities")}
                className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            {/* Environmental Sensors */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className="h-3 w-3 rounded-full bg-sky-600" />
                Raw Sensor Telemetry (Rain/AQI)
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.airQuality}
                onChange={() => toggleLayer("airQuality")}
                className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            {/* Evacuation Routes */}
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className="h-1 w-4 rounded bg-cyan-500" />
                Evacuation Safe Routes
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.safeRoutes}
                onChange={() => toggleLayer("safeRoutes")}
                className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
              />
            </label>

            <div className="border-t border-slate-100 pt-2" />

            {/* Heatmap Density Mode */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <span className="flex items-center gap-2 font-bold text-slate-900">
                <Flame className="h-4 w-4 text-rose-500" />
                Density Heatmap Mode
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.heatmapMode}
                onChange={() => toggleLayer("heatmapMode")}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Bottom Left Floating Legend: Scientific Separation & Color Scheme */}
      {showLegend && (
        <div className="absolute bottom-6 left-4 z-20 max-w-xs sm:max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-600" />
              GIS Intelligence Legend
            </span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-700">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-emerald-800">Green:</span>
              <span className="truncate">Safe & Operational Facilities (Hospitals/Shelters)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600 shrink-0" />
              <span className="font-semibold text-sky-800">Blue:</span>
              <span className="truncate">Raw Sensor Observations (Does not guarantee flood)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold text-amber-800">Yellow/Amber:</span>
              <span className="truncate">Citizen-Reported Hazards (Unverified)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shrink-0" />
              <span className="font-semibold text-rose-800">Red:</span>
              <span className="truncate">Verified Municipal Incidents & High-Risk Zones</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-tight">
            Scientific Separation: Rainfall observations are kept distinct from verified flood ground-truth.
          </div>
        </div>
      )}

      {/* Feature Details Inspector Card (When clicked) */}
      {selectedFeature && (
        <div className="absolute bottom-6 right-4 z-30 max-w-xs sm:max-w-md w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Badge
                  variant={
                    selectedFeature.dataClassification === "VERIFIED_INCIDENT"
                      ? "critical"
                      : selectedFeature.dataClassification === "SAFE_AVAILABLE_FACILITY"
                      ? "low"
                      : selectedFeature.dataClassification === "CITIZEN_REPORTED_HAZARD"
                      ? "high"
                      : "cyan"
                  }
                  className="font-bold text-[9px]"
                >
                  {selectedFeature.dataClassificationLabel}
                </Badge>
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                {selectedFeature.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedFeature.severityOrScore && (
            <div className="mb-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 font-mono">
              {selectedFeature.severityOrScore}
            </div>
          )}

          {selectedFeature.description && (
            <p className="text-xs text-slate-600 leading-relaxed mb-2">
              {selectedFeature.description}
            </p>
          )}

          {selectedFeature.address && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
              <MapPin className="h-3 w-3 text-cyan-600 shrink-0" />
              <span className="truncate">{selectedFeature.address}</span>
            </div>
          )}

          {selectedFeature.actionDirective && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-2.5 text-xs text-cyan-950 font-medium leading-relaxed">
              <span className="font-bold text-cyan-900 block text-[10px] uppercase">
                Action Directive:
              </span>
              {selectedFeature.actionDirective}
            </div>
          )}
        </div>
      )}

      {/* Basemap Attribution Badge */}
      <div className="absolute bottom-1 right-2 z-10 text-[10px] text-slate-500 bg-white/80 px-2 py-0.5 rounded shadow-xs backdrop-blur-xs select-none">
        © OpenStreetMap contributors, © CARTO, TerraGuard GIS Engine
      </div>
    </div>
  );
}
