export type BasemapStyle = "satellite" | "dark" | "topo" | "street";

export type StudioViewMode = "operational-gis" | "flood-intelligence";

export interface LayerConfig {
  id: string;
  name: string;
  category: "hazards" | "environmental" | "infrastructure" | "reports" | "sensors";
  description: string;
  source: string;
  updateFrequency: string;
  visible: boolean;
  opacity: number;
  badge?: string;
}

export interface FloodZoneProperties {
  zone_id: string;
  sector_name: string;
  risk_level: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  risk_score: number;
  flood_depth_m: number;
  population_at_risk: number;
  area_sqkm: number;
  primary_hazard: string;
  drainage_saturation_pct: number;
  last_updated: string;
}

export interface FloodRiskFeature {
  type: "Feature";
  id: string;
  properties: FloodZoneProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface FloodRiskGeoJSON {
  type: "FeatureCollection";
  features: FloodRiskFeature[];
  metadata: {
    total_population_at_risk: number;
    critical_zones_count: number;
    high_zones_count: number;
    moderate_zones_count: number;
    low_zones_count: number;
    total_threat_area_sqkm: number;
    mean_precipitation_mm: number;
    engine: string;
    last_computed: string;
  };
}

export interface PrecipitationPoint {
  timestamp: string;
  precipitation_mm: number;
  drainage_capacity_pct: number;
  flood_index: number;
}

export interface SectorTelemetry {
  sector_id: string;
  sector_name: string;
  timestamp: string;
  live_rainfall_rate_mm_h: number;
  drainage_saturation_pct: number;
  total_population_at_risk: number;
  active_alarms_count: number;
  hyetograph_history: PrecipitationPoint[];
  forecast_progression: PrecipitationPoint[];
}

export interface MapPreset {
  id: string;
  name: string;
  subtext: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  risk_level: string;
  key_metrics: {
    [key: string]: string;
  };
}

