import math
import uuid
from datetime import UTC, datetime
from typing import Any

try:
    from bson import ObjectId
except ImportError:
    class ObjectId:  # type: ignore
        def __init__(self, val: Any = None) -> None:
            self.val = str(val) if val else str(uuid.uuid4())

        def __str__(self) -> str:
            return self.val

        def __repr__(self) -> str:
            return f"ObjectId('{self.val}')"

from app.core.database import db_manager
from app.schemas.pagination import PaginatedResponse


def serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Ensures MongoDB ObjectId is converted to string 'id' and dates are ISO formatted."""
    cleaned = dict(doc)
    if "_id" in cleaned:
        cleaned["id"] = str(cleaned.pop("_id"))
    elif "id" not in cleaned:
        cleaned["id"] = str(uuid.uuid4())

    # Ensure ISO string representation for datetimes in responses if needed
    for k, v in list(cleaned.items()):
        if isinstance(v, datetime):
            cleaned[k] = v.isoformat()
    return cleaned


class BaseRepository:
    """Base async repository providing standard CRUD, pagination, and multi-mode persistence."""

    def __init__(self, collection_name: str) -> None:
        self.collection_name = collection_name

    def _get_memory_store(self) -> dict[str, dict[str, Any]]:
        if self.collection_name not in db_manager._collections_data:
            db_manager._collections_data[self.collection_name] = {}
        return db_manager._collections_data[self.collection_name]

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        """Inserts a new document into MongoDB or in-memory store."""
        item = dict(data)
        if "created_at" not in item:
            item["created_at"] = datetime.now(UTC)

        if not db_manager.is_fallback() and db_manager.db is not None:
            result = await db_manager.db[self.collection_name].insert_one(item)
            item["id"] = str(result.inserted_id)
            item.pop("_id", None)
            return item

        # In-memory storage
        doc_id = item.get("id") or str(uuid.uuid4())
        item["id"] = doc_id
        self._get_memory_store()[doc_id] = item
        return item

    async def find_by_id(self, doc_id: str) -> dict[str, Any] | None:
        """Finds a single document by string ID or ObjectId."""
        if not db_manager.is_fallback() and db_manager.db is not None:
            doc = None
            try:
                if ObjectId.is_valid(doc_id):
                    doc = await db_manager.db[self.collection_name].find_one({"_id": ObjectId(doc_id)})
            except Exception:
                pass

            if not doc:
                doc = await db_manager.db[self.collection_name].find_one({"id": doc_id})

            if doc:
                return serialize_doc(doc)
            return None

        # In-memory storage
        store = self._get_memory_store()
        doc = store.get(doc_id)
        if not doc:
            # Check by internal ObjectId/string match
            for item in store.values():
                if item.get("id") == doc_id or item.get("_id") == doc_id:
                    doc = item
                    break
        return serialize_doc(doc) if doc else None

    async def update(self, doc_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Updates fields of a document and updates 'updated_at'."""
        upd = dict(updates)
        upd["updated_at"] = datetime.now(UTC)

        if not db_manager.is_fallback() and db_manager.db is not None:
            filter_q: dict[str, Any] = {"id": doc_id}
            try:
                if ObjectId.is_valid(doc_id):
                    existing = await db_manager.db[self.collection_name].find_one({"_id": ObjectId(doc_id)})
                    if existing:
                        filter_q = {"_id": ObjectId(doc_id)}
            except Exception:
                pass

            res = await db_manager.db[self.collection_name].update_one(filter_q, {"$set": upd})
            if res.matched_count == 0:
                res = await db_manager.db[self.collection_name].update_one({"id": doc_id}, {"$set": upd})
            if res.matched_count == 0:
                return None
            return await self.find_by_id(doc_id)

        # In-memory storage
        store = self._get_memory_store()
        target_id = doc_id
        if target_id not in store:
            for k, item in store.items():
                if item.get("id") == doc_id or item.get("_id") == doc_id:
                    target_id = k
                    break

        if target_id in store:
            store[target_id].update(upd)
            return serialize_doc(store[target_id])
        return None

    async def delete(self, doc_id: str) -> bool:
        """Deletes a document by ID."""
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                oid = ObjectId(doc_id)
                filter_q = {"_id": oid}
            except Exception:
                filter_q = {"id": doc_id}

            res = await db_manager.db[self.collection_name].delete_one(filter_q)
            return res.deleted_count > 0

        # In-memory storage
        store = self._get_memory_store()
        if doc_id in store:
            del store[doc_id]
            return True
        return False

    async def count(self, filter_query: dict[str, Any] | None = None) -> int:
        """Counts documents matching filter."""
        query = filter_query or {}
        if not db_manager.is_fallback() and db_manager.db is not None:
            return await db_manager.db[self.collection_name].count_documents(query)

        # In-memory filtering count
        return len(self._filter_memory(query))

    async def find_paginated(
        self,
        filter_query: dict[str, Any] | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_field: str = "created_at",
        sort_asc: bool = False,
    ) -> PaginatedResponse[dict[str, Any]]:
        """Returns paginated results with calculated total, page_size, and total_pages."""
        query = filter_query or {}
        skip = (page - 1) * page_size

        if not db_manager.is_fallback() and db_manager.db is not None:
            col = db_manager.db[self.collection_name]
            total = await col.count_documents(query)
            cursor = (
                col.find(query)
                .sort(sort_field, 1 if sort_asc else -1)
                .skip(skip)
                .limit(page_size)
            )
            raw_items = await cursor.to_list(length=page_size)
            items = [serialize_doc(i) for i in raw_items]
        else:
            filtered = self._filter_memory(query)
            # Sort memory items
            filtered.sort(
                key=lambda x: str(x.get(sort_field, "")),
                reverse=not sort_asc,
            )
            total = len(filtered)
            items = [serialize_doc(i) for i in filtered[skip : skip + page_size]]

        total_pages = math.ceil(total / page_size) if total > 0 else 1
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

    def _filter_memory(self, query: dict[str, Any]) -> list[dict[str, Any]]:
        """Simple in-memory filter matching key-value pairs."""
        store = self._get_memory_store()
        matches = []
        for doc in store.values():
            match = True
            for k, v in query.items():
                if k.startswith("$"):
                    continue
                doc_val = doc.get(k)
                if isinstance(v, dict):
                    if "$gte" in v and not (doc_val is not None and doc_val >= v["$gte"]):
                        match = False
                        break
                    if "$lte" in v and not (doc_val is not None and doc_val <= v["$lte"]):
                        match = False
                        break
                    if "$in" in v and doc_val not in v["$in"]:
                        match = False
                        break
                elif doc_val != v:
                    match = False
                    break
            if match:
                matches.append(doc)
        return matches

    def clear_memory(self) -> None:
        """Utility for test suites."""
        store = self._get_memory_store()
        store.clear()

