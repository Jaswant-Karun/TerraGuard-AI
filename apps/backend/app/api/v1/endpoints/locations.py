from typing import Any

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import require_role
from app.core.errors import AppException
from app.models.collections import LocationModel
from app.repositories.locations_repository import locations_repository
from app.schemas.geospatial import NearbyFacilitiesResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserRole

router = APIRouter()


@router.get(
    "/nearby",
    response_model=NearbyFacilitiesResponse,
    summary="Find Emergency Facilities Nearby",
    description="Returns shelters, hospitals, pump stations, and relief hubs within a geographical radius using 2dsphere indexing.",
)
async def get_nearby_locations(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude coordinate"),
    radius_km: float = Query(default=10.0, gt=0.0, le=100.0, description="Search radius in kilometers"),
    category: str | None = Query(default=None, description="Optional category filter (e.g. HOSPITAL, EMERGENCY_SHELTER)"),
    operational_only: bool = Query(default=True, description="Only return operational facilities"),
    limit: int = Query(default=50, ge=1, le=100, description="Maximum items to return"),
) -> NearbyFacilitiesResponse:
    radius_meters = radius_km * 1000.0
    items = await locations_repository.find_nearby(
        lng=lng,
        lat=lat,
        radius_meters=radius_meters,
        category=category,
        operational_only=operational_only,
        limit=limit,
    )
    return NearbyFacilitiesResponse(
        items=items,
        count=len(items),
        search_center={"lat": lat, "lng": lng},
        radius_km=radius_km,
    )


@router.get(
    "",
    response_model=PaginatedResponse[dict[str, Any]],
    summary="List Facilities Paginated",
)
async def list_locations(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    category: str | None = Query(default=None, description="Filter by category"),
    operational_only: bool | None = Query(default=None, description="Filter by operational status"),
) -> PaginatedResponse[dict[str, Any]]:
    query: dict[str, Any] = {}
    if category:
        query["category"] = category
    if operational_only is not None:
        query["is_operational"] = operational_only

    return await locations_repository.find_paginated(
        filter_query=query,
        page=page,
        page_size=page_size,
        sort_field="name",
        sort_asc=True,
    )


@router.get(
    "/{location_id}",
    response_model=dict[str, Any],
    summary="Get Location Details",
)
async def get_location_by_id(location_id: str) -> dict[str, Any]:
    loc = await locations_repository.find_by_id(location_id)
    if not loc:
        raise AppException(
            message=f"Location '{location_id}' not found.",
            status_code=404,
            error_code="LOCATION_NOT_FOUND",
        )
    return loc


@router.post(
    "",
    response_model=dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Register New Facility (Restricted)",
)
async def create_location(
    location: LocationModel,
    current_user: dict[str, Any] = Depends(require_role(UserRole.COORDINATOR, UserRole.ADMIN)),
) -> dict[str, Any]:
    return await locations_repository.create_location(location)


@router.put(
    "/{location_id}",
    response_model=dict[str, Any],
    summary="Update Facility Status / Information (Restricted)",
)
async def update_location(
    location_id: str,
    updates: dict[str, Any],
    current_user: dict[str, Any] = Depends(require_role(UserRole.COORDINATOR, UserRole.ADMIN)),
) -> dict[str, Any]:
    existing = await locations_repository.find_by_id(location_id)
    if not existing:
        raise AppException(
            message=f"Location '{location_id}' not found.",
            status_code=404,
            error_code="LOCATION_NOT_FOUND",
        )
    # Exclude immutable fields
    for field in ["id", "_id", "created_at"]:
        updates.pop(field, None)

    updated = await locations_repository.update(location_id, updates)
    return updated or existing


@router.delete(
    "/{location_id}",
    response_model=dict[str, Any],
    summary="Delete Facility (Admin Only)",
)
async def delete_location(
    location_id: str,
    current_user: dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
) -> dict[str, Any]:
    success = await locations_repository.delete(location_id)
    if not success:
        raise AppException(
            message=f"Location '{location_id}' not found or could not be removed.",
            status_code=404,
            error_code="LOCATION_NOT_FOUND",
        )
    return {"deleted": True, "id": location_id}

