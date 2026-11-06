"use client";

import React, { useEffect, useRef, useState } from "react";
import { Layers, ShieldAlert, Maximize2, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CityRiskMapProps {
  interactive?: boolean;
  className?: string;
  height?: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

const DEFAULT_CITY_CENTER: [number, number] = [77.5946, 12.9716];

export function CityRiskMap({
  interactive = true,
  className = "",
  height = "520px",
  center = DEFAULT_CITY_CENTER,
  zoom = 12.5,
}: CityRiskMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [activeLayer, setActiveLayer] = useState<"all" | "flood" | "air" | "infra">("all");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selectedZone, setSelectedZone] = useState<{
    name: string;
    level: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
    score: number;
    hazard: string;
    action: string;
  } | null>({
    name: "Central Lowland Drainage Basin (Sector 4)",
    level: "CRITICAL",
    score: 88.4,
    hazard: "Flash Inundation (>0.65m)",
    action: "Deploy high-volume suction pump units and trigger road diversions.",
  });

  const centerLng = center?.[0] ?? DEFAULT_CITY_CENTER[0];
  const centerLat = center?.[1] ?? DEFAULT_CITY_CENTER[1];

  useEffect(() => {
    let isMounted = true;
    let map: any = null;

    async function initMap() {
      if (!mapContainer.current || mapInstance.current) return;

      try {
        const maplibregl = (await import("maplibre-gl")).default;

        // Clean OpenStreetMap command center basemap style (Free, no API key required)
        map = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              "osm-tiles": {
                type: "raster",
                tiles: [
                  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
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
          center: center,
          zoom: zoom,
          pitch: 25,
          interactive: interactive,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          if (!isMounted) return;
          setMapLoaded(true);

          // 1. Add Urban Flood Risk Polygon Layer
          map.addSource("urban-risk-zones", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {
                    name: "Central Lowland Drainage Basin (Sector 4)",
                    risk_level: "CRITICAL",
                    score: 88.4,
                    hazard: "Flash Inundation (>0.65m)",
                    color: "#F43F5E",
                    action: "Deploy high-volume suction pump units and trigger road diversions.",
                  },
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [77.585, 12.965],
                        [77.605, 12.965],
                        [77.605, 12.978],
                        [77.595, 12.982],
                        [77.585, 12.975],
                        [77.585, 12.965],
                      ],
                    ],
                  },
                },
                {
                  type: "Feature",
                  properties: {
                    name: "North Lake Overflow Catchment",
                    risk_level: "HIGH",
                    score: 72.1,
                    hazard: "Stormwater runoff rate 180 m³/s",
                    color: "#F97316",
                    action: "Open sluice gate #2 and activate overflow canal barrier.",
                  },
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [77.575, 12.982],
                        [77.592, 12.985],
                        [77.588, 12.998],
                        [77.572, 12.995],
                        [77.575, 12.982],
                      ],
                    ],
                  },
                },
                {
                  type: "Feature",
                  properties: {
                    name: "East Industrial Corridor",
                    risk_level: "MODERATE",
                    score: 49.3,
                    hazard: "Particulate inversion spike PM2.5: 148 µg/m³",
                    color: "#F59E0B",
                    action: "Issue localized air quality advisories for sensitive groups.",
                  },
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [77.605, 12.965],
                        [77.625, 12.965],
                        [77.625, 12.980],
                        [77.605, 12.980],
                        [77.605, 12.965],
                      ],
                    ],
                  },
                },
              ],
            },
          });

          // Fill Layer
          map.addLayer({
            id: "risk-zones-fill",
            type: "fill",
            source: "urban-risk-zones",
            paint: {
              "fill-color": ["get", "color"],
              "fill-opacity": 0.35,
            },
          });

          // Outline Layer
          map.addLayer({
            id: "risk-zones-line",
            type: "line",
            source: "urban-risk-zones",
            paint: {
              "line-color": ["get", "color"],
              "line-width": 2.5,
            },
          });

          // 2. Add Live Sensor Markers Source
          map.addSource("sensor-nodes", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {
                    title: "Storm Drain Sensor #04",
                    type: "HYDROLOGICAL",
                    water_depth: "0.68m",
                    status: "ALARM",
                  },
                  geometry: { type: "Point", coordinates: [77.5946, 12.9716] },
                },
                {
                  type: "Feature",
                  properties: {
                    title: "Air Station Alpha",
                    type: "ATMOSPHERIC",
                    aqi: 142,
                    status: "WARNING",
                  },
                  geometry: { type: "Point", coordinates: [77.615, 12.974] },
                },
                {
                  type: "Feature",
                  properties: {
                    title: "River Outflow Gateway",
                    type: "FLOW",
                    discharge: "210 m³/s",
                    status: "NORMAL",
                  },
                  geometry: { type: "Point", coordinates: [77.58, 12.99] },
                },
              ],
            },
          });

          // Circle Marker Layer for Sensors
          map.addLayer({
            id: "sensor-nodes-circle",
            type: "circle",
            source: "sensor-nodes",
            paint: {
              "circle-radius": 7,
              "circle-color": "#06B6D4",
              "circle-stroke-width": 2.5,
              "circle-stroke-color": "#FFFFFF",
            },
          });

          // Interactivity on polygon click
          map.on("click", "risk-zones-fill", (e: any) => {
            if (e.features && e.features[0]) {
              const props = e.features[0].properties;
              setSelectedZone({
                name: props.name,
                level: props.risk_level,
                score: Number(props.score),
                hazard: props.hazard,
                action: props.action,
              });
            }
          });

          map.on("mouseenter", "risk-zones-fill", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "risk-zones-fill", () => {
            map.getCanvas().style.cursor = "";
          });
        });

        mapInstance.current = map;
      } catch (err) {
        console.error("MapLibre GL initialization error:", err);
        if (isMounted) setMapError(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (map) {
        mapInstance.current = null;
        map.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLng, centerLat, zoom, interactive]);

  const toggleLayerFilter = (layer: "all" | "flood" | "air" | "infra") => {
    setActiveLayer(layer);
    const map = mapInstance.current as any;
    if (!map || !map.getLayer("risk-zones-fill")) return;

    if (layer === "all") {
      map.setFilter("risk-zones-fill", null);
      map.setFilter("risk-zones-line", null);
    } else if (layer === "flood") {
      map.setFilter("risk-zones-fill", ["in", "risk_level", "CRITICAL", "HIGH"]);
      map.setFilter("risk-zones-line", ["in", "risk_level", "CRITICAL", "HIGH"]);
    } else if (layer === "air") {
      map.setFilter("risk-zones-fill", ["==", "risk_level", "MODERATE"]);
      map.setFilter("risk-zones-line", ["==", "risk_level", "MODERATE"]);
    }
  };

  const resetView = () => {
    const map = mapInstance.current as any;
    if (map) {
      map.flyTo({ center: center, zoom: zoom, pitch: 25, essential: true });
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-command ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainer} style={{ width: "100%", height: height }} />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm z-10 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-500">Loading Live Geospatial Radar...</p>
        </div>
      )}

      {/* Error Fallback Banner */}
      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 z-10 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
          <h4 className="text-sm font-semibold text-slate-800">Vector Basemap Standby</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Interactive WebGL tile preview ready. Environmental telemetry overlay active.
          </p>
        </div>
      )}

      {/* Map Control Top Bar Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-200/90 shadow-sm text-xs font-medium">
          <button
            onClick={() => toggleLayerFilter("all")}
            className={`px-2.5 py-1 rounded-md transition ${
              activeLayer === "all"
                ? "bg-navy-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Hazards
          </button>
          <button
            onClick={() => toggleLayerFilter("flood")}
            className={`px-2.5 py-1 rounded-md transition ${
              activeLayer === "flood"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Flood Risk
          </button>
          <button
            onClick={() => toggleLayerFilter("air")}
            className={`px-2.5 py-1 rounded-md transition ${
              activeLayer === "air"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Air Inversion
          </button>
        </div>

        <button
          onClick={resetView}
          title="Reset Map Center"
          className="p-2 bg-white/95 backdrop-blur-md text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200/90 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected Risk Zone Telemetry Popup (Bottom Left) */}
      {selectedZone && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200/90 shadow-command-lg space-y-2">
          <div className="flex items-center justify-between">
            <Badge
              variant={
                selectedZone.level === "CRITICAL"
                  ? "critical"
                  : selectedZone.level === "HIGH"
                  ? "high"
                  : selectedZone.level === "MODERATE"
                  ? "moderate"
                  : "low"
              }
              pulse={selectedZone.level === "CRITICAL"}
            >
              {selectedZone.level} RISK · {selectedZone.score}/100
            </Badge>
            <span className="text-[10px] font-mono text-slate-400">Click zone to inspect</span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-snug">
              {selectedZone.name}
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              <span className="font-semibold text-slate-700">Threat:</span> {selectedZone.hazard}
            </p>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
            <span className="font-semibold text-brand-blue">AI Protocol:</span> {selectedZone.action}
          </div>
        </div>
      )}

      {/* Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-lg p-2.5 border border-slate-200/90 shadow-sm text-[10px] space-y-1.5 font-medium text-slate-600 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Critical (80–100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>High Risk (60–79)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Moderate (40–59)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span>IoT Sensor Node</span>
        </div>
      </div>
    </div>
  );
}

