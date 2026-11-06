import {
  BasemapStyle,
  FloodRiskGeoJSON,
  LayerConfig,
  MapPreset,
  SectorTelemetry,
} from "../types/studio";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const BASEMAP_STYLES: Record<
  BasemapStyle,
  {
    name: string;
    description: string;
    thumbnail: string;
    tiles: string[];
    attribution: string;
    maxzoom: number;
  }
> = {
  satellite: {
    name: "Satellite Imagery",
    description: "High-resolution orbital optical imagery (Esri World Imagery)",
    thumbnail: "🛰️",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxzoom: 19,
  },
  dark: {
    name: "Dark Intelligence",
    description: "High-contrast tactical dark canvas optimized for risk layers (CartoDB)",
    thumbnail: "🌑",
    tiles: [
      "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    ],
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    maxzoom: 19,
  },
  topo: {
    name: "Topographic Terrain",
    description: "Contour elevations, ridgelines, and hydrological basins (OpenTopoMap)",
    thumbnail: "⛰️",
    tiles: [
      "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    ],
    attribution: "Kartendaten: &copy; OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: &copy; OpenTopoMap",
    maxzoom: 17,
  },
  street: {
    name: "Municipal Street",
    description: "Clear urban street network, landmarks, and arterial corridors (OSM)",
    thumbnail: "🗺️",
    tiles: [
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    attribution: "&copy; OpenStreetMap contributors",
    maxzoom: 19,
  },
};

export const DEFAULT_PRESETS: MapPreset[] = [
  {
    id: "koramangala",
    name: "Koramangala Lowland Basin",
    subtext: "Sector 4 · 80ft Road Critical Culvert Zone",
    center: [77.6250, 12.9250],
    zoom: 14.5,
    pitch: 35.0,
    bearing: -12.0,
    risk_level: "CRITICAL",
    key_metrics: {
      "Depth": "0.72m",
      "Rainfall": "48.5 mm/h",
      "At Risk": "42.8k",
    },
  },
  {
    id: "bellandur",
    name: "Bellandur Catchment & EcoSpace",
    subtext: "Outer Ring Road IT Corridor & Spillway",
    center: [77.6800, 12.9260],
    zoom: 14.0,
    pitch: 30.0,
    bearing: 15.0,
    risk_level: "HIGH",
    key_metrics: {
      "Depth": "0.48m",
      "Rainfall": "42.0 mm/h",
      "At Risk": "68.5k",
    },
  },
  {
    id: "mahadevapura",
    name: "Mahadevapura Low-Lying Arterial",
    subtext: "Whitefield Connection Box Drain Sump",
    center: [77.7020, 12.9780],
    zoom: 13.8,
    pitch: 25.0,
    bearing: 0.0,
    risk_level: "HIGH",
    key_metrics: {
      "Depth": "0.39m",
      "Rainfall": "38.2 mm/h",
      "At Risk": "51.2k",
    },
  },
  {
    id: "hebbal",
    name: "Hebbal Valley Drainage Sump",
    subtext: "North Bengaluru Elevated Retention Basin",
    center: [77.5980, 13.0280],
    zoom: 13.5,
    pitch: 20.0,
    bearing: -20.0,
    risk_level: "MODERATE",
    key_metrics: {
      "Depth": "0.22m",
      "Rainfall": "24.0 mm/h",
      "At Risk": "24.9k",
    },
  },
  {
    id: "bengaluru_metro",
    name: "Bengaluru Metropolitan HQ",
    subtext: "City-Wide Integrated Command Overview",
    center: [77.5946, 12.9716],
    zoom: 12.0,
    pitch: 0.0,
    bearing: 0.0,
    risk_level: "MODERATE",
    key_metrics: {
      "Threat Area": "17.6 km²",
      "Mean Rain": "48.5 mm",
      "Total At Risk": "201.7k",
    },
  },
];

export const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: "flood_risk_zones",
    name: "Predictive Flood Inundation Zones",
    category: "hazards",
    description: "AI-predicted inundation depth polygons based on hydro-elevation raster",
    source: "TerraGuard Hydro-UNet v2.4 + LiDAR",
    updateFrequency: "5 min sync",
    visible: true,
    opacity: 0.75,
    badge: "PREDICTIVE",
  },
  {
    id: "water_bodies",
    name: "Surface Water Bodies & Reservoirs",
    category: "environmental",
    description: "Active lake basins, wetland retention sinks, and stormwater detention reservoirs",
    source: "Lake Development Authority & Sentinel-2",
    updateFrequency: "Daily pass",
    visible: true,
    opacity: 0.85,
  },
  {
    id: "stormwater_network",
    name: "Primary Stormwater Culverts & Drains",
    category: "infrastructure",
    description: "Major arterial culverts, stormwater channels, and municipal pump stations",
    source: "Smart City Drainage Registry",
    updateFrequency: "Weekly",
    visible: false,
    opacity: 0.7,
  },
  {
    id: "critical_facilities",
    name: "Emergency Shelters & Medical Centers",
    category: "infrastructure",
    description: "Designated evacuation shelters, response staging nodes, and trauma centers",
    source: "District Disaster Management Authority",
    updateFrequency: "Live status",
    visible: true,
    opacity: 0.9,
    badge: "CRITICAL",
  },
  {
    id: "citizen_reports",
    name: "Citizen Hazard Incident Cluster",
    category: "reports",
    description: "Live citizen-submitted hazard reports (culvert blockages, waterlogging)",
    source: "TerraGuard Citizen Reporting Engine",
    updateFrequency: "Real-time",
    visible: true,
    opacity: 0.9,
    badge: "LIVE",
  },
  {
    id: "iot_telemetry_nodes",
    name: "IoT Water Level & Rain Gauges",
    category: "sensors",
    description: "Ultrasonic river stage gauges, automated tipping buckets, and sensor telemetry",
    source: "LoRaWAN Sensor Mesh",
    updateFrequency: "15s cycle",
    visible: true,
    opacity: 0.9,
  },
  {
    id: "radar_reflectivity",
    name: "Doppler Weather Radar Precipitation",
    category: "environmental",
    description: "Composite atmospheric radar reflectivity overlay highlighting heavy rain cells",
    source: "IMD Doppler Radar",
    updateFrequency: "10 min",
    visible: false,
    opacity: 0.6,
    badge: "IMD RADAR",
  },
];

export const FALLBACK_FLOOD_ZONES: FloodRiskGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "zone-blr-koramangala-01",
      properties: {
        zone_id: "Z-KOR-04",
        sector_name: "Koramangala 80ft Road Lowland Basin",
        risk_level: "CRITICAL",
        risk_score: 91.4,
        flood_depth_m: 0.72,
        population_at_risk: 42800,
        area_sqkm: 3.45,
        primary_hazard: "Flash Inundation & Culvert Silt Backflow",
        drainage_saturation_pct: 94.2,
        last_updated: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.6180, 12.9290],
          [77.6360, 12.9320],
          [77.6410, 12.9240],
          [77.6250, 12.9180],
          [77.6180, 12.9290],
        ]],
      },
    },
    {
      type: "Feature",
      id: "zone-blr-bellandur-02",
      properties: {
        zone_id: "Z-BEL-01",
        sector_name: "Bellandur Catchment & EcoSpace Spillway",
        risk_level: "HIGH",
        risk_score: 78.6,
        flood_depth_m: 0.48,
        population_at_risk: 68500,
        area_sqkm: 5.12,
        primary_hazard: "Spillway Overflow & Arterial Waterlogging",
        drainage_saturation_pct: 83.5,
        last_updated: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.6650, 12.9280],
          [77.6920, 12.9340],
          [77.6980, 12.9200],
          [77.6710, 12.9150],
          [77.6650, 12.9280],
        ]],
      },
    },
    {
      type: "Feature",
      id: "zone-blr-mahadevapura-03",
      properties: {
        zone_id: "Z-MHD-09",
        sector_name: "Mahadevapura ORR Tech Corridor",
        risk_level: "HIGH",
        risk_score: 74.2,
        flood_depth_m: 0.39,
        population_at_risk: 51200,
        area_sqkm: 4.20,
        primary_hazard: "Impervious Runoff & Surcharged Box Drains",
        drainage_saturation_pct: 79.0,
        last_updated: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.6890, 12.9850],
          [77.7120, 12.9900],
          [77.7180, 12.9720],
          [77.6930, 12.9690],
          [77.6890, 12.9850],
        ]],
      },
    },
    {
      type: "Feature",
      id: "zone-blr-hebbal-04",
      properties: {
        zone_id: "Z-HEB-02",
        sector_name: "Hebbal Valley Drainage Sump",
        risk_level: "MODERATE",
        risk_score: 52.8,
        flood_depth_m: 0.22,
        population_at_risk: 24900,
        area_sqkm: 2.85,
        primary_hazard: "Elevated Water Table & Retention Lag",
        drainage_saturation_pct: 58.4,
        last_updated: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.5840, 13.0320],
          [77.6080, 13.0380],
          [77.6140, 13.0230],
          [77.5900, 13.0190],
          [77.5840, 13.0320],
        ]],
      },
    },
    {
      type: "Feature",
      id: "zone-blr-ulsoor-05",
      properties: {
        zone_id: "Z-ULS-03",
        sector_name: "Ulsoor Lake Buffer Zone",
        risk_level: "LOW",
        risk_score: 29.5,
        flood_depth_m: 0.08,
        population_at_risk: 14300,
        area_sqkm: 1.95,
        primary_hazard: "Perimeter Inflow Concentration",
        drainage_saturation_pct: 36.0,
        last_updated: new Date().toISOString(),
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [77.6150, 12.9830],
          [77.6320, 12.9850],
          [77.6350, 12.9730],
          [77.6180, 12.9720],
          [77.6150, 12.9830],
        ]],
      },
    },
  ],
  metadata: {
    total_population_at_risk: 201700,
    critical_zones_count: 1,
    high_zones_count: 2,
    moderate_zones_count: 1,
    low_zones_count: 1,
    total_threat_area_sqkm: 17.57,
    mean_precipitation_mm: 48.5,
    engine: "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
    last_computed: new Date().toISOString(),
  },
};

export const FALLBACK_TELEMETRY: SectorTelemetry = {
  sector_id: "zone-blr-koramangala-01",
  sector_name: "Koramangala 80ft Road Lowland Basin (Sector 04)",
  timestamp: new Date().toISOString(),
  live_rainfall_rate_mm_h: 48.5,
  drainage_saturation_pct: 94.2,
  total_population_at_risk: 42800,
  active_alarms_count: 3,
  hyetograph_history: [
    { timestamp: "19:00", precipitation_mm: 12.4, drainage_capacity_pct: 42.0, flood_index: 18.5 },
    { timestamp: "20:00", precipitation_mm: 26.8, drainage_capacity_pct: 64.0, flood_index: 44.2 },
    { timestamp: "21:00", precipitation_mm: 41.2, drainage_capacity_pct: 88.5, flood_index: 72.0 },
    { timestamp: "22:00", precipitation_mm: 48.5, drainage_capacity_pct: 94.2, flood_index: 91.4 },
  ],
  forecast_progression: [
    { timestamp: "+1h", precipitation_mm: 38.0, drainage_capacity_pct: 92.0, flood_index: 86.0 },
    { timestamp: "+2h", precipitation_mm: 24.5, drainage_capacity_pct: 81.0, flood_index: 70.5 },
    { timestamp: "+3h", precipitation_mm: 14.0, drainage_capacity_pct: 68.0, flood_index: 52.0 },
    { timestamp: "+4h", precipitation_mm: 6.2, drainage_capacity_pct: 52.0, flood_index: 35.0 },
    { timestamp: "+5h", precipitation_mm: 2.1, drainage_capacity_pct: 38.0, flood_index: 22.0 },
    { timestamp: "+6h", precipitation_mm: 0.8, drainage_capacity_pct: 25.0, flood_index: 14.0 },
  ],
};

export async function getMapStudioLayers(): Promise<LayerConfig[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/map-studio/layers`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("Failed to fetch layers");
    const data = await res.json();
    return data.layers.map((l: any) => ({
      id: l.id,
      name: l.name,
      category: l.category,
      description: l.description,
      source: l.source,
      updateFrequency: l.update_frequency,
      visible: l.visible_by_default,
      opacity: l.default_opacity,
      badge: l.badge,
    }));
  } catch (err) {
    return DEFAULT_LAYERS;
  }
}

export async function getFloodRiskZones(minRiskLevel?: string): Promise<FloodRiskGeoJSON> {
  try {
    const url = new URL(`${API_BASE}/api/v1/map-studio/zones`);
    if (minRiskLevel) url.searchParams.set("min_risk_level", minRiskLevel);
    const res = await fetch(url.toString(), {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch flood zones");
    return await res.json();
  } catch (err) {
    if (minRiskLevel) {
      return {
        ...FALLBACK_FLOOD_ZONES,
        features: FALLBACK_FLOOD_ZONES.features.filter(
          (f) => f.properties.risk_level === minRiskLevel.toUpperCase()
        ),
      };
    }
    return FALLBACK_FLOOD_ZONES;
  }
}

export async function getSectorTelemetry(sectorId?: string): Promise<SectorTelemetry> {
  try {
    const url = new URL(`${API_BASE}/api/v1/map-studio/telemetry`);
    if (sectorId) url.searchParams.set("sector_id", sectorId);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch sector telemetry");
    return await res.json();
  } catch (err) {
    return FALLBACK_TELEMETRY;
  }
}

export async function getHotspotPresets(): Promise<MapPreset[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/map-studio/presets`);
    if (!res.ok) throw new Error("Failed to fetch presets");
    const data = await res.json();
    return data.presets;
  } catch (err) {
    return DEFAULT_PRESETS;
  }
}
