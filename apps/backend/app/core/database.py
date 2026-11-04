import logging
from typing import Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("terraguard.database")


class DatabaseManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None
    _in_memory_collections: dict[str, list[dict[str, Any]]] = {}
    _use_fallback: bool = False

    @classmethod
    async def connect(cls) -> None:
        """Initializes connection to MongoDB Atlas."""
        try:
            logger.info("Connecting to MongoDB Atlas at %s...", settings.DATABASE_NAME)
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
            )
            cls.db = cls.client[settings.DATABASE_NAME]
            # Ping database to verify connection
            await cls.client.admin.command("ping")
            cls._use_fallback = False
            logger.info("Successfully connected to MongoDB Atlas database [%s]", settings.DATABASE_NAME)
        except Exception as err:
            logger.warning(
                "MongoDB Atlas unreachable (%s). Initializing async resilient in-memory storage fallback.",
                str(err),
            )
            cls._use_fallback = True

    @classmethod
    async def disconnect(cls) -> None:
        """Closes the MongoDB connection pool."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase | None:
        return cls.db

    @classmethod
    def is_fallback(cls) -> bool:
        return cls._use_fallback


db_manager = DatabaseManager()
