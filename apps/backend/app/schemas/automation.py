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

