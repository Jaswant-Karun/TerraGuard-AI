"""Pydantic schemas for TerraGuard AI Unified Maps API Engine (Prompt 5).

Defines RFC 7946 GeoJSON compliant response models, layer catalogs, legends,
bounds validation models, and auditable metadata structures.
"""

from typing import Any

from pydantic import BaseModel, Field


class MapPaginationMeta(BaseModel):
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1)
    total_features: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    has_more: bool


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    properties: dict[str, Any]
    geometry: dict[str, Any]


class GeoJSONFeatureCollectionResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]
    bbox: list[float] | None = None
    metadata: dict[str, Any]
    pagination: MapPaginationMeta | None = None


class MapLayerCatalogItem(BaseModel):
    id: str
    name: str
    category: str
    layer_type: str  # GeoJSON polygons, Point markers, Heatmap layers, Line layers, Raster tiles
    description: str
    endpoint: str
    source: str
    source_name: str
    data_type: str
    unit: str | None = None
    last_updated: str
    coverage: str
    availability: str = "AVAILABLE"  # LIVE_SYNCED, AVAILABLE, RATE_LIMITED_CACHE, UNAVAILABLE
    data_quality: str
    is_unavailable: bool = False
    unavailable_reason: str | None = None
    update_frequency: str
    is_active_by_default: bool
    default_opacity: float = 0.8


class MapLayersResponse(BaseModel):
    layers: list[MapLayerCatalogItem]
    total: int
    categories: list[str]
    metadata: dict[str, Any]


class LegendSymbol(BaseModel):
    label: str
    color: str
    shape: str  # polygon, circle, line, heatmap-gradient
    description: str | None = None
    value_range: str | None = None


class MapLegendLayer(BaseModel):
    layer_id: str
    layer_name: str
    symbols: list[LegendSymbol]


class MapLegendResponse(BaseModel):
    layers: list[MapLegendLayer]
    metadata: dict[str, Any]


class MapMetadataResponse(BaseModel):
    service_name: str
    version: str
    timestamp: str
    coordinate_reference_system: str
    default_center: list[float]
    default_bounding_box: list[float]
    available_endpoints: list[str]
    mongodb_status: dict[str, Any]
    scientific_standards: str


# =========================================================================
# Prompt 7 — Contextual Area Analytics & Information Panel Schemas
# =========================================================================


class EnvironmentalConditionSnapshot(BaseModel):
    rainfall_intensity_mm_h: float
    rainfall_station: str
    rainfall_last_updated: str
    rainfall_status: str
    temperature_c: float
    humidity_pct: float
    temperature_station: str
    temperature_last_updated: str
    air_quality_index: float
    pm25_ug_m3: float
    pm10_ug_m3: float
    air_quality_category: str
    air_quality_station: str
    air_quality_last_updated: str


class FloodRiskEstimate(BaseModel):
    risk_level: str  # CRITICAL, HIGH, MODERATE, LOW
    risk_score: float
    flood_depth_m: float
    drainage_saturation_pct: float
    model_version: str
    confidence_pct: float
    uncertainty_range: str
    data_source: str
    elevation_masl: float


class HeatRiskEstimate(BaseModel):
    risk_level: str
    heat_index_c: float
    lst_anomaly_c: float
    canopy_buffer_pct: float
    model_source: str


class NearbyIncidentItem(BaseModel):
    id: str
    type: str  # CITIZEN_REPORT or VERIFIED_INCIDENT
    title: str
    category: str
    severity: int
    status: str
    distance_m: int
    coordinates: list[float]
    timestamp: str
    verified_by: str | None = None


class NearbyFacilityItem(BaseModel):
    id: str
    name: str
    type: str  # HOSPITAL, SHELTER, FIRE_STATION
    distance_m: int
    coordinates: list[float]
    is_operational: bool
    capacity_detail: str


class DataSourceFreshnessItem(BaseModel):
    dataset: str
    provider: str
    last_updated: str
    status: str  # LIVE_SYNCED, AVAILABLE, RATE_LIMITED_CACHE
    quality_assurance: str


class HistoricalObservationPoint(BaseModel):
    timestamp: str
    offset_label: str  # "-24h", "-18h", ... "NOW"
    rainfall_mm: float
    temperature_c: float
    aqi: float
    inundation_depth_m: float
    drainage_capacity_pct: float


class ContextualComparisonMetrics(BaseModel):
    area_flood_score: float
    city_avg_flood_score: float
    area_heat_score: float
    city_avg_heat_score: float
    area_aqi: float
    city_avg_aqi: float


class MapContextualAreaResponse(BaseModel):
    area_name: str
    ward_code: str
    coordinates: dict[str, float]  # {"lat": ..., "lng": ...}
    bbox: list[float]
    radius_km: float
    current_conditions: EnvironmentalConditionSnapshot
    flood_risk: FloodRiskEstimate
    heat_risk: HeatRiskEstimate
    nearby_citizen_reports: list[NearbyIncidentItem]
    nearby_verified_incidents: list[NearbyIncidentItem]
    nearby_facilities: list[NearbyFacilityItem]
    data_freshness: list[DataSourceFreshnessItem]
    historical_series: list[HistoricalObservationPoint]
    comparison_metrics: ContextualComparisonMetrics
    applied_date_range: dict[str, str | None]


