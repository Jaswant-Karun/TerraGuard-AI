"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BasemapStyle,
  ExperienceId,
  ExperienceViewMeta,
  FloodRiskFeature,
  FloodRiskGeoJSON,
  LayerConfig,
  MapPreset,
  MapStudioExperienceResponse,
  SectorTelemetry,
  StudioViewMode,
} from "../types/studio";
import {
  DEFAULT_EXPERIENCES_META,
  DEFAULT_LAYERS,
  DEFAULT_PRESETS,
  EXPERIENCE_DEFAULT_LAYERS,
  FALLBACK_FLOOD_ZONES,
  FALLBACK_TELEMETRY,
  getExperienceDetails,
  getExperiencesMeta,
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

  // 11 Specialized Map Experiences State
  const [experiences, setExperiences] = useState<ExperienceViewMeta[]>(DEFAULT_EXPERIENCES_META);
  const [activeExperienceId, setActiveExperienceId] = useState<ExperienceId>("operational-satellite-gis");
  const [activeExperienceData, setActiveExperienceData] = useState<MapStudioExperienceResponse | null>(null);

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
        const [layerData, zonesData, presetsData, telemetryData, expMeta, initialExpData] = await Promise.all([
          getMapStudioLayers(),
          getFloodRiskZones(),
          getHotspotPresets(),
          getSectorTelemetry(),
          getExperiencesMeta(),
          getExperienceDetails("operational-satellite-gis"),
        ]);
        if (mounted) {
          const activeLayerIds = EXPERIENCE_DEFAULT_LAYERS["operational-satellite-gis"] || [];
          const effectiveLayers = layerData.map((l) => ({
            ...l,
            visible: activeLayerIds.includes(l.id),
          }));

          setLayers(effectiveLayers);
          setFloodZones(zonesData);
          setPresets(presetsData);
          if (presetsData.length > 0) {
            setActivePreset(presetsData[0]);
          }
          setTelemetry(telemetryData);
          setExperiences(expMeta);
          setActiveExperienceData(initialExpData);
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

  // Layer toggle with sessionStorage persistence
  const toggleLayer = (layerId: string) => {
    setLayers((prev) => {
      const updated = prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l));
      try {
        sessionStorage.setItem("terraguard_studio_layers", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Layer opacity update with sessionStorage persistence
  const setLayerOpacity = (layerId: string, opacity: number) => {
    setLayers((prev) => {
      const updated = prev.map((l) => (l.id === layerId ? { ...l, opacity } : l));
      try {
        sessionStorage.setItem("terraguard_studio_layers", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Quick Action: Show All Layers
  const showAllLayers = () => {
    setLayers((prev) => {
      const updated = prev.map((l) => ({ ...l, visible: true }));
      try {
        sessionStorage.setItem("terraguard_studio_layers", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Quick Action: Hide All Layers
  const hideAllLayers = () => {
    setLayers((prev) => {
      const updated = prev.map((l) => ({ ...l, visible: false }));
      try {
        sessionStorage.setItem("terraguard_studio_layers", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Change basemap style with session persistence
  const handleBasemapStyleChange = (style: BasemapStyle) => {
    setBasemapStyle(style);
    try {
      sessionStorage.setItem("terraguard_studio_basemap", style);
    } catch (e) {}
  };

  // Switch preset
  const selectPreset = (preset: MapPreset) => {
    setActivePreset(preset);
  };

  // Switch between any of the 11 Specialized Map Experiences
  const selectExperience = useCallback(async (id: ExperienceId) => {
    setActiveExperienceId(id);
    try {
      const data = await getExperienceDetails(id);
      setActiveExperienceData(data);
      if (data.meta && data.meta.default_basemap) {
        setBasemapStyle(data.meta.default_basemap);
      }
      if (id === "operational-satellite-gis") {
        setViewMode("operational-gis");
      } else {
        setViewMode("flood-intelligence");
      }

      // Configure dedicated domain layers for this experience
      const targetLayerIds = EXPERIENCE_DEFAULT_LAYERS[id] || [];
      setLayers((prev) =>
        prev.map((l) => ({
          ...l,
          visible: targetLayerIds.includes(l.id),
        }))
      );
    } catch (e) {
      console.error("Failed to switch experience:", e);
    }
  }, []);

  // Switch view mode (auto adjust basemap style & experience)
  const handleViewModeChange = (mode: StudioViewMode) => {
    setViewMode(mode);
    if (mode === "operational-gis") {
      selectExperience("operational-satellite-gis");
    } else {
      selectExperience("flood-risk-intelligence");
    }
  };

  return {
    basemapStyle,
    setBasemapStyle: handleBasemapStyleChange,
    viewMode,
    setViewMode: handleViewModeChange,
    experiences,
    activeExperienceId,
    activeExperienceData,
    selectExperience,
    layers,
    toggleLayer,
    setLayerOpacity,
    showAllLayers,
    hideAllLayers,
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

