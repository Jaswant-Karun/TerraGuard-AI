from typing import Any
from fastapi import APIRouter, Query, status

from app.repositories.safe_routes_repository import safe_routes_repository
from app.schemas.routing import (
    NearbyFacilitiesResponse,
    RouteQueryRequest,
    RouteQueryResponse,
)
from app.services.routing_service import routing_service

router = APIRouter(prefix="/navigation", tags=["Navigation & Safe Routes"])


@router.post(
    "/routes",
    response_model=RouteQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute safe navigation routes with hazard avoidance",
    description=(
        "Calculates real-world driving/walking route alternatives between origin and destination. "
        "Cross-checks paths against active flood reports, road closures, and risk zones. "
        "Adheres strictly to truth-in-routing: only marks a route as safer when verified hazard data supports it."
    ),
)
async def compute_safe_routes(payload: RouteQueryRequest) -> RouteQueryResponse:
    return await routing_service.calculate_routes(payload)


@router.get(
    "/facilities/nearby",
    response_model=NearbyFacilitiesResponse,
    status_code=status.HTTP_200_OK,
    summary="Discover genuine nearby emergency facilities, hospitals, and shelters",
)
async def get_nearby_facilities(
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    radius_km: float = Query(default=15.0, ge=0.5, le=50.0, description="Search radius in kilometers"),
    category: str | None = Query(
        default=None,
        description="Filter by: HOSPITAL, EMERGENCY_SHELTER, FIRE_STATION, RELIEF_HUB, PUMP_STATION",
    ),
    limit: int = Query(default=25, ge=1, le=50),
) -> NearbyFacilitiesResponse:
    facilities = await routing_service.get_nearby_emergency_facilities(
        lng=lng,
        lat=lat,
        radius_meters=radius_km * 1000.0,
        category=category,
        limit=limit,
    )
    return NearbyFacilitiesResponse(
        facilities=facilities,
        total=len(facilities),
        center=[lng, lat],
        radius_km=radius_km,
    )


@router.get(
    "/corridors",
    response_model=list[dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="List designated municipal evacuation corridors",
)
async def get_evacuation_corridors() -> list[dict[str, Any]]:
    return await safe_routes_repository.list_active_corridors(limit=50)
