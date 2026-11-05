import uuid
from datetime import UTC, datetime
from typing import Any

from bson import ObjectId

from app.core.database import db_manager


class UserRepository:
    """Async repository for User persistence in MongoDB Atlas."""

    _in_memory_users: dict[str, dict[str, Any]] = {}

    @classmethod
    async def find_by_email(cls, email: str) -> dict[str, Any] | None:
        email_clean = email.strip().lower()
        if not db_manager.is_fallback() and db_manager.db is not None:
            doc = await db_manager.db["users"].find_one({"email": email_clean})
            if doc:
                doc["id"] = str(doc.get("_id"))
                return doc
            return None

        # Fallback in-memory
        for user in cls._in_memory_users.values():
            if user.get("email") == email_clean:
                return user
        return None

    @classmethod
    async def find_by_id(cls, user_id: str) -> dict[str, Any] | None:
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                oid = ObjectId(user_id)
                doc = await db_manager.db["users"].find_one({"_id": oid})
                if doc:
                    doc["id"] = str(doc.get("_id"))
                    return doc
            except Exception:
                pass
            return None

        # Fallback in-memory
        return cls._in_memory_users.get(user_id)

    @classmethod
    async def create(cls, user_data: dict[str, Any]) -> dict[str, Any]:
        user_data["email"] = user_data["email"].strip().lower()
        user_data["created_at"] = datetime.now(UTC)
        user_data["is_active"] = True
        user_data["refresh_token"] = None
        user_data["reset_token"] = None

        if not db_manager.is_fallback() and db_manager.db is not None:
            result = await db_manager.db["users"].insert_one(user_data)
            user_data["id"] = str(result.inserted_id)
            return user_data

        # Fallback in-memory
        user_id = str(uuid.uuid4())
        user_data["id"] = user_id
        cls._in_memory_users[user_id] = user_data
        return user_data

    @classmethod
    async def update(cls, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        updates["updated_at"] = datetime.now(UTC)
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                oid = ObjectId(user_id)
                await db_manager.db["users"].update_one({"_id": oid}, {"$set": updates})
                return await cls.find_by_id(user_id)
            except Exception:
                return None

        # Fallback in-memory
        if user_id in cls._in_memory_users:
            cls._in_memory_users[user_id].update(updates)
            return cls._in_memory_users[user_id]
        return None

    @classmethod
    async def list_users(cls, page: int = 1, page_size: int = 50) -> tuple[list[dict[str, Any]], int]:
        """Returns paginated users and total count."""
        if not db_manager.is_fallback() and db_manager.db is not None:
            total = await db_manager.db["users"].count_documents({})
            cursor = db_manager.db["users"].find({}).skip((page - 1) * page_size).limit(page_size)
            raw = await cursor.to_list(length=page_size)
            results = []
            for d in raw:
                doc = dict(d)
                doc["id"] = str(doc.get("_id"))
                results.append(doc)
            return results, total

        # Fallback in-memory
        users = list(cls._in_memory_users.values())
        total = len(users)
        start = (page - 1) * page_size
        return users[start : start + page_size], total

    @classmethod
    async def save_refresh_token(cls, user_id: str, refresh_token: str) -> None:
        await cls.update(user_id, {"refresh_token": refresh_token})

    @classmethod
    async def revoke_refresh_token(cls, user_id: str) -> None:
        await cls.update(user_id, {"refresh_token": None})

    @classmethod
    async def clear_all_memory(cls) -> None:
        """Utility for test suites."""
        cls._in_memory_users.clear()
