from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    agent,
    alerts,
    analytics,
    auth,
    automation,
    dashboard,
    digital_twin,
    environment,
    geospatial,
    health,
    locations,
    map_studio,
    navigation,
    reports,
    risk,
)

api_v1_router = APIRouter()

# Mount health & diagnostic endpoints
api_v1_router.include_router(health.router, tags=["Health & Diagnostics"])

# Mount authentication endpoints
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Management"])

# Mount alerts & notifications
api_v1_router.include_router(alerts.router)

# Mount operations administration command panel
api_v1_router.include_router(admin.router)

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

# Mount safe navigation and routing intelligence
api_v1_router.include_router(navigation.router)

# Mount 3D Digital Twin and visual analytics
api_v1_router.include_router(digital_twin.router)

# Mount geospatial intelligence endpoints
api_v1_router.include_router(geospatial.router, prefix="/geospatial", tags=["Geospatial Intelligence"])

# Mount advanced analytics and report generation
api_v1_router.include_router(analytics.router)

# Mount TerraGuard AI 2.0 Additive Map Intelligence Studio
api_v1_router.include_router(map_studio.router)
