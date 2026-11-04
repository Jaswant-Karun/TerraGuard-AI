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


@router.get(
    "/map-layers",
    response_model=MapLayersResponse,
    summary="All GIS Map Layers as GeoJSON FeatureCollections",
    description="Returns standards-compliant RFC 7946 GeoJSON collections with explicit scientific classification labeling.",
)
async def get_map_layers(
    lat: float | None = Query(default=None, ge=-90.0, le=90.0),
    lng: float | None = Query(default=None, ge=-180.0, le=180.0),
    radius_km: float = Query(default=50.0, gt=0.0, le=200.0),
) -> MapLayersResponse:
    risks_repo = BaseRepository("risk_assessments")
    reports_repo = BaseRepository("citizen_reports")
    locations_repo = BaseRepository("locations")
    env_repo = BaseRepository("environmental_data")
    routes_repo = BaseRepository("safe_routes")

    # Fetch raw data
    raw_risks = await risks_repo.find_paginated(page=1, page_size=100)
    raw_reports = await reports_repo.find_paginated(page=1, page_size=200)
    raw_facilities = await locations_repo.find_paginated(page=1, page_size=100)
    raw_env = await env_repo.find_paginated(page=1, page_size=100)
    raw_routes = await routes_repo.find_paginated(page=1, page_size=50)

    # 1. Risk Polygons
    risk_features = []
    for r in raw_risks.items:
        boundary = r.get("boundary")
        if boundary:
            risk_features.append({
                "type": "Feature",
                "geometry": boundary,
                "properties": {
                    "id": str(r.get("id")),
                    "name": r.get("name"),
                    "zone_code": r.get("zone_code"),
                    "risk_level": r.get("risk_level", "LOW"),
                    "composite_risk_score": float(r.get("composite_risk_score", 0.0)),
                    "primary_hazard": r.get("primary_hazard", "GENERAL"),
                    "contributing_factors": r.get("contributing_factors", {}),
                    "population": int(r.get("estimated_affected_population", 0)),
                    "data_classification": "MODEL_GENERATED_RISK_ESTIMATE",
                    "data_classification_label": "Model-Generated Risk Estimate",
                },
            })

    # 2. Citizen Reports (Unverified) & Verified Incidents
    unverified_features = []
    verified_features = []
    for rep in raw_reports.items:
        loc = rep.get("location")
        if loc:
            status = rep.get("status", "REPORTED")
            is_verified = status in ["VERIFIED", "DISPATCHED", "RESOLVED"]
            feat = {
                "type": "Feature",
                "geometry": loc,
                "properties": {
                    "id": str(rep.get("id")),
                    "title": rep.get("title"),
                    "description": rep.get("description", ""),
                    "category": rep.get("category", "OTHER"),
                    "severity": int(rep.get("severity", 1)),
                    "status": status,
                    "address": rep.get("address", ""),
                    "media_urls": rep.get("media_urls", []),
                    "created_at": str(rep.get("created_at")),
                    "data_classification": "VERIFIED_INCIDENT" if is_verified else "CITIZEN_REPORTED_HAZARD",
                    "data_classification_label": "Verified Municipal Incident" if is_verified else "Citizen-Reported Hazard (Unverified)",
                },
            }
            if is_verified:
                verified_features.append(feat)
            else:
                unverified_features.append(feat)

    # 3. Critical Facilities
    fac_features = []
    for f in raw_facilities.items:
        loc = f.get("location")
        if loc:
            fac_features.append({
                "type": "Feature",
                "geometry": loc,
                "properties": {
                    "id": str(f.get("id")),
                    "name": f.get("name"),
                    "category": f.get("category", "RELIEF_HUB"),
                    "address": f.get("address", ""),
                    "capacity": f.get("capacity"),
                    "is_operational": bool(f.get("is_operational", True)),
                    "contact_phone": f.get("contact_phone"),
                    "data_classification": "SAFE_AVAILABLE_FACILITY",
                    "data_classification_label": "Safe / Verified Emergency Facility",
                },
            })

    # 4. Environmental Sensor Observations
    env_features = []
    for e in raw_env.items:
        loc = e.get("location")
        if loc:
            metrics = e.get("metrics", {})
            env_features.append({
                "type": "Feature",
                "geometry": loc,
                "properties": {
                    "id": str(e.get("id")),
                    "station_id": e.get("station_id"),
                    "source": e.get("source", "IOT_STATION"),
                    "rainfall_mm": float(metrics.get("precipitation_mm", 0.0)),
                    "aqi": float(metrics.get("aqi", 0.0)),
                    "temperature_c": float(metrics.get("temperature_c", 25.0)),
                    "humidity_pct": float(metrics.get("humidity_pct", 70.0)),
                    "wind_speed_kmh": float(metrics.get("wind_speed_kmh", 10.0)),
                    "timestamp": str(e.get("timestamp")),
                    "data_classification": "OBSERVED_ENVIRONMENTAL_CONDITION",
                    "data_classification_label": "Observed Environmental Condition (Raw Sensor)",
                },
            })

    # 5. Evacuation Safe Corridors
    route_features = []
    for r in raw_routes.items:
        path = r.get("path")
        if path:
            route_features.append({
                "type": "Feature",
                "geometry": path,
                "properties": {
                    "id": str(r.get("id")),
                    "name": r.get("name"),
                    "status": r.get("status", "ACTIVE"),
                    "capacity_vehicles_per_hour": int(r.get("capacity_vehicles_per_hour", 1500)),
                    "data_classification": "SAFE_EVACUATION_CORRIDOR",
                    "data_classification_label": "Safe Evacuation Corridor",
                },
            })

    return MapLayersResponse(
        risk_zones=GeoJSONFeatureCollection(features=risk_features),
        citizen_reports=GeoJSONFeatureCollection(features=unverified_features),
        verified_incidents=GeoJSONFeatureCollection(features=verified_features),
        facilities=GeoJSONFeatureCollection(features=fac_features),
        environmental_sensors=GeoJSONFeatureCollection(features=env_features),
        safe_routes=GeoJSONFeatureCollection(features=route_features),
        metadata={
            "center": [lng or 77.5946, lat or 12.9716],
            "radius_km": radius_km,
            "total_features": len(risk_features) + len(unverified_features) + len(verified_features) + len(fac_features) + len(env_features) + len(route_features),
            "attribution": "© OpenStreetMap contributors, © CARTO, TerraGuard GIS Engine",
        },
    )

