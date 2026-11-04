from typing import Any

from fastapi import APIRouter, Query

from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import geospatial_repository
from app.schemas.geospatial import (
    DatabaseStatsResponse,
    GeoJSONFeatureCollection,
    MapLayersResponse,
    NearbyReportsResponse,
    PolygonQueryRequest,
)

router = APIRouter()


@router.get(
    "/reports-near",
    response_model=NearbyReportsResponse,
    summary="Find Citizen Hazard Reports Near Location",
    description="Locates public incident reports within a spatial radius using 2dsphere indexing.",
)
async def get_reports_near(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate"),
    radius_km: float = Query(default=5.0, gt=0.0, le=50.0, description="Search radius in kilometers"),
    category: str | None = Query(default=None, description="Hazard category filter"),
    status: str | None = Query(default=None, description="Incident status filter"),
    min_severity: int = Query(default=1, ge=1, le=5, description="Minimum severity 1-5"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum reports to return"),
) -> NearbyReportsResponse:
    radius_meters = radius_km * 1000.0
    items = await geospatial_repository.find_reports_near(
        lng=lng,
        lat=lat,
        radius_meters=radius_meters,
        category=category,
        status=status,
        min_severity=min_severity,
        limit=limit,
    )
    return NearbyReportsResponse(
        items=items,
        count=len(items),
        search_center={"lat": lat, "lng": lng},
        radius_km=radius_km,
    )


@router.post(
    "/risk-zones-within",
    response_model=list[dict[str, Any]],
    summary="Query Calculated Risk Zones Contained in Boundary Polygon",
    description="Performs GeoJSON $geoWithin query to find risk assessment zones enclosed inside a municipal boundary.",
)
async def get_risk_zones_within(
    payload: PolygonQueryRequest,
) -> list[dict[str, Any]]:
    return await geospatial_repository.find_risk_zones_within(
        polygon_coords=payload.coordinates,
        min_risk_level=payload.min_risk_level,
        limit=payload.limit,
    )


@router.get(
    "/historical-events",
    response_model=list[dict[str, Any]],
    summary="Retrieve Historical Disaster Events Near Epicenter",
    description="Queries past flood, fire, or heatwave occurrences within a radius for AI baseline training.",
)
async def get_historical_events(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate"),
    radius_km: float = Query(default=25.0, gt=0.0, le=200.0, description="Search radius in kilometers"),
    event_type: str | None = Query(default=None, description="Event type filter"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum items to return"),
) -> list[dict[str, Any]]:
    radius_meters = radius_km * 1000.0
    return await geospatial_repository.find_historical_events_near(
        lng=lng,
        lat=lat,
        radius_meters=radius_meters,
        event_type=event_type,
        limit=limit,
    )


@router.get(
    "/db-stats",
    response_model=DatabaseStatsResponse,
    summary="MongoDB Cluster Telemetry and Collection Audit",
    description="Returns collection document counts, live Atlas connection status, and round-trip ping latency.",
)
async def get_db_stats() -> DatabaseStatsResponse:
    stats = await geospatial_repository.get_database_stats()
    return DatabaseStatsResponse(**stats)

