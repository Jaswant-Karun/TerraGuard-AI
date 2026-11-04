export interface EnvironmentalStatus {
  rainfall_mm: number | null;
  temperature_c: number | null;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  humidity_pct: number | null;
  wind_speed_kmh: number | null;
  station_id: string | null;
  source: string;
  freshness_timestamp: string | null;
  status: "AVAILABLE" | "UNAVAILABLE" | "SAMPLE_DATA";
  is_sample: boolean;
  anomaly_detected: boolean;
}

export interface RiskDistribution {
  CRITICAL: number;
  HIGH: number;
  MODERATE: number;
  LOW: number;
  total_zones: number;
}

export interface RiskTrendPoint {
  timestamp: string;
  label: string;
  flood_risk: number;
  air_risk: number;
  composite_risk: number;
}

export interface GeographicRiskZone {
  id: string;
  zone_code: string;
  name: string;
  risk_level: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  composite_risk_score: number;
  primary_hazard: string;
  estimated_affected_population: number;
  trend: "RISING" | "STABLE" | "FALLING";
}

export interface AIInsight {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  title: string;
  recommendation: string;
  target_zone: string;
  confidence_score: number;
  created_at: string;
}

export interface CitizenReportItem {
  id: string;
  title: string;
  description?: string;
  category: "FLOOD" | "AIR_POLLUTION" | "FIRE" | "LANDSLIDE" | "INFRASTRUCTURE_FAILURE" | "WATER_CONTAMINATION" | "OTHER";
  severity: number;
  status: "REPORTED" | "AI_ANALYZED" | "VERIFIED" | "DISPATCHED" | "RESOLVED" | "REJECTED";
  address?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  created_at: string;
  metadata?: {
    is_sample?: boolean;
  };
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  target_zone: string;
  channels: string[];
  is_active: boolean;
  created_at: string;
  metadata?: {
    is_sample?: boolean;
  };
}

export interface LocationOption {
  id: string;
  name: string;
  zone_code?: string | null;
  coordinates: [number, number];
  category: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: "ALERT" | "TASK" | "SYSTEM" | "REPORT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  timestamp: string;
  read: boolean;
}

export interface DashboardSummary {
  location: {
    id: string;
    name: string;
    zone_code?: string;
    coordinates: [number, number];
  };
  time_range: string;
  environmental_status: EnvironmentalStatus;
  active_incidents_count: number;
  risk_distribution: RiskDistribution;
  recent_citizen_reports: CitizenReportItem[];
  recent_alerts: AlertItem[];
  risk_trends: RiskTrendPoint[];
  geographic_risk_summary: GeographicRiskZone[];
  ai_insights: AIInsight[];
  data_disclaimer: string;
}
