from datetime import UTC, datetime
from typing import Any

from app.core.database import db_manager, serialize_doc
from app.repositories.base_repository import BaseRepository


class NotificationPreferencesRepository(BaseRepository):
    """Repository managing user notification preferences and subscribed geographical areas."""

    def __init__(self) -> None:
        super().__init__("notification_preferences")

    async def get_or_create(self, user_id: str) -> dict[str, Any]:
        """Retrieves user settings or creates defaults."""
        if not db_manager.is_fallback() and db_manager.db is not None:
            doc = await db_manager.db["notification_preferences"].find_one({"user_id": user_id})
            if doc:
                return serialize_doc(doc)
            default_pref = {
                "user_id": user_id,
                "email_enabled": True,
                "sms_enabled": False,
                "telegram_enabled": True,
                "min_severity_alert": 3,
                "monitored_zones": ["BLR-ZONE-BELLANDUR-01", "BLR-ZONE-SILKBOARD-02"],
                "updated_at": datetime.now(UTC),
            }
            res = await db_manager.db["notification_preferences"].insert_one(default_pref)
            default_pref["id"] = str(res.inserted_id)
            return default_pref

        store = self._get_memory_store()
        for doc in store.values():
            if doc.get("user_id") == user_id:
                return serialize_doc(doc)

        default_pref = {
            "user_id": user_id,
            "email_enabled": True,
            "sms_enabled": False,
            "telegram_enabled": True,
            "min_severity_alert": 3,
            "monitored_zones": ["BLR-ZONE-BELLANDUR-01", "BLR-ZONE-SILKBOARD-02"],
            "updated_at": datetime.now(UTC),
        }
        return await self.create(default_pref)

    async def update_preferences(
        self, user_id: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        updates["updated_at"] = datetime.now(UTC)
        current = await self.get_or_create(user_id)
        return await self.update(current["id"], updates)


class NotificationsRepository(BaseRepository):
    """Repository storing in-app user notifications and read/unread flags."""

    def __init__(self) -> None:
        super().__init__("notifications")
        self._ensure_sample_notifications()

    def _ensure_sample_notifications(self) -> None:
        store = self._get_memory_store()
        if not store:
            sample_notifs = [
                {
                    "id": "NOTIF-01",
                    "_id": "NOTIF-01",
                    "user_id": "usr_citizen_01",
                    "title": "Waterlogging Alert in Monitored Zone",
                    "message": "High water levels detected in storm runoff channels near Bellandur Basin.",
                    "severity": "HIGH",
                    "target_zone": "BLR-ZONE-BELLANDUR-01",
                    "is_read": False,
                    "created_at": datetime.now(UTC),
                },
                {
                    "id": "NOTIF-02",
                    "_id": "NOTIF-02",
                    "user_id": "usr_citizen_01",
                    "title": "Safe Navigation Alternative Available",
                    "message": "Secondary high-ground route active around Indiranagar 100ft road congestion.",
                    "severity": "MODERATE",
                    "target_zone": "BLR-ZONE-SILKBOARD-02",
                    "is_read": True,
                    "created_at": datetime.now(UTC),
                },
            ]
            for n in sample_notifs:
                store[n["id"]] = n

    async def list_user_notifications(
        self, user_id: str, unread_only: bool = False, limit: int = 50
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"$or": [{"user_id": user_id}, {"user_id": "ALL"}]}
        if unread_only:
            query["is_read"] = False

        if not db_manager.is_fallback() and db_manager.db is not None:
            cursor = db_manager.db["notifications"].find(query).sort("created_at", -1).limit(limit)
            raw = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in raw]

        store = self._get_memory_store()
        results = [
            serialize_doc(d)
            for d in store.values()
            if (d.get("user_id") in [user_id, "ALL"])
            and (not unread_only or not d.get("is_read", False))
        ]
        results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return results[:limit]

    async def mark_read(self, notification_id: str, user_id: str) -> dict[str, Any] | None:
        return await self.update(notification_id, {"is_read": True})

    async def mark_all_read(self, user_id: str) -> int:
        if not db_manager.is_fallback() and db_manager.db is not None:
            res = await db_manager.db["notifications"].update_many(
                {"$or": [{"user_id": user_id}, {"user_id": "ALL"}], "is_read": False},
                {"$set": {"is_read": True}},
            )
            return res.modified_count

        store = self._get_memory_store()
        count = 0
        for d in store.values():
            if d.get("user_id") in [user_id, "ALL"] and not d.get("is_read", False):
                d["is_read"] = True
                count += 1
        return count


notification_preferences_repository = NotificationPreferencesRepository()
notifications_repository = NotificationsRepository()
