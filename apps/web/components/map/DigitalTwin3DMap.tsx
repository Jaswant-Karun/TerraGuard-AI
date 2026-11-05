"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Compass,
  Eye,
  EyeOff,
  Flame,
  History,
  Layers,
  Maximize2,
  RefreshCw,
  RotateCw,
  Shield,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HistoricalBenchmark,
  SectorComparison,
  TimelineSlice,
} from "@/types/digital_twin";

interface DigitalTwin3DMapProps {
  buildingsData: any;
  activeSlice: TimelineSlice | null;
  selectedSector: SectorComparison | null;
  historicalBenchmarks: HistoricalBenchmark[];
  onSelectSector: (sector: SectorComparison) => void;
}

export function DigitalTwin3DMap({
  buildingsData,
  activeSlice,
  selectedSector,
  historicalBenchmarks,
  onSelectSector,
}: DigitalTwin3DMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [show3DBuildings, setShow3DBuildings] = useState(true);
  const [pitch3D, setPitch3D] = useState(48);

  // Initialize MapLibre in 3D pitch mode
  useEffect(() => {
    let isMounted = true;
    let map: any = null;

    async function init() {
      if (!mapContainer.current) return;
      try {
        const maplibregl = (await import("maplibre-gl")).default;

        map = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              "osm-tiles": {
                type: "raster",
                tiles: [
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
          center: [77.6245, 12.9352], // Koramangala - Bellandur corridor
          zoom: 13.5,
          pitch: 48,
          bearing: -15,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        map.on("load", () => {
          if (!isMounted) return;
          mapInstance.current = map;
          setMapReady(true);
        });
      } catch (err) {
        console.error("Failed to initialize MapLibre 3D Digital Twin:", err);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (map) {
        map.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Fly to selected sector when selection changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady || !selectedSector) return;

    map.flyTo({
      center: selectedSector.centroid,
      zoom: 14.5,
      pitch: 52,
      bearing: -20,
      duration: 1800,
      essential: true,
    });
  }, [selectedSector, mapReady]);

  // Render 3D Extruded Buildings and Historical Markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    // 1. Add / Update 3D Building Extrusions Layer
    const sourceId = "3d-buildings-source";
    const layerId = "3d-buildings-layer";

    if (buildingsData && buildingsData.features) {
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(buildingsData);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: buildingsData,
        });

        // 3D Fill Extrusion Layer
        map.addLayer({
          id: layerId,
          type: "fill-extrusion",
          source: sourceId,
          paint: {
            "fill-extrusion-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#38bdf8",
              ["get", "color"],
            ],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.88,
          },
        });

        // Interactive popup on building click
        import("maplibre-gl").then(({ default: maplibregl }) => {
          map.on("click", layerId, (e: any) => {
            if (!e.features || !e.features[0]) return;
            const props = e.features[0].properties;
            const coords = e.lngLat;

            new maplibregl.Popup({ offset: 15 })
              .setLngLat(coords)
              .setHTML(
                `<div class="p-2 text-xs font-sans max-w-[220px]">
                  <div class="text-[10px] uppercase font-bold text-slate-400">${props.type}</div>
                  <div class="font-bold text-slate-900 text-sm">${props.name}</div>
                  <div class="mt-1 text-slate-600 font-mono">Structural Height: <strong>${props.height}m</strong></div>
                  <div class="text-slate-600 font-mono">Base Elevation: <strong>${props.elevation}m</strong></div>
                  <div class="mt-1 flex items-center">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      props.flood_vulnerability === "CRITICAL"
                        ? "bg-red-100 text-red-800"
                        : props.flood_vulnerability === "HIGH"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }">
                      Vulnerability: ${props.flood_vulnerability}
                    </span>
                  </div>
                </div>`
              )
              .addTo(map);
          });

          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        });
      }
    }

    // Toggle layer visibility
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", show3DBuildings ? "visible" : "none");
    }

    // 2. Clear & Redraw Historical Event Disaster Markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("maplibre-gl").then(({ default: maplibregl }) => {
      historicalBenchmarks.forEach((bench) => {
        const markerEl = document.createElement("div");
        markerEl.className = "cursor-pointer transform hover:scale-125 transition-transform";
        markerEl.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-rose-400 opacity-60"></span>
            <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-rose-500 shadow-xl flex items-center justify-center text-rose-400 text-[10px] font-bold">
              ★
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div class="p-2 text-xs font-sans max-w-[230px]">
            <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mb-1 bg-rose-100 text-rose-800">
              Historical Event (${new Date(bench.occurred_at).getFullYear()})
            </span>
            <div class="font-bold text-slate-900 leading-snug">${bench.title}</div>
            <div class="text-[11px] text-slate-600 mt-1">${bench.description}</div>
            <div class="mt-1.5 pt-1 border-t border-slate-100 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-700">
              <div>Peak: <strong>${bench.peak_rainfall_mm || 0}mm</strong></div>
              <div>Loss: <strong>$${((bench.damage_estimate_usd || 0) / 1e6).toFixed(1)}M</strong></div>
            </div>
            <div class="mt-1 text-[10px] text-slate-500 italic">Lessons: ${bench.lessons_learned}</div>
          </div>`
        );

        const m = new maplibregl.Marker({ element: markerEl })
          .setLngLat(bench.location)
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(m);
      });
    });
  }, [mapReady, buildingsData, show3DBuildings, historicalBenchmarks]);

  const togglePitch = () => {
    const map = mapInstance.current;
    if (!map) return;
    const nextPitch = pitch3D > 20 ? 0 : 52;
    setPitch3D(nextPitch);
    map.easeTo({ pitch: nextPitch, duration: 800 });
  };

  const rotateCamera = () => {
    const map = mapInstance.current;
    if (!map) return;
    const currentBearing = map.getBearing();
    map.easeTo({ bearing: currentBearing + 60, duration: 1200 });
  };

  return (
    <div className="relative w-full h-[580px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating 3D Controls Toolstrip */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button
          size="sm"
          variant="outline"
          onClick={togglePitch}
          className="bg-white/95 backdrop-blur-sm text-slate-800 border-slate-300 shadow-md text-xs h-8 px-2.5"
          title="Toggle 2D / 3D Extrusion Pitch"
        >
          <Building2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
          {pitch3D > 20 ? "3D Tilt (52°)" : "Flat 2D"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={rotateCamera}
          className="bg-white/95 backdrop-blur-sm text-slate-800 border-slate-300 shadow-md text-xs h-8 px-2.5"
          title="Rotate 3D Camera"
        >
          <RotateCw className="w-3.5 h-3.5 mr-1 text-slate-600" />
          Rotate 60°
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShow3DBuildings(!show3DBuildings)}
          className={`backdrop-blur-sm shadow-md text-xs h-8 px-2.5 ${
            show3DBuildings
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white/95 text-slate-800 border-slate-300"
          }`}
          title="Toggle Extruded Buildings"
        >
          {show3DBuildings ? (
            <>
              <Eye className="w-3.5 h-3.5 mr-1" />
              Buildings 3D
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              Buildings Off
            </>
          )}
        </Button>
      </div>

      {/* Active Time Slice Simulation Pill Overlay */}
      {activeSlice && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white px-4 py-2.5 rounded-lg border border-slate-700 shadow-xl backdrop-blur-sm flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeSlice.is_live
                  ? "bg-emerald-400 animate-pulse"
                  : activeSlice.is_projection
                  ? "bg-cyan-400"
                  : "bg-amber-400"
              }`}
            />
            <span className="font-bold text-xs uppercase tracking-wider">
              {activeSlice.label}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="text-[11px] text-slate-300 font-mono flex items-center space-x-3">
            <span>
              Rain: <strong>{activeSlice.precipitation_mm}mm</strong>
            </span>
            <span>
              Rate: <strong>{activeSlice.rainfall_intensity_mmh}mm/h</strong>
            </span>
            <span>
              Risk:{" "}
              <strong
                className={
                  activeSlice.composite_risk_score >= 70
                    ? "text-red-400"
                    : activeSlice.composite_risk_score >= 40
                    ? "text-amber-400"
                    : "text-emerald-400"
                }
              >
                {activeSlice.composite_risk_score}/100
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* 3D Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-lg p-3 text-[11px] shadow-lg space-y-1.5 max-w-xs">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
          3D Digital Twin Visual Key
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
          <span className="text-slate-700">Critical Flood Vulnerability (&gt;70m depth)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
          <span className="text-slate-700">High Risk Infrastructure (Valley Floor)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          <span className="text-slate-700">Civic Relief Hub &amp; High-Ground Shelter</span>
        </div>
        <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 text-slate-600">
          <span className="w-3 h-3 rounded-full bg-slate-900 border border-rose-500 inline-flex items-center justify-center text-rose-400 text-[8px] font-bold mr-1">
            ★
          </span>
          <span>Verified Historical Disaster Benchmark</span>
        </div>
      </div>
    </div>
  );
}

