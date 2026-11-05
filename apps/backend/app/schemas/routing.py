from typing import Any, Literal

from pydantic import BaseModel, Field


class HazardIntersectionDTO(BaseModel):
    """Details of a reported hazard or risk zone intersected or close to a route."""
    hazard_id: str
    hazard_category: str = Field(..., description="e.g. FLOOD, WATERLOGGING, ROAD_DAMAGE")
    severity: int = Field(..., ge=1, le=5)
    distance_to_route_meters: float
    description: str
    location: list[float] = Field(..., description="[lng, lat] coordinate of hazard")


class RouteAlternativeDTO(BaseModel):
    """An evaluated route option between origin and destination."""
    route_id: str
    name: str
    safety_status: Literal[
        "VERIFIED_SAFER_ROUTE",
        "STANDARD_ROUTE",
        "CAUTION_ROUTE",
        "HAZARDOUS_ROUTE",
    ]
    safety_label: str
    distance_meters: float
    distance_km: float
    duration_seconds: float
    duration_minutes: float
    path_geojson: dict[str, Any]
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    risk_explanation: str
    hazard_intersections: list[HazardIntersectionDTO] = Field(default_factory=list)
    avoided_hazards_count: int = Field(default=0)
    data_sufficiency: Literal["SUFFICIENT", "INSUFFICIENT"] = Field(
        default="INSUFFICIENT",
        description="Indicates whether enough verified hazard data exists to certify enhanced safety",
    )
    disclaimer: str = (
        "Official instructions and municipal emergency services take precedence over algorithmic routing."
    )


class FacilityDTO(BaseModel):
    """Verified emergency facility or hospital."""
    id: str
    name: str
    category: Literal[
        "HOSPITAL",
        "EMERGENCY_SHELTER",
        "FIRE_STATION",
        "PUMP_STATION",
        "POLICE_POST",
        "SENSOR_STATION",
        "RELIEF_HUB",
    ]
    address: str
    capacity: int | None = None
    is_operational: bool = True
    contact_phone: str | None = None
    coordinates: list[float] = Field(..., description="[lng, lat]")
    distance_meters: float
    distance_km: float


class RouteQueryRequest(BaseModel):
    """Request payload for safe route generation."""
    origin: list[float] = Field(..., min_length=2, max_length=2, description="[lng, lat]")
    destination: list[float] = Field(..., min_length=2, max_length=2, description="[lng, lat]")
    mode: Literal["driving", "walking", "emergency_vehicle"] = Field(default="driving")
    avoid_hazards: bool = Field(default=True)
    max_alternatives: int = Field(default=3, ge=1, le=5)


class RouteQueryResponse(BaseModel):
    """Response returned by safe routing intelligence engine."""
    origin: list[float]
    destination: list[float]
    provider: str
    primary_route: RouteAlternativeDTO
    alternatives: list[RouteAlternativeDTO] = Field(default_factory=list)
    nearby_facilities: list[FacilityDTO] = Field(default_factory=list)
    overall_hazard_data_sufficiency: bool
    disclaimer: str = (
        "Official emergency services (112, Police, Fire, BBMP Disaster Cell) take precedence over automated safe route recommendations. Never drive through standing water or unverified evacuation routes."
    )


class NearbyFacilitiesResponse(BaseModel):
    facilities: list[FacilityDTO]
    total: int
    center: list[float]
    radius_km: float
