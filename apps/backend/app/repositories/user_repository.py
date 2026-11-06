import json
import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path
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

logger = logging.getLogger("terraguard.repository.user")

STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage"
USERS_CACHE_FILE = STORAGE_DIR / "users_cache.json"

DEFAULT_DEMO_USERS: list[dict[str, Any]] = [
    {
        "id": "demo-analyst-uuid-0001",
        "email": "analyst@city.gov",
        "hashed_password": "$2b$12$sMJS2FpUDG6JGC//kzlktuAy1HiCsRVRlecThiNybUaOA9gwyFpIC",  # AnalystPassword2026!
        "full_name": "Analyst - Environmental Team",
        "role": "ANALYST",
        "phone": "+91 98765 43210",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00+00:00",
    },
    {
        "id": "demo-coordinator-uuid-0002",
        "email": "commander@city.gov",
        "hashed_password": "$2b$12$B3OBPTHKWo1UKaJEDdWLhOJaqya2L6CsJ31SZCfLgp2KnJ/NnafHq",  # CommanderPassword2026!
        "full_name": "Commander - Emergency Dispatch",
        "role": "COORDINATOR",
        "phone": "+91 98765 43211",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00+00:00",
    },
    {
        "id": "demo-admin-uuid-0003",
        "email": "admin@city.gov",
        "hashed_password": "$2b$12$4p2O1wLsT/phtI4/l3Au.uJmkp9UgdKq2MVI0Y6zpkHh/ejpJIaOK",  # AdminPassword2026!
        "full_name": "City System Administrator",
        "role": "ADMIN",
        "phone": "+91 98765 43212",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00+00:00",
    },
    {
        "id": "demo-citizen-uuid-0004",
        "email": "citizen@city.gov",
        "hashed_password": "$2b$12$sWGPtmM4zj0fcpI8KmKeGeTHH3H4bOWDe7ov.B8tnAxeAU37dnEsa",  # CitizenPassword2026!
        "full_name": "Citizen Sentinel",
        "role": "CITIZEN",
        "phone": "+91 98765 43213",
        "is_active": True,
        "created_at": "2026-01-01T00:00:00+00:00",
    },
]


class UserRepository:
    """Async repository for User persistence in MongoDB Atlas with resilient local fallback."""

    _in_memory_users: dict[str, dict[str, Any]] = {}
    _initialized: bool = False

    @classmethod
    def _ensure_initialized(cls) -> None:
        """Seeds demo accounts and loads local file-persisted users."""
        if cls._initialized:
            return

        # 1. Seed default demo accounts
        for demo in DEFAULT_DEMO_USERS:
            cls._in_memory_users[demo["id"]] = dict(demo)

        # 2. Load disk-cached users if available
        try:
            if USERS_CACHE_FILE.exists():
                with open(USERS_CACHE_FILE, encoding="utf-8") as f:
                    cached = json.load(f)
                    if isinstance(cached, dict):
                        cls._in_memory_users.update(cached)
                        logger.info("Loaded %d persisted users from local storage cache", len(cached))
        except Exception as e:
            logger.warning("Failed to load local users cache: %s", e)

        cls._initialized = True

    @classmethod
    def _save_cache(cls) -> None:
        """Persists current users to local disk cache to survive restarts."""
        try:
            STORAGE_DIR.mkdir(parents=True, exist_ok=True)
            serializable: dict[str, dict[str, Any]] = {}
            for uid, user in cls._in_memory_users.items():
                copy = dict(user)
                for k, v in copy.items():
                    if isinstance(v, datetime):
                        copy[k] = v.isoformat()
                    elif isinstance(v, ObjectId):
                        copy[k] = str(v)
                serializable[uid] = copy

            with open(USERS_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2)
        except Exception as e:
            logger.warning("Failed to persist users to disk cache: %s", e)

    @classmethod
    async def seed_demo_users_to_db(cls) -> None:
        """Synchronizes demo users into live MongoDB collection if connected."""
        cls._ensure_initialized()
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                for demo in DEFAULT_DEMO_USERS:
                    await db_manager.db["users"].update_one(
                        {"email": demo["email"]},
                        {"$setOnInsert": dict(demo)},
                        upsert=True,
                    )
                logger.info("Successfully synchronized demo accounts to MongoDB Atlas.")
            except Exception as e:
                logger.warning("Failed to sync demo accounts to MongoDB: %s", e)

    @classmethod
    async def find_by_email(cls, email: str) -> dict[str, Any] | None:
        cls._ensure_initialized()
        email_clean = email.strip().lower()

        # 1. Try MongoDB Atlas if connected
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                doc = await db_manager.db["users"].find_one({"email": email_clean})
                if doc:
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    return doc
            except Exception as e:
                logger.warning("MongoDB find_by_email failed, trying local store: %s", e)

        # 2. Check local memory & disk cache
        for user in cls._in_memory_users.values():
            if user.get("email", "").strip().lower() == email_clean:
                return dict(user)

        # 3. Direct demo fallback matching
        for demo in DEFAULT_DEMO_USERS:
            if demo["email"] == email_clean:
                cls._in_memory_users[demo["id"]] = dict(demo)
                return dict(demo)

        return None

    @classmethod
    async def find_by_id(cls, user_id: str) -> dict[str, Any] | None:
        cls._ensure_initialized()

        # 1. Try MongoDB Atlas if connected
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                doc = None
                try:
                    doc = await db_manager.db["users"].find_one({"_id": ObjectId(user_id)})
                except Exception:
                    doc = await db_manager.db["users"].find_one({"id": user_id})
                if doc:
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    return doc
            except Exception as e:
                logger.warning("MongoDB find_by_id failed, trying local store: %s", e)

        # 2. Check local memory
        if user_id in cls._in_memory_users:
            return dict(cls._in_memory_users[user_id])

        # 3. Direct demo fallback matching
        for demo in DEFAULT_DEMO_USERS:
            if demo["id"] == user_id:
                return dict(demo)

        return None

    @classmethod
    async def create(cls, user_data: dict[str, Any]) -> dict[str, Any]:
        cls._ensure_initialized()
        user_data["email"] = user_data["email"].strip().lower()
        now = datetime.now(UTC)
        user_data["created_at"] = now.isoformat()
        user_data["is_active"] = True
        user_data["refresh_token"] = None
        user_data["reset_token"] = None

        user_id = str(uuid.uuid4())
        user_data["id"] = user_id

        # 1. Write to MongoDB if connected
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                result = await db_manager.db["users"].insert_one(dict(user_data))
                user_data["id"] = str(result.inserted_id)
            except Exception as e:
                logger.warning("MongoDB insert_one failed, storing locally: %s", e)

        # 2. Always persist in memory and disk cache
        cls._in_memory_users[user_data["id"]] = dict(user_data)
        cls._save_cache()
        return user_data

    @classmethod
    async def update(cls, user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        cls._ensure_initialized()
        updates["updated_at"] = datetime.now(UTC).isoformat()

        # 1. Update MongoDB if connected
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                try:
                    oid = ObjectId(user_id)
                    await db_manager.db["users"].update_one({"_id": oid}, {"$set": updates})
                except Exception:
                    await db_manager.db["users"].update_one({"id": user_id}, {"$set": updates})
            except Exception as e:
                logger.warning("MongoDB update failed: %s", e)

        # 2. Update memory & disk cache
        if user_id in cls._in_memory_users:
            cls._in_memory_users[user_id].update(updates)
            cls._save_cache()
            return dict(cls._in_memory_users[user_id])

        for demo in DEFAULT_DEMO_USERS:
            if demo["id"] == user_id:
                cls._in_memory_users[user_id] = dict(demo)
                cls._in_memory_users[user_id].update(updates)
                cls._save_cache()
                return dict(cls._in_memory_users[user_id])

        return None

    @classmethod
    async def list_users(cls, page: int = 1, page_size: int = 50) -> tuple[list[dict[str, Any]], int]:
        """Returns paginated users and total count."""
        cls._ensure_initialized()
        if not db_manager.is_fallback() and db_manager.db is not None:
            try:
                total = await db_manager.db["users"].count_documents({})
                cursor = db_manager.db["users"].find({}).skip((page - 1) * page_size).limit(page_size)
                raw = await cursor.to_list(length=page_size)
                results = []
                for d in raw:
                    doc = dict(d)
                    doc["id"] = str(doc.get("_id", doc.get("id")))
                    results.append(doc)
                return results, total
            except Exception as e:
                logger.warning("MongoDB list_users failed, using local store: %s", e)

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
        await cls.update(user_id, {"refresh_token": "REVOKED"})

    @classmethod
    def clear_all_memory(cls) -> None:
        """Utility for test suites."""
        cls._in_memory_users.clear()
        cls._initialized = False
