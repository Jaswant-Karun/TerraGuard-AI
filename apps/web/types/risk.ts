export interface SubscoreDTO {
  category: "FLOOD" | "HEAT" | "AIR_QUALITY" | string;
  score: number;
  level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | string;
  contributing_factors: Record<string, number>;
  explanation: string;
  model_version: string;
  confidence: number;
  is_rule_based: boolean;
  provenance_label: string;
}

export interface RiskAssessmentRequest {
  lat?: number;
  lng?: number;
  zone_code?: string;
  rainfall_intensity_mmh?: number;
  forecast_rainfall_sum_mm?: number;
  temperature_c?: number;
  humidity_pct?: number;
  aqi?: number;
  drainage_capacity_deficit_pct?: number;
}

export interface RiskAssessmentResponse {
  id: string;
  risk_category: string;
  composite_risk_score: number;
  risk_level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | string;
  primary_hazard: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  zone_code: string;
  timestamp: string;
  flood_risk: SubscoreDTO;
  heat_risk: SubscoreDTO;
  air_quality_risk: SubscoreDTO;
  input_factors: Record<string, unknown>;
  explanation: string;
  mitigation_directives: string[];
  data_sources: string[];
  model_version: string;
  confidence: number;
  is_rule_based: boolean;
  provenance_label: string;
}

export interface RiskExplanationResponse {
  assessment_id: string;
  primary_hazard: string;
  composite_score: number;
  risk_level: string;
  detailed_explanation: string;
  contributing_factors_breakdown: Record<string, unknown>;
  model_provenance: Record<string, unknown>;
  mitigation_directives: string[];
}

export interface HistoricalRiskResponse {
  items: RiskAssessmentResponse[];
  total: number;
  page: number;
  page_size: number;
}
