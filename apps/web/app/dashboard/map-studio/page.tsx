"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/features/auth/AuthContext";
import { useMapStudioData } from "@/features/map-studio/hooks/useMapStudioData";
import { MapStudioHeader } from "@/features/map-studio/components/MapStudioHeader";
import { ExperienceSelectorBar } from "@/features/map-studio/components/ExperienceSelectorBar";
import { StudioControlPanel } from "@/features/map-studio/components/StudioControlPanel";
import { ExperienceSidePanel } from "@/features/map-studio/components/ExperienceSidePanel";
import { TimeForecastScrubber } from "@/features/map-studio/components/TimeForecastScrubber";
import { MapStudioLegend } from "@/features/map-studio/components/MapStudioLegend";
import { StudioFloatingControls } from "@/features/map-studio/components/StudioFloatingControls";
import { AlertOctagon, X, Info } from "lucide-react";
import { FloodRiskExplanationPanel } from "@/features/flood-engine/components/FloodRiskExplanationPanel";
import {
  fetchFloodZoneExplanation,
  FloodZoneExplanationData,
  FALLBACK_FLOOD_LAYERS_DATA,
} from "@/features/flood-engine/services/flood_visualization";
import { AreaAnalyticsDrawer } from "@/features/map-studio/components/AreaAnalyticsDrawer";
import { MapAutomationModal } from "@/features/map-studio/components/MapAutomationModal";
import { fetchMapAutomationStatus } from "@/features/map-studio/services/map_studio";
import { MapAutomationStatusResponse } from "@/features/map-studio/types/studio";
import {
  fetchContextualAreaAnalytics,
  MapContextualAreaResponse,
  FALLBACK_CONTEXTUAL_AREA,
} from "@/features/maps/services/unified_maps";

// Dynamically import MapStudioCanvas to ensure zero SSR WebGL issues
const MapStudioCanvas = dynamic(
  () =>
    import("@/features/map-studio/components/MapStudioCanvas").then(
      (mod) => mod.MapStudioCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
          Loading TerraGuard Map Intelligence Studio 2.0...
        </span>
      </div>
    ),
  }
);

export default function MapStudioPage() {
  const { user } = useAuth();
  const {
    basemapStyle,
    setBasemapStyle,
    viewMode,
    setViewMode,
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
  } = useMapStudioData();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is3DActive, setIs3DActive] = useState(false);
  const [geoNotification, setGeoNotification] = useState<string | null>(null);
  const [explanationData, setExplanationData] = useState<FloodZoneExplanationData | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [loadingLayerIds, setLoadingLayerIds] = useState<string[]>([]);

  // Contextual Area Analytics Drawer State (Prompt 7)
  const [isAreaAnalyticsOpen, setIsAreaAnalyticsOpen] = useState(false);
  const [areaAnalyticsData, setAreaAnalyticsData] = useState<MapContextualAreaResponse>(FALLBACK_CONTEXTUAL_AREA);
  const [isAreaAnalyticsLoading, setIsAreaAnalyticsLoading] = useState(false);

  // n8n Event-Driven Automation Sync State (Prompt 9)
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<MapAutomationStatusResponse | null>(null);
  const [isAutomationLoading, setIsAutomationLoading] = useState(false);

  const loadAutomationStatus = useCallback(async () => {
    setIsAutomationLoading(true);
    try {
      const res = await fetchMapAutomationStatus();
      setAutomationStatus(res);
    } finally {
      setIsAutomationLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAutomationStatus();
  }, [loadAutomationStatus]);

  const mapRef = useRef<any>(null);

  const handleSelectLocation = useCallback(async (coords: [number, number], areaName?: string) => {
    setIsAreaAnalyticsOpen(true);
    setIsAreaAnalyticsLoading(true);
    const [lng, lat] = coords;
    try {
      const data = await fetchContextualAreaAnalytics({ lat, lng, area_name: areaName });
      if (data) {
        setAreaAnalyticsData(data);
      }
    } finally {
      setIsAreaAnalyticsLoading(false);
    }
  }, []);

  const handleDateRangeChange = useCallback(async (range: string, startDate?: string, endDate?: string) => {
    setIsAreaAnalyticsLoading(true);
    try {
      const data = await fetchContextualAreaAnalytics({
        lat: areaAnalyticsData.coordinates.lat,
        lng: areaAnalyticsData.coordinates.lng,
        area_name: areaAnalyticsData.area_name,
        start_date: startDate,
        end_date: endDate,
      });
      if (data) {
        setAreaAnalyticsData(data);
      }
    } finally {
      setIsAreaAnalyticsLoading(false);
    }
  }, [areaAnalyticsData]);

  const handleSelectPreset = useCallback((preset: any) => {
    selectPreset(preset);
    fetchContextualAreaAnalytics({
      lat: preset.center[1],
      lng: preset.center[0],
      area_name: preset.name,
    }).then((data) => {
      if (data) setAreaAnalyticsData(data);
    });
  }, [selectPreset]);

  const handleOpenZoneExplanation = useCallback(async (zoneId: string) => {
    let targetId = zoneId;
    if (!targetId.startsWith("ZONE-BLR-")) {
      if (targetId.includes("koramangala") || targetId.includes("KOR")) targetId = "ZONE-BLR-KOR-01";
      else if (targetId.includes("bellandur") || targetId.includes("BEL")) targetId = "ZONE-BLR-BEL-02";
      else if (targetId.includes("mahadevapura") || targetId.includes("hsr") || targetId.includes("HSR")) targetId = "ZONE-BLR-HSR-03";
      else if (targetId.includes("hebbal") || targetId.includes("HEB")) targetId = "ZONE-BLR-HEB-04";
      else if (targetId.includes("ulsoor") || targetId.includes("CEN")) targetId = "ZONE-BLR-CEN-05";
      else targetId = "ZONE-BLR-KOR-01";
    }

    const data = await fetchFloodZoneExplanation(targetId);
    if (data) {
      setExplanationData(data);
      setIsExplanationOpen(true);
    }
  }, []);

  const isDarkGIS = viewMode === "flood-intelligence";
  const activeExperienceMeta =
    experiences.find((e) => e.id === activeExperienceId) || experiences[0];

  // Map callbacks
  const handleMapLoaded = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomOut();
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [77.5946, 12.9716],
        zoom: 12.0,
        pitch: 0,
        bearing: 0,
        essential: true,
      });
      setIs3DActive(false);
    }
  }, []);

  const handleToggle3D = useCallback(() => {
    if (mapRef.current) {
      const next3D = !is3DActive;
      setIs3DActive(next3D);
      mapRef.current.easeTo({
        pitch: next3D ? 50 : 0,
        bearing: next3D ? -15 : 0,
        duration: 1200,
      });
    }
  }, [is3DActive]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoNotification("Geolocation is unsupported on this browser. Centered at Bengaluru HQ.");
      setTimeout(() => setGeoNotification(null), 4000);
      handleResetView();
      return;
    }

    setGeoNotification("Acquiring high-accuracy GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 15.0,
            essential: true,
            duration: 1800,
          });
        }
        setGeoNotification("Centered at your current physical location.");
        setTimeout(() => setGeoNotification(null), 3000);
      },
      () => {
        setGeoNotification("Location access unavailable or timed out. Defaulting to Central Command.");
        setTimeout(() => setGeoNotification(null), 4000);
        handleResetView();
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  }, [handleResetView]);

  const handleSearchSelect = useCallback((query: string) => {
    const match = presets.find(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.subtext.toLowerCase().includes(query.toLowerCase())
    );
    if (match) {
      selectPreset(match);
    }
  }, [presets, selectPreset]);

  // Global Keyboard Accessibility Listeners (Prompt 8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in search input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetView();
      } else if (e.key === "3") {
        e.preventDefault();
        handleToggle3D();
      } else if (e.key === "[") {
        e.preventDefault();
        setLeftPanelOpen((prev) => !prev);
      } else if (e.key === "]") {
        e.preventDefault();
        setRightPanelOpen((prev) => !prev);
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setLegendOpen((prev) => !prev);
      } else if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[role="combobox"]');
        if (searchInput) {
          searchInput.focus();
        }
      } else if (e.key === "Escape") {
        setSelectedFeature(null);
        setIsExplanationOpen(false);
        setIsAreaAnalyticsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleToggle3D,
    setLeftPanelOpen,
    setRightPanelOpen,
    setLegendOpen,
    setSelectedFeature,
  ]);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Smart-City Command Header */}
      <MapStudioHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        presets={presets}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        leftPanelOpen={leftPanelOpen}
        onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        legendOpen={legendOpen}
        onToggleLegend={() => setLegendOpen(!legendOpen)}
        isAreaAnalyticsOpen={isAreaAnalyticsOpen}
        onToggleAreaAnalytics={() => setIsAreaAnalyticsOpen(!isAreaAnalyticsOpen)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onResetView={handleResetView}
      />

      {/* Professional 11-Map View Navigation Strip */}
      <ExperienceSelectorBar
        experiences={experiences}
        activeExperienceId={activeExperienceId}
        onSelectExperience={selectExperience}
        isDarkGIS={isDarkGIS}
      />

      {/* Main Full-Scale Map Viewport */}
      <div className="relative flex-1 w-full h-[calc(100%-6.5rem)] overflow-hidden">
        {/* Dynamic WebGL Canvas with On-Demand Loading & Layer Load Indicators */}
        <MapStudioCanvas
          basemapStyle={basemapStyle}
          layers={layers}
          floodZones={floodZones}
          activePreset={activePreset}
          timeOffsetHours={timeOffsetHours}
          activeExperienceId={activeExperienceId}
          experienceData={activeExperienceData}
          onSelectFeature={setSelectedFeature}
          onMapLoaded={handleMapLoaded}
          isDarkGIS={isDarkGIS}
          onOpenZoneExplanation={handleOpenZoneExplanation}
          onSelectLocation={handleSelectLocation}
          onLoadingLayersChange={setLoadingLayerIds}
        />

        {/* Floating Top Search & Right Zoom Controls */}
        <StudioFloatingControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onToggle3D={handleToggle3D}
          is3DActive={is3DActive}
          onSearchSelect={handleSearchSelect}
          presets={presets}
          isDarkGIS={isDarkGIS}
        />

        {/* Left Floating Advanced Map Control Panel with Framer Motion & Loading States */}
        <StudioControlPanel
          isOpen={leftPanelOpen}
          onClose={() => setLeftPanelOpen(false)}
          onOpen={() => setLeftPanelOpen(true)}
          basemapStyle={basemapStyle}
          onSelectBasemapStyle={setBasemapStyle}
          layers={layers}
          onToggleLayer={toggleLayer}
          onSetLayerOpacity={setLayerOpacity}
          onShowAllLayers={showAllLayers}
          onHideAllLayers={hideAllLayers}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetOrientation={handleResetView}
          onLocateMe={handleLocateMe}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleLegend={() => setLegendOpen(!legendOpen)}
          isFullscreen={isFullscreen}
          legendOpen={legendOpen}
          userRole={user?.role}
          isDarkGIS={isDarkGIS}
          loadingLayerIds={loadingLayerIds}
        />

        {/* Right Floating Drawer: Domain-Tailored Intelligence with Framer Motion */}
        <ExperienceSidePanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          onOpen={() => setRightPanelOpen(true)}
          experienceMeta={activeExperienceMeta}
          experienceData={activeExperienceData}
          telemetry={telemetry}
          activePreset={activePreset}
          timeOffsetHours={timeOffsetHours}
          isDarkGIS={isDarkGIS}
          onOpenExplanation={() => handleOpenZoneExplanation("ZONE-BLR-KOR-01")}
        />

        {/* Bottom Time Scrubber (-24h to +6h ML Projection without fake continuous movement) */}
        <TimeForecastScrubber
          timeOffsetHours={timeOffsetHours}
          onTimeOffsetChange={setTimeOffsetHours}
          isPlaying={isPlayingTimeline}
          onTogglePlay={() => setIsPlayingTimeline(!isPlayingTimeline)}
          isDarkGIS={isDarkGIS}
          title={
            activeExperienceId === "extreme-heat-risk"
              ? "Thermal Heat Index Timeline Scrubber"
              : activeExperienceId === "air-quality-intelligence"
              ? "Atmospheric Dispersion Timeline Scrubber"
              : activeExperienceId === "verified-incident"
              ? "Municipal Incident Triage Timeline Scrubber"
              : activeExperienceId === "citizen-hazard-report"
              ? "Citizen Hazard Event Timeline Scrubber"
              : activeExperienceId === "safe-navigation-risk-aware"
              ? "Routing Risk Forecast Scrubber"
              : activeExperienceId === "infrastructure-emergency-facility"
              ? "Civil Defense Standby Timeline Scrubber"
              : "Hydrological Timeline Scrubber"
          }
        />

        {/* Bottom Left Interactive Legend with Framer Motion & Filter Controls */}
        <MapStudioLegend
          isOpen={legendOpen}
          onClose={() => setLegendOpen(false)}
          legendItems={activeExperienceData?.legend_items}
          title={`${activeExperienceMeta.name.replace(/^Map \d+ — /, "")} Legend`}
          isDarkGIS={isDarkGIS}
        />

        {/* Non-Blocking Location Toast Notification with Framer Motion */}
        <AnimatePresence>
          {geoNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/60 text-cyan-300 text-xs shadow-2xl backdrop-blur-md"
            >
              <Info className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{geoNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Inspection Modal when a feature is clicked */}
        <AnimatePresence>
          {selectedFeature && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg p-5 rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label="Detailed Geospatial Inspection"
              >
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  aria-label="Close Inspection Modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <AlertOctagon className="h-5 w-5 text-rose-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Detailed Geospatial Inspection
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mb-1">
                  {selectedFeature.properties.sector_name}
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Primary Threat: {selectedFeature.properties.primary_hazard}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase">Risk Level</span>
                    <p className="text-base font-bold text-rose-400 mt-0.5">
                      {selectedFeature.properties.risk_level} ({selectedFeature.properties.risk_score}/100)
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase">Peak Flood Depth</span>
                    <p className="text-base font-bold text-cyan-400 mt-0.5">
                      {selectedFeature.properties.flood_depth_m} meters
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase">Population In Danger</span>
                    <p className="text-base font-bold text-white mt-0.5">
                      {selectedFeature.properties.population_at_risk.toLocaleString()} citizens
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase">Drain Saturation</span>
                    <p className="text-base font-bold text-amber-400 mt-0.5">
                      {selectedFeature.properties.drainage_saturation_pct}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedFeature(null)}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
                  >
                    Dismiss Inspection
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dedicated Analytical Flood Risk Explanation Panel (Prompt 4) */}
        <FloodRiskExplanationPanel
          explanation={explanationData}
          isOpen={isExplanationOpen}
          onClose={() => setIsExplanationOpen(false)}
          onSelectZone={handleOpenZoneExplanation}
          availableZones={FALLBACK_FLOOD_LAYERS_DATA.susceptibility_zones.features.map((f) => ({
            zone_id: f.properties.zone_id,
            sector_name: f.properties.sector_name,
            risk_category: f.properties.risk_category,
          }))}
        />

        {/* Contextual Area Analytics & Multi-Hazard Information Panel (Prompt 7) */}
        <AreaAnalyticsDrawer
          isOpen={isAreaAnalyticsOpen}
          onClose={() => setIsAreaAnalyticsOpen(false)}
          analyticsData={areaAnalyticsData}
          isLoading={isAreaAnalyticsLoading}
          onRefresh={() => {
            if (areaAnalyticsData) {
              handleSelectLocation(
                [areaAnalyticsData.coordinates.lng, areaAnalyticsData.coordinates.lat],
                areaAnalyticsData.area_name
              );
            }
          }}
          onDateRangeChange={handleDateRangeChange}
          isDarkGIS={isDarkGIS}
          onSelectIncident={(coords) => {
            if (mapRef.current) {
              mapRef.current.flyTo({ center: coords, zoom: 16, essential: true });
            }
          }}
          onSelectFacility={(coords) => {
            if (mapRef.current) {
              mapRef.current.flyTo({ center: coords, zoom: 16, essential: true });
            }
          }}
        />
      </div>
    </div>
  );
}
