import json
import logging
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.core.database import db_manager
from app.models.collections import CitizenReportModel
from app.repositories.base_repository import BaseRepository, serialize_doc
from app.repositories.geospatial_repository import geospatial_repository

try:
    from bson import ObjectId
except ImportError:
    class ObjectId:  # type: ignore
        def __init__(self, val: Any = None) -> None:
            self.val = str(val) if val else ""

        def __str__(self) -> str:
            return self.val

        def __repr__(self) -> str:
            return f"ObjectId('{self.val}')"

        @staticmethod
        def is_valid(val: Any) -> bool:
            return isinstance(val, str) and len(val) == 24

logger = logging.getLogger("terraguard.reports_repo")
STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage"
REPORTS_CACHE_FILE = STORAGE_DIR / "reports_cache.json"


class CitizenReportsRepository(BaseRepository):
    """Repository for public hazard submissions and incident verifications."""

    def __init__(self) -> None:
        super().__init__("citizen_reports")
        self._load_cache()

    def _save_cache(self) -> None:
        """Persists current in-memory reports to disk cache so they survive container restarts."""
        try:
            STORAGE_DIR.mkdir(parents=True, exist_ok=True)
            store = self._get_memory_store()
            serializable: dict[str, Any] = {}
            for k, doc in store.items():
                copy = dict(doc)
                for prop, val in copy.items():
                    if isinstance(val, datetime):
                        copy[prop] = val.isoformat()
                    elif isinstance(val, ObjectId):
                        copy[prop] = str(val)
                serializable[k] = copy
            with open(REPORTS_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2)
        except Exception as e:
            logger.warning("Failed to save citizen reports disk cache: %s", e)

    def _load_cache(self) -> None:
        """Loads cached reports from disk into memory on startup."""
        try:
            if REPORTS_CACHE_FILE.exists():
                with open(REPORTS_CACHE_FILE, encoding="utf-8") as f:
                    data = json.load(f)
                    store = self._get_memory_store()
                    store.update(data)
                    logger.info("Loaded %d citizen reports from persistent disk cache.", len(data))
        except Exception as e:
            logger.warning("Failed to load citizen reports disk cache: %s", e)

    async def create_report(self, model: CitizenReportModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        res = await self.create(data)
        # Always mirror in memory store and persist to disk cache
        store = self._get_memory_store()
        doc_id = res.get("id") or str(res.get("_id", ""))
        if doc_id:
            store[doc_id] = dict(res)
            self._save_cache()
        return res

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
            self._save_cache()
            return serialize_doc(store[report_id])
        return None

    async def update(self, doc_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        res = await super().update(doc_id, updates)
        if res and "id" in res:
            store = self._get_memory_store()
            store[res["id"]] = dict(res)
            self._save_cache()
        return res

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

    @classmethod
    def clear_all_memory(cls) -> None:
        """Utility for test suites."""
        if "citizen_reports" in db_manager._collections_data:
            db_manager._collections_data["citizen_reports"].clear()
        if REPORTS_CACHE_FILE.exists():
            try:
                REPORTS_CACHE_FILE.unlink()
            except Exception:
                pass


citizen_reports_repository = CitizenReportsRepository()
