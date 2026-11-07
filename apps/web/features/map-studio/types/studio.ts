export type BasemapStyle = "satellite" | "satellite_labels" | "street" | "topo" | "dark";

export type StudioViewMode = "operational-gis" | "flood-intelligence";

export interface LayerConfig {
  id: string;
  name: string;
  category: "environmental" | "infrastructure" | "incidents" | "hazards" | "sensors" | "reports";
  description: string;
  source: string;
  updateFrequency: string;
  visible: boolean;
  opacity: number;
  badge?: string;
  adminOnly?: boolean;

  // Prompt 6: Real Data Provenance & Telemetry Metadata
  source_name?: string;
  data_type?: string;
  unit?: string;
  last_updated?: string;
  coverage?: string;
  availability?: "LIVE_SYNCED" | "AVAILABLE" | "RATE_LIMITED_CACHE" | "UNAVAILABLE";
  data_quality?: string;
  is_unavailable?: boolean;
  unavailable_reason?: string;
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
  data_source?: string;
  model_version?: string;
  confidence_pct?: number;
  uncertainty_range?: string;
  risk_explanation?: any;
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

export type ExperienceId =
  | "operational-satellite-gis"
  | "flood-risk-intelligence"
  | "live-rainfall-monitoring"
  | "elevation-terrain"
  | "drainage-water-body"
  | "extreme-heat-risk"
  | "air-quality-intelligence"
  | "citizen-hazard-report"
  | "verified-incident"
  | "infrastructure-emergency-facility"
  | "safe-navigation-risk-aware";

export interface ExperienceLegendItem {
  label: string;
  color: string;
  description?: string;
  shape?: "circle" | "square" | "line" | "polygon";
}

export interface ExperienceViewMeta {
  id: ExperienceId;
  index: number;
  name: string;
  subtitle: string;
  badge: string;
  category: string;
  default_basemap: BasemapStyle;
  default_zoom: number;
  default_pitch: number;
  default_bearing: number;
  center: [number, number];
  attribution: string;
  freshness: string;
  limitations?: string;
}

export interface MapStudioExperienceResponse {
  meta: ExperienceViewMeta;
  geojson: any;
  metrics: Record<string, any>;
  legend_items: ExperienceLegendItem[];
  side_panel_data: Record<string, any>;
}

export interface MapAutomationConfirmedEvent {
  workflow_id: string;
  action_taken: string;
  status: string;
  created_at: string;
  details?: Record<string, any>;
}

export interface MapAutomationStatusResponse {
  is_connected: boolean;
  webhook_url: string;
  active_workflows_count: number;
  confirmed_executions_24h: number;
  success_rate_pct: number;
  last_sync_timestamp: string | null;
  recent_confirmed_events: MapAutomationConfirmedEvent[];
}



