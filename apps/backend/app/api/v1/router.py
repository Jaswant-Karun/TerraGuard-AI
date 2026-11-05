from fastapi import APIRouter

from app.api.v1.endpoints import (
    agent,
    auth,
    automation,
    dashboard,
    environment,
    geospatial,
    health,
    locations,
    reports,
    risk,
)

api_v1_router = APIRouter()

# Mount health & diagnostic endpoints
api_v1_router.include_router(health.router, tags=["Health & Diagnostics"])

# Mount authentication endpoints
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Management"])

# Mount predictive risk intelligence & ML engine
api_v1_router.include_router(risk.router, prefix="/risk", tags=["Environmental Risk Intelligence & ML"])

# Mount live environmental data collection & external APIs
api_v1_router.include_router(environment.router, prefix="/environment", tags=["Live Environmental Telemetry"])

# Mount command dashboard & telemetry endpoints
api_v1_router.include_router(dashboard.router, prefix="/dashboard", tags=["Command Dashboard & Telemetry"])

# Mount locations & critical infrastructure endpoints
api_v1_router.include_router(locations.router, prefix="/locations", tags=["Locations & Facilities"])

# Mount citizen hazard reporting & AI vision
api_v1_router.include_router(reports.router)

# Mount AI Multi-Agent Command Center
api_v1_router.include_router(agent.router)

# Mount n8n Automation Engine & Webhooks
api_v1_router.include_router(automation.router)

# Mount geospatial intelligence endpoints
api_v1_router.include_router(geospatial.router, prefix="/geospatial", tags=["Geospatial Intelligence"])
