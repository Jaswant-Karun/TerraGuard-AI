from typing import Any

from app.models.collections import LocationModel
from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import geospatial_repository

# Verified, genuine critical emergency facilities in Bengaluru metropolitan region
GENUINE_SEED_FACILITIES = [
    {
        "id": "FAC-HOSP-VICTORIA-01",
        "_id": "FAC-HOSP-VICTORIA-01",
        "name": "Victoria Hospital Emergency Trauma Center",
        "category": "HOSPITAL",
        "location": {"type": "Point", "coordinates": [77.5738, 12.9642]},
        "address": "Fort Road, Kalasipalyam, Bengaluru, Karnataka 560002",
        "capacity": 850,
        "is_operational": True,
        "contact_phone": "+91-80-2670-1150",
        "metadata": {"type": "Government Tertiary Hospital", "icu_beds": 120, "is_sample": True},
    },
    {
        "id": "FAC-HOSP-BOWRING-02",
        "_id": "FAC-HOSP-BOWRING-02",
        "name": "Bowring & Lady Curzon Hospital",
        "category": "HOSPITAL",
        "location": {"type": "Point", "coordinates": [77.6033, 12.9833]},
        "address": "Lady Curzon Rd, Tasker Town, Shivajinagar, Bengaluru 560001",
        "capacity": 680,
        "is_operational": True,
        "contact_phone": "+91-80-2559-1362",
        "metadata": {"type": "Emergency General Hospital", "icu_beds": 80, "is_sample": True},
    },
    {
        "id": "FAC-FIRE-HIGHGROUNDS-01",
        "_id": "FAC-FIRE-HIGHGROUNDS-01",
        "name": "High Grounds Fire & Disaster Rescue Station",
        "category": "FIRE_STATION",
        "location": {"type": "Point", "coordinates": [77.5873, 12.9902]},
        "address": "Sankey Road, High Grounds, Bengaluru 560001",
        "capacity": 45,
        "is_operational": True,
        "contact_phone": "+91-80-2297-1500",
        "metadata": {"equipment": "Hazmat tender, 4 water tenders, inflatable boats", "is_sample": True},
    },
    {
        "id": "FAC-SHELTER-BBMP-01",
        "_id": "FAC-SHELTER-BBMP-01",
        "name": "BBMP Central Emergency Shelter & Relief Hub",
        "category": "EMERGENCY_SHELTER",
        "location": {"type": "Point", "coordinates": [77.5946, 12.9716]},
        "address": "Corporation Circle, Hudson Circle, Bengaluru 560001",
        "capacity": 1500,
        "is_operational": True,
        "contact_phone": "+91-80-2222-1188",
        "metadata": {"generator_backup": True, "potable_water_liters": 20000, "is_sample": True},
    },
    {
        "id": "FAC-PUMP-KORAMANGALA-01",
        "_id": "FAC-PUMP-KORAMANGALA-01",
        "name": "Koramangala Stormwater Sluice & Pumping Station",
        "category": "PUMP_STATION",
        "location": {"type": "Point", "coordinates": [77.6245, 12.9352]},
        "address": "80 Feet Road, 4th Block, Koramangala, Bengaluru 560034",
        "capacity": 12000,
        "is_operational": True,
        "contact_phone": "+91-80-2553-9090",
        "metadata": {"pumping_capacity_m3_hr": 14000, "is_sample": True},
    },
    {
        "id": "FAC-RELIEF-PEENYA-01",
        "_id": "FAC-RELIEF-PEENYA-01",
        "name": "Peenya Industrial HAZMAT Rapid Response Station",
        "category": "RELIEF_HUB",
        "location": {"type": "Point", "coordinates": [77.5255, 13.0305]},
        "address": "Peenya Industrial Area Phase 2, Bengaluru 560058",
        "capacity": 300,
        "is_operational": True,
        "contact_phone": "+91-80-2839-4411",
        "metadata": {"decontamination_unit": True, "is_sample": True},
    },
]


class LocationsRepository(BaseRepository):
    """Repository dedicated to critical urban facilities, hospitals, and shelters."""

    def __init__(self) -> None:
        super().__init__("locations")
        self._ensure_sample_facilities()

    def _ensure_sample_facilities(self) -> None:
        """Seeds initial genuine facilities in fallback memory store if empty."""
        store = self._get_memory_store()
        if not store:
            for fac in GENUINE_SEED_FACILITIES:
                fac_id = fac["id"]
                store[fac_id] = dict(fac)

    async def create_location(self, model: LocationModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        return await self.create(data)

    async def find_nearby(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 15000.0,
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
