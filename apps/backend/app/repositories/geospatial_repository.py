import math
from typing import Any

from app.core.database import db_manager, haversine_distance_meters
from app.repositories.base_repository import BaseRepository, serialize_doc


def point_in_polygon(x: float, y: float, polygon_ring: list[list[float]]) -> bool:
    """Ray-casting algorithm to determine if point (x, y) = (lng, lat) is inside polygon ring."""
    n = len(polygon_ring)
    if n < 3:
        return False
    inside = False
    p1x, p1y = polygon_ring[0]
    for i in range(1, n + 1):
        p2x, p2y = polygon_ring[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    else:
                        xinters = p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside


def polygon_intersects_polygon(ring1: list[list[float]], ring2: list[list[float]]) -> bool:
    """Checks if two polygons intersect or overlap by checking vertices inside rings or bounding box overlap."""
    # 1. Check if any vertex of ring1 is inside ring2
    for pt in ring1:
        if point_in_polygon(pt[0], pt[1], ring2):
            return True
    # 2. Check if any vertex of ring2 is inside ring1
    for pt in ring2:
        if point_in_polygon(pt[0], pt[1], ring1):
            return True

    # 3. Check bounding box overlap as fallback
    min_x1 = min(p[0] for p in ring1)
    max_x1 = max(p[0] for p in ring1)
    min_y1 = min(p[1] for p in ring1)
    max_y1 = max(p[1] for p in ring1)

    min_x2 = min(p[0] for p in ring2)
    max_x2 = max(p[0] for p in ring2)
    min_y2 = min(p[1] for p in ring2)
    max_y2 = max(p[1] for p in ring2)

    return not (max_x1 < min_x2 or min_x1 > max_x2 or max_y1 < min_y2 or min_y1 > max_y2)


class GeospatialRepository:
    """Repository handling 2dsphere proximity, radius, and polygon boundary queries."""

    def __init__(self) -> None:
        self.locations_repo = BaseRepository("locations")
        self.reports_repo = BaseRepository("citizen_reports")
        self.risks_repo = BaseRepository("risk_assessments")
        self.alerts_repo = BaseRepository("alerts")
        self.events_repo = BaseRepository("historical_events")
        self.routes_repo = BaseRepository("safe_routes")

    async def find_nearby_facilities(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 10000.0,
        category: str | None = None,
        operational_only: bool = True,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Queries the 'locations' collection for facilities within radius."""
        query: dict[str, Any] = {}
        if category:
            query["category"] = category
        if operational_only:
            query["is_operational"] = True

        if not db_manager.is_fallback() and db_manager.db is not None:
            query["location"] = {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius_meters,
                }
            }
            cursor = db_manager.db["locations"].find(query).limit(limit)
            raw = await cursor.to_list(length=limit)
            results = []
            for doc in raw:
                cleaned = serialize_doc(doc)
                coords = cleaned.get("location", {}).get("coordinates", [0.0, 0.0])
                dist = haversine_distance_meters(lng, lat, coords[0], coords[1])
                cleaned["distance_meters"] = round(dist, 1)
                cleaned["distance_km"] = round(dist / 1000.0, 2)
                results.append(cleaned)
            return results

        # In-memory fallback
        store = self.locations_repo._get_memory_store()
        matches = []
        for doc in store.values():
            if category and doc.get("category") != category:
                continue
            if operational_only and not doc.get("is_operational", True):
                continue
            loc = doc.get("location", {})
            coords = loc.get("coordinates", [0.0, 0.0])
            dist = haversine_distance_meters(lng, lat, coords[0], coords[1])
            if dist <= radius_meters:
                item = serialize_doc(doc)
                item["distance_meters"] = round(dist, 1)
                item["distance_km"] = round(dist / 1000.0, 2)
                matches.append(item)

        matches.sort(key=lambda x: x["distance_meters"])
        return matches[:limit]

    async def find_reports_near(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 5000.0,
        category: str | None = None,
        status: str | None = None,
        min_severity: int = 1,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Finds citizen hazard reports near a geographical location."""
        query: dict[str, Any] = {"severity": {"$gte": min_severity}}
        if category:
            query["category"] = category
        if status:
            query["status"] = status

        if not db_manager.is_fallback() and db_manager.db is not None:
            query["location"] = {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius_meters,
                }
            }
            cursor = db_manager.db["citizen_reports"].find(query).limit(limit)
            raw = await cursor.to_list(length=limit)
            results = []
            for doc in raw:
                cleaned = serialize_doc(doc)
                coords = cleaned.get("location", {}).get("coordinates", [0.0, 0.0])
                dist = haversine_distance_meters(lng, lat, coords[0], coords[1])
                cleaned["distance_meters"] = round(dist, 1)
                cleaned["distance_km"] = round(dist / 1000.0, 2)
                results.append(cleaned)
            return results

        # In-memory fallback
        store = self.reports_repo._get_memory_store()
        matches = []
        for doc in store.values():
            if category and doc.get("category") != category:
                continue
            if status and doc.get("status") != status:
                continue
            if doc.get("severity", 1) < min_severity:
                continue
            loc = doc.get("location", {})
            coords = loc.get("coordinates", [0.0, 0.0])
            dist = haversine_distance_meters(lng, lat, coords[0], coords[1])
            if dist <= radius_meters:
                item = serialize_doc(doc)
                item["distance_meters"] = round(dist, 1)
                item["distance_km"] = round(dist / 1000.0, 2)
                matches.append(item)

        matches.sort(key=lambda x: x["distance_meters"])
        return matches[:limit]

    async def find_risk_zones_within(
        self,
        polygon_coords: list[list[float]],
        min_risk_level: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Finds calculated risk zones within or intersecting a specified area boundary."""
        query: dict[str, Any] = {}
        if min_risk_level:
            query["risk_level"] = min_risk_level

        if not db_manager.is_fallback() and db_manager.db is not None:
            query["boundary"] = {
                "$geoWithin": {
                    "$geometry": {
                        "type": "Polygon",
                        "coordinates": [polygon_coords],
                    }
                }
            }
            cursor = db_manager.db["risk_assessments"].find(query).limit(limit)
            raw = await cursor.to_list(length=limit)
            return [serialize_doc(doc) for doc in raw]

        # In-memory fallback
        store = self.risks_repo._get_memory_store()
        matches = []
        for doc in store.values():
            if min_risk_level and doc.get("risk_level") != min_risk_level:
                continue
            boundary = doc.get("boundary", {})
            rings = boundary.get("coordinates", [])
            if rings and len(rings) > 0:
                target_ring = rings[0]
                if polygon_intersects_polygon(target_ring, polygon_coords):
                    matches.append(serialize_doc(doc))
        return matches[:limit]

    async def find_historical_events_near(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 25000.0,
        event_type: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Finds historical natural disaster and extreme weather occurrences for model comparison."""
        query: dict[str, Any] = {}
        if event_type:
            query["event_type"] = event_type

        if not db_manager.is_fallback() and db_manager.db is not None:
            query["location"] = {
                "$nearSphere": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": radius_meters,
                }
            }
            cursor = db_manager.db["historical_events"].find(query).limit(limit)
            raw = await cursor.to_list(length=limit)
            results = []
            for doc in raw:
                cleaned = serialize_doc(doc)
                coords = cleaned.get("location", {}).get("coordinates", [0.0, 0.0])
                dist = haversine_distance_meters(lng, lat, coords[0], coords[1])
                cleaned["distance_meters"] = round(dist, 1)
                cleaned["distance_km"] = round(dist / 1000.0, 2)
                results.append(cleaned)
            return results

        # In-memory fallback
        store = self.events_repo._get_memory_store()
        matches = []
        for doc in store.values():
            if event_type and doc.get("event_type") != event_type:
                continue
            loc = doc.get("location", {})
            coords = loc.get("coordinates", [0.0, 0.0])
            dist = haversine_distance_meters(lng, lat, coords[0], coords[1])
            if dist <= radius_meters:
                item = serialize_doc(doc)
                item["distance_meters"] = round(dist, 1)
                item["distance_km"] = round(dist / 1000.0, 2)
                matches.append(item)

        matches.sort(key=lambda x: x["distance_meters"])
        return matches[:limit]

    async def get_database_stats(self) -> dict[str, Any]:
        """Provides statistical metrics across all collections for monitoring & command cockpit."""
        counts = {}
        for col_name in db_manager.COLLECTIONS:
            repo = BaseRepository(col_name)
            counts[col_name] = await repo.count()

        ping_status = await db_manager.ping()
        return {
            "database": ping_status.get("database", "terraguard"),
            "mode": ping_status.get("mode", "in_memory_fallback"),
            "connected": ping_status.get("connected", False),
            "latency_ms": ping_status.get("latency_ms"),
            "collections": counts,
            "total_documents": sum(counts.values()),
        }


geospatial_repository = GeospatialRepository()
