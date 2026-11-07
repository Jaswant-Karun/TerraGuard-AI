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
}: MapStudioCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const isInitializing = useRef(false);
  const popupRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

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
    },
    [floodZones]
  );

  // Dynamically apply layer visibility with strict isolation for dedicated experiences
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

  // Initialize MapLibre
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
          style: getStyleSpec(basemapStyle),
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
          applyLayerVisibility(map, layers, activeExperienceId);
          if (experienceData) {
            injectExperienceFeatures(map, experienceData);
          }
          if (onMapLoaded) onMapLoaded(map);
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
  }, [basemapStyle, getStyleSpec, injectStudioLayers, applyLayerVisibility, injectExperienceFeatures, experienceData, activeExperienceId, onMapLoaded]);

  // Handle Basemap Style Changes Dynamically
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    try {
      map.setStyle(getStyleSpec(basemapStyle));
      map.once("style.load", () => {
        injectStudioLayers(map);
        applyLayerVisibility(map, layers, activeExperienceId);
        if (experienceData) {
          injectExperienceFeatures(map, experienceData);
        }
      });
    } catch (e) {
      console.error("Error updating basemap style:", e);
    }
  }, [basemapStyle, getStyleSpec, injectStudioLayers, applyLayerVisibility, experienceData, activeExperienceId, injectExperienceFeatures]);

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
