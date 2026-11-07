"""Pydantic schemas for TerraGuard AI Flood Risk Visualization Engine."""

from typing import Any

from pydantic import BaseModel, Field


class RiskContributingFactor(BaseModel):
    factor_name: str
    weight_pct: float
    metric_value: str
    impact_level: str  # SEVERE, ELEVATED, MODERATE, LOW
    description: str


class RiskExplanationDTO(BaseModel):
    headline: str
    primary_driver: str
    hydrological_rationale: str
    contributing_factors: list[RiskContributingFactor]
    mitigation_protocol: str


class FloodSusceptibilityProperties(BaseModel):
    zone_id: str
    sector_name: str
    risk_category: str = Field(..., description="CRITICAL, HIGH, MODERATE, LOW")
    risk_score: float = Field(..., ge=0.0, le=100.0)
    flood_depth_m: float = Field(..., ge=0.0)
    area_sqkm: float
    timestamp: str
    data_source: str
    model_version: str
    confidence_pct: float = Field(..., ge=0.0, le=100.0)
    uncertainty_range: str
    drainage_saturation_pct: float = Field(..., ge=0.0, le=100.0)
    impervious_surface_pct: float = Field(..., ge=0.0, le=100.0)
    elevation_masl: float
    population_at_risk: int
    color: str
    risk_explanation: RiskExplanationDTO


class GeoJSONPolygonGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: list[list[list[float]]]


class FloodSusceptibilityFeature(BaseModel):
    type: str = "Feature"
    id: str
    properties: FloodSusceptibilityProperties
    geometry: GeoJSONPolygonGeometry


class FloodVisualizationLayersResponse(BaseModel):
    susceptibility_zones: dict[str, Any]
    observed_rainfall: dict[str, Any]
    forecast_rainfall: dict[str, Any]
    historical_incidents: dict[str, Any]
    waterlogging_reports: dict[str, Any]
    water_bodies: dict[str, Any]
    elevation_benchmarks: dict[str, Any]
    drainage_network: dict[str, Any]
    layer_registry: list[dict[str, Any]]
    metadata: dict[str, Any]


class FloodZoneExplanationResponse(BaseModel):
    zone_id: str
    sector_name: str
    risk_category: str
    risk_score: float
    flood_depth_m: float
    area_sqkm: float
    timestamp: str
    data_source: str
    model_version: str
    confidence_pct: float
    uncertainty_range: str
    explanation: RiskExplanationDTO
