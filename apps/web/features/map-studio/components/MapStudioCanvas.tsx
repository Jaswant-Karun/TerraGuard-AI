"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  BasemapStyle,
  FloodRiskFeature,
  FloodRiskGeoJSON,
  LayerConfig,
  MapPreset,
} from "../types/studio";
import { BASEMAP_STYLES } from "../services/map_studio";

interface MapStudioCanvasProps {
  basemapStyle: BasemapStyle;
  layers: LayerConfig[];
  floodZones: FloodRiskGeoJSON;
  activePreset: MapPreset;
  timeOffsetHours: number;
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
  onSelectFeature,
  onMapLoaded,
  isDarkGIS = true,
}: MapStudioCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const isInitializing = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Generate MapLibre Style Specification for given Basemap
  const getStyleSpec = useCallback((styleKey: BasemapStyle): any => {
    const config = BASEMAP_STYLES[styleKey] || BASEMAP_STYLES.satellite;
    return {
      version: 8,
      sources: {
        "basemap-raster-source": {
          type: "raster",
          tiles: config.tiles,
          tileSize: 256,
          attribution: config.attribution,
          maxzoom: config.maxzoom,
        },
      },
      layers: [
        {
          id: "basemap-raster-layer",
          type: "raster",
          source: "basemap-raster-source",
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    };
  }, []);

  // Add Studio GIS Vector and GeoJSON Layers
  const injectStudioLayers = useCallback(
    (map: any) => {
      if (!map || !map.isStyleLoaded()) return;

      // 1. Flood Inundation Zones Source
      if (!map.getSource("studio-flood-zones")) {
        map.addSource("studio-flood-zones", {
          type: "geojson",
          data: floodZones,
        });

        // Polygon Fill
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

        // Polygon Outline
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
            "line-opacity": 0.95,
          },
        });

        // Interactive Click on Flood Zone
        map.on("click", "studio-flood-zones-fill", (e: any) => {
          if (e.features && e.features[0]) {
            const raw = e.features[0];
            const matching = floodZones.features.find((f) => f.id === raw.id || f.properties.zone_id === raw.properties.zone_id);
            if (matching) {
              onSelectFeature(matching);
            }
          }
        });

        // Cursor pointer styling
        map.on("mouseenter", "studio-flood-zones-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "studio-flood-zones-fill", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      // 2. Critical Facilities (Emergency Shelters, Hospitals)
      if (!map.getSource("studio-facilities")) {
        const facilitiesGeoJSON = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Victoria Hospital Trauma Center", type: "Hospital", status: "Operational" },
              geometry: { type: "Point", coordinates: [77.5750, 12.9640] },
            },
            {
              type: "Feature",
              properties: { name: "Koramangala Indoor Evacuation Shelter", type: "Shelter", status: "Active" },
              geometry: { type: "Point", coordinates: [77.6200, 12.9340] },
            },
            {
              type: "Feature",
              properties: { name: "Manipal Hospital HAL Airport Rd", type: "Hospital", status: "Operational" },
              geometry: { type: "Point", coordinates: [77.6520, 12.9590] },
            },
            {
              type: "Feature",
              properties: { name: "Bellandur Community Relief Staging", type: "Shelter", status: "Standby" },
              geometry: { type: "Point", coordinates: [77.6750, 12.9300] },
            },
          ],
        };

        map.addSource("studio-facilities", {
          type: "geojson",
          data: facilitiesGeoJSON,
        });

        map.addLayer({
          id: "studio-facilities-circle",
          type: "circle",
          source: "studio-facilities",
          paint: {
            "circle-radius": 7,
            "circle-color": "#10b981",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      // 3. Citizen Hazard Incident Cluster
      if (!map.getSource("studio-citizen-reports")) {
        const reportsGeoJSON = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { title: "Severe Waterlogging on 80 Feet Road", severity: 4, type: "Waterlogging" },
              geometry: { type: "Point", coordinates: [77.6240, 12.9330] },
            },
            {
              type: "Feature",
              properties: { title: "Choked Stormwater Culvert 4B", severity: 3, type: "Culvert" },
              geometry: { type: "Point", coordinates: [77.6320, 12.9270] },
            },
            {
              type: "Feature",
              properties: { title: "Deep Pothole / Arterial Subsidence", severity: 2, type: "Road Damage" },
              geometry: { type: "Point", coordinates: [77.6850, 12.9280] },
            },
          ],
        };

        map.addSource("studio-citizen-reports", {
          type: "geojson",
          data: reportsGeoJSON,
        });

        map.addLayer({
          id: "studio-citizen-reports-circle",
          type: "circle",
          source: "studio-citizen-reports",
          paint: {
            "circle-radius": 6,
            "circle-color": "#f59e0b",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#000000",
          },
        });
      }

      // 4. IoT Telemetry River Gauges
      if (!map.getSource("studio-iot-sensors")) {
        const sensorsGeoJSON = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Bellandur Outflow Siphon Node #01", depth_m: 1.45, status: "ALARM" },
              geometry: { type: "Point", coordinates: [77.6720, 12.9350] },
            },
            {
              type: "Feature",
              properties: { name: "Koramangala Storm Drain Ultrasonic Gauge", depth_m: 0.92, status: "WARNING" },
              geometry: { type: "Point", coordinates: [77.6290, 12.9240] },
            },
          ],
        };

        map.addSource("studio-iot-sensors", {
          type: "geojson",
          data: sensorsGeoJSON,
        });

        map.addLayer({
          id: "studio-iot-sensors-circle",
          type: "circle",
          source: "studio-iot-sensors",
          paint: {
            "circle-radius": 5,
            "circle-color": "#38bdf8",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });
      }
    },
    [floodZones, onSelectFeature]
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
  }, [basemapStyle, getStyleSpec, injectStudioLayers, onMapLoaded]);

  // Handle Basemap Style Changes Dynamically
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    try {
      map.setStyle(getStyleSpec(basemapStyle));
      map.once("style.load", () => {
        injectStudioLayers(map);
      });
    } catch (e) {
      console.error("Error updating basemap style:", e);
    }
  }, [basemapStyle, getStyleSpec, injectStudioLayers]);

  // Handle Dynamic Layer Visibility & Opacity
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    layers.forEach((layer) => {
      let layerId = "";
      if (layer.id === "flood_risk_zones") layerId = "studio-flood-zones-fill";
      if (layer.id === "critical_facilities") layerId = "studio-facilities-circle";
      if (layer.id === "citizen_reports") layerId = "studio-citizen-reports-circle";
      if (layer.id === "iot_telemetry_nodes") layerId = "studio-iot-sensors-circle";

      if (layerId && map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", layer.visible ? "visible" : "none");
        if (layer.visible) {
          if (layerId === "studio-flood-zones-fill") {
            map.setPaintProperty(layerId, "fill-opacity", layer.opacity);
          } else {
            map.setPaintProperty(layerId, "circle-opacity", layer.opacity);
          }
        }
      }
      // Line boundary visibility
      if (layer.id === "flood_risk_zones" && map.getLayer("studio-flood-zones-line")) {
        map.setLayoutProperty("studio-flood-zones-line", "visibility", layer.visible ? "visible" : "none");
      }
    });
  }, [layers]);

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
