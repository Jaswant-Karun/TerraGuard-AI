from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field

from app.schemas.user import UserRole


class AlertCreateRequest(BaseModel):
    """Payload to trigger an official municipal emergency advisory or siren."""
    title: str = Field(..., min_length=3)
    message: str = Field(..., min_length=10)
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(...)
    target_zone: str = Field(..., description="e.g. BLR-ZONE-BELLANDUR-01")
    location: list[float] = Field(..., min_length=2, max_length=2, description="[lng, lat]")
    radius_km: float = Field(default=5.0, gt=0.0)
    channels: list[str] = Field(default_factory=lambda: ["SMS", "TELEGRAM", "DASHBOARD", "SIREN"])
    expires_in_hours: int = Field(default=24, ge=1, le=168)


class AlertResponseDTO(BaseModel):
    """Full alert data returned to clients."""
    id: str
    title: str
    message: str
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    target_zone: str
    location: dict[str, Any]
    radius_km: float
    channels: list[str]
    is_active: bool
    is_verified: bool = False
    verified_by_user_id: str | None = None
    acknowledged_by: list[str] = Field(default_factory=list)
    created_at: datetime
    expires_at: datetime | None = None


class NotificationPreferenceDTO(BaseModel):
    """Citizen / operator notification delivery and area subscription settings."""
    user_id: str
    email_enabled: bool = True
    sms_enabled: bool = False
    telegram_enabled: bool = True
    min_severity_alert: int = Field(default=3, ge=1, le=5)
    monitored_zones: list[str] = Field(default_factory=list)
    updated_at: datetime


class NotificationPreferenceUpdateRequest(BaseModel):
    email_enabled: bool | None = None
    sms_enabled: bool | None = None
    telegram_enabled: bool | None = None
    min_severity_alert: int | None = Field(default=None, ge=1, le=5)
    monitored_zones: list[str] | None = None


class InAppNotificationDTO(BaseModel):
    id: str
    title: str
    message: str
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    target_zone: str
    is_read: bool = False
    created_at: datetime


# --- Admin Management Schemas ---

class AdminUserListItem(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    phone: str | None = None
    is_active: bool = True
    created_at: datetime


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserStatusRequest(BaseModel):
    is_active: bool
    reason: str | None = None


class VerifyReportRequest(BaseModel):
    status: Literal["VERIFIED", "REJECTED", "ESCALATED"]
    verification_notes: str = Field(..., min_length=3)
    create_official_alert: bool = False
    alert_severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = "HIGH"


class CreateResponseTaskRequest(BaseModel):
    title: str = Field(..., min_length=3)
    incident_id: str | None = None
    assigned_department: str = Field(..., description="e.g. MUNICIPAL_STORMWATER_CORPS, TRAFFIC_POLICE_DISASTER_WING")
    assigned_to_user_id: str | None = None
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"] = "MEDIUM"
    location: list[float] = Field(..., min_length=2, max_length=2, description="[lng, lat]")
    instructions: str = Field(..., min_length=5)


class UpdateTaskStatusRequest(BaseModel):
    status: Literal["PENDING", "DISPATCHED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
    notes: str | None = None


class AuditLogListItem(BaseModel):
    id: str
    action: str
    actor_user_id: str | None = None
    resource: str
    resource_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    created_at: datetime


class SystemHealthDTO(BaseModel):
    database_status: str
    database_ping_ms: float
    fallback_mode: bool
    open_meteo_healthy: bool
    open_aq_healthy: bool
    n8n_broker_active: bool
    models_loaded: list[str]
    active_corridors_count: int


class AdminOverviewResponse(BaseModel):
    total_users: int
    active_alerts: int
    pending_citizen_reports: int
    active_response_tasks: int
    completed_tasks: int
    system_health: SystemHealthDTO
    recent_audit_logs: list[AuditLogListItem]
