"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  BasemapStyle,
  ExperienceId,
  FloodRiskFeature,
  FloodRiskGeoJSON,
  LayerConfig,
  MapPreset,
  MapStudioExperienceResponse,
} from "../types/studio";
import { BASEMAP_STYLES } from "../services/map_studio";

interface MapStudioCanvasProps {
  basemapStyle: BasemapStyle;
  layers: LayerConfig[];
  floodZones: FloodRiskGeoJSON;
  activePreset: MapPreset;
  timeOffsetHours: number;
  activeExperienceId?: ExperienceId;
  experienceData?: MapStudioExperienceResponse | null;
  onSelectFeature: (feature: FloodRiskFeature | null) => void;
  onMapLoaded?: (mapInstance: any) => void;
  isDarkGIS?: boolean;
  onOpenZoneExplanation?: (zoneId: string) => void;
  onSelectLocation?: (coords: [number, number], areaName?: string) => void;
  onLoadingLayersChange?: (loadingLayerIds: string[]) => void;
}

export function MapStudioCanvas({
  basemapStyle,
  layers,
  floodZones,
  activePreset,
  timeOffsetHours,
  activeExperienceId = "operational-satellite-gis",
  experienceData,
  onSelectFeature,
  onMapLoaded,
  isDarkGIS = true,
  onOpenZoneExplanation,
  onSelectLocation,
  onLoadingLayersChange,
}: MapStudioCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const isInitializing = useRef(false);
  const popupRef = useRef<any>(null);
  const loadedLayersRef = useRef<Set<string>>(new Set());

  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [loadingLayers, setLoadingLayers] = useState<string[]>([]);

  // Synchronized refs to avoid re-initializing map on prop changes
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const activeExpRef = useRef(activeExperienceId);
  activeExpRef.current = activeExperienceId;
  const expDataRef = useRef(experienceData);
  expDataRef.current = experienceData;
  const currentBasemapRef = useRef(basemapStyle);

  // Register global callbacks for popup explanation trigger & area analytics (Prompt 7)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__openFloodExplanation = (zoneId: string) => {
        if (onOpenZoneExplanation) {
          onOpenZoneExplanation(zoneId);
        }
      };
      (window as any).__openAreaAnalytics = (lat: number, lng: number, name: string) => {
        if (onSelectLocation) {
          onSelectLocation([lng, lat], name);
        }
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__openFloodExplanation;
        delete (window as any).__openAreaAnalytics;
      }
    };
  }, [onOpenZoneExplanation, onSelectLocation]);

  // Generate MapLibre Style Specification for given Basemap
  const getStyleSpec = useCallback((styleKey: BasemapStyle): any => {
    const config = BASEMAP_STYLES[styleKey] || BASEMAP_STYLES.satellite;
    const sources: any = {
      "basemap-raster-source": {
        type: "raster",
        tiles: config.tiles,
        tileSize: 256,
        attribution: config.attribution,
        maxzoom: config.maxzoom,
      },
    };
    const styleLayers: any = [
      {
        id: "basemap-raster-layer",
        type: "raster",
        source: "basemap-raster-source",
        minzoom: 0,
        maxzoom: 22,
      },
    ];

    if (config.labels && config.labels.length > 0) {
      sources["basemap-labels-source"] = {
        type: "raster",
        tiles: config.labels,
        tileSize: 256,
        maxzoom: config.maxzoom || 19,
      };
      styleLayers.push({
        id: "basemap-labels-layer",
        type: "raster",
        source: "basemap-labels-source",
        minzoom: 0,
        maxzoom: 22,
      });
    }

    return {
      version: 8,
      sources,
      layers: styleLayers,
    };
  }, []);

  // On-Demand Layer Factory: Injects a specific layer only when requested
  const loadLayerOnDemand = useCallback(
    (map: any, layerKey: string) => {
      if (!map || !map.isStyleLoaded() || loadedLayersRef.current.has(layerKey)) return;

      switch (layerKey) {
        case "flood_risk":
        case "flood_risk_zones": {
          if (!map.getSource("studio-flood-zones")) {
            map.addSource("studio-flood-zones", {
              type: "geojson",
              data: floodZones,
            });

            const isFloodExp =
              activeExpRef.current === "operational-satellite-gis" ||
              activeExpRef.current === "flood-risk-intelligence";

            map.addLayer({
              id: "studio-flood-zones-fill",
              type: "fill",
              source: "studio-flood-zones",
              layout: {
                visibility: isFloodExp ? "visible" : "none",
              },
              paint: {
                "fill-color": [
                  "match",
                  ["get", "risk_level"],
                  "CRITICAL",
                  "#ef4444",
                  "HIGH",
                  "#f97316",
                  "MODERATE",
                  "#eab308",
                  "LOW",
                  "#10b981",
                  "#3b82f6",
                ],
                "fill-opacity": 0.75,
              },
            });

            map.addLayer({
              id: "studio-flood-zones-line",
              type: "line",
              source: "studio-flood-zones",
              layout: {
                visibility: isFloodExp ? "visible" : "none",
              },
              paint: {
                "line-color": [
                  "match",
                  ["get", "risk_level"],
                  "CRITICAL",
                  "#fca5a5",
                  "HIGH",
                  "#fdba74",
                  "MODERATE",
                  "#fef08a",
                  "LOW",
                  "#86efac",
                  "#93c5fd",
                ],
                "line-width": 2.5,
              },
            });
          }
          break;
        }

        case "rainfall": {
          if (!map.getSource("studio-rainfall")) {
            map.addSource("studio-rainfall", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "Koramangala AWS", rain_mm_h: 48.5, color: "#a855f7" }, geometry: { type: "Point", coordinates: [77.6250, 12.9280] } },
                  { type: "Feature", properties: { name: "HAL Airport IMD", rain_mm_h: 42.0, color: "#ef4444" }, geometry: { type: "Point", coordinates: [77.6680, 12.9550] } },
                  { type: "Feature", properties: { name: "Central Command", rain_mm_h: 26.4, color: "#f97316" }, geometry: { type: "Point", coordinates: [77.5946, 12.9716] } },
                  { type: "Feature", properties: { name: "Hebbal AWS", rain_mm_h: 18.2, color: "#38bdf8" }, geometry: { type: "Point", coordinates: [77.5980, 13.0280] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-rainfall-circle",
              type: "circle",
              source: "studio-rainfall",
              paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "temperature": {
          if (!map.getSource("studio-temperature")) {
            map.addSource("studio-temperature", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "MG Road Commercial", temp_c: 34.2, color: "#f97316" }, geometry: { type: "Point", coordinates: [77.6080, 12.9750] } },
                  { type: "Feature", properties: { name: "Peenya Industrial", temp_c: 35.8, color: "#dc2626" }, geometry: { type: "Point", coordinates: [77.5250, 13.0320] } },
                  { type: "Feature", properties: { name: "Cubbon Park", temp_c: 28.9, color: "#10b981" }, geometry: { type: "Point", coordinates: [77.5920, 12.9760] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-temperature-circle",
              type: "circle",
              source: "studio-temperature",
              paint: { "circle-radius": 6.5, "circle-color": ["get", "color"], "circle-stroke-width": 1.5, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "heat_risk": {
          if (!map.getSource("studio-heat-risk")) {
            map.addSource("studio-heat-risk", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "Peenya Heat Island", heat_index: 41.2, color: "#dc2626" }, geometry: { type: "Point", coordinates: [77.5250, 13.0320] } },
                  { type: "Feature", properties: { name: "CBD Asphalt Core", heat_index: 38.6, color: "#f97316" }, geometry: { type: "Point", coordinates: [77.6080, 12.9750] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-heat-risk-circle",
              type: "circle",
              source: "studio-heat-risk",
              paint: { "circle-radius": 8.5, "circle-color": ["get", "color"], "circle-opacity": 0.8, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "air_quality": {
          if (!map.getSource("studio-air-quality")) {
            map.addSource("studio-air-quality", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "BTM Layout CAAQMS", aqi: 142, color: "#f59e0b" }, geometry: { type: "Point", coordinates: [77.6100, 12.9160] } },
                  { type: "Feature", properties: { name: "Silk Board Inversion Junction", aqi: 188, color: "#ef4444" }, geometry: { type: "Point", coordinates: [77.6230, 12.9170] } },
                  { type: "Feature", properties: { name: "Jayanagar 4th Block", aqi: 78, color: "#10b981" }, geometry: { type: "Point", coordinates: [77.5830, 12.9310] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-air-quality-circle",
              type: "circle",
              source: "studio-air-quality",
              paint: { "circle-radius": 7.5, "circle-color": ["get", "color"], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "roads": {
          if (!map.getSource("studio-roads")) {
            map.addSource("studio-roads", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "Hosur Main Road Arterial Corridor" }, geometry: { type: "LineString", coordinates: [[77.6180, 12.9360], [77.6230, 12.9170], [77.6320, 12.9050]] } },
                  { type: "Feature", properties: { name: "Outer Ring Road (ORR)" }, geometry: { type: "LineString", coordinates: [[77.6850, 12.9280], [77.6750, 12.9350], [77.6650, 12.9450]] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-roads-line",
              type: "line",
              source: "studio-roads",
              paint: { "line-color": "#38bdf8", "line-width": 2.5, "line-opacity": 0.8 },
            });
          }
          break;
        }

        case "water_bodies": {
          if (!map.getSource("studio-water-bodies")) {
            map.addSource("studio-water-bodies", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "Bellandur Wetland Basin", area_sqkm: 3.6 }, geometry: { type: "Polygon", coordinates: [[[77.6650, 12.9350], [77.6800, 12.9380], [77.6780, 12.9250], [77.6620, 12.9240], [77.6650, 12.9350]]] } },
                  { type: "Feature", properties: { name: "Ulsoor Historic Reservoir", area_sqkm: 1.2 }, geometry: { type: "Polygon", coordinates: [[[77.6180, 12.9800], [77.6260, 12.9840], [77.6280, 12.9750], [77.6190, 12.9730], [77.6180, 12.9800]]] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-water-bodies-fill",
              type: "fill",
              source: "studio-water-bodies",
              paint: { "fill-color": "#0284c7", "fill-opacity": 0.75 },
            });
            map.addLayer({
              id: "studio-water-bodies-line",
              type: "line",
              source: "studio-water-bodies",
              paint: { "line-color": "#38bdf8", "line-width": 2 },
            });
          }
          break;
        }

        case "drainage": {
          if (!map.getSource("studio-drainage-channels")) {
            map.addSource("studio-drainage-channels", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "K-100 Primary Storm Culvert Raja Kaluve" }, geometry: { type: "LineString", coordinates: [[77.6050, 12.9700], [77.6200, 12.9400], [77.6350, 12.9270], [77.6650, 12.9350]] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-drainage-channels-line",
              type: "line",
              source: "studio-drainage-channels",
              paint: { "line-color": "#06b6d4", "line-width": 3, "line-dasharray": [3, 2] },
            });
          }
          break;
        }

        case "hospitals": {
          if (!map.getSource("studio-hospitals")) {
            map.addSource("studio-hospitals", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "St. John's Medical College Hospital", beds: 1200 }, geometry: { type: "Point", coordinates: [77.6210, 12.9310] } },
                  { type: "Feature", properties: { name: "Manipal Hospital HAL Road", beds: 650 }, geometry: { type: "Point", coordinates: [77.6520, 12.9590] } },
                  { type: "Feature", properties: { name: "Apollo Hospital Bannerghatta", beds: 500 }, geometry: { type: "Point", coordinates: [77.5990, 12.8930] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-hospitals-circle",
              type: "circle",
              source: "studio-hospitals",
              paint: { "circle-radius": 7, "circle-color": "#ef4444", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "emergency_facilities": {
          if (!map.getSource("studio-emergency")) {
            map.addSource("studio-emergency", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "Jayanagar Fire & Rescue Command" }, geometry: { type: "Point", coordinates: [77.5820, 12.9300] } },
                  { type: "Feature", properties: { name: "Whitefield Police Logistics Post" }, geometry: { type: "Point", coordinates: [77.7450, 12.9700] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-emergency-circle",
              type: "circle",
              source: "studio-emergency",
              paint: { "circle-radius": 6.5, "circle-color": "#f97316", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "shelters": {
          if (!map.getSource("studio-shelters")) {
            map.addSource("studio-shelters", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { name: "Koramangala Indoor Evacuation Stadium", capacity: 1200 }, geometry: { type: "Point", coordinates: [77.6200, 12.9340] } },
                  { type: "Feature", properties: { name: "BBMP Community Hall Shelter 4B", capacity: 600 }, geometry: { type: "Point", coordinates: [77.6350, 12.9320] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-shelters-circle",
              type: "circle",
              source: "studio-shelters",
              paint: { "circle-radius": 7, "circle-color": "#10b981", "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "citizen_reports": {
          if (!map.getSource("studio-citizen-reports")) {
            map.addSource("studio-citizen-reports", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { title: "Waterlogging 80ft Road", severity: 3 }, geometry: { type: "Point", coordinates: [77.6240, 12.9330] } },
                  { type: "Feature", properties: { title: "Deep Pothole Outer Ring Road", severity: 2 }, geometry: { type: "Point", coordinates: [77.6850, 12.9280] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-citizen-reports-circle",
              type: "circle",
              source: "studio-citizen-reports",
              paint: { "circle-radius": 6, "circle-color": "#f59e0b", "circle-stroke-width": 2, "circle-stroke-color": "#000000" },
            });
          }
          break;
        }

        case "verified_incidents": {
          if (!map.getSource("studio-verified-incidents")) {
            map.addSource("studio-verified-incidents", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { incident: "Stormwater Culvert 4B Surcharged", status: "VERIFIED_SIREN" }, geometry: { type: "Point", coordinates: [77.6320, 12.9270] } },
                  { type: "Feature", properties: { incident: "Underpass Sump Flood Alarm", status: "CREWS_DISPATCHED" }, geometry: { type: "Point", coordinates: [77.5850, 12.9980] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-verified-incidents-circle",
              type: "circle",
              source: "studio-verified-incidents",
              paint: { "circle-radius": 8, "circle-color": "#ef4444", "circle-stroke-width": 2.5, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        case "historical_incidents": {
          if (!map.getSource("studio-historical-incidents")) {
            map.addSource("studio-historical-incidents", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [
                  { type: "Feature", properties: { year: 2024, event: "Monsoon Lowland Sump Overflow" }, geometry: { type: "Point", coordinates: [77.6280, 12.9240] } },
                  { type: "Feature", properties: { year: 2023, event: "Bellandur Spillway Inundation" }, geometry: { type: "Point", coordinates: [77.6750, 12.9300] } },
                ],
              },
            });
            map.addLayer({
              id: "studio-historical-incidents-circle",
              type: "circle",
              source: "studio-historical-incidents",
              paint: { "circle-radius": 5, "circle-color": "#64748b", "circle-stroke-width": 1.5, "circle-stroke-color": "#ffffff" },
            });
          }
          break;
        }

        default:
          break;
      }

      loadedLayersRef.current.add(layerKey);
    },
    [floodZones]
  );

  // Dynamically apply layer visibility with on-demand loading & strict isolation
  const applyLayerVisibility = useCallback(
    (map: any, currentLayers: LayerConfig[], currentExpId: ExperienceId) => {
      if (!map || !map.isStyleLoaded()) return;

      const LAYER_MAP: Record<string, string[]> = {
        flood_risk: ["studio-flood-zones-fill", "studio-flood-zones-line"],
        flood_risk_zones: ["studio-flood-zones-fill", "studio-flood-zones-line"],
        rainfall: ["studio-rainfall-circle"],
        temperature: ["studio-temperature-circle"],
        heat_risk: ["studio-heat-risk-circle"],
        air_quality: ["studio-air-quality-circle"],
        roads: ["studio-roads-line"],
        water_bodies: ["studio-water-bodies-fill", "studio-water-bodies-line"],
        drainage: ["studio-drainage-channels-line"],
        hospitals: ["studio-hospitals-circle"],
        emergency_facilities: ["studio-emergency-circle"],
        shelters: ["studio-shelters-circle"],
        citizen_reports: ["studio-citizen-reports-circle"],
        verified_incidents: ["studio-verified-incidents-circle"],
        historical_incidents: ["studio-historical-incidents-circle"],
      };

      const pendingLoaders: string[] = [];

      currentLayers.forEach((layer) => {
        let isVisible = layer.visible;

        // Strict isolation: Never bleed static flood zones into non-flood dedicated experiences
        if (
          (layer.id === "flood_risk" || layer.id === "flood_risk_zones") &&
          currentExpId !== "operational-satellite-gis" &&
          currentExpId !== "flood-risk-intelligence"
        ) {
          isVisible = false;
        }

        // On-demand load if active and not yet registered
        if (isVisible && !loadedLayersRef.current.has(layer.id)) {
          pendingLoaders.push(layer.name);
          loadLayerOnDemand(map, layer.id);
        }

        const targetLayerIds = LAYER_MAP[layer.id] || [];
        targetLayerIds.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
            if (isVisible) {
              if (layerId.includes("-fill")) {
                map.setPaintProperty(layerId, "fill-opacity", layer.opacity);
              } else if (layerId.includes("-line")) {
                map.setPaintProperty(layerId, "line-opacity", layer.opacity);
              } else if (layerId.includes("-circle")) {
                map.setPaintProperty(layerId, "circle-opacity", layer.opacity);
              }
            }
          }
        });
      });

      if (pendingLoaders.length > 0) {
        setLoadingLayers(pendingLoaders);
        if (onLoadingLayersChange) onLoadingLayersChange(pendingLoaders);
        setTimeout(() => {
          setLoadingLayers([]);
          if (onLoadingLayersChange) onLoadingLayersChange([]);
        }, 800);
      }
    },
    [loadLayerOnDemand, onLoadingLayersChange]
  );

  // Add Dynamic 11-Experience Features with Rich HUD Popups
  const injectExperienceFeatures = useCallback(
    (map: any, data?: MapStudioExperienceResponse | null) => {
      if (!map || !map.isStyleLoaded() || !data) return;

      const sourceId = "studio-experience-features";
      const geojson = data.geojson || { type: "FeatureCollection", features: [] };

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        // 1. Polygon Fill Layer
        map.addLayer({
          id: "exp-polygons-fill",
          type: "fill",
          source: sourceId,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "fill-color": [
              "coalesce",
              ["get", "color"],
              [
                "match",
                ["get", "risk_level"],
                "CRITICAL",
                "#ef4444",
                "HIGH",
                "#f97316",
                "MODERATE",
                "#eab308",
                "LOW",
                "#10b981",
                "#06b6d4",
              ],
            ],
            "fill-opacity": 0.65,
          },
        });

        // 2. Polygon Line Layer
        map.addLayer({
          id: "exp-polygons-line",
          type: "line",
          source: sourceId,
          filter: ["==", "$type", "Polygon"],
          paint: {
            "line-color": [
              "coalesce",
              ["get", "color"],
              [
                "match",
                ["get", "risk_level"],
                "CRITICAL",
                "#fca5a5",
                "HIGH",
                "#fdba74",
                "MODERATE",
                "#fef08a",
                "LOW",
                "#86efac",
                "#67e8f9",
              ],
            ],
            "line-width": 2.5,
          },
        });

        // 3. LineStrings Layer (Routes & Raja Kaluve canals)
        map.addLayer({
          id: "exp-lines",
          type: "line",
          source: sourceId,
          filter: ["==", "$type", "LineString"],
          paint: {
            "line-color": ["coalesce", ["get", "color"], "#10b981"],
            "line-width": 4.5,
            "line-opacity": 0.9,
          },
        });

        // 4. Points Layer (Stations, Sensors, Reports, Facilities)
        map.addLayer({
          id: "exp-points-circle",
          type: "circle",
          source: sourceId,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 8.5,
            "circle-color": ["coalesce", ["get", "color"], "#38bdf8"],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Click popup handler for interactive experience inspection
        const handleFeatureClick = (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          if (popupRef.current) {
            popupRef.current.remove();
          }

          const title =
            props.name || props.incident_id || props.report_id || props.sector_name || "Feature Detail";
          const status = props.status || props.risk_level || props.category || props.stress || "";
          const metric =
            props.rainfall_rate_mm_h
              ? `Rainfall Intensity: <b>${props.rainfall_rate_mm_h} mm/h</b> (${props.status || "Active"})`
              : props.elevation_masl
              ? `Terrain Elevation: <b>${props.elevation_masl}m MASL</b> (${props.type || "Landmark"})`
              : props.heat_index_c
              ? `Bioclimatic Heat Index: <b>${props.heat_index_c}°C</b> (Temp: ${props.temp_c}°C)`
              : props.aqi
              ? `Air Quality Index: <b>${props.aqi} AQI</b> (PM2.5: ${props.pm25} µg/m³)`
              : props.flood_depth_m
              ? `Predicted Inundation Depth: <b>${props.flood_depth_m}m</b>`
              : props.distance_km
              ? `Route Length: <b>${props.distance_km} km</b> (~${props.time_min} mins)`
              : props.description || (props.water_level ? `Level: <b>${props.water_level}</b>` : "");

          const coordinates = e.lngLat;
          const zoneId = props.zone_id;
          const hasExplanation = Boolean(
            zoneId &&
              (zoneId.includes("KOR") ||
                zoneId.includes("BEL") ||
                zoneId.includes("HSR") ||
                zoneId.includes("HEB") ||
                zoneId.includes("CEN") ||
                props.risk_level)
          );

          const explanationBtn = hasExplanation
            ? `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button onclick="window.__openFloodExplanation && window.__openFloodExplanation('${zoneId}')" style="width: 100%; padding: 6px 10px; background: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                  Why is this area ${status || "risk"}? Rationale &rarr;
                </button>
              </div>
            `
            : "";

          import("maplibre-gl").then((mod) => {
            const maplibregl = mod.default;
            popupRef.current = new maplibregl.Popup({
              className: "studio-experience-popup",
              closeButton: true,
              closeOnClick: true,
              maxWidth: "320px",
            })
              .setLngLat(coordinates)
              .setHTML(`
                <div style="font-family: system-ui, sans-serif; padding: 6px; color: #f8fafc; background: #090e17; border-radius: 8px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                    <div style="font-size: 13px; font-weight: 700; color: #ffffff;">${title}</div>
                    ${
                      status
                        ? `<div style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.4);">${status}</div>`
                        : ""
                    }
                  </div>
                  <div style="font-size: 10px; font-family: monospace; color: #94a3b8; margin-bottom: 6px;">
                    ${coordinates.lat.toFixed(4)}°N, ${coordinates.lng.toFixed(4)}°E
                  </div>
                  ${metric ? `<div style="font-size: 11px; color: #cbd5e1; line-height: 1.4; margin-bottom: 6px;">${metric}</div>` : ""}
                  ${props.data_source ? `<div style="font-size: 9px; color: #64748b; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;"><b>Source:</b> ${props.data_source}</div>` : ""}
                  ${props.model_version ? `<div style="font-size: 9px; color: #64748b;"><b>Model:</b> ${props.model_version}</div>` : ""}
                  <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button onclick="window.__openAreaAnalytics && window.__openAreaAnalytics(${coordinates.lat}, ${coordinates.lng}, '${(title || "").replace(/'/g, "\\'")}')" style="width: 100%; padding: 6px 8px; background: #0891b2; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; text-align: center; display: block; box-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                      Contextual Area Analytics &rarr;
                    </button>
                  </div>
                  ${explanationBtn}
                </div>
              `)
              .addTo(map);
          });
        };

        ["exp-points-circle", "exp-lines", "exp-polygons-fill"].forEach((layerId) => {
          map.on("click", layerId, handleFeatureClick);
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        });
      }
    },
    []
  );

  // Initialize MapLibre ONCE on mount
  useEffect(() => {
    let isMounted = true;
    let map: any = null;

    async function init() {
      if (!mapContainer.current || mapInstance.current || isInitializing.current) return;
      isInitializing.current = true;
      setIsMapLoading(true);

      try {
        const maplibregl = (await import("maplibre-gl")).default;

        if (
          typeof window !== "undefined" &&
          (maplibregl as any).supported &&
          !(maplibregl as any).supported()
        ) {
          if (isMounted) setMapError("WebGL is unsupported on this device or GPU context is lost.");
          isInitializing.current = false;
          setIsMapLoading(false);
          return;
        }

        if (!mapContainer.current || !isMounted) {
          isInitializing.current = false;
          setIsMapLoading(false);
          return;
        }

        map = new maplibregl.Map({
          container: mapContainer.current,
          style: getStyleSpec(currentBasemapRef.current),
          center: activePreset.center,
          zoom: activePreset.zoom,
          pitch: activePreset.pitch,
          bearing: activePreset.bearing,
          attributionControl: false,
        });

        map.on("load", () => {
          if (!isMounted) return;
          mapInstance.current = map;
          isInitializing.current = false;
          setIsMapLoading(false);

          // Apply initial active layers on demand
          applyLayerVisibility(map, layersRef.current, activeExpRef.current);
          if (expDataRef.current) {
            injectExperienceFeatures(map, expDataRef.current);
          }
          if (onMapLoaded) onMapLoaded(map);

          // Click handler for area analytics
          map.on("click", (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["exp-points-circle", "exp-lines", "exp-polygons-fill", "studio-flood-zones-fill"],
            });
            if (features.length === 0 && onSelectLocation) {
              onSelectLocation([e.lngLat.lng, e.lngLat.lat], "Selected Urban Sector");
            }
          });
        });

        map.on("error", (e: any) => {
          console.warn("MapLibre tile event:", e?.error?.message || e);
        });
      } catch (err: any) {
        console.error("MapStudio init error:", err);
        if (isMounted) setMapError("Failed to initialize Map Studio WebGL canvas.");
        isInitializing.current = false;
        setIsMapLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (popupRef.current) {
        try {
          popupRef.current.remove();
        } catch (e) {}
      }
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
        } catch (e) {}
        mapInstance.current = null;
      }
      isInitializing.current = false;
    };
  }, []);

  // Handle Basemap Style Changes Dynamically
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;
    if (currentBasemapRef.current === basemapStyle) return;
    currentBasemapRef.current = basemapStyle;
    loadedLayersRef.current.clear();
    setIsMapLoading(true);

    try {
      map.setStyle(getStyleSpec(basemapStyle));
      map.once("style.load", () => {
        setIsMapLoading(false);
        applyLayerVisibility(map, layersRef.current, activeExpRef.current);
        if (expDataRef.current) {
          injectExperienceFeatures(map, expDataRef.current);
        }
      });
    } catch (e) {
      console.error("Error updating basemap style:", e);
      setIsMapLoading(false);
    }
  }, [basemapStyle, getStyleSpec, applyLayerVisibility, injectExperienceFeatures]);

  // Handle Dynamic Layer Visibility & Opacity across layers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;
    applyLayerVisibility(map, layers, activeExperienceId);
  }, [layers, activeExperienceId, applyLayerVisibility]);

  // Handle Preset Quick-Fly
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    map.flyTo({
      center: activePreset.center,
      zoom: activePreset.zoom,
      pitch: activePreset.pitch,
      bearing: activePreset.bearing,
      essential: true,
      duration: 1800,
    });
  }, [activePreset]);

  // Handle Time Offset (Simulated Inundation Scaling)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("studio-flood-zones-fill")) {
      const baseOpacity = layers.find((l) => l.id === "flood_risk_zones")?.opacity || 0.75;
      const forecastFactor = timeOffsetHours > 0 ? 0.85 : 0.65;
      map.setPaintProperty("studio-flood-zones-fill", "fill-opacity", baseOpacity * forecastFactor);
    }
  }, [timeOffsetHours, layers]);

  // Handle Dynamic 11-Experience Features Injection & Camera Transition
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded() || !experienceData) return;

    injectExperienceFeatures(map, experienceData);

    if (experienceData.meta) {
      map.flyTo({
        center: experienceData.meta.center,
        zoom: experienceData.meta.default_zoom,
        pitch: experienceData.meta.default_pitch,
        bearing: experienceData.meta.default_bearing,
        essential: true,
        duration: 1600,
      });
    }
  }, [experienceData, injectExperienceFeatures]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Smooth Map & Shader Loading Overlay */}
      <AnimatePresence>
        {isMapLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-35 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs text-white gap-3 pointer-events-none"
          >
            <div className="relative flex items-center justify-center">
              <div className="h-11 w-11 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <div className="absolute h-5 w-5 rounded-full bg-cyan-500/20 animate-ping" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-300">
                Initializing GIS Canvas
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                Calibrating Geospatial Telemetry
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer Loading Floating Indicator */}
      <AnimatePresence>
        {loadingLayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-25 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/95 border border-cyan-500/40 text-cyan-300 text-xs shadow-xl backdrop-blur-md"
          >
            <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
            <span className="text-[11px] font-semibold">
              Loading {loadingLayers.join(", ")} layer...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WebGL Context / Initialization Error State */}
      {mapError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 text-white p-6 backdrop-blur-sm">
          <div className="max-w-md w-full p-5 rounded-2xl border border-rose-800 bg-slate-900 text-center shadow-2xl">
            <div className="h-10 w-10 rounded-full bg-rose-950/80 border border-rose-600 flex items-center justify-center mx-auto mb-3 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">WebGL Map Error</h3>
            <p className="text-xs text-rose-200 mb-4">{mapError}</p>
            <button
              onClick={() => {
                setMapError(null);
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
            >
              Reload Map Engine
            </button>
          </div>
        </div>
      )}

      {/* WebGL Canvas Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Official Map Attribution Banner (Prompt 8 Requirement) */}
      <div className="absolute bottom-1 right-2 z-10 text-[9px] text-slate-400 bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-800/80 flex items-center gap-1.5 pointer-events-auto select-none">
        <span>
          ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-cyan-400"
          >
            OpenStreetMap
          </a>
        </span>
        <span>|</span>
        <span>
          ©{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-cyan-400"
          >
            Open-Meteo
          </a>
        </span>
        <span>|</span>
        <span>
          ©{" "}
          <a
            href="https://openaq.org/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-cyan-400"
          >
            OpenAQ
          </a>
        </span>
        <span>|</span>
        <span>NASA SRTM 30m</span>
        <span>|</span>
        <span className="text-cyan-400 font-semibold">TerraGuard AI 2.0</span>
      </div>
    </div>
  );
}
