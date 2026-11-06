"""Pydantic v2 schemas for TerraGuard AI 2.0 Additive Map Intelligence Studio."""

from typing import Any, List, Optional
from pydantic import BaseModel, Field


class LayerMetadata(BaseModel):
    id: str = Field(..., description="Unique layer identifier")
    name: str = Field(..., description="Human-readable layer display name")
    category: str = Field(..., description="Category: hazards, environmental, infrastructure, reports, sensors")
    description: str = Field(..., description="Operational purpose and context")
    source: str = Field(..., description="Data provenance (e.g., Esri, IMD, BBMP, IoT Network)")
    update_frequency: str = Field(..., description="Update cadence (e.g., Real-time, 5 min, Static)")
    visible_by_default: bool = Field(default=True)
    default_opacity: float = Field(default=0.8, ge=0.0, le=1.0)
    badge: Optional[str] = Field(default=None)


class MapStudioLayersResponse(BaseModel):
    layers: List[LayerMetadata]
    total: int
    categories: List[str]


class FloodZoneProperties(BaseModel):
    zone_id: str
    sector_name: str
    risk_level: str = Field(..., description="CRITICAL, HIGH, MODERATE, LOW")
    risk_score: float = Field(..., ge=0.0, le=100.0)
    flood_depth_m: float = Field(..., ge=0.0)
    population_at_risk: int = Field(..., ge=0)
    area_sqkm: float
    primary_hazard: str
    drainage_saturation_pct: float = Field(..., ge=0.0, le=100.0)
    last_updated: str


class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]


class FloodRiskZoneFeature(BaseModel):
    type: str = "Feature"
    id: str
    properties: FloodZoneProperties
    geometry: GeoJSONGeometry


class FloodRiskZonesResponse(BaseModel):
    type: str = "FeatureCollection"
    features: List[FloodRiskZoneFeature]
    metadata: dict[str, Any]


class PrecipitationPoint(BaseModel):
    timestamp: str
    precipitation_mm: float
    drainage_capacity_pct: float
    flood_index: float


class MapStudioTelemetryResponse(BaseModel):
    sector_id: str
    sector_name: str
    timestamp: str
    live_rainfall_rate_mm_h: float
    drainage_saturation_pct: float
    total_population_at_risk: int
    active_alarms_count: int
    hyetograph_history: List[PrecipitationPoint]
    forecast_progression: List[PrecipitationPoint]


class MapPresetSector(BaseModel):
    id: str
    name: str
    subtext: str
    center: List[float] = Field(..., min_length=2, max_length=2)  # [lng, lat]
    zoom: float
    pitch: float = 0.0
    bearing: float = 0.0
    risk_level: str
    key_metrics: dict[str, Any]


class MapStudioPresetsResponse(BaseModel):
    presets: List[MapPresetSector]
    default_centroid: List[float]
