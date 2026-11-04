from pydantic import BaseModel, Field


class HealthServicesStatus(BaseModel):
    api: str = Field(default="operational", description="API Gateway status")
    database: str = Field(default="ready", description="Database connection status")
    cache: str = Field(default="ready", description="Cache / worker status")


class HealthResponse(BaseModel):
    status: str = Field(
        json_schema_extra={"example": "healthy"}, description="Overall health state"
    )
    app_name: str = Field(description="Application title")
    version: str = Field(description="Semantic version string")
    environment: str = Field(description="Deployment environment")
    timestamp: str = Field(description="ISO 8601 UTC timestamp")
    uptime_seconds: float = Field(description="Application process uptime in seconds")
    services: HealthServicesStatus = Field(
        description="Subservice operational statuses"
    )
