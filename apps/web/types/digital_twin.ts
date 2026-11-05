export type TimelinePhase =
  | "HISTORICAL"
  | "RECENT_PAST"
  | "CURRENT_LIVE"
  | "PROJECTED_12H"
  | "PROJECTED_24H";

export interface TimelineSlice {
  slice_id: string;
  timestamp: string;
  label: string;
  phase: TimelinePhase;
  is_live: boolean;
  is_projection: boolean;
  precipitation_mm: number;
  rainfall_intensity_mmh: number;
  temperature_c: number;
  aqi_pm25: number;
  active_incidents_count: number;
  composite_risk_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  water_level_m: number;
  summary: string;
  data_provenance: string;
}

export interface SectorComparison {
  sector_id: string;
  name: string;
  zone_code: string;
  centroid: [number, number];
  elevation_meters: number;
  topography_type: string;
  drainage_infrastructure_index: number;
  impervious_surface_pct: number;
  population_density_sqkm: number;
  estimated_affected_population: number;
  current_risk_score: number;
  current_risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  primary_hazard: string;
  active_incidents: number;
  safe_facilities_nearby: number;
}

export interface HistoricalBenchmark {
  id: string;
  event_type: string;
  title: string;
  description: string;
  occurred_at: string;
  peak_severity: number;
  location: [number, number];
  peak_rainfall_mm?: number | null;
  damage_estimate_usd?: number | null;
  casualties_count: number;
  inundation_depth_meters?: number | null;
  lessons_learned: string;
}

export interface DigitalTwinSummaryResponse {
  city: string;
  reference_center: [number, number];
  generated_at: string;
  timeline_slices: TimelineSlice[];
  sectors: SectorComparison[];
  historical_benchmarks: HistoricalBenchmark[];
  disclaimer: string;
}
