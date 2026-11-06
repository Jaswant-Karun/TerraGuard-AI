"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMapStudioData } from "@/features/map-studio/hooks/useMapStudioData";
import { MapStudioHeader } from "@/features/map-studio/components/MapStudioHeader";
import { StudioControlPanel } from "@/features/map-studio/components/StudioControlPanel";
import { FloodIntelligenceDrawer } from "@/features/map-studio/components/FloodIntelligenceDrawer";
import { TimeForecastScrubber } from "@/features/map-studio/components/TimeForecastScrubber";
import { MapStudioLegend } from "@/features/map-studio/components/MapStudioLegend";
import { StudioFloatingControls } from "@/features/map-studio/components/StudioFloatingControls";
import { AlertOctagon, X, Droplets, Users, ShieldAlert } from "lucide-react";

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
  const {
    basemapStyle,
    setBasemapStyle,
    viewMode,
    setViewMode,
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
  } = useMapStudioData();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is3DActive, setIs3DActive] = useState(false);
  const mapRef = useRef<any>(null);

  const isDarkGIS = viewMode === "flood-intelligence";

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

      {/* Main Full-Scale Map Viewport */}
      <div className="relative flex-1 w-full h-[calc(100%-3.5rem)] overflow-hidden">
        {/* Dynamic WebGL Canvas */}
        <MapStudioCanvas
          basemapStyle={basemapStyle}
          layers={layers}
          floodZones={floodZones}
          activePreset={activePreset}
          timeOffsetHours={timeOffsetHours}
          onSelectFeature={setSelectedFeature}
          onMapLoaded={handleMapLoaded}
          isDarkGIS={isDarkGIS}
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

        {/* Left Floating Control Panel: Basemaps & Layers (Ref Image A) */}
        <StudioControlPanel
          isOpen={leftPanelOpen}
          onClose={() => setLeftPanelOpen(false)}
          basemapStyle={basemapStyle}
          onSelectBasemapStyle={setBasemapStyle}
          layers={layers}
          onToggleLayer={toggleLayer}
          onSetLayerOpacity={setLayerOpacity}
          isDarkGIS={isDarkGIS}
        />

        {/* Right Floating Drawer: Flood Risk Intelligence & Hyetograph (Ref Image B) */}
        <FloodIntelligenceDrawer
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          telemetry={telemetry}
          floodZones={floodZones}
          activePreset={activePreset}
          isDarkGIS={isDarkGIS}
        />

        {/* Bottom Time Scrubber (-24h to +6h ML Projection) */}
        <TimeForecastScrubber
          timeOffsetHours={timeOffsetHours}
          onTimeOffsetChange={setTimeOffsetHours}
          isPlaying={isPlayingTimeline}
          onTogglePlay={() => setIsPlayingTimeline(!isPlayingTimeline)}
          isDarkGIS={isDarkGIS}
        />

        {/* Bottom Left Legend */}
        <MapStudioLegend
          isOpen={legendOpen}
          onClose={() => setLegendOpen(false)}
          isDarkGIS={isDarkGIS}
        />

        {/* Inspection Modal when a flood polygon is clicked */}
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
                  Detailed Hydrological Inspection
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
      </div>
    </div>
  );
}

