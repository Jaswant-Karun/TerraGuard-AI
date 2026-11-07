from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.collections import GeoJSONPoint


class WorkflowDefinition(BaseModel):
    id: str
    name: str
    category: str
    trigger_type: Literal["SCHEDULED", "WEBHOOK", "HYBRID"]
    status: Literal["ACTIVE", "CONFIGURED", "PAUSED", "ERROR"]
    description: str
    last_executed_at: str | None = None
    execution_count: int = 0
    success_rate_pct: float = 100.0
    success_rate: float = 100.0
    cadence: str | None = None
    webhook_slug: str | None = None
    tags: list[str] = Field(default_factory=list)


class WorkflowLogDTO(BaseModel):
    id: str
    workflow_id: str
    trigger_event: str
    status: Literal["SUCCESS", "FAILED", "PENDING", "RETRYING"]
    payload: dict[str, Any] = Field(default_factory=dict)
    executed_at: datetime | str
    execution_duration_ms: int = 0


class WorkflowLogListResponse(BaseModel):
    items: list[WorkflowLogDTO]
    total: int
    page: int
    page_size: int


class CreateAlertWebhookPayload(BaseModel):
    title: str = Field(..., min_length=3)
    message: str = Field(...)
    severity: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"] = Field(...)
    target_zone: str = Field(...)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    radius_km: float = Field(default=5.0, gt=0.0)


class TaskDispatchWebhookPayload(BaseModel):
    workflow_id: str = Field(default="WF_05_RESPONSE_TASK_CREATION")
    status: Literal["PENDING", "DISPATCHED", "PENDING_APPROVAL"] = Field(default="DISPATCHED")
    title: str = Field(..., min_length=3)
    assigned_department: str = Field(...)
    priority: Literal["LOW", "MEDIUM", "HIGH", "URGENT"] = Field(default="HIGH")
    instructions: str = Field(...)
    location: GeoJSONPoint = Field(...)
    requires_human_approval: bool = False


class AlertDeliveryWebhookPayload(BaseModel):
    workflow_id: str = Field(default="WF_04_ALERT_NOTIFICATION")
    alert_id: str = Field(...)
    dispatched_count: int = Field(default=1)
    delivery_status: str = Field(default="DELIVERED")
    channels: list[str] = Field(default_factory=lambda: ["TELEGRAM", "SMS"])


class DailyIntelligenceWebhookPayload(BaseModel):
    workflow_id: str = Field(default="WF_06_DAILY_INTELLIGENCE_REPORT")
    status: str = Field(default="SUCCESS")
    report_date: str = Field(...)
    title: str = Field(...)
    summary_text: str = Field(...)
    total_incidents: int = Field(default=0)


class GenericWebhookLogPayload(BaseModel):
    workflow_id: str = Field(...)
    status: Literal["SUCCESS", "FAILED", "PENDING", "RETRYING"] = Field(default="SUCCESS")
    action_taken: str | None = None
    note: str | None = None
    error_message: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class TriggerWorkflowRequest(BaseModel):
    workflow_id: str
    parameters: dict[str, Any] = Field(default_factory=dict)


# -------------------------------------------------------------
# Event-Driven Map Integration Webhook Schemas (Prompt 9)
# -------------------------------------------------------------
class VerifiedIncidentWebhookPayload(BaseModel):
    """Payload sent by n8n or EOC workflow upon confirming a real flood or infrastructure incident."""
    workflow_id: str = Field(default="WF_02_RISK_THRESHOLD")
    report_id: str | None = Field(default=None, description="Optional citizen report ID being verified")
    incident_id: str | None = Field(default=None, description="Official municipal incident ID")
    title: str = Field(..., min_length=3, description="Incident summary")
    category: str = Field(default="FLOOD", description="FLOOD, WATERLOGGING, ROAD_DAMAGE, etc.")
    severity: int = Field(default=4, ge=1, le=5)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    depth_m: float = Field(default=0.65, ge=0.0)
    response_unit: str = Field(default="BBMP Stormwater Quick Reaction Team")
    verified_by: str = Field(default="EOC_AUTOMATED_TRIAGE_PIPELINE")
    notes: str | None = Field(default="Verified via sensor correlation and automated inspection")
    status: Literal["VERIFIED", "DISPATCHED", "RESOLVED"] = Field(default="VERIFIED")


class EnvironmentalObservationWebhookPayload(BaseModel):
    """Payload sent by n8n upon polling or ingesting new weather/telemetry observations."""
    workflow_id: str = Field(default="WF_01_ENV_MONITORING")
    station_id: str = Field(..., min_length=2)
    station_name: str = Field(...)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    rainfall_rate_mm_h: float = Field(default=0.0, ge=0.0)
    temperature_c: float = Field(default=28.0)
    humidity_pct: float = Field(default=65.0, ge=0.0, le=100.0)
    aqi: int = Field(default=50, ge=0)
    source: str = Field(default="Open-Meteo & Community Telemetry")
    timestamp: str | None = None


class PredictionOutcomeWebhookPayload(BaseModel):
    """Payload sent by n8n or ML evaluation job to verify model forecast accuracy against ground truth."""
    workflow_id: str = Field(default="WF_01_ENV_MONITORING")
    prediction_id: str = Field(...)
    sector_name: str = Field(...)
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    predicted_depth_m: float = Field(..., ge=0.0)
    observed_depth_m: float = Field(..., ge=0.0)
    model_version: str = Field(default="v2.4-hydrological-ensemble")
    timestamp: str | None = None


class MapAutomationStatusResponse(BaseModel):
    """Operational status summary for the Map Intelligence Studio, verified strictly by actual execution results."""
    is_connected: bool
    webhook_url: str
    active_workflows_count: int
    confirmed_executions_24h: int
    success_rate_pct: float
    last_sync_timestamp: str | None
    recent_confirmed_events: list[dict[str, Any]]
