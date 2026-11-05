from typing import Any, Literal

from pydantic import BaseModel


class EnvironmentalStatusDTO(BaseModel):
    rainfall_mm: float | None = None
    temperature_c: float | None = None
    aqi: float | None = None
    pm25: float | None = None
    pm10: float | None = None
    humidity_pct: float | None = None
    wind_speed_kmh: float | None = None
    station_id: str | None = None
    source: str = "IOT_STATION"
    freshness_timestamp: str | None = None
    status: Literal["AVAILABLE", "UNAVAILABLE", "SAMPLE_DATA"] = "SAMPLE_DATA"
    is_sample: bool = True
    anomaly_detected: bool = False


class RiskDistributionDTO(BaseModel):
    CRITICAL: int = 0
    HIGH: int = 0
    MODERATE: int = 0
    LOW: int = 0
    total_zones: int = 0


class RiskTrendPointDTO(BaseModel):
    timestamp: str
    label: str
    flood_risk: float
    air_risk: float
    composite_risk: float


class GeographicRiskZoneDTO(BaseModel):
    id: str
    zone_code: str
    name: str
    risk_level: str
    composite_risk_score: float
    primary_hazard: str
    estimated_affected_population: int
    trend: str = "STABLE"


class AIInsightDTO(BaseModel):
    id: str
    severity: Literal["CRITICAL", "HIGH", "MODERATE", "LOW"]
    title: str
    recommendation: str
    target_zone: str
    confidence_score: float
    created_at: str


class LocationOptionDTO(BaseModel):
    id: str
    name: str
    zone_code: str | None = None
    coordinates: list[float]
    category: str


class DashboardNotificationDTO(BaseModel):
    id: str
    title: str
    message: str
    type: Literal["ALERT", "TASK", "SYSTEM", "REPORT"]
    severity: Literal["CRITICAL", "HIGH", "MODERATE", "MEDIUM", "LOW"]
    timestamp: str
    read: bool = False


class DashboardSummaryResponse(BaseModel):
    location: dict[str, Any]
    time_range: str
    environmental_status: EnvironmentalStatusDTO
    active_incidents_count: int
    risk_distribution: RiskDistributionDTO
    recent_citizen_reports: list[dict[str, Any]]
    recent_alerts: list[dict[str, Any]]
    risk_trends: list[RiskTrendPointDTO]
    geographic_risk_summary: list[GeographicRiskZoneDTO]
    ai_insights: list[AIInsightDTO]
    data_disclaimer: str
