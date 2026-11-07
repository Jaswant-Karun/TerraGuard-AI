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

