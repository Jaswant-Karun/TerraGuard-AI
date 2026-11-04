from typing import Any
from app.models.collections import CitizenReportModel
from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import geospatial_repository


class CitizenReportsRepository(BaseRepository):
    """Repository for public hazard submissions and incident verifications."""

    def __init__(self) -> None:
        super().__init__("citizen_reports")

    async def create_report(self, model: CitizenReportModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        return await self.create(data)

    async def find_near(
        self,
        lng: float,
        lat: float,
        radius_meters: float = 5000.0,
        category: str | None = None,
        status: str | None = None,
        min_severity: int = 1,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return await geospatial_repository.find_reports_near(
            lng=lng,
            lat=lat,
            radius_meters=radius_meters,
            category=category,
            status=status,
            min_severity=min_severity,
            limit=limit,
        )


citizen_reports_repository = CitizenReportsRepository()
