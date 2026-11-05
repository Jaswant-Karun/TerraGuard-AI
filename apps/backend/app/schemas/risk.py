from typing import Any

from pydantic import BaseModel, Field


class RiskAssessmentRequest(BaseModel):
    """Payload to trigger an on-demand multi-hazard risk assessment."""

    lat: float = Field(default=12.9716, ge=-90.0, le=90.0, description="Latitude coordinate")
    lng: float = Field(default=77.5946, ge=-180.0, le=180.0, description="Longitude coordinate")
    zone_code: str | None = Field(default=None, description="Optional administrative zone identifier")

    # Optional parameter overrides for disaster simulation & "what-if" planning
    rainfall_intensity_mmh: float | None = Field(default=None, ge=0.0, description="Manual rainfall override (mm/h)")
    forecast_rainfall_sum_mm: float | None = Field(default=None, ge=0.0, description="Manual 24h rainfall forecast (mm)")
    temperature_c: float | None = Field(default=None, description="Manual temperature override in °C")
    humidity_pct: float | None = Field(default=None, ge=0.0, le=100.0, description="Manual humidity override")
    aqi: float | None = Field(default=None, ge=0.0, description="Manual AQI override")
    drainage_capacity_deficit_pct: float | None = Field(default=None, ge=0.0, le=100.0, description="Manual culvert stress")


class SubscoreDTO(BaseModel):
    category: str
    score: float
    level: str
    contributing_factors: dict[str, float]
    explanation: str
    model_version: str
    confidence: float
    is_rule_based: bool
    provenance_label: str


class RiskAssessmentResponse(BaseModel):
    id: str = Field(description="Unique assessment ID")
    risk_category: str = Field(description="Dominant or aggregated hazard category")
    composite_risk_score: float = Field(ge=0.0, le=100.0, description="Composite Threat Index (0-100)")
    risk_level: str = Field(description="CRITICAL, HIGH, MODERATE, or LOW")
    primary_hazard: str = Field(description="Acute hazard driving composite score")
    location: dict[str, Any] = Field(description="GeoJSON Point representing assessment epicenter")
    zone_code: str = Field(description="Associated administrative sector or zone")
    timestamp: str = Field(description="Calculation timestamp")
    flood_risk: SubscoreDTO
    heat_risk: SubscoreDTO
    air_quality_risk: SubscoreDTO
    input_factors: dict[str, Any]
    explanation: str
    mitigation_directives: list[str]
    data_sources: list[str]
    model_version: str
    confidence: float
    is_rule_based: bool
    provenance_label: str


class RiskExplanationResponse(BaseModel):
    assessment_id: str
    primary_hazard: str
    composite_score: float
    risk_level: str
    detailed_explanation: str
    contributing_factors_breakdown: dict[str, Any]
    model_provenance: dict[str, Any]
    mitigation_directives: list[str]


class HistoricalRiskResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int
    page: int
    page_size: int
