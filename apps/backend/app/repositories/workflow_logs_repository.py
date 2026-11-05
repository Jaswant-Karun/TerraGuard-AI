from datetime import UTC, datetime
from typing import Any

from app.core.database import db_manager
from app.models.collections import WorkflowLogModel
from app.repositories.base_repository import BaseRepository, serialize_doc


class WorkflowLogsRepository(BaseRepository):
    """Repository for persisting and querying n8n workflow execution receipts."""

    def __init__(self) -> None:
        super().__init__("workflow_logs")

    async def log_execution(
        self,
        workflow_id: str,
        trigger_event: str,
        status: str = "SUCCESS",
        payload: dict[str, Any] | None = None,
        duration_ms: int = 0,
    ) -> dict[str, Any]:
        log_model = WorkflowLogModel(
            workflow_id=workflow_id,
            trigger_event=trigger_event,
            status=status,  # type: ignore[arg-type]
            payload=payload or {},
            executed_at=datetime.now(UTC),
            execution_duration_ms=duration_ms,
        )
        return await self.create(log_model.model_dump(exclude_none=True))

    async def find_filtered(
        self,
        workflow_id: str | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        query: dict[str, Any] = {}
        if workflow_id:
            query["workflow_id"] = workflow_id
        if status:
            query["status"] = status

        if not db_manager.is_fallback() and db_manager.db is not None:
            total = await db_manager.db[self.collection_name].count_documents(query)
            cursor = (
                db_manager.db[self.collection_name]
                .find(query)
                .sort("executed_at", -1)
                .skip(skip)
                .limit(limit)
            )
            docs = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in docs], total

        # In-memory store
        store = self._get_memory_store()
        filtered = list(store.values())
        if workflow_id:
            filtered = [r for r in filtered if r.get("workflow_id") == workflow_id]
        if status:
            filtered = [r for r in filtered if r.get("status") == status]

        filtered.sort(key=lambda x: str(x.get("executed_at", "")), reverse=True)
        total = len(filtered)
        paged = filtered[skip : skip + limit]
        return [serialize_doc(d) for d in paged], total


workflow_logs_repository = WorkflowLogsRepository()

