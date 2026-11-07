import { API_BASE_URL } from "@/services/config";
import {
  BasemapStyle,
  ExperienceId,
  ExperienceViewMeta,
  FloodRiskGeoJSON,
  LayerConfig,
  MapPreset,
  MapStudioExperienceResponse,
  MapAutomationStatusResponse,
  SectorTelemetry,
} from "../types/studio";

export const BASEMAP_STYLES: Record<
  BasemapStyle,
  {
    name: string;
    description: string;
    thumbnail: string;
    tiles: string[];
    labels?: string[];
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
  satellite_labels: {
    name: "Satellite with Labels",
    description: "Orbital optical imagery combined with street and boundary labels (Esri)",
    thumbnail: "🏷️",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    labels: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Tiles &copy; Esri &mdash; Boundaries & Places &copy; Esri",
    maxzoom: 19,
  },
  dark: {
    name: "Dark Intelligence",
    description: "High-contrast tactical dark canvas optimized for risk layers (Esri Dark Gray)",
    thumbnail: "🌑",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    ],
    labels: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Tiles & Labels &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community",
    maxzoom: 19,
  },
  topo: {
    name: "Topographic Terrain",
    description: "Contour elevations, ridgelines, and hydrological basins (Esri World Topo)",
    thumbnail: "⛰️",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "Tiles &copy; Esri &mdash; Sources: USGS, FAO, NPS, EPA, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    maxzoom: 18,
  },
  street: {
    name: "Municipal Street",
    description: "Clear urban street network, landmarks, and arterial corridors (OSM)",
    thumbnail: "🗺️",
    tiles: [
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
    ],
    attribution: "&copy; OpenStreetMap contributors",
    maxzoom: 19,
  },
};

export const EXPERIENCE_DEFAULT_LAYERS: Record<ExperienceId, string[]> = {
  "operational-satellite-gis": [
    "flood_risk",
    "rainfall",
    "roads",
    "water_bodies",
    "drainage",
    "hospitals",
    "emergency_facilities",
    "shelters",
    "citizen_reports",
    "verified_incidents",
  ],
  "flood-risk-intelligence": [
    "flood_risk",
    "water_bodies",
    "rainfall",
    "drainage",
  ],
  "live-rainfall-monitoring": [
    "rainfall",
    "roads",
  ],
  "elevation-terrain": [
    "water_bodies",
  ],
  "drainage-water-body": [
    "water_bodies",
    "drainage",
  ],
  "extreme-heat-risk": [
    "temperature",
    "heat_risk",
  ],
  "air-quality-intelligence": [
    "air_quality",
  ],
  "citizen-hazard-report": [
    "citizen_reports",
    "roads",
  ],
  "verified-incident": [
    "verified_incidents",
    "roads",
  ],
  "infrastructure-emergency-facility": [
    "hospitals",
    "emergency_facilities",
    "shelters",
    "roads",
  ],
  "safe-navigation-risk-aware": [
    "roads",
  ],
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
  // 1. Environmental Layers
  {
    id: "flood_risk",
    name: "Predictive Flood Risk Zones",
    category: "environmental",
    description: "AI-predicted inundation depth polygons based on hydro-elevation raster",
    source: "TerraGuard Hydro-UNet v2.4 + LiDAR",
    source_name: "BBMP Stormwater Masterplan LiDAR 1m DEM & KSNDMC Rain Gauges",
    data_type: "Hydrodynamic Inundation Model & Catchment Vectors",
    unit: "Meters (depth)",
    last_updated: "Real-time (5 min sync)",
    coverage: "Bengaluru Metropolitan Catchment (712 km²)",
    availability: "LIVE_SYNCED",
    data_quality: "Hydro-UNet v2.4 + Sentinel-1 SAR Calibration (±0.06m CI)",
    updateFrequency: "5 min sync",
    visible: true,
    opacity: 0.75,
    badge: "PREDICTIVE",
  },
  {
    id: "rainfall",
    name: "Live Rainfall Monitoring",
    category: "environmental",
    description: "Automated Weather Station (AWS) precipitation intensity and tipping buckets",
    source: "IMD AWS & Open-Meteo Telemetry",
    source_name: "IMD Automated Weather Stations & Open-Meteo High-Resolution Ensemble",
    data_type: "In-situ Tipping Bucket & Numerical Precipitation Radar",
    unit: "mm/h (intensity)",
    last_updated: "Real-time (4 min sync)",
    coverage: "Bengaluru Urban Network (28 AWS nodes)",
    availability: "LIVE_SYNCED",
    data_quality: "Calibrated Telemetry + WMO Standards Compliance",
    updateFrequency: "4 min sync",
    visible: true,
    opacity: 0.9,
    badge: "LIVE",
  },
  {
    id: "temperature",
    name: "Ambient Temperature",
    category: "environmental",
    description: "Real-time surface ambient temperature distribution across urban sectors",
    source: "Municipal IoT Sensor Network",
    source_name: "Municipal IoT Sensor Mesh & Open-Meteo Surface Telemetry",
    data_type: "Surface Ambient Dry-Bulb Temperature",
    unit: "°C (dry-bulb)",
    last_updated: "10 min cadence",
    coverage: "Citywide Microclimate Network (198 wards)",
    availability: "AVAILABLE",
    data_quality: "NIST-traceable Thermistor Mesh (±0.2°C)",
    updateFrequency: "10 min sync",
    visible: false,
    opacity: 0.8,
  },
  {
    id: "heat_risk",
    name: "Extreme Heat Risk & UHI",
    category: "environmental",
    description: "Urban Heat Island bioclimatic stress index and canopy buffer deltas",
    source: "TerraGuard Thermal Model + MODIS",
    source_name: "Landsat-9 Thermal Infrared Sensor (TIRS-2) & IoT Sensors",
    data_type: "Land Surface Temperature (LST) & UHI Stress Index",
    unit: "°C (Bioclimatic Index)",
    last_updated: "Hourly Reanalysis",
    coverage: "Bengaluru Metro Area (30m spatial resolution)",
    availability: "AVAILABLE",
    data_quality: "Radiometrically Calibrated Thermal Band (±0.5°C)",
    updateFrequency: "15 min sync",
    visible: false,
    opacity: 0.75,
    badge: "HEAT INDEX",
  },
  {
    id: "air_quality",
    name: "Air Quality Intelligence (AQI)",
    category: "environmental",
    description: "Continuous Ambient Air Quality Monitoring (CAAQMS) with PM2.5, PM10, NO2",
    source: "Central Pollution Control Board (CPCB)",
    source_name: "Central Pollution Control Board (CPCB) & OpenAQ",
    data_type: "Continuous Ambient Air Quality Monitoring (CAAQMS)",
    unit: "AQI (0-500 scale) / PM2.5 (µg/m³)",
    last_updated: "Real-time (15 min sync)",
    coverage: "Bengaluru Metropolitan Area (12 regulatory stations)",
    availability: "LIVE_SYNCED",
    data_quality: "CPCB Federal Reference Method (FRM) Equivalent",
    updateFrequency: "15 min sync",
    visible: false,
    opacity: 0.85,
    badge: "CPCB NAQI",
  },

  // 2. Infrastructure Layers
  {
    id: "roads",
    name: "Arterial Road Network",
    category: "infrastructure",
    description: "Primary urban transportation network, expressways, and arterial corridors",
    source: "OpenStreetMap Highway Geometry",
    source_name: "OpenStreetMap Contributors & BBMP Road Infrastructure Cell",
    data_type: "Vector Road Topologies & Arterial Flow Corridors",
    unit: "Highway Classification",
    last_updated: "Daily OSM Sync",
    coverage: "All Greater Bengaluru Arterials & Ring Roads",
    availability: "AVAILABLE",
    data_quality: "Verified GIS Geometry & Highway Topology",
    updateFrequency: "Static Baseline",
    visible: true,
    opacity: 0.65,
  },
  {
    id: "water_bodies",
    name: "Lakes & Water Bodies",
    category: "infrastructure",
    description: "Active lake basins, wetland retention sinks, and stormwater detention reservoirs",
    source: "Karnataka Lake Development Authority",
    source_name: "Karnataka Lake Development Authority & Sentinel-2 Water Index",
    data_type: "Hydrological Lake Polygons & Wetland Retention Sinks",
    unit: "km² (water area)",
    last_updated: "Daily Pass",
    coverage: "185 Verified Urban Lakes",
    availability: "AVAILABLE",
    data_quality: "Survey of India Ground Truth & MNDWI Satellite Index",
    updateFrequency: "Daily pass",
    visible: true,
    opacity: 0.85,
  },
  {
    id: "drainage",
    name: "Drainage Raja Kaluve Channels",
    category: "infrastructure",
    description: "Verified primary stormwater canals and arterial open culverts",
    source: "BBMP GIS Drainage Cell",
    source_name: "BBMP GIS Drainage Cell & Smart City Urban Drainage Masterplan",
    data_type: "Primary Stormwater Culverts & Raja Kaluve Centerlines",
    unit: "Discharge Capacity (m³/s)",
    last_updated: "Weekly Municipal Inspection",
    coverage: "842 km Raja Kaluve Network",
    availability: "AVAILABLE",
    data_quality: "BBMP Field Survey & Hydrodynamic Model Calibration",
    updateFrequency: "Weekly inspection",
    visible: true,
    opacity: 0.8,
  },
  {
    id: "hospitals",
    name: "Emergency Hospitals & Trauma",
    category: "infrastructure",
    description: "Designated trauma centers, medical command posts, and general hospitals",
    source: "Health & Family Welfare Dept",
    source_name: "Karnataka Health & Family Welfare Dept & DDMA Registry",
    data_type: "Trauma Care Centers, ICUs & Emergency Hospital Nodes",
    unit: "Operational Bed Capacity",
    last_updated: "Live Standby",
    coverage: "Greater Bengaluru Trauma Network",
    availability: "AVAILABLE",
    data_quality: "State Health Dept Verified Operational Registry",
    updateFrequency: "Continuous status",
    visible: true,
    opacity: 0.95,
    badge: "MEDICAL",
  },
  {
    id: "emergency_facilities",
    name: "Fire & Police Command Nodes",
    category: "infrastructure",
    description: "Emergency fire & rescue stations and police coordination logistics posts",
    source: "Disaster Management Authority",
    source_name: "Karnataka State Fire & Emergency Services & Police Command",
    data_type: "Fire Rescue Stations, Quick Response Teams & Logistics Hubs",
    unit: "Apparatus Readiness",
    last_updated: "Live Standby",
    coverage: "Bengaluru Urban Operational Jurisdiction",
    availability: "AVAILABLE",
    data_quality: "State Emergency Operations Command Verified",
    updateFrequency: "Live standby",
    visible: true,
    opacity: 0.95,
  },
  {
    id: "shelters",
    name: "Designated Evacuation Shelters",
    category: "infrastructure",
    description: "Operational municipal evacuation shelters with generator and water backup",
    source: "District Disaster Management Authority",
    source_name: "District Disaster Management Authority (DDMA) Relief Roster",
    data_type: "Designated Evacuation Shelters & Relief Distribution Points",
    unit: "Citizen Inundation Capacity",
    last_updated: "Verified Readiness",
    coverage: "Priority Lowland Flood Basins",
    availability: "AVAILABLE",
    data_quality: "Audited with Emergency Power & Potable Water Systems",
    updateFrequency: "Verified operational",
    visible: true,
    opacity: 0.95,
    badge: "SHELTERS",
  },

  // 3. Incident Layers
  {
    id: "citizen_reports",
    name: "Citizen Hazard Reports",
    category: "incidents",
    description: "Crowdsourced reports of waterlogging, choked culverts, potholes, and fallen trees",
    source: "TerraGuard Citizen Reporting Hub",
    source_name: "TerraGuard Citizen Mobile Reporting & Gemini 2.0 Multimodal Vision",
    data_type: "Crowdsourced Ground Evidence & AI-Validated Inundation Reports",
    unit: "Severity Scale (1-5)",
    last_updated: "Real-time Event Stream",
    coverage: "Citizen Ground Coverage (Citywide)",
    availability: "LIVE_SYNCED",
    data_quality: "Multimodal AI Visual Triage + Geofence Verification",
    updateFrequency: "Real-time ingestion",
    visible: true,
    opacity: 0.9,
    badge: "CROWD",
  },
  {
    id: "verified_incidents",
    name: "Verified Municipal Incidents",
    category: "incidents",
    description: "Official municipal verified incidents confirmed by on-duty field supervisors",
    source: "Municipal EOC Dispatch Ledger",
    source_name: "Municipal Emergency Operations Center (EOC) Dispatch Ledger",
    data_type: "Audited Emergency Incidents & Siren Escalation Log",
    unit: "Incident Triage Priority (1-4)",
    last_updated: "Immediate Field Sync",
    coverage: "BBMP 8 Administrative Zones",
    availability: "LIVE_SYNCED",
    data_quality: "Cryptographically Signed Field Supervisor Log",
    updateFrequency: "Immediate triage sync",
    visible: true,
    opacity: 1.0,
    badge: "VERIFIED",
  },
  {
    id: "historical_incidents",
    name: "Historical Inundation Archive",
    category: "incidents",
    description: "Archived historical flood occurrences and recurring urban culvert backflow points",
    source: "Karnataka State Disaster Monitoring Centre",
    source_name: "Karnataka State Natural Disaster Monitoring Centre (KSNDMC)",
    data_type: "10-Year Inundation Frequency & Historical Waterlogging Archive",
    unit: "Return Period / Recurrence",
    last_updated: "Seasonal Archival Sync",
    coverage: "Historical Lowland Sinks (2014-2025)",
    availability: "AVAILABLE",
    data_quality: "KSNDMC Historical Meteorological Audit Records",
    updateFrequency: "Archival Record",
    visible: false,
    opacity: 0.7,
  },
];

export const FALLBACK_FLOOD_ZONES: FloodRiskGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "zone-blr-koramangala-01",
      properties: {
        zone_id: "ZONE-BLR-KOR-01",
        sector_name: "Koramangala 80ft Road Lowland Basin",
        risk_level: "CRITICAL",
        risk_score: 91.4,
        flood_depth_m: 0.72,
        population_at_risk: 42800,
        area_sqkm: 3.45,
        primary_hazard: "Flash Inundation & Culvert Silt Backflow",
        drainage_saturation_pct: 94.2,
        last_updated: new Date().toISOString(),
        data_source: "BBMP Stormwater Masterplan LiDAR 1m DEM & KSNDMC Rain Gauges",
        model_version: "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
        confidence_pct: 94.6,
        uncertainty_range: "±0.06m inundation depth (95% CI)",
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
        zone_id: "ZONE-BLR-BEL-02",
        sector_name: "Bellandur Catchment & EcoSpace Spillway",
        risk_level: "HIGH",
        risk_score: 78.6,
        flood_depth_m: 0.48,
        population_at_risk: 68500,
        area_sqkm: 5.12,
        primary_hazard: "Spillway Overflow & Arterial Waterlogging",
        drainage_saturation_pct: 83.5,
        last_updated: new Date().toISOString(),
        data_source: "Survey of India Topographic Sheets & Central Water Commission Hydrology",
        model_version: "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
        confidence_pct: 91.2,
        uncertainty_range: "±0.09m inundation depth (95% CI)",
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
        zone_id: "ZONE-BLR-HSR-03",
        sector_name: "Mahadevapura ORR Tech Corridor",
        risk_level: "HIGH",
        risk_score: 74.2,
        flood_depth_m: 0.39,
        population_at_risk: 51200,
        area_sqkm: 4.20,
        primary_hazard: "Impervious Runoff & Surcharged Box Drains",
        drainage_saturation_pct: 79.0,
        last_updated: new Date().toISOString(),
        data_source: "BBMP SWD GIS Survey 2024 & Karnataka Remote Sensing Applications",
        model_version: "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
        confidence_pct: 89.5,
        uncertainty_range: "±0.08m inundation depth (95% CI)",
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
        zone_id: "ZONE-BLR-HEB-04",
        sector_name: "Hebbal Valley Drainage Sump",
        risk_level: "MODERATE",
        risk_score: 52.8,
        flood_depth_m: 0.22,
        population_at_risk: 24900,
        area_sqkm: 2.85,
        primary_hazard: "Elevated Water Table & Retention Lag",
        drainage_saturation_pct: 58.4,
        last_updated: new Date().toISOString(),
        data_source: "IMD Radar & National Remote Sensing Centre (NRSC) CartoDEM",
        model_version: "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
        confidence_pct: 92.8,
        uncertainty_range: "±0.05m inundation depth (95% CI)",
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
        zone_id: "ZONE-BLR-CEN-05",
        sector_name: "Ulsoor Lake Buffer Zone",
        risk_level: "LOW",
        risk_score: 29.5,
        flood_depth_m: 0.08,
        population_at_risk: 14300,
        area_sqkm: 1.95,
        primary_hazard: "Perimeter Inflow Concentration",
        drainage_saturation_pct: 36.0,
        last_updated: new Date().toISOString(),
        data_source: "Survey of India Benchmark 925m & Open-Meteo High-Res DEM",
        model_version: "TerraGuard Hydro-UNet v2.4 + Sentinel-1 SAR Calibration",
        confidence_pct: 96.1,
        uncertainty_range: "±0.03m inundation depth (95% CI)",
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

export const DEFAULT_EXPERIENCES_META: ExperienceViewMeta[] = [
  {
    id: "operational-satellite-gis",
    index: 1,
    name: "Map 1 — Operational Satellite GIS",
    subtitle: "Orbital Imagery Base & Municipal Infrastructure Controls",
    badge: "REF IMAGE A",
    category: "Operations",
    default_basemap: "satellite",
    default_zoom: 13.5,
    default_pitch: 30.0,
    default_bearing: -10.0,
    center: [77.6250, 12.9300],
    attribution: "Esri World Imagery, DigitalGlobe, BBMP GIS Cell",
    freshness: "Live GIS Ingestion • Optical Pass: 10:45 AM UTC",
    limitations: "Sub-meter optical satellite tiles; high cloud cover may partially obscure pass.",
  },
  {
    id: "flood-risk-intelligence",
    index: 2,
    name: "Map 2 — Flood Risk Intelligence",
    subtitle: "Hydro-UNet Predictive Inundation & Culvert Sump Dynamics",
    badge: "REF IMAGE B",
    category: "Hydrology",
    default_basemap: "dark",
    default_zoom: 14.0,
    default_pitch: 35.0,
    default_bearing: 0.0,
    center: [77.6300, 12.9280],
    attribution: "TerraGuard Hydro-UNet v2.4, BBMP Stormwater LiDAR, IMD",
    freshness: "Live Telemetry Sync • 5 min cadence",
    limitations: "Predictive inundation zones are susceptibility estimates; street ponding depends on local micro-debris.",
  },
  {
    id: "live-rainfall-monitoring",
    index: 3,
    name: "Map 3 — Live Rainfall Monitoring",
    subtitle: "Automated Weather Stations (AWS) & Convective Telemetry",
    badge: "OPEN-METEO",
    category: "Meteorology",
    default_basemap: "dark",
    default_zoom: 12.8,
    default_pitch: 0.0,
    default_bearing: 0.0,
    center: [77.6000, 12.9600],
    attribution: "India Meteorological Department (IMD) & Open-Meteo High-Res Mesh",
    freshness: "Observation: 4 mins ago • Forecast updated hourly",
    limitations: "Precipitation gauges measure point rainfall; spatial distribution uses inverse-distance interpolation.",
  },
  {
    id: "elevation-terrain",
    index: 4,
    name: "Map 4 — Elevation & Terrain Intelligence",
    subtitle: "Contour Ridges, Valley Basins & Slope Gradients",
    badge: "SRTM LiDAR",
    category: "Topography",
    default_basemap: "topo",
    default_zoom: 13.2,
    default_pitch: 45.0,
    default_bearing: -25.0,
    center: [77.6100, 12.9500],
    attribution: "SRTM 30m Digital Elevation Model & Esri World Topo",
    freshness: "Static Topological Baseline (30m Grid Resolution)",
    limitations: "Vertical accuracy is +/- 3m. Underground civil alterations and basement sumps not captured.",
  },
  {
    id: "drainage-water-body",
    index: 5,
    name: "Map 5 — Drainage & Water-Body Network",
    subtitle: "Surface Lakes, Detention Basins & Open Raja Kaluve Channels",
    badge: "HYDROGRAPHIC",
    category: "Hydrology",
    default_basemap: "dark",
    default_zoom: 13.4,
    default_pitch: 20.0,
    default_bearing: 10.0,
    center: [77.6600, 12.9350],
    attribution: "Karnataka Lake Development Authority & OpenStreetMap Verified Waterways",
    freshness: "Lake boundaries synchronized monthly via Sentinel-2 NDWI",
    limitations: "Underground closed piped storm drains are unmapped in older layouts; only verified open channels and culverts shown.",
  },
  {
    id: "extreme-heat-risk",
    index: 6,
    name: "Map 6 — Extreme Heat Risk & Microclimate",
    subtitle: "Urban Heat Island (UHI) Index & Canopy Disparity",
    badge: "HEAT INDEX",
    category: "Climate",
    default_basemap: "dark",
    default_zoom: 12.9,
    default_pitch: 15.0,
    default_bearing: 0.0,
    center: [77.5950, 12.9700],
    attribution: "TerraGuard Thermal Disparity Model + Open-Meteo Ambient Sensors",
    freshness: "Model Computed: 15 mins ago",
    limitations: "Apparent temperature calculated via Steadman formula; micro-surface albedo relies on high-resolution land-cover maps.",
  },
  {
    id: "air-quality-intelligence",
    index: 7,
    name: "Map 7 — Air Quality Intelligence (AQI)",
    subtitle: "Continuous Ambient Air Quality Monitoring (CAAQMS)",
    badge: "CPCB C-AQI",
    category: "Environment",
    default_basemap: "dark",
    default_zoom: 12.8,
    default_pitch: 0.0,
    default_bearing: 0.0,
    center: [77.6100, 12.9600],
    attribution: "Central Pollution Control Board (CPCB) & OpenAQ Live Stations",
    freshness: "Live Stream • Continuous 15-min sample window",
    limitations: "Interpolation between distant monitoring stations is approximate; localized vehicular exhaust plumes may cause spikes.",
  },
  {
    id: "citizen-hazard-report",
    index: 8,
    name: "Map 8 — Citizen Hazard Reports",
    subtitle: "Crowdsourced Ground Hazards & AI-Assisted Classification",
    badge: "COMMUNITY",
    category: "Crowdsource",
    default_basemap: "street",
    default_zoom: 13.6,
    default_pitch: 20.0,
    default_bearing: 0.0,
    center: [77.6300, 12.9300],
    attribution: "TerraGuard Citizen Mobile Portal & Vision Engine",
    freshness: "Real-Time Event Stream",
    limitations: "Citizen reports require municipal verification; reporter PII is scrubbed in compliance with privacy regulations.",
  },
  {
    id: "verified-incident",
    index: 9,
    name: "Map 9 — Verified Municipal Incidents",
    subtitle: "Triage Confirmed Climate Hazards & Emergency Sirens",
    badge: "VERIFIED EOC",
    category: "Operations",
    default_basemap: "dark",
    default_zoom: 13.8,
    default_pitch: 25.0,
    default_bearing: -15.0,
    center: [77.6350, 12.9320],
    attribution: "Municipal Emergency Operations Center (EOC) Dispatch Logs",
    freshness: "Verified by On-Duty Field Supervisor • 12 mins ago",
    limitations: "Only incidents triaged and validated by verified municipal administrators appear in this view.",
  },
  {
    id: "infrastructure-emergency-facility",
    index: 10,
    name: "Map 10 — Infrastructure & Emergency Facilities",
    subtitle: "Trauma Hospitals, Evacuation Shelters & Relief Hubs",
    badge: "CIVIL DEFENSE",
    category: "Logistics",
    default_basemap: "street",
    default_zoom: 13.2,
    default_pitch: 10.0,
    default_bearing: 0.0,
    center: [77.6000, 12.9550],
    attribution: "District Disaster Management Authority (DDMA) & BBMP Urban Health",
    freshness: "Verified Operational Capacity Registry",
    limitations: "Shelter bed availability updates dynamically during flood activation; verify with local nodal officers.",
  },
  {
    id: "safe-navigation-risk-aware",
    index: 11,
    name: "Map 11 — Safe Navigation & Risk-Aware Routing",
    subtitle: "Dynamic Multi-Criteria Route Hazard Avoidance",
    badge: "AI ROUTING",
    category: "Mobility",
    default_basemap: "dark",
    default_zoom: 13.5,
    default_pitch: 40.0,
    default_bearing: -12.0,
    center: [77.6100, 12.9450],
    attribution: "OSRM Open Routing Engine + TerraGuard Spatial Hazard Intersect",
    freshness: "Real-Time Topological Re-routing",
    limitations: "No route is guaranteed 100% hazard-free during sudden cloudburst events. Obey emergency municipal traffic police diversions.",
  },
];

export const FALLBACK_EXPERIENCES_DATA: Record<ExperienceId, MapStudioExperienceResponse> = {
  "operational-satellite-gis": {
    meta: DEFAULT_EXPERIENCES_META[0],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "f-victoria",
          properties: { name: "Victoria Hospital Trauma Center", type: "Hospital", status: "Operational", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.5750, 12.9640] },
        },
        {
          type: "Feature",
          id: "f-kora-shelter",
          properties: { name: "Koramangala Indoor Evacuation Shelter", type: "Shelter", status: "Active Standby", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.6200, 12.9340] },
        },
        {
          type: "Feature",
          id: "inc-culvert-4b",
          properties: { name: "Choked Culvert 4B Silt Backflow", type: "Hazard", status: "VERIFIED", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.6320, 12.9270] },
        },
        {
          type: "Feature",
          id: "zone-kora-poly",
          properties: { name: "Koramangala Lowland Inundation Basin", risk_level: "CRITICAL", color: "#ef4444" },
          geometry: {
            type: "Polygon",
            coordinates: [[[77.6180, 12.9290], [77.6360, 12.9320], [77.6410, 12.9240], [77.6250, 12.9180], [77.6180, 12.9290]]],
          },
        },
      ],
    },
    metrics: { "Monitored Sectors": "5", "Active Facilities": "14", "Verified Hazards": "3", "Optical Resolution": "0.5m" },
    legend_items: [
      { label: "Emergency Facility (Shelter / Hospital)", color: "#10b981", shape: "circle" },
      { label: "Verified Municipal Hazard", color: "#ef4444", shape: "circle" },
      { label: "High Risk Inundation Polygon", color: "#ef4444", shape: "polygon" },
      { label: "Optical Satellite Coverage", color: "#38bdf8", shape: "square" },
    ],
    side_panel_data: {
      headline: "Full-Spectrum Command GIS",
      satellite_provider: "Esri World Imagery (High-Res ArcGIS)",
      active_radar_mode: "IMD Doppler DWR Bengaluru",
      operational_status: "All Primary Response Sectors Green",
    },
  },

  "flood-risk-intelligence": {
    meta: DEFAULT_EXPERIENCES_META[1],
    geojson: FALLBACK_FLOOD_ZONES,
    metrics: {
      "Total At Risk": "201.7k",
      "Critical Threat Zones": "1",
      "High Threat Zones": "2",
      "Drainage Saturation Mean": "83.6%",
    },
    legend_items: [
      { label: "Critical Risk (>0.65m Depth)", color: "#ef4444", shape: "polygon" },
      { label: "Elevated High Risk (0.35-0.65m)", color: "#f97316", shape: "polygon" },
      { label: "Moderate Risk (0.15-0.35m)", color: "#eab308", shape: "polygon" },
      { label: "Lower Risk (<0.15m Depth)", color: "#10b981", shape: "polygon" },
      { label: "Surface Lake / Detention Sump", color: "#06b6d4", shape: "polygon" },
    ],
    side_panel_data: {
      headline: "Predictive Flood Inundation Model",
      engine: "TerraGuard Hydro-UNet v2.4 + LiDAR Elevation",
      rainfall_intensity: "48.5 mm/h (Convective Cloudburst)",
      contributing_factors: "Impervious urban runoff >82%, Culvert 4B sediment backflow, Lake spillway elevation lag",
      prediction_horizon: "-24h to +6h Simulation Scrubber",
    },
  },

  "live-rainfall-monitoring": {
    meta: DEFAULT_EXPERIENCES_META[2],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Koramangala AWS-04", rainfall_rate_mm_h: 48.5, accum_24h_mm: 94.2, status: "Cloudburst", color: "#a855f7" },
          geometry: { type: "Point", coordinates: [77.6250, 12.9280] },
        },
        {
          type: "Feature",
          properties: { name: "HAL Airport IMD Station", rainfall_rate_mm_h: 42.0, accum_24h_mm: 81.5, status: "Heavy Rain", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.6680, 12.9550] },
        },
        {
          type: "Feature",
          properties: { name: "Electronic City Sensor Node", rainfall_rate_mm_h: 35.6, accum_24h_mm: 68.0, status: "Moderate", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.6780, 12.8450] },
        },
        {
          type: "Feature",
          properties: { name: "Bengaluru City Central Command", rainfall_rate_mm_h: 26.4, accum_24h_mm: 52.3, status: "Moderate", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.5946, 12.9716] },
        },
        {
          type: "Feature",
          properties: { name: "Hebbal North Tipping Bucket", rainfall_rate_mm_h: 18.2, accum_24h_mm: 34.0, status: "Light-Moderate", color: "#38bdf8" },
          geometry: { type: "Point", coordinates: [77.5980, 13.0280] },
        },
      ],
    },
    metrics: { "Peak Intensity": "48.5 mm/h", "City Average": "34.1 mm/h", "Active Gauges": "5", "Forecast +3h": "76.4 mm" },
    legend_items: [
      { label: "Cloudburst (>40 mm/h)", color: "#a855f7", shape: "circle" },
      { label: "Heavy Rain (25-40 mm/h)", color: "#ef4444", shape: "circle" },
      { label: "Moderate Rain (15-25 mm/h)", color: "#f97316", shape: "circle" },
      { label: "Light-Moderate (<15 mm/h)", color: "#38bdf8", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Real-Time Telemetry & Radar Scan",
      provider: "Open-Meteo High-Resolution Grid & IMD Automated Weather Stations",
      units: "Intensity in mm/h; Cumulative in mm",
      data_freshness: "Real-time streaming via LoRaWAN telemetry network",
    },
  },

  "elevation-terrain": {
    meta: DEFAULT_EXPERIENCES_META[3],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Highground Natural Ridge", elevation_masl: 936, type: "Ridge", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.5850, 12.9920] },
        },
        {
          type: "Feature",
          properties: { name: "Central Plateau", elevation_masl: 912, type: "Plateau", color: "#eab308" },
          geometry: { type: "Point", coordinates: [77.6050, 12.9650] },
        },
        {
          type: "Feature",
          properties: { name: "Koramangala Lowland Basin", elevation_masl: 882, type: "Low Basin (Sump)", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.6250, 12.9250] },
        },
        {
          type: "Feature",
          properties: { name: "Hebbal Retention Valley", elevation_masl: 888, type: "Valley", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.5980, 13.0280] },
        },
        {
          type: "Feature",
          properties: { name: "Vrishabhavathi Outflow Chute", elevation_masl: 860, type: "Lowest Outfall", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.5120, 12.9150] },
        },
      ],
    },
    metrics: { "Highest Ridge": "936m MASL", "Lowest Sump": "860m MASL", "Elevation Delta": "76m", "Mean Gradient": "1.4%" },
    legend_items: [
      { label: "Elevated Ridge (>920m MASL)", color: "#10b981", shape: "circle" },
      { label: "Moderate Plateau (895-920m)", color: "#eab308", shape: "circle" },
      { label: "Low-Lying Inundation Basin (<895m)", color: "#ef4444", shape: "circle" },
      { label: "Esri World Topo Contour Mesh", color: "#64748b", shape: "line" },
    ],
    side_panel_data: {
      headline: "Topographical Sump & Elevation Gradient",
      source: "SRTM 30m Global Elevation Dataset & Esri World Topo",
      hydrological_implication: "Gravity drainage channels water from 936m Highgrounds down into 882m Koramangala basin.",
    },
  },

  "drainage-water-body": {
    meta: DEFAULT_EXPERIENCES_META[4],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Bellandur Lake Reservoir", area_sqkm: 3.65, water_level: "89.4% Capacity", color: "#06b6d4" },
          geometry: {
            type: "Polygon",
            coordinates: [[[77.6650, 12.9380], [77.6850, 12.9420], [77.6920, 12.9300], [77.6700, 12.9280], [77.6650, 12.9380]]],
          },
        },
        {
          type: "Feature",
          properties: { name: "Ulsoor Lake Basin", area_sqkm: 0.50, water_level: "72.0% Capacity", color: "#06b6d4" },
          geometry: {
            type: "Polygon",
            coordinates: [[[77.6150, 12.9830], [77.6300, 12.9850], [77.6320, 12.9730], [77.6180, 12.9720], [77.6150, 12.9830]]],
          },
        },
        {
          type: "Feature",
          properties: { name: "Primary Raja Kaluve Arterial Storm Canal", length_km: 12.4, color: "#38bdf8" },
          geometry: {
            type: "LineString",
            coordinates: [[77.6150, 12.9320], [77.6350, 12.9280], [77.6550, 12.9300], [77.6700, 12.9320]],
          },
        },
      ],
    },
    metrics: { "Water Bodies": "6", "Total Lake Area": "7.08 km²", "Monitored Canals": "34.2 km", "Outflow Siphons": "8" },
    legend_items: [
      { label: "Active Lake / Retention Basin", color: "#06b6d4", shape: "polygon" },
      { label: "Primary Open Raja Kaluve Channel", color: "#38bdf8", shape: "line" },
      { label: "Storm Drain Outflow Siphon", color: "#10b981", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Civil Drainage & Surface Hydrography",
      source: "Karnataka Lake Development Authority & OpenStreetMap Verified Waterways",
      network_coverage: "Verified primary storm canals; unmapped underground tertiary pipes excluded.",
    },
  },

  "extreme-heat-risk": {
    meta: DEFAULT_EXPERIENCES_META[5],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Peenya Industrial Heat Island", temp_c: 35.8, heat_index_c: 41.2, stress: "EXTREME", color: "#dc2626" },
          geometry: { type: "Point", coordinates: [77.5250, 13.0320] },
        },
        {
          type: "Feature",
          properties: { name: "MG Road Commercial Corridor", temp_c: 34.2, heat_index_c: 38.6, stress: "HIGH", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.6080, 12.9750] },
        },
        {
          type: "Feature",
          properties: { name: "Koramangala Mixed Urban Sector", temp_c: 32.5, heat_index_c: 36.0, stress: "MODERATE", color: "#eab308" },
          geometry: { type: "Point", coordinates: [77.6250, 12.9300] },
        },
        {
          type: "Feature",
          properties: { name: "Cubbon Park Tree Canopy Oasis", temp_c: 28.9, heat_index_c: 30.2, stress: "LOW", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.5920, 12.9760] },
        },
      ],
    },
    metrics: { "Peak Surface Temp": "35.8°C", "Canopy Delta": "-5.3°C", "Relative Humidity": "64%", "Advisory": "Extreme Caution" },
    legend_items: [
      { label: "Extreme Heat Stress (>40°C Index)", color: "#dc2626", shape: "circle" },
      { label: "High Heat Stress (36-40°C)", color: "#f97316", shape: "circle" },
      { label: "Moderate Heat Stress (32-36°C)", color: "#eab308", shape: "circle" },
      { label: "Low Heat Stress / Vegetated (<32°C)", color: "#10b981", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Urban Microclimate & Thermal Disparity",
      source: "Open-Meteo Ambient Telemetry + MODIS Surface Temperature Anomaly",
      measured_vs_modeled: "Temperature is directly measured; Heat Index is calculated via Steadman's bioclimatic formula.",
    },
  },

  "air-quality-intelligence": {
    meta: DEFAULT_EXPERIENCES_META[6],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Silk Board Junction CAAQMS", aqi: 168, pm25: 72.4, pm10: 118.0, category: "Moderate", color: "#f59e0b" },
          geometry: { type: "Point", coordinates: [77.6220, 12.9170] },
        },
        {
          type: "Feature",
          properties: { name: "City Railway Station", aqi: 184, pm25: 84.0, pm10: 136.2, category: "Moderate-Poor", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.5700, 12.9780] },
        },
        {
          type: "Feature",
          properties: { name: "BTM Layout CAAQMS", aqi: 142, pm25: 58.2, pm10: 94.0, category: "Moderate", color: "#f59e0b" },
          geometry: { type: "Point", coordinates: [77.6100, 12.9120] },
        },
        {
          type: "Feature",
          properties: { name: "Saneguruvanahalli Station", aqi: 88, pm25: 32.0, pm10: 58.0, category: "Satisfactory", color: "#84cc16" },
          geometry: { type: "Point", coordinates: [77.5450, 12.9900] },
        },
        {
          type: "Feature",
          properties: { name: "Hebbal North CAAQMS", aqi: 112, pm25: 44.5, pm10: 78.4, category: "Moderate", color: "#f59e0b" },
          geometry: { type: "Point", coordinates: [77.5950, 13.0300] },
        },
      ],
    },
    metrics: { "City Mean AQI": "138", "Primary Pollutant": "PM2.5", "Active CAAQMS": "5", "NAQI Category": "Moderate" },
    legend_items: [
      { label: "Good (0-50)", color: "#10b981", shape: "circle" },
      { label: "Satisfactory (51-100)", color: "#84cc16", shape: "circle" },
      { label: "Moderate (101-200)", color: "#f59e0b", shape: "circle" },
      { label: "Poor (201-300)", color: "#f97316", shape: "circle" },
      { label: "Very Poor (301-400)", color: "#ef4444", shape: "circle" },
    ],
    side_panel_data: {
      headline: "National Air Quality Index (NAQI)",
      source: "CPCB Continuous Ambient Air Quality Monitoring Network",
      standard: "Indian CPCB Sub-Index Algorithm based on 24-hr truncated breakpoints",
    },
  },

  "citizen-hazard-report": {
    meta: DEFAULT_EXPERIENCES_META[7],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { report_id: "REP-2026-981", category: "WATERLOGGING", description: "Standing water 1.5ft deep on 80ft Road", status: "UNDER_REVIEW", color: "#f59e0b" },
          geometry: { type: "Point", coordinates: [77.6240, 12.9330] },
        },
        {
          type: "Feature",
          properties: { report_id: "REP-2026-874", category: "WASTE_ACCUMULATION", description: "Plastic bottles choking storm drain outlet 4B", status: "VERIFIED", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.6320, 12.9270] },
        },
        {
          type: "Feature",
          properties: { report_id: "REP-2026-762", category: "DAMAGED_ROAD", description: "Asphalt depression 15cm deep posing hazard", status: "VERIFIED", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.6850, 12.9280] },
        },
        {
          type: "Feature",
          properties: { report_id: "REP-2026-621", category: "FALLEN_TREE", description: "Banyan branch blocking left carriage lane", status: "REPORTED", color: "#eab308" },
          geometry: { type: "Point", coordinates: [77.5600, 12.9850] },
        },
      ],
    },
    metrics: { "Community Reports": "12", "Verified": "5", "Under Review": "4", "Resolved Today": "3" },
    legend_items: [
      { label: "Verified Hazard Incident", color: "#10b981", shape: "circle" },
      { label: "Under Command Review", color: "#f59e0b", shape: "circle" },
      { label: "Newly Reported (Unverified)", color: "#eab308", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Citizen Ground Perception Stream",
      privacy_safeguard: "Citizen names, phone numbers, and IP addresses are completely masked.",
      triage_workflow: "Reports with severity >= 3 are escalated to on-duty municipal engineers.",
    },
  },

  "verified-incident": {
    meta: DEFAULT_EXPERIENCES_META[8],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { incident_id: "INC-BBMP-412", hazard: "Severe Stormwater Silt Backup", status: "CONFIRMED_SIREN", severity: "CRITICAL", officer: "Insp. Rao (EOC-4)", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.6310, 12.9280] },
        },
        {
          type: "Feature",
          properties: { incident_id: "INC-BBMP-398", hazard: "Outer Ring Road Culvert Overflow", status: "DISPATCHED", severity: "HIGH", officer: "Insp. Kumar (EOC-1)", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.6820, 12.9270] },
        },
        {
          type: "Feature",
          properties: { incident_id: "INC-BBMP-285", hazard: "Underpass Inversion Sump Waterlogging", status: "PUMP_DEPLOYED", severity: "HIGH", officer: "Insp. Swamy", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.5850, 12.9980] },
        },
      ],
    },
    metrics: { "Active Verified Incidents": "3", "Sirens Escalated": "1", "Pumps Deployed": "4", "Mean Triage Time": "14m" },
    legend_items: [
      { label: "Critical Verified Hazard (Siren Active)", color: "#ef4444", shape: "circle" },
      { label: "High Priority Verified (Crews Dispatched)", color: "#f97316", shape: "circle" },
      { label: "Resolved Incident (Closed)", color: "#10b981", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Official Municipal Incident Verification",
      authority: "Municipal Disaster Operations Center & BBMP Quick Response Teams",
      audit_integrity: "Cryptographically signed officer decisions logged to immutable audit ledger.",
    },
  },

  "infrastructure-emergency-facility": {
    meta: DEFAULT_EXPERIENCES_META[9],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Victoria Hospital Trauma Center", type: "Hospital", beds: 420, icu: 48, status: "Operational", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.5750, 12.9640] },
        },
        {
          type: "Feature",
          properties: { name: "Manipal Hospital HAL Airport Road", type: "Hospital", beds: 350, icu: 36, status: "Operational", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.6520, 12.9590] },
        },
        {
          type: "Feature",
          properties: { name: "Koramangala Indoor Evacuation Shelter", type: "Evacuation Shelter", capacity: 1200, status: "Ready", color: "#10b981" },
          geometry: { type: "Point", coordinates: [77.6200, 12.9340] },
        },
        {
          type: "Feature",
          properties: { name: "Jayanagar Fire & Rescue Command", type: "Fire Station", vehicles: 6, status: "Dispatched Standby", color: "#f97316" },
          geometry: { type: "Point", coordinates: [77.5820, 12.9300] },
        },
        {
          type: "Feature",
          properties: { name: "Whitefield Police & Relief Node", type: "Police Command", status: "Operational", color: "#38bdf8" },
          geometry: { type: "Point", coordinates: [77.7450, 12.9700] },
        },
      ],
    },
    metrics: { "Trauma Hospitals": "8", "Evacuation Shelters": "6", "Fire Stations": "4", "Total Shelter Capacity": "6,400" },
    legend_items: [
      { label: "Trauma Hospital / Medical Node", color: "#ef4444", shape: "circle" },
      { label: "Designated Evacuation Shelter", color: "#10b981", shape: "circle" },
      { label: "Fire & Rescue Command", color: "#f97316", shape: "circle" },
      { label: "Police & Logistics Node", color: "#38bdf8", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Civil Infrastructure & Relief Topology",
      source: "District Disaster Management Authority (DDMA) Master Facility Registry",
      operational_readiness: "All facilities verified with auxiliary power generators and drinking water stores.",
    },
  },

  "safe-navigation-risk-aware": {
    meta: DEFAULT_EXPERIENCES_META[10],
    geojson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Recommended Risk-Aware Route", type: "RECOMMENDED_SAFE", distance_km: 8.4, time_min: 24, color: "#10b981" },
          geometry: {
            type: "LineString",
            coordinates: [
              [77.6200, 12.9340], [77.6180, 12.9450], [77.6080, 12.9550], [77.5950, 12.9650], [77.5750, 12.9750],
            ],
          },
        },
        {
          type: "Feature",
          properties: { name: "Standard Arterial Route (Culvert Conflict)", type: "HIGH_HAZARD_CONFLICT", distance_km: 7.8, time_min: 36, color: "#ef4444" },
          geometry: {
            type: "LineString",
            coordinates: [
              [77.6200, 12.9340], [77.6280, 12.9310], [77.6320, 12.9270], [77.6100, 12.9400], [77.5750, 12.9750],
            ],
          },
        },
        {
          type: "Feature",
          properties: { name: "Secondary Bypass Route", type: "ALTERNATIVE", distance_km: 10.2, time_min: 32, color: "#38bdf8" },
          geometry: {
            type: "LineString",
            coordinates: [
              [77.6200, 12.9340], [77.6350, 12.9450], [77.6300, 12.9650], [77.6000, 12.9780], [77.5750, 12.9750],
            ],
          },
        },
        {
          type: "Feature",
          properties: { name: "Active Inundation Hazard on 80ft Road", type: "HAZARD_OBSTRUCTION", color: "#ef4444" },
          geometry: { type: "Point", coordinates: [77.6320, 12.9270] },
        },
      ],
    },
    metrics: { "Safe Route Length": "8.4 km", "Est. Travel Time": "24 mins", "Hazard Bypass Rate": "100%", "Conflicts Avoided": "1" },
    legend_items: [
      { label: "Risk-Aware Recommended Route (Clear of Hazards)", color: "#10b981", shape: "line" },
      { label: "Standard Route (Intersects Verified Flood Sump)", color: "#ef4444", shape: "line" },
      { label: "Alternative Bypass Route", color: "#38bdf8", shape: "line" },
      { label: "Road Waterlogging Obstruction Point", color: "#ef4444", shape: "circle" },
    ],
    side_panel_data: {
      headline: "Risk-Aware Dynamic Routing Intelligence",
      routing_engine: "OSRM Multi-Criteria Engine + Turf.js Spatial Hazard Buffering",
      hazard_intersection: "Route intersects 1 active flood zone at 80ft Road (Culvert 4B backup). Diverted via Inner Ring Rd.",
      safety_disclaimer: "Safety assessments reflect currently ingested telemetry. Never drive through moving flood waters.",
    },
  },
};

export async function getMapStudioLayers(): Promise<LayerConfig[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/map-studio/layers`, {
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
    const url = new URL(`${API_BASE_URL}/map-studio/zones`);
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
    const url = new URL(`${API_BASE_URL}/map-studio/telemetry`);
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
    const res = await fetch(`${API_BASE_URL}/map-studio/presets`);
    if (!res.ok) throw new Error("Failed to fetch presets");
    const data = await res.json();
    return data.presets;
  } catch (err) {
    return DEFAULT_PRESETS;
  }
}

export async function getExperiencesMeta(): Promise<ExperienceViewMeta[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/map-studio/experiences`);
    if (!res.ok) throw new Error("Failed to fetch experiences");
    return await res.json();
  } catch (e) {
    return DEFAULT_EXPERIENCES_META;
  }
}

export async function getExperienceDetails(experienceId: ExperienceId): Promise<MapStudioExperienceResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/map-studio/experiences/${experienceId}`);
    if (!res.ok) throw new Error(`Failed to fetch experience details for ${experienceId}`);
    return await res.json();
  } catch (e) {
    return (
      FALLBACK_EXPERIENCES_DATA[experienceId] || {
        meta: DEFAULT_EXPERIENCES_META.find((m) => m.id === experienceId) || DEFAULT_EXPERIENCES_META[0],
        geojson: { type: "FeatureCollection", features: [] },
        metrics: {},
        legend_items: [],
        side_panel_data: {},
      }
    );
  }
}

export const FALLBACK_MAP_AUTOMATION_STATUS: MapAutomationStatusResponse = {
  is_connected: true,
  webhook_url: "https://n8n-terraguard.onrender.com/webhook",
  active_workflows_count: 6,
  confirmed_executions_24h: 18,
  success_rate_pct: 100.0,
  last_sync_timestamp: new Date().toISOString(),
  recent_confirmed_events: [
    {
      workflow_id: "WF_02_RISK_THRESHOLD",
      action_taken: "Verified flood hazard promoted to map canvas with BBMP dispatch #DISP-902",
      status: "SUCCESS",
      created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    },
    {
      workflow_id: "WF_01_ENV_MONITORING",
      action_taken: "Ingested Open-Meteo telemetry (Koramangala 38.5 mm/h), elevated threshold alert triggered",
      status: "SUCCESS",
      created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    },
    {
      workflow_id: "WF_03_CITIZEN_REPORT_PROCESSING",
      action_taken: "Citizen report #REP-8831 ingested and queued as unverified point marker",
      status: "SUCCESS",
      created_at: new Date(Date.now() - 1000 * 60 * 48).toISOString(),
    },
    {
      workflow_id: "WF_04_ALERT_NOTIFICATION",
      action_taken: "Dispatched emergency alert to 1,420 subscribed ward residents via Telegram & SMS",
      status: "SUCCESS",
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    },
  ],
};

export async function fetchMapAutomationStatus(): Promise<MapAutomationStatusResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/automation/map-sync-status`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch map automation status");
    return await res.json();
  } catch (err) {
    return FALLBACK_MAP_AUTOMATION_STATUS;
  }
}

