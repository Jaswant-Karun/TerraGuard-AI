from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.core.database import db_manager
from app.models.collections import CitizenReportModel
from app.repositories.base_repository import BaseRepository, serialize_doc
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

    async def update_status(
        self,
        report_id: str,
        status: str,
        verification_notes: str | None = None,
        verified_by_user_id: str | None = None,
    ) -> dict[str, Any] | None:
        """Update report verification status and audit metadata."""
        update_data: dict[str, Any] = {
            "status": status,
            "updated_at": datetime.now(UTC),
        }
        if verification_notes is not None:
            update_data["verification_notes"] = verification_notes
        if verified_by_user_id is not None:
            update_data["verified_by_user_id"] = verified_by_user_id

        if not db_manager.is_fallback() and db_manager.db is not None:
            query: dict[str, Any] = {"id": report_id}
            if ObjectId.is_valid(report_id):
                query = {"$or": [{"_id": ObjectId(report_id)}, {"id": report_id}]}

            result = await db_manager.db[self.collection_name].find_one_and_update(
                query,
                {"$set": update_data},
                return_document=True,
            )
            return serialize_doc(result) if result else None

        # In-memory update
        store = self._get_memory_store()
        if report_id in store:
            store[report_id].update(update_data)
            return serialize_doc(store[report_id])
        return None

    async def find_filtered(
        self,
        category: str | None = None,
        status: str | None = None,
        is_duplicate: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        """Query reports with filtering and pagination."""
        query: dict[str, Any] = {}
        if category:
            query["category"] = category
        if status:
            query["status"] = status
        if is_duplicate is not None:
            query["is_potential_duplicate"] = is_duplicate

        if not db_manager.is_fallback() and db_manager.db is not None:
            total = await db_manager.db[self.collection_name].count_documents(query)
            cursor = (
                db_manager.db[self.collection_name]
                .find(query)
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )
            docs = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in docs], total

        # In-memory filtering
        store = self._get_memory_store()
        filtered = list(store.values())
        if category:
            filtered = [r for r in filtered if r.get("category") == category]
        if status:
            filtered = [r for r in filtered if r.get("status") == status]
        if is_duplicate is not None:
            filtered = [r for r in filtered if r.get("is_potential_duplicate") == is_duplicate]

        # Sort descending by created_at
        filtered.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        total = len(filtered)
        paged = filtered[skip : skip + limit]
        return [serialize_doc(d) for d in paged], total

    async def list_reports(
        self, status: str | None = None, limit: int = 50
    ) -> list[dict[str, Any]]:
        items, _ = await self.find_filtered(status=status, limit=limit)
        return items


citizen_reports_repository = CitizenReportsRepository()
