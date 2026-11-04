import time
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, status

from app.core.config import settings
from app.core.database import db_manager
from app.schemas.health import HealthResponse, HealthServicesStatus

router = APIRouter()

START_TIME = time.time()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health Check",
    description="Returns high-level system availability, uptime, and subservice health.",
)
async def get_health() -> HealthResponse:
    uptime = time.time() - START_TIME
    db_ping = await db_manager.ping()
    db_status = "operational" if db_ping.get("status") in ["healthy", "degraded_in_memory"] else "unhealthy"

    return HealthResponse(
        status="healthy",
        app_name=settings.PROJECT_NAME,
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(UTC).isoformat(),
        uptime_seconds=round(uptime, 2),
        services=HealthServicesStatus(
            api="operational",
            database=db_status,
            cache="ready",
        ),
    )


@router.get(
    "/health/db",
    status_code=status.HTTP_200_OK,
    summary="MongoDB Cluster Connection Probe",
    description="Returns latency and reachability of MongoDB Atlas or in-memory fallback.",
)
async def get_db_health() -> dict[str, Any]:
    return await db_manager.ping()


@router.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    summary="Kubernetes / Render Readiness Probe",
)
async def get_readiness() -> dict[str, Any]:
    return {"ready": True, "timestamp": datetime.now(UTC).isoformat()}
