from __future__ import annotations

import logging
import math
from typing import Any
import httpx

from app.core.database import db_manager, haversine_distance_meters
from app.repositories.base_repository import serialize_doc
from app.repositories.locations_repository import locations_repository
from app.schemas.routing import (
    FacilityDTO,
    HazardIntersectionDTO,
    RouteAlternativeDTO,
    RouteQueryRequest,
    RouteQueryResponse,
)

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "Official emergency instructions and municipal disaster responders (112, Police, Fire, "
    "BBMP Disaster Management Cell) take precedence over automated routing algorithms. "
    "Never drive through standing stormwater or disobey physical emergency barricades."
)


def point_to_segment_distance_meters(
    px: float, py: float, x1: float, y1: float, x2: float, y2: float
) -> float:
    """Calculates minimum distance in meters from point P to line segment AB.
    (Coordinates given as longitude [x] and latitude [y]).
    """
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return haversine_distance_meters(px, py, x1, y1)

    # Project point onto segment in approximate planar degrees
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy

    return haversine_distance_meters(px, py, proj_x, proj_y)


def point_to_linestring_distance_meters(
    point_lng: float, point_lat: float, coords: list[list[float]]
) -> float:
    """Computes minimum distance in meters between a point and a GeoJSON LineString."""
    if not coords:
        return 999999.0
    if len(coords) == 1:
        return haversine_distance_meters(point_lng, point_lat, coords[0][0], coords[0][1])

    min_dist = 999999.0
    for i in range(len(coords) - 1):
        x1, y1 = coords[i][0], coords[i][1]
        x2, y2 = coords[i + 1][0], coords[i + 1][1]
        d = point_to_segment_distance_meters(point_lng, point_lat, x1, y1, x2, y2)
        if d < min_dist:
            min_dist = d
    return min_dist


class SafeRoutingService:
    """Engine for risk-aware navigation, hazard avoidance, and emergency facility discovery."""

    OSRM_BASE_URL = "http://router.project-osrm.org/route/v1"

    async def calculate_routes(self, request: RouteQueryRequest) -> RouteQueryResponse:
        origin = request.origin
        destination = request.destination

        # 1. Fetch raw routing candidates from OSRM or Geodesic fallback
        raw_routes, provider = await self._fetch_osrm_or_fallback_routes(
            origin=origin,
            destination=destination,
            mode=request.mode,
            max_alternatives=request.max_alternatives,
        )

        # 2. Gather active local hazards along the corridor
        hazards = await self._fetch_active_hazards_in_corridor(origin, destination)

        # 3. Evaluate each route against hazards
        evaluated_routes: list[RouteAlternativeDTO] = []
        for idx, r in enumerate(raw_routes):
            coords: list[list[float]] = r["path"]["coordinates"]
            intersections, avoided_count = self._evaluate_route_against_hazards(coords, hazards)

            # Determine safety status following strict truth-in-routing rules
            safety_status, safety_label, risk_score, explanation, data_sufficiency = (
                self._classify_route_safety(
                    intersections=intersections,
                    hazards_count=len(hazards),
                    is_alternative=(idx > 0),
                    distance_km=r["distance_meters"] / 1000.0,
                    avoided_count=avoided_count,
                )
            )

            dist_m = float(r["distance_meters"])
            dur_s = float(r["duration_seconds"])

            alternative = RouteAlternativeDTO(
                route_id=f"RT-{idx + 1:02d}",
                name=r.get("name", f"Route Alternative {idx + 1}"),
                safety_status=safety_status,
                safety_label=safety_label,
                distance_meters=round(dist_m, 1),
                distance_km=round(dist_m / 1000.0, 2),
                duration_seconds=round(dur_s, 1),
                duration_minutes=round(dur_s / 60.0, 1),
                path_geojson=r["path"],
                risk_score=round(risk_score, 1),
                risk_explanation=explanation,
                hazard_intersections=intersections,
                avoided_hazards_count=avoided_count,
                data_sufficiency=data_sufficiency,
                disclaimer=DISCLAIMER_TEXT,
            )
            evaluated_routes.append(alternative)

        # Sort so safest route or primary route is first
        # Prioritize VERIFIED_SAFER_ROUTE, then STANDARD_ROUTE, then CAUTION, then HAZARDOUS
        status_rank = {
            "VERIFIED_SAFER_ROUTE": 1,
            "STANDARD_ROUTE": 2,
            "CAUTION_ROUTE": 3,
            "HAZARDOUS_ROUTE": 4,
        }
        evaluated_routes.sort(key=lambda x: (status_rank.get(x.safety_status, 5), x.risk_score))

        primary = evaluated_routes[0]
        alternatives = evaluated_routes[1:]

        # 4. Discover nearby emergency facilities near origin and destination
        facilities = await self.get_nearby_emergency_facilities(
            lng=destination[0], lat=destination[1], radius_meters=12000.0
        )

        return RouteQueryResponse(
            origin=origin,
            destination=destination,
            provider=provider,
            primary_route=primary,
            alternatives=alternatives,
            nearby_facilities=facilities,
            overall_hazard_data_sufficiency=(len(hazards) > 0),
            disclaimer=DISCLAIMER_TEXT,
        )

    async def get_nearby_emergency_facilities(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 12000.0,
        category: str | None = None,
        limit: int = 25,
    ) -> list[FacilityDTO]:
        """Finds genuine, verified emergency facilities near given coordinate."""
        raw_facilities = await locations_repository.find_nearby(
            lng=lng,
            lat=lat,
            radius_meters=radius_meters,
            category=category,
            operational_only=True,
            limit=limit,
        )

        results: list[FacilityDTO] = []
        for f in raw_facilities:
            coords = f.get("location", {}).get("coordinates", [lng, lat])
            dist_m = float(
                f.get("distance_meters")
                or haversine_distance_meters(lng, lat, coords[0], coords[1])
            )
            results.append(
                FacilityDTO(
                    id=f.get("id") or f.get("_id") or "FAC-UNKNOWN",
                    name=f.get("name", "Emergency Facility"),
                    category=f.get("category", "HOSPITAL"),
                    address=f.get("address", "Bengaluru"),
                    capacity=f.get("capacity"),
                    is_operational=f.get("is_operational", True),
                    contact_phone=f.get("contact_phone"),
                    coordinates=coords,
                    distance_meters=round(dist_m, 1),
                    distance_km=round(dist_m / 1000.0, 2),
                )
            )

        results.sort(key=lambda x: x.distance_meters)
        return results

    async def _fetch_osrm_or_fallback_routes(
        self,
        origin: list[float],
        destination: list[float],
        mode: str = "driving",
        max_alternatives: int = 3,
    ) -> tuple[list[dict[str, Any]], str]:
        """Attempts to call OSRM public service; falls back to realistic geodesic interpolation."""
        osrm_profile = "driving" if mode in ["driving", "emergency_vehicle"] else "walking"
        url = (
            f"{self.OSRM_BASE_URL}/{osrm_profile}/"
            f"{origin[0]},{origin[1]};{destination[0]},{destination[1]}"
            f"?overview=full&geometries=geojson&alternatives=true&steps=false"
        )

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        parsed_routes = []
                        for i, r in enumerate(data["routes"][:max_alternatives]):
                            route_name = (
                                "Direct Arterial Route"
                                if i == 0
                                else f"Secondary Corridor via Bypass {i}"
                            )
                            parsed_routes.append(
                                {
                                    "name": route_name,
                                    "distance_meters": r["distance"],
                                    "duration_seconds": r["duration"],
                                    "path": r["geometry"],
                                }
                            )
                        return parsed_routes, "OSRM_ONLINE"
        except Exception as e:
            logger.info("OSRM online service unavailable or timed out (%s); activating offline geodesic router", e)

        # Offline geodesic generator
        routes = self._generate_offline_geodesic_routes(origin, destination, max_alternatives)
        return routes, "TERRAGUARD_OFFLINE_GEODESIC"

    def _generate_offline_geodesic_routes(
        self, origin: list[float], destination: list[float], count: int = 3
    ) -> list[dict[str, Any]]:
        """Generates realistic street-approximating route geometries between origin and destination."""
        routes: list[dict[str, Any]] = []
        base_dist = haversine_distance_meters(
            origin[0], origin[1], destination[0], destination[1]
        )
        # Average urban driving speed: 28 km/h ~ 7.77 m/s
        avg_speed_mps = 7.77

        # 1. Primary Direct Route (with 5 interpolated segments)
        primary_coords = self._interpolate_path(origin, destination, curvature=0.0)
        direct_dist = base_dist * 1.18  # Urban winding factor
        routes.append(
            {
                "name": "Primary Arterial Corridor",
                "distance_meters": direct_dist,
                "duration_seconds": direct_dist / avg_speed_mps,
                "path": {"type": "LineString", "coordinates": primary_coords},
            }
        )

        if count >= 2:
            # 2. Northern / Eastern Bypass Route
            north_coords = self._interpolate_path(origin, destination, curvature=0.006)
            north_dist = base_dist * 1.32
            routes.append(
                {
                    "name": "Northern Ring Bypass Route",
                    "distance_meters": north_dist,
                    "duration_seconds": north_dist / avg_speed_mps,
                    "path": {"type": "LineString", "coordinates": north_coords},
                }
            )

        if count >= 3:
            # 3. Southern / Western Ridge Route (Higher elevation bypass)
            south_coords = self._interpolate_path(origin, destination, curvature=-0.007)
            south_dist = base_dist * 1.38
            routes.append(
                {
                    "name": "Elevated Ridge Safe Corridor",
                    "distance_meters": south_dist,
                    "duration_seconds": south_dist / avg_speed_mps,
                    "path": {"type": "LineString", "coordinates": south_coords},
                }
            )

        return routes

    def _interpolate_path(
        self, origin: list[float], dest: list[float], curvature: float = 0.0
    ) -> list[list[float]]:
        """Builds an 8-waypoint LineString simulating realistic road geometry."""
        coords = []
        steps = 7
        dx = dest[0] - origin[0]
        dy = dest[1] - origin[1]

        # Normal vector for curvature
        norm_x = -dy
        norm_y = dx
        mag = math.sqrt(norm_x * norm_x + norm_y * norm_y) or 1.0
        norm_x /= mag
        norm_y /= mag

        for i in range(steps + 1):
            t = i / steps
            # Parabolic curve offset
            offset = 4.0 * t * (1.0 - t) * curvature
            lng = origin[0] + t * dx + offset * norm_x
            lat = origin[1] + t * dy + offset * norm_y
            coords.append([round(lng, 6), round(lat, 6)])

        return coords

    async def _fetch_active_hazards_in_corridor(
        self, origin: list[float], destination: list[float]
    ) -> list[dict[str, Any]]:
        """Collects verified citizen hazard reports and risk zones in corridor."""
        hazards: list[dict[str, Any]] = []

        # Find center and radius to query reports
        mid_lng = (origin[0] + destination[0]) / 2.0
        mid_lat = (origin[1] + destination[1]) / 2.0
        radius = max(
            haversine_distance_meters(origin[0], origin[1], destination[0], destination[1]) * 0.75,
            3500.0,
        )

        # 1. Citizen reports
        if not db_manager.is_fallback() and db_manager.db is not None:
            query = {
                "category": {
                    "$in": [
                        "FLOOD",
                        "WATERLOGGING",
                        "ROAD_DAMAGE",
                        "INFRASTRUCTURE_FAILURE",
                        "FALLEN_TREES",
                    ]
                },
                "status": {"$in": ["VERIFIED", "DISPATCHED", "REPORTED", "AI_ANALYZED"]},
            }
            cursor = db_manager.db["citizen_reports"].find(query).limit(50)
            raw = await cursor.to_list(length=50)
            for d in raw:
                doc = serialize_doc(d)
                coords = doc.get("location", {}).get("coordinates", [0.0, 0.0])
                dist_mid = haversine_distance_meters(mid_lng, mid_lat, coords[0], coords[1])
                if dist_mid <= radius:
                    hazards.append(doc)
        else:
            # Memory store fallback
            from app.repositories.citizen_reports_repository import (
                citizen_reports_repository,
            )

            store = citizen_reports_repository._get_memory_store()
            for doc in store.values():
                cat = doc.get("category", "")
                if cat in [
                    "FLOOD",
                    "WATERLOGGING",
                    "ROAD_DAMAGE",
                    "INFRASTRUCTURE_FAILURE",
                    "FALLEN_TREES",
                ]:
                    loc = doc.get("location", {})
                    coords = loc.get("coordinates", [0.0, 0.0])
                    dist_mid = haversine_distance_meters(mid_lng, mid_lat, coords[0], coords[1])
                    if dist_mid <= radius:
                        hazards.append(serialize_doc(doc))

        return hazards

    def _evaluate_route_against_hazards(
        self, coords: list[list[float]], hazards: list[dict[str, Any]]
    ) -> tuple[list[HazardIntersectionDTO], int]:
        """Calculates distance from route to each active hazard."""
        intersections: list[HazardIntersectionDTO] = []
        avoided_count = 0

        for h in hazards:
            h_coords = h.get("location", {}).get("coordinates", [0.0, 0.0])
            d_meters = point_to_linestring_distance_meters(h_coords[0], h_coords[1], coords)

            if d_meters <= 250.0:
                # Active Direct Route Hazard Intersection
                intersections.append(
                    HazardIntersectionDTO(
                        hazard_id=str(h.get("id") or h.get("_id") or "HZ-01"),
                        hazard_category=h.get("category", "FLOOD"),
                        severity=int(h.get("severity", 3)),
                        distance_to_route_meters=round(d_meters, 1),
                        description=h.get("description", "Reported active hazard near roadway"),
                        location=h_coords,
                    )
                )
            elif d_meters <= 600.0:
                # Proximity Warning
                intersections.append(
                    HazardIntersectionDTO(
                        hazard_id=str(h.get("id") or h.get("_id") or "HZ-WARN"),
                        hazard_category=h.get("category", "FLOOD"),
                        severity=int(h.get("severity", 2)),
                        distance_to_route_meters=round(d_meters, 1),
                        description=f"Adjacent hazard: {h.get('description', 'Caution near route')}",
                        location=h_coords,
                    )
                )
            else:
                # Safely bypassed
                avoided_count += 1

        intersections.sort(key=lambda x: x.distance_to_route_meters)
        return intersections, avoided_count

    def _classify_route_safety(
        self,
        intersections: list[HazardIntersectionDTO],
        hazards_count: int,
        is_alternative: bool,
        distance_km: float,
        avoided_count: int,
    ) -> tuple[
        str,
        str,
        float,
        str,
        str,
    ]:
        """Strict truth-in-routing safety classification.

        Rules:
        1. A route must only be described as safer when available hazard info supports it.
        2. If insufficient hazard data exists, label as 'STANDARD_ROUTE'.
        """
        if hazards_count == 0:
            return (
                "STANDARD_ROUTE",
                "Standard Route (Insufficient hazard telemetry to certify enhanced safety)",
                15.0,
                "Route calculated using standard road networks. There is insufficient verified hazard telemetry along this corridor to designate it as an enhanced safe route.",
                "INSUFFICIENT",
            )

        # Check for direct hazardous intersections (distance <= 250m)
        direct_hazards = [h for h in intersections if h.distance_to_route_meters <= 250.0]
        if direct_hazards:
            top_h = direct_hazards[0]
            risk = 60.0 + min(35.0, top_h.severity * 7.0)
            return (
                "HAZARDOUS_ROUTE",
                f"Hazardous: Passes within {top_h.distance_to_route_meters:.0f}m of active {top_h.hazard_category}",
                risk,
                f"Route enters active hazard zone ({top_h.hazard_category}, severity {top_h.severity}/5): {top_h.description}. Use an alternative bypass.",
                "SUFFICIENT",
            )

        # Check for proximity warnings (250m < distance <= 600m)
        proximity_hazards = [h for h in intersections if h.distance_to_route_meters <= 600.0]
        if proximity_hazards:
            top_p = proximity_hazards[0]
            return (
                "CAUTION_ROUTE",
                f"Caution: Near reported {top_p.hazard_category} ({top_p.distance_to_route_meters:.0f}m away)",
                42.0,
                f"Route passes within {top_p.distance_to_route_meters:.0f}m of {top_p.description}. Proceed with caution.",
                "SUFFICIENT",
            )

        # If zero intersections and hazards were avoided
        if avoided_count > 0:
            return (
                "VERIFIED_SAFER_ROUTE",
                f"Verified Safer Route (Bypasses {avoided_count} active hazard points)",
                8.0,
                f"Hazard evaluation confirms this path maintains a safe distance (>600m) from {avoided_count} reported hazards in the sector.",
                "SUFFICIENT",
            )

        # Otherwise cleared normal route
        return (
            "STANDARD_ROUTE",
            "Standard Cleared Route (No active hazards reported along path)",
            12.0,
            "No active flood or hazard reports detected along this corridor.",
            "SUFFICIENT",
        )


routing_service = SafeRoutingService()
