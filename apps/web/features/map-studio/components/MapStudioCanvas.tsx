"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
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
}: MapStudioCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const isInitializing = useRef(false);
  const popupRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

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
    const layers: any = [
      {
        id: "basemap-raster-layer",
        type: "raster",
        source: "basemap-raster-source",
        minzoom: 0,
        maxzoom: 22,
      },
    ];

    // If basemap includes boundary/place labels (e.g., satellite with labels or dark gray reference)
    if (config.labels && config.labels.length > 0) {
      sources["basemap-labels-source"] = {
        type: "raster",
        tiles: config.labels,
        tileSize: 256,
        maxzoom: config.maxzoom || 19,
      };
      layers.push({
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
      layers,
    };
  }, []);

  // Add Studio GIS Vector and GeoJSON Layers
  const injectStudioLayers = useCallback(
    (map: any) => {
      if (!map || !map.isStyleLoaded()) return;

      // 1. Flood Inundation Zones (Environmental Layer)
      if (!map.getSource("studio-flood-zones")) {
        map.addSource("studio-flood-zones", {
          type: "geojson",
          data: floodZones,
        });

        map.addLayer({
          id: "studio-flood-zones-fill",
          type: "fill",
          source: "studio-flood-zones",
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

      // 2. Live Rainfall Stations (Environmental Layer)
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

      // 3. Ambient Temperature (Environmental Layer)
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

      // 4. Extreme Heat Risk (Environmental Layer)
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

      // 5. Air Quality AQI Stations (Environmental Layer)
      if (!map.getSource("studio-air-quality")) {
        map.addSource("studio-air-quality", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: { name: "Silk Board CAAQMS", aqi: 168, color: "#f59e0b" }, geometry: { type: "Point", coordinates: [77.6220, 12.9170] } },
              { type: "Feature", properties: { name: "City Railway Station", aqi: 184, color: "#f97316" }, geometry: { type: "Point", coordinates: [77.5700, 12.9780] } },
              { type: "Feature", properties: { name: "Saneguruvanahalli", aqi: 88, color: "#84cc16" }, geometry: { type: "Point", coordinates: [77.5450, 12.9900] } },
            ],
          },
        });
        map.addLayer({
          id: "studio-air-quality-circle",
          type: "circle",
          source: "studio-air-quality",
          paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
        });
      }

      // 6. Roads (Infrastructure Layer)
      if (!map.getSource("studio-roads")) {
        map.addSource("studio-roads", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: "Outer Ring Road Arterial Corridor" },
                geometry: {
                  type: "LineString",
                  coordinates: [[77.6300, 12.9200], [77.6550, 12.9250], [77.6850, 12.9280], [77.7000, 12.9550]],
                },
              },
              {
                type: "Feature",
                properties: { name: "Hosur Road Expressway" },
                geometry: {
                  type: "LineString",
                  coordinates: [[77.5950, 12.9700], [77.6100, 12.9400], [77.6200, 12.9150], [77.6350, 12.8900]],
                },
              },
            ],
          },
        });
        map.addLayer({
          id: "studio-roads-line",
          type: "line",
          source: "studio-roads",
          paint: { "line-color": "#94a3b8", "line-width": 3, "line-opacity": 0.8 },
        });
      }

      // 7. Water Bodies & Retention Sinks (Infrastructure Layer)
      if (!map.getSource("studio-water-bodies")) {
        map.addSource("studio-water-bodies", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: "Bellandur Lake Basin", area_sqkm: 3.65 },
                geometry: {
                  type: "Polygon",
                  coordinates: [[[77.6650, 12.9380], [77.6850, 12.9420], [77.6920, 12.9300], [77.6700, 12.9280], [77.6650, 12.9380]]],
                },
              },
              {
                type: "Feature",
                properties: { name: "Ulsoor Lake", area_sqkm: 0.50 },
                geometry: {
                  type: "Polygon",
                  coordinates: [[[77.6150, 12.9830], [77.6300, 12.9850], [77.6320, 12.9730], [77.6180, 12.9720], [77.6150, 12.9830]]],
                },
              },
            ],
          },
        });
        map.addLayer({
          id: "studio-water-bodies-fill",
          type: "fill",
          source: "studio-water-bodies",
          paint: { "fill-color": "#06b6d4", "fill-opacity": 0.75 },
        });
        map.addLayer({
          id: "studio-water-bodies-line",
          type: "line",
          source: "studio-water-bodies",
          paint: { "line-color": "#67e8f9", "line-width": 2 },
        });
      }

      // 8. Drainage Raja Kaluve Channels (Infrastructure Layer)
      if (!map.getSource("studio-drainage")) {
        map.addSource("studio-drainage", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: "Primary Raja Kaluve Canal" },
                geometry: {
                  type: "LineString",
                  coordinates: [[77.6150, 12.9320], [77.6350, 12.9280], [77.6550, 12.9300], [77.6700, 12.9320]],
                },
              },
            ],
          },
        });
        map.addLayer({
          id: "studio-drainage-channels-line",
          type: "line",
          source: "studio-drainage",
          paint: { "line-color": "#38bdf8", "line-width": 3.5, "line-dasharray": [2, 1] },
        });
      }

      // 9. Hospitals (Infrastructure Layer)
      if (!map.getSource("studio-hospitals")) {
        map.addSource("studio-hospitals", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: { name: "Victoria Hospital Trauma Center" }, geometry: { type: "Point", coordinates: [77.5750, 12.9640] } },
              { type: "Feature", properties: { name: "Manipal Hospital HAL Airport Rd" }, geometry: { type: "Point", coordinates: [77.6520, 12.9590] } },
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

      // 10. Emergency Facilities (Fire & Police, Infrastructure Layer)
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

      // 11. Evacuation Shelters (Infrastructure Layer)
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

      // 12. Citizen Hazard Reports (Incident Layer)
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

      // 13. Verified Incidents (Incident Layer)
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

      // 14. Historical Incidents Archive (Incident Layer)
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

      // 14. Waterlogging Density Heatmap (Prompt 4 requirement: MapLibre Heatmap layer)
      if (!map.getSource("studio-waterlogging-heatmap-src")) {
        map.addSource("studio-waterlogging-heatmap-src", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: { weight: 0.95 }, geometry: { type: "Point", coordinates: [77.6230, 12.9270] } },
              { type: "Feature", properties: { weight: 0.90 }, geometry: { type: "Point", coordinates: [77.6250, 12.9290] } },
              { type: "Feature", properties: { weight: 0.85 }, geometry: { type: "Point", coordinates: [77.6210, 12.9260] } },
              { type: "Feature", properties: { weight: 0.88 }, geometry: { type: "Point", coordinates: [77.6850, 12.9270] } },
              { type: "Feature", properties: { weight: 0.80 }, geometry: { type: "Point", coordinates: [77.6880, 12.9290] } },
              { type: "Feature", properties: { weight: 0.78 }, geometry: { type: "Point", coordinates: [77.6350, 12.9110] } },
              { type: "Feature", properties: { weight: 0.65 }, geometry: { type: "Point", coordinates: [77.5960, 13.0370] } },
            ],
          },
        });
        map.addLayer({
          id: "studio-waterlogging-heatmap-layer",
          type: "heatmap",
          source: "studio-waterlogging-heatmap-src",
          maxzoom: 17,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 2.5],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(33,102,172,0)",
              0.2, "rgba(103,169,207,0.5)",
              0.4, "rgba(209,229,240,0.7)",
              0.6, "rgba(253,219,199,0.8)",
              0.8, "rgba(239,138,98,0.9)",
              1, "rgba(178,24,43,0.95)"
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 12, 16, 28],
            "heatmap-opacity": 0.7,
          },
        });
      }
    },
    [floodZones]
  );

  // Dynamically apply layer visibility with strict isolation for dedicated experiences
  const applyLayerVisibility = useCallback(
    (map: any, currentLayers: LayerConfig[], currentExpId: ExperienceId) => {
      if (!map || !map.isStyleLoaded()) return;

      // Explicit isolation: flood zones ONLY visible in flood experiences
      const isFloodExp = currentExpId === "operational-satellite-gis" || currentExpId === "flood-risk-intelligence";
      const isFloodLayerVisible = isFloodExp && Boolean(currentLayers.find((l) => l.id === "flood_risk" || l.id === "flood_risk_zones")?.visible);
      if (map.getLayer("studio-flood-zones-fill")) {
        map.setLayoutProperty("studio-flood-zones-fill", "visibility", isFloodLayerVisible ? "visible" : "none");
      }
      if (map.getLayer("studio-flood-zones-line")) {
        map.setLayoutProperty("studio-flood-zones-line", "visibility", isFloodLayerVisible ? "visible" : "none");
      }

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

      currentLayers.forEach((layer) => {
        const targetLayerIds = LAYER_MAP[layer.id] || [];
        targetLayerIds.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            let isVisible = layer.visible;
            // Strict isolation: Never bleed static flood zones into non-flood dedicated experiences
            if (
              (layerId === "studio-flood-zones-fill" || layerId === "studio-flood-zones-line") &&
              currentExpId !== "operational-satellite-gis" &&
              currentExpId !== "flood-risk-intelligence"
            ) {
              isVisible = false;
            }

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

      // Strict visibility for waterlogging heatmap
      if (map.getLayer("studio-waterlogging-heatmap-layer")) {
        const isHeatmapExp = currentExpId === "flood-risk-intelligence" || currentExpId === "citizen-hazard-report";
        map.setLayoutProperty("studio-waterlogging-heatmap-layer", "visibility", isHeatmapExp ? "visible" : "none");
      }
    },
    []
  );

  // Add Dynamic 11-Experience Features (Polygons, Lines, Stations, Facilities) with interactive popups
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

          const title = props.name || props.incident_id || props.report_id || props.sector_name || "Feature Detail";
          const status = props.status || props.risk_level || props.category || props.stress || "";
          const metric =
            props.rainfall_rate_mm_h ? `Rainfall Intensity: <b>${props.rainfall_rate_mm_h} mm/h</b> (${props.status || 'Active'})` :
            props.elevation_masl ? `Terrain Elevation: <b>${props.elevation_masl}m MASL</b> (${props.type || 'Landmark'})` :
            props.heat_index_c ? `Bioclimatic Heat Index: <b>${props.heat_index_c}°C</b> (Temp: ${props.temp_c}°C)` :
            props.aqi ? `Air Quality Index: <b>${props.aqi} AQI</b> (PM2.5: ${props.pm25} µg/m³)` :
            props.flood_depth_m ? `Predicted Inundation Depth: <b>${props.flood_depth_m}m</b>` :
            props.distance_km ? `Route Length: <b>${props.distance_km} km</b> (~${props.time_min} mins)` :
            props.description || (props.water_level ? `Level: <b>${props.water_level}</b>` : "");

          const coordinates = e.lngLat;
          const zoneId = props.zone_id;
          const hasExplanation = Boolean(
            zoneId && (zoneId.includes("KOR") || zoneId.includes("BEL") || zoneId.includes("HSR") || zoneId.includes("HEB") || zoneId.includes("CEN") || props.risk_level)
          );
          const explanationBtn = hasExplanation
            ? `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                <button onclick="window.__openFloodExplanation && window.__openFloodExplanation('${zoneId}')" style="width: 100%; padding: 6px 10px; background: #0284c7; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; text-align: center; display: block; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                  Why is this area ${status || 'risk'}? Rationale &rarr;
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
                <div style="font-family: system-ui, sans-serif; padding: 4px; color: #0f172a;">
                  <div style="font-size: 13px; font-weight: 700; margin-bottom: 3px;">${title}</div>
                  ${status ? `<div style="display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px; background: #e0f2fe; color: #0369a1;">${status}</div>` : ""}
                  ${metric ? `<div style="font-size: 11px; color: #334155; line-height: 1.4;">${metric}</div>` : ""}
                  ${props.data_source ? `<div style="font-size: 9px; color: #64748b; margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 3px;"><b>Source:</b> ${props.data_source}</div>` : ""}
                  ${props.model_version ? `<div style="font-size: 9px; color: #64748b;"><b>Model:</b> ${props.model_version}</div>` : ""}
                  ${props.uncertainty_range ? `<div style="font-size: 9px; color: #0284c7;"><b>Uncertainty:</b> ${props.uncertainty_range}</div>` : ""}
                  <div style="margin-top: 6px; padding-top: 5px; border-top: 1px solid #e2e8f0;">
                    <button onclick="window.__openAreaAnalytics && window.__openAreaAnalytics(${coordinates.lat}, ${coordinates.lng}, '${(title || '').replace(/'/g, "\\'")}')" style="width: 100%; padding: 5px 8px; background: #0891b2; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; text-align: center; display: block; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
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

      try {
        const maplibregl = (await import("maplibre-gl")).default;

        if (typeof window !== "undefined" && (maplibregl as any).supported && !(maplibregl as any).supported()) {
          if (isMounted) setMapError("WebGL is unsupported on this device.");
          isInitializing.current = false;
          return;
        }

        if (!mapContainer.current || !isMounted) {
          isInitializing.current = false;
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
          injectStudioLayers(map);
          applyLayerVisibility(map, layersRef.current, activeExpRef.current);
          if (expDataRef.current) {
            injectExperienceFeatures(map, expDataRef.current);
          }
          if (onMapLoaded) onMapLoaded(map);

          // Click handler for area analytics (Prompt 7)
          map.on("click", (e: any) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ["exp-points-circle", "exp-lines", "exp-polygons-fill", "studio-flood-zones-fill"],
            });
            if (features.length === 0 && onSelectLocation) {
              onSelectLocation([e.lngLat.lng, e.lngLat.lat], "Selected Urban Sector");
            }
          });
        });
      } catch (err: any) {
        console.error("MapStudio init error:", err);
        if (isMounted) setMapError("Failed to initialize Map Studio WebGL canvas.");
        isInitializing.current = false;
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
        } catch (e) {
          // ignore cleanup error
        }
        mapInstance.current = null;
      }
      isInitializing.current = false;
    };
  }, []);

  // Handle Basemap Style Changes Dynamically without destroying Map instance
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;
    if (currentBasemapRef.current === basemapStyle) return;
    currentBasemapRef.current = basemapStyle;

    try {
      map.setStyle(getStyleSpec(basemapStyle));
      map.once("style.load", () => {
        injectStudioLayers(map);
        applyLayerVisibility(map, layersRef.current, activeExpRef.current);
        if (expDataRef.current) {
          injectExperienceFeatures(map, expDataRef.current);
        }
      });
    } catch (e) {
      console.error("Error updating basemap style:", e);
    }
  }, [basemapStyle, getStyleSpec, injectStudioLayers, applyLayerVisibility, injectExperienceFeatures]);

  // Handle Dynamic Layer Visibility & Opacity across all 14 Environmental, Infrastructure & Incident Layers
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
      // Scale opacity or highlight as time progresses into forecast
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

    // Camera fly-to for the experience
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
      {mapError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 text-white p-6">
          <div className="max-w-md p-4 rounded-xl border border-rose-800 bg-rose-950/60 text-center">
            <h3 className="text-base font-bold text-rose-400 mb-1">WebGL Map Error</h3>
            <p className="text-xs text-rose-200">{mapError}</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
