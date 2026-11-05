export interface EnvironmentalTrendPoint {
  date: string;
  avg_temperature_c: number;
  total_rainfall_mm: number;
  avg_humidity_pct: number;
  avg_aqi: number;
  avg_pm25: number;
  avg_pm10: number;
}

export interface RiskCategoryDistributionItem {
  category: string;
  critical_count: number;
  high_count: number;
  moderate_count: number;
  low_count: number;
  mean_risk_score: number;
}

export interface GeographicRiskComparisonItem {
  zone_code: string;
  zone_name: string;
  composite_risk: number;
  flood_risk_score: number;
  heat_risk_score: number;
  air_quality_index: number;
  verified_incidents: number;
  citizen_reports: number;
  population_at_risk: number;
  drainage_capacity_pct: number;
}

export interface IncidentHistoryItem {
  date: string;
  verified_incidents: number;
  unverified_reports: number;
  rejected_reports: number;
  primary_hazard: string;
}

export interface CitizenReportTrendItem {
  date: string;
  total_submitted: number;
  verified: number;
  in_review: number;
  rejected: number;
  ai_confidence_avg: number;
}

export interface AlertHistoryItem {
  id: string;
  title: string;
  severity: string;
  target_zone: string;
  issued_at: string;
  status: string;
  acknowledgements_count: number;
}

export interface ResponseTaskStatistics {
  total_dispatches: number;
  status_counts: Record<string, number>;
  priority_counts: Record<string, number>;
  avg_resolution_time_minutes: number;
  completion_rate_pct: number;
}

export interface DataSourceCoverageItem {
  source_id: string;
  name: string;
  provider: string;
  status: string;
  coverage_pct: number;
  freshness_lag_minutes: number;
  last_sync_timestamp: string;
  data_type: string;
}

export interface ModelEvaluationMetricItem {
  model_id: string;
  model_name: string;
  version: string;
  algorithm: string;
  accuracy: number;
  f1_score: number;
  precision: number;
  recall: number;
  roc_auc?: number | null;
  validation_split: string;
  last_trained: string;
}

export interface AnalyticsOverviewResponse {
  filters: {
    time_range: string;
    days: number;
    location: string;
    risk_category: string;
    verification_status: string;
    [key: string]: any;
  };
  summary: {
    time_range: string;
    monitored_days: number;
    total_citizen_reports: number;
    verified_incidents_count: number;
    active_alerts_count: number;
    average_composite_risk: number;
    field_squads_deployed: number;
    data_sources_online: number;
    [key: string]: any;
  };
  environmental_trends: EnvironmentalTrendPoint[];
  risk_distribution: RiskCategoryDistributionItem[];
  geographic_comparisons: GeographicRiskComparisonItem[];
  incident_history: IncidentHistoryItem[];
  citizen_report_trends: CitizenReportTrendItem[];
  alert_history: AlertHistoryItem[];
  response_task_stats: ResponseTaskStatistics;
  data_sources: DataSourceCoverageItem[];
  model_evaluations: ModelEvaluationMetricItem[];
  data_disclaimer: string;
}

export interface AnalyticsFilterParams {
  time_range?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  risk_category?: string;
  verification_status?: string;
}
