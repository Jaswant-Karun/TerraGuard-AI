from datetime import UTC, datetime
from typing import Any

from app.core.database import db_manager
from app.repositories.base_repository import BaseRepository, serialize_doc


class AuditLogsRepository(BaseRepository):
    """Repository storing tamper-proof administrative security and audit logs."""

    def __init__(self) -> None:
        super().__init__("audit_logs")

    async def log_action(
        self,
        action: str,
        actor_user_id: str | None,
        resource: str,
        resource_id: str | None = None,
        details: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> dict[str, Any]:
        """Appends a new immutable audit trail entry."""
        entry = {
            "action": action,
            "actor_user_id": actor_user_id,
            "resource": resource,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "created_at": datetime.now(UTC),
        }
        return await self.create(entry)

    async def list_logs(
        self,
        action: str | None = None,
        resource: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        query: dict[str, Any] = {}
        if action:
            query["action"] = action
        if resource:
            query["resource"] = resource

        if not db_manager.is_fallback() and db_manager.db is not None:
            total = await db_manager.db["audit_logs"].count_documents(query)
            cursor = (
                db_manager.db["audit_logs"]
                .find(query)
                .sort("created_at", -1)
                .skip(offset)
                .limit(limit)
            )
            raw = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in raw], total

        store = self._get_memory_store()
        matches = [
            serialize_doc(doc)
            for doc in store.values()
            if (not action or doc.get("action") == action)
            and (not resource or doc.get("resource") == resource)
        ]
        matches.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return matches[offset : offset + limit], len(matches)


audit_logs_repository = AuditLogsRepository()
