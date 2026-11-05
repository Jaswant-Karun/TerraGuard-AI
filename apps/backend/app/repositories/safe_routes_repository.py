from typing import Any

from app.core.database import db_manager, haversine_distance_meters
from app.models.collections import SafeRouteModel
from app.repositories.base_repository import BaseRepository, serialize_doc


class SafeRoutesRepository(BaseRepository):
    """Repository dedicated to designated municipal safe evacuation corridors."""

    def __init__(self) -> None:
        super().__init__("safe_routes")
        self._ensure_sample_data()

    def _ensure_sample_data(self) -> None:
        """Seeds initial verified evacuation corridors in memory fallback store if empty."""
        store = self._get_memory_store()
        if not store:
            sample_corridor = {
                "name": "Koramangala-to-Hudson Safe High-Ground Corridor",
                "status": "ACTIVE",
                "path": {
                    "type": "LineString",
                    "coordinates": [
                        [77.6245, 12.9352],
                        [77.6100, 12.9500],
                        [77.5990, 12.9650],
                        [77.5946, 12.9716],
                    ],
                },
                "avoid_hazard_categories": ["FLOOD", "WATERLOGGING"],
                "capacity_vehicles_per_hour": 2200,
                "origin_zone": "BLR-ZONE-SILKBOARD-02",
                "destination_shelter_id": "BBMP-CENTRAL-SHELTER",
                "is_sample": True,
            }
            corridor_id = "SR-CORRIDOR-BLR-01"
            sample_corridor["id"] = corridor_id
            sample_corridor["_id"] = corridor_id
            store[corridor_id] = sample_corridor

    async def create_route(self, model: SafeRouteModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        return await self.create(data)

    async def list_active_corridors(self, limit: int = 50) -> list[dict[str, Any]]:
        """Returns active municipal evacuation corridors."""
        if not db_manager.is_fallback() and db_manager.db is not None:
            cursor = db_manager.db["safe_routes"].find({"status": "ACTIVE"}).limit(limit)
            raw = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in raw]

        store = self._get_memory_store()
        results = [
            serialize_doc(doc)
            for doc in store.values()
            if doc.get("status") == "ACTIVE"
        ]
        return results[:limit]

    async def find_near_coordinate(
        self, lng: float, lat: float, radius_meters: float = 15000.0, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Finds corridors whose origin or destination is within radius."""
        corridors = await self.list_active_corridors(limit=50)
        matched = []
        for c in corridors:
            path = c.get("path", {})
            coords = path.get("coordinates", [])
            if not coords:
                continue
            origin = coords[0]
            dest = coords[-1]
            dist_origin = haversine_distance_meters(lng, lat, origin[0], origin[1])
            dist_dest = haversine_distance_meters(lng, lat, dest[0], dest[1])
            min_dist = min(dist_origin, dist_dest)
            if min_dist <= radius_meters:
                item = dict(c)
                item["proximity_meters"] = round(min_dist, 1)
                matched.append(item)

        matched.sort(key=lambda x: x.get("proximity_meters", 999999))
        return matched[:limit]


safe_routes_repository = SafeRoutesRepository()
