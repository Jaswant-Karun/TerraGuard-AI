from typing import Any

from pydantic import BaseModel, Field, field_validator


class PolygonQueryRequest(BaseModel):
    """Request payload for polygon spatial containment queries."""

    coordinates: list[list[float]] = Field(
        ...,
        description="List of [longitude, latitude] coordinate pairs forming a closed polygon ring",
        min_length=4,
    )
    min_risk_level: str | None = Field(default=None, description="Optional filter: LOW, MODERATE, HIGH, CRITICAL")
    limit: int = Field(default=50, ge=1, le=200)

    @field_validator("coordinates")
    @classmethod
    def validate_polygon_ring(cls, v: list[list[float]]) -> list[list[float]]:
        if len(v) < 4:
            raise ValueError("Polygon linear ring must contain at least 4 coordinate pairs.")
        for pt in v:
            if len(pt) < 2:
                raise ValueError("Each coordinate element must contain [longitude, latitude].")
            lng, lat = pt[0], pt[1]
            if not (-180.0 <= lng <= 180.0):
                raise ValueError(f"Longitude {lng} out of range [-180, 180].")
            if not (-90.0 <= lat <= 90.0):
                raise ValueError(f"Latitude {lat} out of range [-90, 90].")
        # Ensure closed ring
        if v[0][0] != v[-1][0] or v[0][1] != v[-1][1]:
            v.append(v[0])
        return v


class NearbyFacilitiesResponse(BaseModel):
    items: list[dict[str, Any]]
    count: int
    search_center: dict[str, float]
    radius_km: float


class NearbyReportsResponse(BaseModel):
    items: list[dict[str, Any]]
    count: int
    search_center: dict[str, float]
    radius_km: float


class DatabaseStatsResponse(BaseModel):
    database: str
    mode: str
    connected: bool
    latency_ms: float | None = None
    collections: dict[str, int]
    total_documents: int
