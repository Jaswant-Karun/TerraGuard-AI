"""Unified Map Backend API Endpoints (Prompt 5).

Exposes standards-compliant RFC 7946 GeoJSON endpoints with geographic bounding box validation,
pagination, date filtering, hazard classification, PII protection, and offline resilience.
"""

from fastapi import APIRouter, HTTPException, Query, status

from app.repositories.maps_repository import (
    maps_repository,
    validate_geographic_bounds,
)
from app.schemas.maps import (
    GeoJSONFeatureCollectionResponse,
    MapContextualAreaResponse,
    MapLayersResponse,
    MapLegendResponse,
    MapMetadataResponse,
)

router = APIRouter(tags=["Unified Map Integration & GeoJSON Engine"])


def parse_and_validate_bounds(
    min_lat: float | None = None,
    min_lng: float | None = None,
    max_lat: float | None = None,
    max_lng: float | None = None,
    bbox: str | None = None,
) -> list[float] | None:
    """Helper to validate geographic bounds and raise HTTP 400 on error."""
    try:
        return validate_geographic_bounds(
            min_lat=min_lat,
            min_lng=min_lng,
            max_lat=max_lat,
            max_lng=max_lng,
            bbox_str=bbox,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Geographic bounds validation failed: {err}",
        ) from err


# 1. GET /api/v1/maps/layers
@router.get(
    "/layers",
    response_model=MapLayersResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Unified GIS Map Layer Catalog",
    description="Returns all available GIS map layers with their metadata, source provenance, endpoints, and update frequencies.",
)
async def get_map_layers() -> MapLayersResponse:
    return maps_repository.get_layers_catalog()


# 2. GET /api/v1/maps/geojson/flood
@router.get(
    "/geojson/flood",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Flood Susceptibility GeoJSON Polygons",
    description="Returns hydrological catchment polygons with inundation depths, drainage saturation, model versions, and uncertainty intervals.",
)
async def get_flood_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    min_risk_level: str | None = Query(default=None, description="Filter: CRITICAL, HIGH, MODERATE, LOW"),
    start_date: str | None = Query(default=None, description="Start date filter (ISO or YYYY-MM-DD)"),
    end_date: str | None = Query(default=None, description="End date filter (ISO or YYYY-MM-DD)"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=50, ge=1, le=200, description="Features per page"),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_flood_geojson(
        bbox=parsed_bbox,
        min_risk_level=min_risk_level,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


# 3. GET /api/v1/maps/geojson/heat
@router.get(
    "/geojson/heat",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Urban Heat Island & Thermal GeoJSON",
    description="Returns surface temperature anomalies and heat island telemetry from Landsat-9 and municipal thermal sensors.",
)
async def get_heat_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    min_heat_index: float | None = Query(default=None, description="Minimum heat index in °C"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_heat_geojson(
        bbox=parsed_bbox,
        min_heat_index=min_heat_index,
        page=page,
        page_size=page_size,
    )


# 4. GET /api/v1/maps/geojson/air-quality
@router.get(
    "/geojson/air-quality",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Air Quality Monitoring Stations GeoJSON",
    description="Returns PM2.5, PM10, and AQI readings with CPCB continuous monitoring and OpenAQ station metadata.",
)
async def get_air_quality_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    min_aqi: float | None = Query(default=None, description="Minimum AQI threshold"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_air_quality_geojson(
        bbox=parsed_bbox,
        min_aqi=min_aqi,
        page=page,
        page_size=page_size,
    )


# 5. GET /api/v1/maps/geojson/reports
@router.get(
    "/geojson/reports",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Citizen Hazard Reports GeoJSON (PII Redacted)",
    description="Returns citizen crowdsourced hazard reports with rigorous PII sanitization and spatial bounds filtering.",
)
async def get_reports_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    category: str | None = Query(default=None, description="Hazard category filter"),
    status_filter: str | None = Query(default=None, alias="status", description="Report status filter"),
    min_severity: int = Query(default=1, ge=1, le=5, description="Minimum severity 1-5"),
    start_date: str | None = Query(default=None, description="Start date filter"),
    end_date: str | None = Query(default=None, description="End date filter"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_reports_geojson(
        bbox=parsed_bbox,
        category=category,
        status=status_filter,
        min_severity=min_severity,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


# 6. GET /api/v1/maps/geojson/verified-incidents
@router.get(
    "/geojson/verified-incidents",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Verified Municipal Incidents GeoJSON",
    description="Returns ground-truthed disaster callouts and verified emergency response locations from the EOC dispatch log.",
)
async def get_verified_incidents_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    hazard_type: str | None = Query(default=None, description="Hazard type e.g. FLOOD, WATERLOGGING"),
    status_filter: str | None = Query(default=None, alias="status", description="Status e.g. VERIFIED, DISPATCHED, RESOLVED"),
    start_date: str | None = Query(default=None, description="Start date filter"),
    end_date: str | None = Query(default=None, description="End date filter"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_verified_incidents_geojson(
        bbox=parsed_bbox,
        hazard_type=hazard_type,
        status=status_filter,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


# 7. GET /api/v1/maps/geojson/infrastructure
@router.get(
    "/geojson/infrastructure",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Critical Infrastructure & Facilities GeoJSON",
    description="Returns hospitals, evacuation centers, relief supply hubs, and fire stations with operational statuses.",
)
async def get_infrastructure_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    category: str | None = Query(default=None, description="HOSPITAL, SHELTER, FIRE_STATION, RELIEF_HUB"),
    is_operational: bool | None = Query(default=None, description="Operational status flag"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_infrastructure_geojson(
        bbox=parsed_bbox,
        category=category,
        is_operational=is_operational,
        page=page,
        page_size=page_size,
    )


# 8. GET /api/v1/maps/geojson/water-bodies
@router.get(
    "/geojson/water-bodies",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Lakes & Retention Reservoirs GeoJSON",
    description="Returns urban balancing reservoirs, storage volumes, weir crest levels, and sluice gate discharge statuses.",
)
async def get_water_bodies_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    body_type: str | None = Query(default=None, alias="type", description="LAKE, RESERVOIR, WETLAND"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_water_bodies_geojson(
        bbox=parsed_bbox,
        body_type=body_type,
        page=page,
        page_size=page_size,
    )


# 9. GET /api/v1/maps/geojson/rainfall
@router.get(
    "/geojson/rainfall",
    response_model=GeoJSONFeatureCollectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Observed Rainfall Weather Stations GeoJSON",
    description="Returns real-time precipitation intensities and 24h accumulation data from the IMD AWS telemetry network.",
)
async def get_rainfall_geojson(
    bbox: str | None = Query(default=None, description="Bounding box formatted as min_lng,min_lat,max_lng,max_lat"),
    min_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    min_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    max_lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    max_lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    min_rainfall_mmh: float | None = Query(default=None, description="Minimum rainfall intensity threshold"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> GeoJSONFeatureCollectionResponse:
    parsed_bbox = parse_and_validate_bounds(min_lat, min_lng, max_lat, max_lng, bbox)
    return await maps_repository.get_rainfall_geojson(
        bbox=parsed_bbox,
        min_rainfall_mmh=min_rainfall_mmh,
        page=page,
        page_size=page_size,
    )


# 10. GET /api/v1/maps/legend
@router.get(
    "/legend",
    response_model=MapLegendResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Cartographic Symbology Legend",
    description="Returns standardized color scales, shapes, and risk thresholds across all map layers.",
)
async def get_map_legend() -> MapLegendResponse:
    return maps_repository.get_legend()


# 11. GET /api/v1/maps/metadata
@router.get(
    "/metadata",
    response_model=MapMetadataResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Map Backend Metadata & Cluster Health",
    description="Returns coordinate reference systems, MongoDB 2dsphere status, data standards, and available endpoint catalog.",
)
async def get_map_metadata() -> MapMetadataResponse:
    return await maps_repository.get_metadata()


# 12. GET /api/v1/maps/analytics/context (Prompt 7)
@router.get(
    "/analytics/context",
    response_model=MapContextualAreaResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Contextual Area Analytics & Multi-Hazard Intelligence (Prompt 7)",
    description="Returns environmental telemetry, flood & heat risk estimates, nearby citizen reports, verified incidents, emergency facilities, comparison metrics, and historical time series for any clicked location or urban sector.",
)
async def get_contextual_area_analytics(
    lat: float = Query(default=12.9250, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(default=77.6250, ge=-180.0, le=180.0, description="Longitude coordinate"),
    area_name: str | None = Query(default=None, description="Optional area or sector name"),
    radius_km: float = Query(default=3.0, ge=0.5, le=25.0, description="Search radius in kilometers"),
    start_date: str | None = Query(default=None, description="Start date filter for historical observations"),
    end_date: str | None = Query(default=None, description="End date filter for historical observations"),
) -> MapContextualAreaResponse:
    return await maps_repository.get_contextual_area_analytics(
        lat=lat,
        lng=lng,
        area_name=area_name,
        radius_km=radius_km,
        start_date=start_date,
        end_date=end_date,
    )


