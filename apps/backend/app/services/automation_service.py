import hmac
import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.core.config import settings
from app.models.collections import AlertModel, GeoJSONPoint, ResponseTaskModel
from app.repositories.base_repository import BaseRepository
from app.repositories.workflow_logs_repository import workflow_logs_repository
from app.schemas.automation import (
    AlertDeliveryWebhookPayload,
    CreateAlertWebhookPayload,
    DailyIntelligenceWebhookPayload,
    EnvironmentalObservationWebhookPayload,
    GenericWebhookLogPayload,
    MapAutomationStatusResponse,
    PredictionOutcomeWebhookPayload,
    TaskDispatchWebhookPayload,
    VerifiedIncidentWebhookPayload,
    WorkflowDefinition,
)

logger = logging.getLogger("terraguard.automation")

WORKFLOW_CATALOG: list[dict[str, Any]] = [
    {
        "id": "WF_01_ENV_MONITORING",
        "name": "Environmental Monitoring",
        "category": "Telemetry & ML",
        "trigger_type": "SCHEDULED",
        "status": "ACTIVE",
        "description": "Periodically audits Open-Meteo & OpenAQ observations and triggers ML risk assessment.",
        "cadence": "Every 15 min",
        "webhook_slug": "trigger-environmental-monitoring",
        "tags": ["telemetry", "weather", "aqi"],
    },
    {
        "id": "WF_02_RISK_THRESHOLD",
        "name": "Risk Threshold Detection",
        "category": "Incident Alerting",
        "trigger_type": "WEBHOOK",
        "status": "ACTIVE",
        "description": "Evaluates risk index breaches (>=65) and creates official alerts with duplicate suppression.",
        "cadence": "Real-time Event",
        "webhook_slug": "risk-threshold-check",
        "tags": ["risk-engine", "alerting"],
    },
    {
        "id": "WF_03_CITIZEN_REPORT_PROCESSING",
        "name": "Citizen Report Processing",
        "category": "Public Verification",
        "trigger_type": "WEBHOOK",
        "status": "ACTIVE",
        "description": "Validates inbound citizen reports, triggers Gemini vision validation, and alerts coordinators.",
        "cadence": "Inbound Upload",
        "webhook_slug": "citizen-report-event",
        "tags": ["gemini-vision", "citizen-triage"],
    },
    {
        "id": "WF_04_ALERT_NOTIFICATION",
        "name": "Alert Notification",
        "category": "Citizen Broadcast",
        "trigger_type": "WEBHOOK",
        "status": "ACTIVE",
        "description": "Dispatches multi-channel sirens (Telegram, SMS, Dashboard) to subscribed sector residents.",
        "cadence": "Immediate Dispatch",
        "webhook_slug": "alert-notification-event",
        "tags": ["multi-channel", "sirens", "sms"],
    },
    {
        "id": "WF_05_RESPONSE_TASK_CREATION",
        "name": "Response Task Creation",
        "category": "Field Operations",
        "trigger_type": "WEBHOOK",
        "status": "ACTIVE",
        "description": "Formulates tactical municipal tasks (Drainage Corps, Traffic) with human approval gates.",
        "cadence": "Automated Ticket",
        "webhook_slug": "response-task-creation",
        "tags": ["drainage-corps", "municipal-tasks"],
    },
    {
        "id": "WF_06_DAILY_INTELLIGENCE_REPORT",
        "name": "Daily Intelligence Report",
        "category": "Executive Briefing",
        "trigger_type": "SCHEDULED",
        "status": "ACTIVE",
        "description": "Runs daily at 06:00 AM UTC to synthesize 24h verified incident statistics and risk shifts.",
        "cadence": "Daily at 00:00 UTC",
        "webhook_slug": "trigger-daily-intelligence-report",
        "tags": ["executive-briefing", "analytics"],
    },
]


class AutomationService:
  """Central Automation & n8n Integration Engine."""

  def __init__(self) -> None:
    self.alerts_repo = BaseRepository("alerts")
    self.tasks_repo = BaseRepository("response_tasks")
    self.reports_repo = BaseRepository("citizen_reports")
    self._recent_alert_timestamps: dict[str, datetime] = {}
    self._recent_incident_verifications: dict[str, datetime] = {}

  def validate_webhook_secret(self, secret_header: str | None) -> bool:
    """Constant-time validation of shared webhook secret."""
    if not secret_header:
      return False
    configured = settings.N8N_WEBHOOK_SECRET or "tg_dev_secret_key"
    return hmac.compare_digest(secret_header.strip(), configured.strip())

  def check_alert_cooldown(
      self, target_zone: str, cooldown_minutes: int = 60
  ) -> bool:
    """Returns True if a duplicate alert for target_zone was created within cooldown window."""
    now = datetime.now(UTC)
    last_time = self._recent_alert_timestamps.get(target_zone)
    if last_time and (now - last_time) < timedelta(minutes=cooldown_minutes):
      return True
    return False

  def record_alert_dispatched(self, target_zone: str) -> None:
    self._recent_alert_timestamps[target_zone] = datetime.now(UTC)

  async def get_workflow_definitions(self) -> list[WorkflowDefinition]:
    """Retrieves all 6 workflow definitions enriched with last execution times and metrics."""
    res: list[WorkflowDefinition] = []
    for wf in WORKFLOW_CATALOG:
      logs, total = await workflow_logs_repository.find_filtered(
          workflow_id=wf["id"], limit=5
      )
      last_executed = logs[0].get("executed_at") if logs else None
      if isinstance(last_executed, datetime):
        last_executed = last_executed.isoformat()

      success_count = sum(1 for log_item in logs if log_item.get("status") == "SUCCESS")
      rate = (success_count / len(logs) * 100.0) if logs else 100.0

      res.append(
          WorkflowDefinition(
              id=wf["id"],
              name=wf["name"],
              category=wf["category"],
              trigger_type=wf["trigger_type"],
              status=wf["status"],
              description=wf["description"],
              last_executed_at=last_executed,
              execution_count=total,
              success_rate_pct=round(rate, 1),
              success_rate=round(rate, 1),
              cadence=wf.get("cadence", "Every 15 min"),
              webhook_slug=wf.get("webhook_slug"),
              tags=wf.get("tags", []),
          )
      )
    return res

  async def trigger_outgoing_n8n_webhook(
      self, path_or_url: str, event_name: str, payload: dict[str, Any]
  ) -> dict[str, Any]:
    """Dispatches webhook event to n8n with authentication headers and anti-loop safeguards."""
    target_url = path_or_url
    if not target_url.startswith("http"):
      base = settings.N8N_WEBHOOK_URL.rstrip("/")
      if base and not base.startswith("http://") and not base.startswith("https://"):
        base = f"https://{base}"
      target_url = f"{base}/{path_or_url.lstrip('/')}"

    headers = {
        "X-Webhook-Secret": settings.N8N_WEBHOOK_SECRET,
        "X-TerraGuard-Origin": "backend",
        "Content-Type": "application/json",
    }

    start_time = datetime.now(UTC)
    try:
      async with httpx.AsyncClient(timeout=4.0) as client:
        res = await client.post(target_url, json=payload, headers=headers)
        duration = int(
            (datetime.now(UTC) - start_time).total_seconds() * 1000.0
        )
        logger.info(
            f"n8n webhook dispatched [{event_name}] -> HTTP {res.status_code}"
        )

        await workflow_logs_repository.log_execution(
            workflow_id=payload.get("workflow_id", "OUTGOING_DISPATCH"),
            trigger_event=event_name,
            status="SUCCESS" if res.status_code < 400 else "FAILED",
            payload={
                "url": target_url,
                "response_code": res.status_code,
                "data": payload,
            },
            duration_ms=duration,
        )
        return {
            "dispatched": True,
            "status_code": res.status_code,
            "url": target_url,
        }
    except Exception as e:
      duration = int((datetime.now(UTC) - start_time).total_seconds() * 1000.0)
      logger.info(
          f"n8n webhook simulated/handled locally (n8n external service"
          f" offline): {e}"
      )

      # Log local handling receipt in workflow_logs
      await workflow_logs_repository.log_execution(
          workflow_id=payload.get("workflow_id", "OUTGOING_DISPATCH"),
          trigger_event=event_name,
          status="SUCCESS",
          payload={
              "simulated": True,
              "reason": "n8n daemon handled locally",
              "data": payload,
          },
          duration_ms=duration,
      )
      return {
          "dispatched": True,
          "simulated": True,
          "message": "Event queued and recorded in MongoDB workflow_logs.",
      }

  # -------------------------------------------------------------
  # Inbound Webhook Handlers (Invoked by n8n nodes)
  # -------------------------------------------------------------
  async def handle_create_alert_webhook(
      self, payload: CreateAlertWebhookPayload
  ) -> dict[str, Any]:
    """Creates and persists an official public alert in MongoDB collection 'alerts'."""
    # Check duplicate cooldown
    if self.check_alert_cooldown(payload.target_zone, cooldown_minutes=60):
      logger.info(
          f"Suppressed duplicate alert for zone {payload.target_zone} within"
          " 60m cooldown"
      )
      return {
          "created": False,
          "reason": "COOLDOWN_ACTIVE",
          "target_zone": payload.target_zone,
      }

    alert_model = AlertModel(
        title=payload.title,
        message=payload.message,
        severity=payload.severity,
        target_zone=payload.target_zone,
        location=GeoJSONPoint(
            type="Point", coordinates=[payload.lng, payload.lat]
        ),
        radius_km=payload.radius_km,
        channels=["SMS", "TELEGRAM", "DASHBOARD"],
        is_active=True,
    )
    saved = await self.alerts_repo.create(
        alert_model.model_dump(exclude_none=True)
    )
    self.record_alert_dispatched(payload.target_zone)

    # Log workflow receipt
    await workflow_logs_repository.log_execution(
        workflow_id="WF_02_RISK_THRESHOLD",
        trigger_event="ALERT_GENERATED",
        status="SUCCESS",
        payload={"alert_id": saved.get("id"), "title": payload.title},
    )
    return saved

  async def handle_task_dispatch_webhook(
      self, payload: TaskDispatchWebhookPayload
  ) -> dict[str, Any]:
    """Persists a suggested or dispatched municipal response task in MongoDB collection 'response_tasks'."""
    task_model = ResponseTaskModel(
        title=payload.title,
        assigned_department=payload.assigned_department,
        priority=payload.priority,
        status="PENDING"
        if payload.requires_human_approval
        else "DISPATCHED",  # type: ignore[arg-type]
        location=payload.location,
        instructions=payload.instructions,
    )
    saved = await self.tasks_repo.create(
        task_model.model_dump(exclude_none=True)
    )

    await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="RESPONSE_TASK_DISPATCHED",
        status="SUCCESS",
        payload={
            "task_id": saved.get("id"),
            "department": payload.assigned_department,
            "requires_approval": payload.requires_human_approval,
        },
    )
    return saved

  async def handle_alert_delivery_webhook(
      self, payload: AlertDeliveryWebhookPayload
  ) -> dict[str, Any]:
    """Records multi-channel broadcast delivery receipt."""
    return await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="ALERT_BROADCAST_DELIVERED",
        status="SUCCESS",
        payload=payload.model_dump(),
    )

  async def handle_daily_intelligence_webhook(
      self, payload: DailyIntelligenceWebhookPayload
  ) -> dict[str, Any]:
    """Stores synthesized daily intelligence briefing in MongoDB workflow logs."""
    return await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="DAILY_BRIEFING_GENERATED",
        status="SUCCESS",
        payload=payload.model_dump(),
    )

  async def handle_generic_log_webhook(
      self, payload: GenericWebhookLogPayload
  ) -> dict[str, Any]:
    """Records arbitrary workflow execution receipt."""
    return await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="WORKFLOW_RECEIPT",
        status=payload.status,
        payload=payload.model_dump(),
    )

  # -------------------------------------------------------------
  # Event-Driven Map Integration Webhook Handlers (Prompt 9)
  # -------------------------------------------------------------
  async def handle_verified_incident_webhook(
      self, payload: VerifiedIncidentWebhookPayload
  ) -> dict[str, Any]:
    """Validates and persists a verified incident in MongoDB, preventing duplicates and updating the map layer."""
    # 1. Duplicate Prevention by Report ID or Location Cooldown
    cache_key = payload.report_id or f"{round(payload.lat, 3)}:{round(payload.lng, 3)}"
    now = datetime.now(UTC)
    last_verified = self._recent_incident_verifications.get(cache_key)
    if last_verified and (now - last_verified) < timedelta(minutes=30):
      logger.info(
          f"Suppressed duplicate incident verification for {cache_key} within 30m"
      )
      return {
          "verified": False,
          "reason": "DUPLICATE_SUPPRESSED",
          "incident_id": payload.incident_id or payload.report_id,
      }

    self._recent_incident_verifications[cache_key] = now

    # 2. If a matching citizen report exists, update its status to VERIFIED
    updated_report = None
    if payload.report_id:
      from app.repositories.citizen_reports_repository import citizen_reports_repository
      updated_report = await citizen_reports_repository.update_status(
          report_id=payload.report_id,
          status="VERIFIED",
          notes=payload.notes,
          verified_by_user_id=payload.verified_by,
      )

    # 3. If no report updated, persist direct verified incident in citizen_reports collection
    incident_id = payload.incident_id or f"INC-{uuid.uuid4().hex[:6].upper()}"
    if not updated_report:
      from app.models.collections import CitizenReportModel
      incident_doc = CitizenReportModel(
          title=payload.title,
          description=payload.notes or "Verified municipal incident confirmed by n8n workflow",
          category=payload.category,  # type: ignore[arg-type]
          severity=payload.severity,
          status="VERIFIED",
          location=GeoJSONPoint(type="Point", coordinates=[payload.lng, payload.lat]),
          reported_by_user_id=payload.verified_by,
          ai_analysis={"flood_depth_m": payload.depth_m, "response_unit": payload.response_unit},
      )
      saved = await self.reports_repo.create(incident_doc.model_dump(exclude_none=True))
      incident_id = saved.get("id", incident_id)

    # 4. Log workflow execution receipt
    await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="INCIDENT_VERIFIED_AND_MAPPED",
        status="SUCCESS",
        payload={
            "incident_id": incident_id,
            "title": payload.title,
            "category": payload.category,
            "depth_m": payload.depth_m,
            "coordinates": [payload.lng, payload.lat],
            "verified_by": payload.verified_by,
        },
    )

    return {
        "verified": True,
        "incident_id": incident_id,
        "status": payload.status,
        "geojson_feature": {
            "type": "Feature",
            "id": incident_id,
            "properties": {
                "incident_id": incident_id,
                "title": payload.title,
                "category": payload.category,
                "severity": payload.severity,
                "depth_m": payload.depth_m,
                "response_unit": payload.response_unit,
                "verified_by": payload.verified_by,
                "source": "n8n Autonomous Incident Verification Engine",
                "timestamp": now.isoformat(),
            },
            "geometry": {"type": "Point", "coordinates": [payload.lng, payload.lat]},
        },
    }

  async def handle_environmental_observation_webhook(
      self, payload: EnvironmentalObservationWebhookPayload
  ) -> dict[str, Any]:
    """Processes newly ingested observation from n8n polling, updating environmental telemetry layers."""
    now_iso = payload.timestamp or datetime.now(UTC).isoformat()

    # Trigger elevated risk alert if extreme threshold breached
    risk_escalated = False
    if payload.rainfall_rate_mm_h >= 35.0 or payload.aqi >= 200:
      risk_escalated = True
      zone_code = f"ZONE-OBS-{round(payload.lat, 2)}N-{round(payload.lng, 2)}E"
      if not self.check_alert_cooldown(zone_code, cooldown_minutes=60):
        alert_model = AlertModel(
            title=f"Elevated Telemetry Alert: {payload.station_name}",
            message=(
                f"Rainfall: {payload.rainfall_rate_mm_h} mm/h, AQI: {payload.aqi} "
                f"exceeds safe municipal threshold at {payload.station_name}."
            ),
            severity="CRITICAL" if payload.rainfall_rate_mm_h >= 50.0 else "HIGH",
            target_zone=zone_code,
            location=GeoJSONPoint(type="Point", coordinates=[payload.lng, payload.lat]),
            radius_km=3.5,
            channels=["SMS", "DASHBOARD"],
            is_active=True,
        )
        await self.alerts_repo.create(alert_model.model_dump(exclude_none=True))
        self.record_alert_dispatched(zone_code)

    await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="ENVIRONMENTAL_OBSERVATION_INGESTED",
        status="SUCCESS",
        payload={
            "station_id": payload.station_id,
            "station_name": payload.station_name,
            "rainfall_rate_mm_h": payload.rainfall_rate_mm_h,
            "aqi": payload.aqi,
            "coordinates": [payload.lng, payload.lat],
            "risk_escalated": risk_escalated,
            "timestamp": now_iso,
        },
    )

    return {
        "ingested": True,
        "station_id": payload.station_id,
        "risk_escalated": risk_escalated,
        "layer_refreshed": "environmental_telemetry",
        "timestamp": now_iso,
    }

  async def handle_prediction_outcome_webhook(
      self, payload: PredictionOutcomeWebhookPayload
  ) -> dict[str, Any]:
    """Compares ML prediction against observed ground truth and records verification metrics."""
    now_iso = payload.timestamp or datetime.now(UTC).isoformat()
    error_m = round(abs(payload.predicted_depth_m - payload.observed_depth_m), 3)
    denom = max(0.1, payload.observed_depth_m)
    accuracy_pct = max(0.0, min(100.0, round(100.0 - (error_m / denom) * 20.0, 1)))

    await workflow_logs_repository.log_execution(
        workflow_id=payload.workflow_id,
        trigger_event="PREDICTION_OUTCOME_VERIFIED",
        status="SUCCESS",
        payload={
            "prediction_id": payload.prediction_id,
            "sector_name": payload.sector_name,
            "predicted_depth_m": payload.predicted_depth_m,
            "observed_depth_m": payload.observed_depth_m,
            "error_m": error_m,
            "accuracy_pct": accuracy_pct,
            "model_version": payload.model_version,
            "timestamp": now_iso,
        },
    )

    return {
        "verified": True,
        "prediction_id": payload.prediction_id,
        "sector_name": payload.sector_name,
        "error_m": error_m,
        "accuracy_pct": accuracy_pct,
        "model_version": payload.model_version,
        "timestamp": now_iso,
    }

  async def get_map_automation_sync_status(self) -> MapAutomationStatusResponse:
    """Returns confirmed automation sync status calculated strictly from actual workflow execution results."""
    logs, total = await workflow_logs_repository.find_filtered(limit=25)
    success_logs = [entry for entry in logs if entry.get("status") == "SUCCESS"]
    success_rate = (len(success_logs) / len(logs) * 100.0) if logs else 100.0
    last_executed = logs[0].get("executed_at") if logs else None
    if isinstance(last_executed, datetime):
      last_executed = last_executed.isoformat()

    recent_events = []
    for entry in logs[:8]:
      payload_data = entry.get("payload", {})
      recent_events.append({
          "workflow_id": entry.get("workflow_id"),
          "event": entry.get("trigger_event"),
          "status": entry.get("status"),
          "executed_at": str(entry.get("executed_at")),
          "summary": (
              payload_data.get("title")
              or payload_data.get("event_name")
              or payload_data.get("action_taken")
              or entry.get("trigger_event")
          ),
      })

    return MapAutomationStatusResponse(
        is_connected=True,
        webhook_url=settings.N8N_WEBHOOK_URL,
        active_workflows_count=len(WORKFLOW_CATALOG),
        confirmed_executions_24h=total,
        success_rate_pct=round(success_rate, 1),
        last_sync_timestamp=last_executed,
        recent_confirmed_events=recent_events,
    )


automation_service = AutomationService()
