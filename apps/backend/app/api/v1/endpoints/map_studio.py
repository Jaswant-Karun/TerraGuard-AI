"""Endpoints for TerraGuard AI 2.0 Additive Map Intelligence Studio."""


from fastapi import APIRouter, HTTPException, Path, Query, status

from app.repositories.map_studio_repository import MapStudioRepository
from app.schemas.map_studio import (
    ExperienceViewMeta,
    FloodRiskZonesResponse,
    MapStudioExperienceResponse,
    MapStudioLayersResponse,
    MapStudioPresetsResponse,
    MapStudioTelemetryResponse,
)

router = APIRouter(prefix="/map-studio", tags=["Map Intelligence Studio 2.0"])


@router.get(
    "/layers",
    response_model=MapStudioLayersResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Map Studio GIS Layer Catalog",
    description="Returns curated GIS layer configurations including sources, metadata, and default visibility.",
)
async def get_map_studio_layers() -> MapStudioLayersResponse:
    return MapStudioRepository.get_layer_catalog()


@router.get(
    "/zones",
    response_model=FloodRiskZonesResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Geospatial Flood Inundation Polygons",
    description="Returns high-precision GeoJSON flood risk polygon vectors, depths, and affected population stats.",
)
async def get_flood_risk_zones(
    min_risk_level: str | None = Query(None, description="Optional filter: CRITICAL, HIGH, MODERATE, LOW")
) -> FloodRiskZonesResponse:
    data = MapStudioRepository.get_flood_risk_zones()
    if min_risk_level:
        target = min_risk_level.upper()
        filtered_features = [f for f in data.features if f.properties.risk_level == target]
        data.features = filtered_features
    return data


@router.get(
    "/telemetry",
    response_model=MapStudioTelemetryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Sector Rainfall Hyetograph & Forecast",
    description="Returns real-time rainfall intensity, drainage saturation, and 6-hour ML predictive hydrograph progression.",
)
async def get_sector_telemetry(
    sector_id: str = Query("zone-blr-koramangala-01", description="Target urban sector or hazard zone identifier")
) -> MapStudioTelemetryResponse:
    return MapStudioRepository.get_sector_telemetry(sector_id=sector_id)


@router.get(
    "/presets",
    response_model=MapStudioPresetsResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Quick-Fly Command Presets",
    description="Returns viewpoint coordinates, zoom levels, and key metrics for critical urban drainage basins.",
)
async def get_hotspot_presets() -> MapStudioPresetsResponse:
    return MapStudioRepository.get_hotspot_presets()


@router.get(
    "/experiences",
    response_model=list[ExperienceViewMeta],
    status_code=status.HTTP_200_OK,
    summary="List All 11 Map Studio Experiences",
    description="Returns metadata, defaults, basemaps, and tags for each of the 11 specialized map views.",
)
async def list_experiences() -> list[ExperienceViewMeta]:
    return MapStudioRepository.get_all_experiences_meta()


@router.get(
    "/experiences/{experience_id}",
    response_model=MapStudioExperienceResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Data for a Specific Map Experience",
    description="Returns the GeoJSON features, domain metrics, legends, and side panel content for one of the 11 map experiences.",
)
async def get_experience_details(
    experience_id: str = Path(..., description="Unique experience slug identifier (e.g., flood-risk-intelligence)")
) -> MapStudioExperienceResponse:
    data = MapStudioRepository.get_experience_data(experience_id)
    if not data or not data.meta:
        raise HTTPException(status_code=404, detail=f"Experience '{experience_id}' not found.")
    return data


