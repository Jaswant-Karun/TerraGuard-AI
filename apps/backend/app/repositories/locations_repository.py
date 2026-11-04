from typing import Any

from app.models.collections import LocationModel
from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import geospatial_repository


class LocationsRepository(BaseRepository):
    """Repository dedicated to critical urban facilities, hospitals, and shelters."""

    def __init__(self) -> None:
        super().__init__("locations")

    async def create_location(self, model: LocationModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        return await self.create(data)

    async def find_nearby(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 10000.0,
        category: str | None = None,
        operational_only: bool = True,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return await geospatial_repository.find_nearby_facilities(
            lng=lng,
            lat=lat,
            radius_meters=radius_meters,
            category=category,
            operational_only=operational_only,
            limit=limit,
        )


locations_repository = LocationsRepository()
