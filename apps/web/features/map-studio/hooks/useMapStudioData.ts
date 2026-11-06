"use client";

import { useEffect, useState } from "react";
import {
  BasemapStyle,
  FloodRiskFeature,
  FloodRiskGeoJSON,
  LayerConfig,
  MapPreset,
  SectorTelemetry,
  StudioViewMode,
} from "../types/studio";
import {
  DEFAULT_LAYERS,
  DEFAULT_PRESETS,
  FALLBACK_FLOOD_ZONES,
  FALLBACK_TELEMETRY,
  getFloodRiskZones,
  getHotspotPresets,
  getMapStudioLayers,
  getSectorTelemetry,
} from "../services/map_studio";

export function useMapStudioData() {
  const [basemapStyle, setBasemapStyle] = useState<BasemapStyle>("satellite");
  const [viewMode, setViewMode] = useState<StudioViewMode>("operational-gis");
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);
  const [floodZones, setFloodZones] = useState<FloodRiskGeoJSON>(FALLBACK_FLOOD_ZONES);
  const [presets, setPresets] = useState<MapPreset[]>(DEFAULT_PRESETS);
  const [activePreset, setActivePreset] = useState<MapPreset>(DEFAULT_PRESETS[0]);
  const [telemetry, setTelemetry] = useState<SectorTelemetry>(FALLBACK_TELEMETRY);
  const [selectedFeature, setSelectedFeature] = useState<FloodRiskFeature | null>(null);

  // Time scrubber state: -24 to +6 hours (0 = Live)
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);

  // UI Drawer states
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);
  const [legendOpen, setLegendOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load initial backend data
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [layerData, zonesData, presetsData, telemetryData] = await Promise.all([
          getMapStudioLayers(),
          getFloodRiskZones(),
          getHotspotPresets(),
          getSectorTelemetry(),
        ]);
        if (mounted) {
          setLayers(layerData);
          setFloodZones(zonesData);
          setPresets(presetsData);
          if (presetsData.length > 0) {
            setActivePreset(presetsData[0]);
          }
          setTelemetry(telemetryData);
        }
      } catch (err) {
        console.error("Map Studio data fetch error, using resilient fallbacks:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Layer toggle
  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l))
    );
  };

  // Layer opacity update
  const setLayerOpacity = (layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, opacity } : l))
    );
  };

  // Switch preset
  const selectPreset = (preset: MapPreset) => {
    setActivePreset(preset);
  };

  // Switch view mode (auto adjust basemap style)
  const handleViewModeChange = (mode: StudioViewMode) => {
    setViewMode(mode);
    if (mode === "operational-gis") {
      setBasemapStyle("satellite");
    } else {
      setBasemapStyle("dark");
    }
  };

  return {
    basemapStyle,
    setBasemapStyle,
    viewMode,
    setViewMode: handleViewModeChange,
    layers,
    toggleLayer,
    setLayerOpacity,
    floodZones,
    presets,
    activePreset,
    selectPreset,
    telemetry,
    selectedFeature,
    setSelectedFeature,
    timeOffsetHours,
    setTimeOffsetHours,
    isPlayingTimeline,
    setIsPlayingTimeline,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    legendOpen,
    setLegendOpen,
    isLoading,
  };
}
