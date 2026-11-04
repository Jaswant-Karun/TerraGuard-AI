from typing import Any
from app.models.collections import RiskAssessmentModel
from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import geospatial_repository


class RiskAssessmentsRepository(BaseRepository):
    """Repository for AI-calculated risk polygon zones and spatial threat indices."""

    def __init__(self) -> None:
        super().__init__("risk_assessments")

    async def create_assessment(self, model: RiskAssessmentModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        return await self.create(data)

    async def find_within_polygon(
        self,
        polygon_coords: list[list[float]],
        min_risk_level: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        return await geospatial_repository.find_risk_zones_within(
            polygon_coords=polygon_coords,
            min_risk_level=min_risk_level,
            limit=limit,
        )


risk_assessments_repository = RiskAssessmentsRepository()
