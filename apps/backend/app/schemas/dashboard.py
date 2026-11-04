from typing import Any, Literal
from pydantic import BaseModel, Field


class EnvironmentalFreshness(BaseModel):
    last_updated: str
    minutes_ago: int
    station_name: str
    is_live: bool
    status_label: str


class EnvironmentalMetrics(BaseModel):
    status: Literal["NORMAL", "ADVISORY", "CRITICAL"] = "NORMAL"
    temperature_c: float | None = None
    precipitation_mm: float | None = None
    aqi: int | None = None
    pm25: float | None = None
    humidity_percent: float | None = None
    freshness: EnvironmentalFreshness


class IncidentSummary(BaseModel):
    total_active: int = 0
    verified: int = 0
    pending_ai: int = 0
    critical_severity: int = 0


class RiskDistribution(BaseModel):
    critical: int = 0
    high: int = 0
    moderate: int = 0
    low: int = 0


class RecentReportItem(BaseModel):
    id: str
    title: str
    category: str
    severity: int
    status: str
    address: str | None = None
    distance_km: float | None = None
    created_at: str
    is_sample: bool = False


class RecentAlertItem(BaseModel):
    id: str
    title: str
    message: str
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    target_zone: str
    radius_km: float
    channels: list[str]
    created_at: str
    is_sample: bool = False


class RiskTrendPoint(BaseModel):
    time_label: str
    timestamp: str
    flood_risk: float
    air_quality_index: float
    precipitation_mm: float


class GeographicRiskZone(BaseModel):
    zone_code: str
    name: str
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    composite_risk_score: float
    primary_hazard: str
    estimated_affected_population: int
    contributing_factors: dict[str, float] = Field(default_factory=dict)
    is_sample: bool = False


class AIInsightItem(BaseModel):
    id: str
    title: str
    analysis: str
    severity: Literal["INFO", "WARNING", "CRITICAL"]
    recommended_action: str
    confidence_score: float
    model_name: str
    timestamp: str


class DashboardOverviewResponse(BaseModel):
    sector: str
    coordinates: dict[str, float]
    time_range: str
    data_mode: Literal["LIVE_TELEMETRY", "LABELLED_SAMPLE", "UNAVAILABLE"]
    environmental_status: EnvironmentalMetrics
    incident_summary: IncidentSummary
    risk_distribution: RiskDistribution
    recent_reports: list[RecentReportItem]
    recent_alerts: list[RecentAlertItem]
    risk_trends: list[RiskTrendPoint]
    geographic_risk_summary: list[GeographicRiskZone]
    ai_insights: list[AIInsightItem]
    metadata: dict[str, Any] = Field(default_factory=dict)


class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    type: Literal["ALERT", "REPORT_UPDATE", "AI_DISPATCH", "SYSTEM"]
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    timestamp: str
    read: bool = False
    link: str | None = None

