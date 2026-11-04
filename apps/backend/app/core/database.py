import logging
import math
from typing import Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("terraguard.database")


def haversine_distance_meters(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculates great-circle distance between two points on Earth in meters."""
    radius_earth_m = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return radius_earth_m * c


class DatabaseManager:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None
    _use_fallback: bool = False
    _collections_data: dict[str, dict[str, dict[str, Any]]] = {}

    COLLECTIONS = [
        "users",
        "locations",
        "environmental_data",
        "risk_assessments",
        "citizen_reports",
        "alerts",
        "safe_routes",
        "response_tasks",
        "workflow_logs",
        "historical_events",
        "notification_preferences",
        "audit_logs",
    ]

    @classmethod
    async def connect(cls) -> None:
        """Initializes connection to MongoDB Atlas with connection pooling."""
        # Ensure memory stores exist for all collections
        for col in cls.COLLECTIONS:
            if col not in cls._collections_data:
                cls._collections_data[col] = {}

        try:
            logger.info("Initializing MongoDB Atlas connection pool for [%s]...", settings.DATABASE_NAME)
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=50,
                minPoolSize=10,
                maxIdleTimeMS=45000,
                serverSelectionTimeoutMS=2000,
            )
            cls.db = cls.client[settings.DATABASE_NAME]
            # Ping database to verify live cluster reachability
            await cls.client.admin.command("ping")
            cls._use_fallback = False
            logger.info("MongoDB Atlas connection pool established. Creating indexes...")
            await cls.init_indexes()
        except Exception as err:
            logger.warning(
                "MongoDB Atlas unreachable (%s). Initializing async resilient in-memory storage.",
                str(err),
            )
            cls._use_fallback = True

    @classmethod
    async def init_indexes(cls) -> None:
        """Programmatically provisions 2dsphere and compound indexes on MongoDB collections."""
        if cls._use_fallback or cls.db is None:
            return

        try:
            # 1. 2dsphere Geospatial Indexes
            await cls.db["locations"].create_index([("location", "2dsphere")])
            await cls.db["environmental_data"].create_index([("location", "2dsphere")])
            await cls.db["risk_assessments"].create_index([("boundary", "2dsphere")])
            await cls.db["citizen_reports"].create_index([("location", "2dsphere")])
            await cls.db["alerts"].create_index([("location", "2dsphere")])
            await cls.db["safe_routes"].create_index([("path", "2dsphere")])
            await cls.db["response_tasks"].create_index([("location", "2dsphere")])
            await cls.db["historical_events"].create_index([("location", "2dsphere")])

            # 2. Compound and Performance Query Indexes
            await cls.db["users"].create_index("email", unique=True)
            await cls.db["citizen_reports"].create_index([("status", 1), ("created_at", -1)])
            await cls.db["citizen_reports"].create_index([("category", 1), ("severity", -1)])
            await cls.db["environmental_data"].create_index([("station_id", 1), ("timestamp", -1)])
            await cls.db["environmental_data"].create_index([("timestamp", -1)])
            await cls.db["risk_assessments"].create_index("zone_code", unique=True)
            await cls.db["alerts"].create_index([("is_active", 1), ("created_at", -1)])
            await cls.db["audit_logs"].create_index([("timestamp", -1), ("action", 1)])
            logger.info("MongoDB 2dsphere and compound indexes provisioned successfully.")
        except Exception as err:
            logger.warning("Index provisioning note: %s", str(err))

    @classmethod
    async def ping(cls) -> dict[str, Any]:
        """Pings the database and returns connection latency and health details."""
        if cls._use_fallback or cls.client is None:
            return {
                "status": "degraded_in_memory",
                "mode": "in_memory_fallback",
                "connected": False,
                "collections_ready": len(cls.COLLECTIONS),
            }

        try:
            import time
            start = time.perf_counter()
            await cls.client.admin.command("ping")
            latency_ms = round((time.perf_counter() - start) * 1000.0, 2)
            return {
                "status": "healthy",
                "mode": "mongodb_atlas",
                "connected": True,
                "latency_ms": latency_ms,
                "database": settings.DATABASE_NAME,
            }
        except Exception as err:
            return {
                "status": "unhealthy",
                "mode": "mongodb_atlas",
                "connected": False,
                "error": str(err),
            }

    @classmethod
    async def disconnect(cls) -> None:
        """Closes the MongoDB connection pool."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB Atlas connection pool closed.")

    @classmethod
    def get_database(cls) -> AsyncIOMotorDatabase | None:
        return cls.db

    @classmethod
    def is_fallback(cls) -> bool:
        return cls._use_fallback

    @classmethod
    def clear_all_memory(cls) -> None:
        """Clears in-memory test stores."""
        for col in cls.COLLECTIONS:
            cls._collections_data[col] = {}


db_manager = DatabaseManager()
