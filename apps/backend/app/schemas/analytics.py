from typing import Any

from pydantic import BaseModel, Field


class EnvironmentalTrendPoint(BaseModel):
    date: str
    avg_temperature_c: float
    total_rainfall_mm: float
    avg_humidity_pct: float
    avg_aqi: float
    avg_pm25: float
    avg_pm10: float


class RiskCategoryDistributionItem(BaseModel):
    category: str
    critical_count: int
    high_count: int
    moderate_count: int
    low_count: int
    mean_risk_score: float


class GeographicRiskComparisonItem(BaseModel):
    zone_code: str
    zone_name: str
    composite_risk: float
    flood_risk_score: float
    heat_risk_score: float
    air_quality_index: float
    verified_incidents: int
    citizen_reports: int
    population_at_risk: int
    drainage_capacity_pct: float


class IncidentHistoryItem(BaseModel):
    date: str
    verified_incidents: int
    unverified_reports: int
    rejected_reports: int
    primary_hazard: str


class CitizenReportTrendItem(BaseModel):
    date: str
    total_submitted: int
    verified: int
    in_review: int
    rejected: int
    ai_confidence_avg: float


class AlertHistoryItem(BaseModel):
    id: str
    title: str
    severity: str
    target_zone: str
    issued_at: str
    status: str
    acknowledgements_count: int


class ResponseTaskStatistics(BaseModel):
    total_dispatches: int
    status_counts: dict[str, int]
    priority_counts: dict[str, int]
    avg_resolution_time_minutes: float
    completion_rate_pct: float


class DataSourceCoverageItem(BaseModel):
    source_id: str
    name: str
    provider: str
    status: str
    coverage_pct: float
    freshness_lag_minutes: int
    last_sync_timestamp: str
    data_type: str


class ModelEvaluationMetricItem(BaseModel):
    model_id: str
    model_name: str
    version: str
    algorithm: str
    accuracy: float
    f1_score: float
    precision: float
    recall: float
    roc_auc: float | None = None
    validation_split: str
    last_trained: str


class AnalyticsOverviewResponse(BaseModel):
    filters: dict[str, Any]
    summary: dict[str, Any]
    environmental_trends: list[EnvironmentalTrendPoint]
    risk_distribution: list[RiskCategoryDistributionItem]
    geographic_comparisons: list[GeographicRiskComparisonItem]
    incident_history: list[IncidentHistoryItem]
    citizen_report_trends: list[CitizenReportTrendItem]
    alert_history: list[AlertHistoryItem]
    response_task_stats: ResponseTaskStatistics
    data_sources: list[DataSourceCoverageItem]
    model_evaluations: list[ModelEvaluationMetricItem]
    data_disclaimer: str = Field(
        default="Official municipal instructions and physical emergency services take precedence. "
        "Model estimates are probabilistic simulations and must not be treated as physical flood sensor measurements."
    )
