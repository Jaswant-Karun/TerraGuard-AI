from fastapi import APIRouter
from app.api.v1.endpoints import health

api_v1_router = APIRouter()

# Mount health & diagnostic endpoints
api_v1_router.include_router(health.router, tags=["Health & Diagnostics"])

# Feature endpoints will be mounted in upcoming phases:
# api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_v1_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
# api_v1_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
# api_v1_router.include_router(risks.router, prefix="/risks", tags=["Predictive Risks"])
# api_v1_router.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

