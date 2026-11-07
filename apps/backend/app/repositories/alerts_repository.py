from datetime import UTC, datetime
from typing import Any

from app.core.database import db_manager
from app.models.collections import AlertModel
from app.repositories.base_repository import BaseRepository, serialize_doc

SAMPLE_ALERTS = [
    {
        "id": "ALT-BLR-001",
        "_id": "ALT-BLR-001",
        "title": "Flash Flood Red Advisory — Bellandur & Outer Ring Road",
        "message": "High water levels detected in storm runoff channels. Evacuate subterranean parking structures immediately. Follow approved evacuation routes.",
        "severity": "HIGH",
        "target_zone": "BLR-ZONE-BELLANDUR-01",
        "location": {"type": "Point", "coordinates": [77.6680, 12.9360]},
        "radius_km": 6.5,
        "channels": ["SMS", "TELEGRAM", "DASHBOARD", "SIREN"],
        "is_active": True,
        "is_verified": True,
        "verified_by_user_id": "usr_coord_01",
        "acknowledged_by": [],
        "created_at": datetime.now(UTC),
    },
    {
        "id": "ALT-BLR-002",
        "_id": "ALT-BLR-002",
        "title": "Air Quality Alert — PM2.5 Spike across Peenya Sector",
        "message": "Particulate pollution levels exceed 240 µg/m³. Vulnerable citizens and seniors advised to remain indoors.",
        "severity": "MODERATE",
        "target_zone": "BLR-ZONE-PEENYA-03",
        "location": {"type": "Point", "coordinates": [77.5255, 13.0305]},
        "radius_km": 4.0,
        "channels": ["TELEGRAM", "DASHBOARD"],
        "is_active": True,
        "is_verified": True,
        "verified_by_user_id": "usr_coord_01",
        "acknowledged_by": [],
        "created_at": datetime.now(UTC),
    },
]


class AlertsRepository(BaseRepository):
    """Repository managing municipal hazard sirens and public emergency advisories."""

    def __init__(self) -> None:
        super().__init__("alerts")
        self._ensure_sample_alerts()

    def _ensure_sample_alerts(self) -> None:
        """Seeds sample alerts in memory fallback if empty."""
        store = self._get_memory_store()
        if not store:
            for alt in SAMPLE_ALERTS:
                alt_id = alt["id"]
                store[alt_id] = dict(alt)

    async def list_alerts(
        self,
        target_zone: str | None = None,
        min_severity: str | None = None,
        is_active: bool | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {}
        if target_zone:
            query["target_zone"] = target_zone
        if is_active is not None:
            query["is_active"] = is_active
        if min_severity:
            query["severity"] = min_severity

        if not db_manager.is_fallback() and db_manager.db is not None:
            count = await db_manager.db["alerts"].count_documents({})
            if count == 0:
                for s in SAMPLE_ALERTS:
                    s_doc = dict(s)
                    s_doc["created_at"] = datetime.now(UTC)
                    await db_manager.db["alerts"].insert_one(s_doc)
            cursor = db_manager.db["alerts"].find(query).sort("created_at", -1).limit(limit)
            raw = await cursor.to_list(length=limit)
            return [serialize_doc(d) for d in raw]

        store = self._get_memory_store()
        results = []
        for d in store.values():
            if target_zone and d.get("target_zone") != target_zone:
                continue
            if is_active is not None and d.get("is_active") != is_active:
                continue
            if min_severity and d.get("severity") != min_severity:
                continue
            results.append(serialize_doc(d))

        results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return results[:limit]

    async def create_alert(self, model: AlertModel) -> dict[str, Any]:
        data = model.model_dump(exclude_none=True)
        if "is_verified" not in data:
            data["is_verified"] = False
        if "acknowledged_by" not in data:
            data["acknowledged_by"] = []
        return await self.create(data)

    async def acknowledge_alert(self, alert_id: str, user_id: str) -> dict[str, Any] | None:
        """Adds user_id to acknowledged_by list."""
        if not db_manager.is_fallback() and db_manager.db is not None:
            from bson import ObjectId
            criteria = {"$or": [{"id": alert_id}, {"_id": alert_id}]}
            if ObjectId.is_valid(alert_id):
                criteria["$or"].append({"_id": ObjectId(alert_id)})
            await db_manager.db["alerts"].update_one(
                criteria,
                {"$addToSet": {"acknowledged_by": user_id}},
            )
            found = await self.find_by_id(alert_id)
            if not found:
                for s in SAMPLE_ALERTS:
                    if s.get("id") == alert_id:
                        s_doc = dict(s)
                        s_doc["acknowledged_by"] = [user_id]
                        await db_manager.db["alerts"].insert_one(s_doc)
                        return serialize_doc(s_doc)
            return found

        doc = await self.find_by_id(alert_id)
        if not doc:
            for s in SAMPLE_ALERTS:
                if s.get("id") == alert_id:
                    doc = dict(s)
                    self._get_memory_store()[s["id"]] = doc
                    break
        if doc:
            acks = doc.get("acknowledged_by", [])
            if user_id not in acks:
                acks.append(user_id)
                doc["acknowledged_by"] = acks
                await self.update(doc["id"], {"acknowledged_by": acks})
        return doc

    async def verify_alert(self, alert_id: str, verified_by_user_id: str) -> dict[str, Any] | None:
        """Marks alert as administratively approved/verified."""
        update_data = {
            "is_verified": True,
            "verified_by_user_id": verified_by_user_id,
            "verified_at": datetime.now(UTC).isoformat(),
        }
        return await self.update(alert_id, update_data)

    async def deactivate_alert(self, alert_id: str) -> dict[str, Any] | None:
        """Deactivates an active alert."""
        return await self.update(alert_id, {"is_active": False, "deactivated_at": datetime.now(UTC).isoformat()})


alerts_repository = AlertsRepository()
