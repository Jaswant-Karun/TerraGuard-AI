from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.geojson import GeoJSONLineString, GeoJSONPoint, GeoJSONPolygon


class LocationModel(BaseModel):
    """Collection: locations (Facilities, shelters, hospitals, pump stations)"""
    id: str | None = None
    name: str = Field(..., description="Facility or infrastructure landmark name")
    category: Literal[
        "HOSPITAL",
        "EMERGENCY_SHELTER",
        "FIRE_STATION",
        "PUMP_STATION",
        "POLICE_POST",
        "SENSOR_STATION",
        "RELIEF_HUB",
    ] = Field(..., description="Infrastructure category")
    location: GeoJSONPoint = Field(..., description="Valid GeoJSON point [lng, lat]")
    address: str = Field(..., description="Physical urban address")
    capacity: int | None = Field(default=None, description="Capacity in persons or units")
    is_operational: bool = Field(default=True, description="Operating status")
    contact_phone: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class EnvironmentalDataModel(BaseModel):
    """Collection: environmental_data (Weather, AQI, river gauge telemetry)"""
    id: str | None = None
    station_id: str = Field(..., description="Sensor station code or external identifier")
    source: Literal["OPEN_METEO", "OPEN_AQ", "IOT_STATION", "MUNICIPAL_TELEMETRY"] = Field(...)
    location: GeoJSONPoint = Field(..., description="Sensor geographic position [lng, lat]")
    metrics: dict[str, float] = Field(
        ...,
        description="Key environmental metrics (precipitation_mm, aqi, pm25, temperature_c, wind_speed_kmh)",
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    is_anomaly: bool = Field(default=False, description="Flagged by ML outlier detector")
    metadata: dict[str, Any] = Field(default_factory=dict)


class RiskAssessmentModel(BaseModel):
    """Collection: risk_assessments (Calculated spatial risk index zones)"""
    id: str | None = None
    zone_code: str = Field(..., description="Unique administrative zone code (e.g. URBAN-ZONE-04A)")
    name: str = Field(..., description="Human-readable zone name")
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(...)
    composite_risk_score: float = Field(..., ge=0.0, le=100.0, description="Score 0.0 to 100.0")
    primary_hazard: Literal["FLASH_FLOOD", "AIR_POLLUTION", "LANDSLIDE", "HEATWAVE", "INFRASTRUCTURE"] = Field(...)
    boundary: GeoJSONPolygon = Field(..., description="GeoJSON polygon delimiting the zone")
    contributing_factors: dict[str, float] = Field(
        default_factory=dict,
        description="Explainable AI factor weights (e.g. rainfall: 42.5, elevation: 28.1)",
    )
    estimated_affected_population: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CitizenReportModel(BaseModel):
    """Collection: citizen_reports (Hazard incidents filed by the public)"""
    id: str | None = None
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5)
    category: Literal[
        "WATERLOGGING",
        "ROAD_FLOODING",
        "DAMAGED_ROAD",
        "FALLEN_TREE",
        "WASTE_ACCUMULATION",
        "OTHER",
        "FLOOD",
        "AIR_POLLUTION",
        "FIRE",
        "LANDSLIDE",
        "INFRASTRUCTURE_FAILURE",
        "WATER_CONTAMINATION",
    ] = Field(...)
    severity: int = Field(default=2, ge=1, le=5, description="Severity 1 to 5")
    status: Literal[
        "REPORTED",
        "AI_ANALYZED",
        "VERIFIED",
        "DISPATCHED",
        "RESOLVED",
        "REJECTED",
    ] = Field(default="REPORTED")
    location: GeoJSONPoint = Field(..., description="Location of incident [lng, lat]")
    address: str | None = None
    media_urls: list[str] = Field(default_factory=list)
    image_hash: str | None = None
    reported_by_user_id: str | None = None
    ai_analysis: dict[str, Any] = Field(default_factory=dict)
    is_potential_duplicate: bool = False
    duplicate_of_report_id: str | None = None
    duplicate_metadata: dict[str, Any] = Field(default_factory=dict)
    verification_notes: str | None = None
    verified_by_user_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None


class AlertModel(BaseModel):
    """Collection: alerts (Public hazard advisories and emergency sirens)"""
    id: str | None = None
    title: str = Field(..., min_length=3)
    message: str = Field(...)
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(...)
    target_zone: str = Field(..., description="Target sector or zone code")
    location: GeoJSONPoint = Field(..., description="Epicenter location [lng, lat]")
    radius_km: float = Field(default=5.0, gt=0.0)
    channels: list[str] = Field(default_factory=lambda: ["SMS", "TELEGRAM", "DASHBOARD"])
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: datetime | None = None


class SafeRouteModel(BaseModel):
    """Collection: safe_routes (Evacuation paths avoiding active flood/fire zones)"""
    id: str | None = None
    name: str = Field(..., description="Evacuation corridor name")
    status: Literal["ACTIVE", "CONGESTED", "BLOCKED", "PREPARING"] = Field(default="ACTIVE")
    path: GeoJSONLineString = Field(..., description="GeoJSON LineString coordinate route")
    avoid_hazard_categories: list[str] = Field(default_factory=list)
    capacity_vehicles_per_hour: int = Field(default=1500)
    origin_zone: str
    destination_shelter_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ResponseTaskModel(BaseModel):
    """Collection: response_tasks (Action orders assigned to municipal field teams)"""
    id: str | None = None
    title: str = Field(..., min_length=3)
    incident_id: str | None = None
    assigned_department: str = Field(..., description="e.g. MUNICIPAL_STORMWATER_CORPS")
    assigned_to_user_id: str | None = None
    status: Literal["PENDING", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"] = Field(
        default="PENDING"
    )
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"] = Field(default="MEDIUM")
    location: GeoJSONPoint = Field(..., description="Deployment destination [lng, lat]")
    instructions: str = Field(...)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None


class WorkflowLogModel(BaseModel):
    """Collection: workflow_logs (n8n execution records and webhook receipts)"""
    id: str | None = None
    workflow_id: str = Field(...)
    trigger_event: str = Field(...)
    status: Literal["SUCCESS", "FAILED", "PENDING", "RETRYING"] = Field(default="SUCCESS")
    payload: dict[str, Any] = Field(default_factory=dict)
    executed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    execution_duration_ms: int = Field(default=0)


class HistoricalEventModel(BaseModel):
    """Collection: historical_events (Archived past disaster events for ML training)"""
    id: str | None = None
    event_type: str = Field(...)
    description: str = Field(...)
    location: GeoJSONPoint = Field(..., description="Historical event center [lng, lat]")
    peak_severity: int = Field(ge=1, le=5)
    damage_estimate_usd: float = Field(default=0.0)
    casualties_count: int = Field(default=0)
    occurred_at: datetime = Field(...)
    metadata: dict[str, Any] = Field(default_factory=dict)


class NotificationPreferenceModel(BaseModel):
    """Collection: notification_preferences (Citizen / operator subscription settings)"""
    id: str | None = None
    user_id: str = Field(..., description="Target user identifier")
    email_enabled: bool = Field(default=True)
    sms_enabled: bool = Field(default=False)
    telegram_enabled: bool = Field(default=True)
    min_severity_alert: int = Field(default=3, ge=1, le=5)
    monitored_zones: list[str] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AuditLogModel(BaseModel):
    """Collection: audit_logs (Tamper-proof administrative activity log)"""
    id: str | None = None
    action: str = Field(..., description="Action taken (e.g. USER_LOGIN, STATUS_UPDATED, SIREN_TRIGGERED)")
    actor_user_id: str | None = None
    resource: str = Field(...)
    resource_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
