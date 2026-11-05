from datetime import UTC, datetime
from typing import Any

from app.core.database import db_manager, serialize_doc
from app.models.collections import ResponseTaskModel
from app.repositories.base_repository import BaseRepository

SAMPLE_RESPONSE_TASKS = [
    {
        "id": "TASK-DISPATCH-001",
        "_id": "TASK-DISPATCH-001",
        "title": "Deploy Dewatering Pump Unit 3 — Sony World Junction",
        "incident_id": "REP-KOR-01",
        "assigned_department": "MUNICIPAL_STORMWATER_CORPS",
        "assigned_to_user_id": "usr_coord_01",
        "status": "DISPATCHED",
        "priority": "HIGH",
        "location": {"type": "Point", "coordinates": [77.6245, 12.9352]},
        "instructions": "Clear debris from primary intake culvert #4 and activate auxiliary suction pump.",
        "created_at": datetime.now(UTC),
    },
    {
        "id": "TASK-DISPATCH-002",
        "_id": "TASK-DISPATCH-002",
        "title": "Emergency Evacuation Barricade — Yemalur Feeder",
        "incident_id": "REP-BEL-02",
        "assigned_department": "TRAFFIC_POLICE_DISASTER_WING",
        "assigned_to_user_id": "usr_coord_01",
        "status": "IN_PROGRESS",
        "priority": "URGENT",
        "location": {"type": "Point", "coordinates": [77.6711, 12.9348]},
        "instructions": "Divert light motor vehicles to north arterial corridor; close submerged underpass.",
        "created_at": datetime.now(UTC),
    },
]


class ResponseTasksRepository(BaseRepository):
    """Repository dedicated to municipal field response tasks and action orders."""

    def __init__(self) -> None:
        super().__init__("response_tasks")
        self._ensure_sample_tasks()

    def _ensure_sample_tasks(self) -> None:
        """Seeds initial response tasks in fallback memory store if empty."""
        store = self._get_memory_store()
        if not store:
            for task in SAMPLE_RESPONSE_TASKS:
                task_id = task["id"]
                store[task_id] = dict(task)

    async def list_tasks(
        self,
        status: str | None = None,
        assigned_department: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {}
        if status:
            query["status"] = status
        if assigned_department:
            query["assigned_department"] = assigned_department

        if not db_manager.is_fallback() and db_manager.db is not None:
            cursor = db_manager.db["response_tasks"].find(query).sort("created_at", -1).limit(limit)
            raw = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in raw]

        store = self._get_memory_store()
        results = []
        for d in store.values():
            if status and d.get("status") != status:
                continue
            if assigned_department and d.get("assigned_department") != assigned_department:
                continue
            results.append(serialize_doc(d))

        results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return results[:limit]

    async def create_task(self, model: ResponseTaskModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        return await self.create(data)

    async def update_task_status(
        self, task_id: str, new_status: str, notes: str | None = None
    ) -> dict[str, Any] | None:
        update_data: dict[str, Any] = {"status": new_status}
        if new_status == "COMPLETED":
            update_data["completed_at"] = datetime.now(UTC).isoformat()
        if notes:
            update_data["completion_notes"] = notes
        return await self.update(task_id, update_data)


response_tasks_repository = ResponseTasksRepository()
