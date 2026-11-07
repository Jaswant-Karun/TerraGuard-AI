"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/features/auth/AuthContext";
import { useMapStudioData } from "@/features/map-studio/hooks/useMapStudioData";
import { MapStudioHeader } from "@/features/map-studio/components/MapStudioHeader";
import { ExperienceSelectorBar } from "@/features/map-studio/components/ExperienceSelectorBar";
import { StudioControlPanel } from "@/features/map-studio/components/StudioControlPanel";
import { ExperienceSidePanel } from "@/features/map-studio/components/ExperienceSidePanel";
import { TimeForecastScrubber } from "@/features/map-studio/components/TimeForecastScrubber";
import { MapStudioLegend } from "@/features/map-studio/components/MapStudioLegend";
import { StudioFloatingControls } from "@/features/map-studio/components/StudioFloatingControls";
import { AlertOctagon, X, Droplets, Users, ShieldAlert, Crosshair, Info } from "lucide-react";
import { FloodRiskExplanationPanel } from "@/features/flood-engine/components/FloodRiskExplanationPanel";
import {
  fetchFloodZoneExplanation,
  FloodZoneExplanationData,
  FALLBACK_FLOOD_LAYERS_DATA,
} from "@/features/flood-engine/services/flood_visualization";

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
  const mapRef = useRef<any>(null);

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

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleResetView = () => {
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
  };

  const handleToggle3D = () => {
    if (mapRef.current) {
      const next3D = !is3DActive;
      setIs3DActive(next3D);
      mapRef.current.easeTo({
        pitch: next3D ? 50 : 0,
        bearing: next3D ? -15 : 0,
        duration: 1200,
      });
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleLocateMe = () => {
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
        // Polite non-blocking notification instead of a window.alert
        setGeoNotification("Location access unavailable or timed out. Defaulting to Central Command.");
        setTimeout(() => setGeoNotification(null), 4000);
        handleResetView();
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  const handleSearchSelect = (query: string) => {
    const match = presets.find(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.subtext.toLowerCase().includes(query.toLowerCase())
    );
    if (match) {
      selectPreset(match);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Smart-City Command Header (Ref Image A) */}
      <MapStudioHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        presets={presets}
        activePreset={activePreset}
        onSelectPreset={selectPreset}
        leftPanelOpen={leftPanelOpen}
        onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
        rightPanelOpen={rightPanelOpen}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        legendOpen={legendOpen}
        onToggleLegend={() => setLegendOpen(!legendOpen)}
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
        {/* Dynamic WebGL Canvas */}
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

        {/* Left Floating Advanced Map Control Panel (Inspired by Ref Image A) */}
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
        />

        {/* Right Floating Drawer: Domain-Tailored Intelligence for Active Experience */}
        <ExperienceSidePanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          experienceMeta={activeExperienceMeta}
          experienceData={activeExperienceData}
          telemetry={telemetry}
          activePreset={activePreset}
          timeOffsetHours={timeOffsetHours}
          isDarkGIS={isDarkGIS}
          onOpenExplanation={() => handleOpenZoneExplanation("ZONE-BLR-KOR-01")}
        />

        {/* Bottom Time Scrubber (-24h to +6h ML Projection) */}
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

        {/* Bottom Left Legend for Active Experience */}
        <MapStudioLegend
          isOpen={legendOpen}
          onClose={() => setLegendOpen(false)}
          legendItems={activeExperienceData?.legend_items}
          title={`${activeExperienceMeta.name.replace(/^Map \d+ — /, "")} Legend`}
          isDarkGIS={isDarkGIS}
        />

        {/* Polite Non-Blocking Location Toast Notification */}
        {geoNotification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-cyan-500/60 text-cyan-300 text-xs shadow-2xl backdrop-blur-md animate-fade-in">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>{geoNotification}</span>
          </div>
        )}

        {/* Inspection Modal when a feature is clicked */}
        {selectedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="relative w-full max-w-lg p-5 rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
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
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
