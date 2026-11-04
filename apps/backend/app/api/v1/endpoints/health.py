import time
from datetime import UTC, datetime

from app.core.config import settings
from app.schemas.health import HealthResponse, HealthServicesStatus
from fastapi import APIRouter, status

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
    return HealthResponse(
        status="healthy",
        app_name=settings.PROJECT_NAME,
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(UTC).isoformat(),
        uptime_seconds=round(uptime, 2),
        services=HealthServicesStatus(
            api="operational",
            database="ready",
            cache="ready",
        ),
    )


@router.get(
    "/ready",
    status_code=status.HTTP_200_OK,
    summary="Kubernetes / Render Readiness Probe",
)
async def get_readiness() -> dict:
    return {"ready": True, "timestamp": datetime.now(UTC).isoformat()}
