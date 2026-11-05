"use client";

import React, { useEffect, useRef, useState } from "react";
import * as turf from "@turf/turf";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Compass,
  Crosshair,
  Flame,
  Home,
  Info,
  Layers,
  MapPin,
  Navigation,
  Phone,
  Shield,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Facility, HazardIntersection, RouteAlternative } from "@/types/navigation";

interface NavigationRouteMapProps {
  origin: [number, number];
  destination: [number, number];
  routes: RouteAlternative[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
  facilities: Facility[];
  onSelectFacilityDestination: (fac: Facility) => void;
  clickMode: "NONE" | "SET_ORIGIN" | "SET_DESTINATION";
  onMapClickCoordinate: (coords: [number, number]) => void;
}

export function NavigationRouteMap({
  origin,
  destination,
  routes,
  selectedRouteId,
  onSelectRoute,
  facilities,
  onSelectFacilityDestination,
  clickMode,
  onMapClickCoordinate,
}: NavigationRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize MapLibre
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
          center: origin,
          zoom: 12,
          pitch: 15,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        map.on("load", () => {
          if (!isMounted) return;
          mapInstance.current = map;
          setMapReady(true);
        });

        map.on("click", (e: any) => {
          const coords: [number, number] = [
            Number(e.lngLat.lng.toFixed(6)),
            Number(e.lngLat.lat.toFixed(6)),
          ];
          onMapClickCoordinate(coords);
        });
      } catch (err) {
        console.error("MapLibre init error in NavigationRouteMap:", err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Route Layers and Markers when data changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import("maplibre-gl").then(({ default: maplibregl }) => {
      // 1. Draw Origin Marker
      const originEl = document.createElement("div");
      originEl.className = "flex items-center justify-center";
      originEl.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75"></span>
          <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
            A
          </div>
        </div>
      `;
      const originMarker = new maplibregl.Marker({ element: originEl })
        .setLngLat(origin)
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div class="p-2 text-xs font-sans">
              <strong class="text-blue-700">Origin Point</strong>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">[${origin[0].toFixed(4)}, ${origin[1].toFixed(4)}]</div>
            </div>`
          )
        )
        .addTo(map);
      markersRef.current.push(originMarker);

      // 2. Draw Destination Marker
      const destEl = document.createElement("div");
      destEl.className = "flex items-center justify-center";
      destEl.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-bold">
          B
        </div>
      `;
      const destMarker = new maplibregl.Marker({ element: destEl })
        .setLngLat(destination)
        .setPopup(
          new maplibregl.Popup({ offset: 15 }).setHTML(
            `<div class="p-2 text-xs font-sans">
              <strong class="text-slate-900">Destination Point</strong>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">[${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}]</div>
            </div>`
          )
        )
        .addTo(map);
      markersRef.current.push(destMarker);

      // 3. Draw Emergency Facilities
      facilities.forEach((fac) => {
        const facEl = document.createElement("div");
        facEl.className = "cursor-pointer transform hover:scale-110 transition-transform";

        let bgColor = "bg-rose-600";
        let iconHtml = "+";
        if (fac.category === "EMERGENCY_SHELTER") {
          bgColor = "bg-emerald-600";
          iconHtml = "⌂";
        } else if (fac.category === "FIRE_STATION") {
          bgColor = "bg-amber-600";
          iconHtml = "▲";
        } else if (fac.category === "PUMP_STATION") {
          bgColor = "bg-cyan-600";
          iconHtml = "≈";
        }

        facEl.innerHTML = `
          <div class="w-6 h-6 rounded-md ${bgColor} border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold">
            ${iconHtml}
          </div>
        `;

        const facPopup = new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div class="p-2 text-xs font-sans max-w-[200px]">
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 bg-slate-100 text-slate-800">${fac.category.replace("_", " ")}</span>
            <div class="font-bold text-slate-900 leading-tight">${fac.name}</div>
            <div class="text-[11px] text-slate-500 mt-1">${fac.address}</div>
            ${fac.contact_phone ? `<div class="text-[11px] text-blue-700 font-mono mt-1">☎ ${fac.contact_phone}</div>` : ""}
            <div class="text-[11px] font-medium text-emerald-700 mt-1">${fac.distance_km} km away</div>
          </div>`
        );

        const m = new maplibregl.Marker({ element: facEl })
          .setLngLat(fac.coordinates)
          .setPopup(facPopup)
          .addTo(map);
        markersRef.current.push(m);
      });

      // 4. Draw Route GeoJSON Lines on Map
      // Clean up previous route layers/sources if any
      for (let i = 0; i < 5; i++) {
        const lineId = `route-line-${i}`;
        const casingId = `route-casing-${i}`;
        const sourceId = `route-source-${i}`;
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(casingId)) map.removeLayer(casingId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }

      // Render alternative routes first (behind), then selected route on top
      const allCoordinates: [number, number][] = [origin, destination];

      routes.forEach((r, idx) => {
        const isSelected = r.route_id === selectedRouteId;
        const sourceId = `route-source-${idx}`;
        const lineId = `route-line-${idx}`;
        const casingId = `route-casing-${idx}`;

        const coords = r.path_geojson?.coordinates || [];
        coords.forEach((c) => allCoordinates.push(c));

        map.addSource(sourceId, {
          type: "geojson",
          data: r.path_geojson,
        });

        // Color coding based on verified safety status
        let strokeColor = "#0284c7"; // Blue
        if (r.safety_status === "VERIFIED_SAFER_ROUTE") {
          strokeColor = "#059669"; // Emerald green
        } else if (r.safety_status === "HAZARDOUS_ROUTE") {
          strokeColor = "#dc2626"; // Red
        } else if (r.safety_status === "CAUTION_ROUTE") {
          strokeColor = "#d97706"; // Amber
        }

        // Casing layer (outer border / shadow)
        map.addLayer({
          id: casingId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": isSelected ? "#0f172a" : "#cbd5e1",
            "line-width": isSelected ? 8 : 4,
            "line-opacity": isSelected ? 0.4 : 0.6,
          },
        });

        // Main line layer
        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": strokeColor,
            "line-width": isSelected ? 5 : 3,
            "line-dasharray": isSelected ? [1] : [2, 1],
            "line-opacity": isSelected ? 1.0 : 0.6,
          },
        });

        // Add Hazard Markers on intersecting routes
        if (isSelected && r.hazard_intersections?.length > 0) {
          r.hazard_intersections.forEach((h: HazardIntersection) => {
            const hzEl = document.createElement("div");
            hzEl.className = "flex items-center justify-center animate-bounce";
            hzEl.innerHTML = `
              <div class="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
                !
              </div>
            `;
            const hMarker = new maplibregl.Marker({ element: hzEl })
              .setLngLat(h.location)
              .setPopup(
                new maplibregl.Popup({ offset: 15 }).setHTML(
                  `<div class="p-2 text-xs font-sans max-w-[200px]">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 bg-red-100 text-red-800">
                      ${h.hazard_category} (Severity ${h.severity}/5)
                    </span>
                    <div class="font-bold text-slate-900">${h.description}</div>
                    <div class="text-[11px] text-red-700 mt-1">${h.distance_to_route_meters}m from route path</div>
                  </div>`
                )
              )
              .addTo(map);
            markersRef.current.push(hMarker);
          });
        }
      });

      // 5. Fit bounds to all coordinates using Turf.js
      if (allCoordinates.length >= 2) {
        try {
          const line = turf.lineString(allCoordinates);
          const [minX, minY, maxX, maxY] = turf.bbox(line);
          map.fitBounds(
            [
              [minX, minY],
              [maxX, maxY],
            ],
            { padding: 60, maxZoom: 14 }
          );
        } catch (e) {
          console.warn("Turf bbox calculation fallback:", e);
        }
      }
    });
  }, [mapReady, origin, destination, routes, selectedRouteId, facilities]);

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Click Mode Overlay Banner */}
      {clickMode !== "NONE" && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg backdrop-blur-sm border border-slate-700 flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>
            {clickMode === "SET_ORIGIN"
              ? "Click anywhere on the map to set Origin (Point A)"
              : "Click anywhere on the map to set Destination (Point B)"}
          </span>
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-lg p-3 text-[11px] shadow-md space-y-1.5 max-w-xs">
        <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
          Route Map Legend
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 rounded bg-emerald-600 inline-block" />
          <span className="text-slate-700">Verified Safer Route (Bypasses hazards)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 rounded bg-blue-600 inline-block" />
          <span className="text-slate-700">Standard Road Route (Baseline)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 rounded bg-red-600 inline-block" />
          <span className="text-slate-700">Hazardous / Inundated Path</span>
        </div>
        <div className="flex items-center space-x-3 pt-1 border-t border-slate-100 text-slate-600">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 text-white inline-flex items-center justify-center text-[8px] font-bold mr-1">
              +
            </span>
            Hospital
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 text-white inline-flex items-center justify-center text-[8px] font-bold mr-1">
              ⌂
            </span>
            Shelter
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-600 text-white inline-flex items-center justify-center text-[8px] font-bold mr-1">
              ▲
            </span>
            Fire
          </span>
        </div>
      </div>
    </div>
  );
}

