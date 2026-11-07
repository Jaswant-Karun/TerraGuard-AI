from typing import Any

from fastapi import (
    APIRouter,
    Header,
    Query,
)

from app.core.errors import AppException
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
    WorkflowLogDTO,
    WorkflowLogListResponse,
)
from app.services.automation_service import automation_service

router = APIRouter(prefix="/automation", tags=["n8n Workflow Automation Engine"])


def verify_webhook_auth(x_webhook_secret: str | None = Header(None)) -> None:
    """Dependency enforcing secret authentication on incoming n8n webhook callbacks."""
    if not automation_service.validate_webhook_secret(x_webhook_secret):
        raise AppException(
            message="Invalid or missing X-Webhook-Secret header.",
            status_code=401,
            error_code="UNAUTHORIZED_WEBHOOK",
        )


# -------------------------------------------------------------
# Management & Dashboard Endpoints (Called by Web Frontend)
# -------------------------------------------------------------
@router.get(
    "/workflows",
    response_model=list[WorkflowDefinition],
    summary="List all 6 n8n workflows with operational statuses and metrics",
)
async def list_workflows() -> list[WorkflowDefinition]:
    """Returns workflow definitions, execution counts, success rates, and last executed timestamps."""
    return await automation_service.get_workflow_definitions()


@router.get(
    "/logs",
    response_model=WorkflowLogListResponse,
    summary="Query paginated n8n workflow execution receipts stored in MongoDB",
)
async def list_workflow_logs(
    workflow_id: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> WorkflowLogListResponse:
    """Retrieves chronological execution receipts from MongoDB collection 'workflow_logs'."""
    skip = (page - 1) * page_size
    docs, total = await workflow_logs_repository.find_filtered(
        workflow_id=workflow_id,
        status=status,
        skip=skip,
        limit=page_size,
    )
    items = [WorkflowLogDTO(**d) for d in docs]
    return WorkflowLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/trigger/{workflow_id}",
    summary="Manually trigger an n8n workflow execution from the command center",
)
@router.post(
    "/workflows/{workflow_id}/trigger",
    summary="Manually trigger an n8n workflow execution (REST alias)",
)
async def trigger_workflow(
    workflow_id: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Manually invokes an n8n workflow or queues simulated execution receipt."""
    path_map = {
        "WF_01_ENV_MONITORING": "trigger-environmental-monitoring",
        "WF_02_RISK_THRESHOLD": "risk-threshold-check",
        "WF_03_CITIZEN_REPORT_PROCESSING": "citizen-report-event",
        "WF_04_ALERT_NOTIFICATION": "alert-notification-event",
        "WF_05_RESPONSE_TASK_CREATION": "response-task-creation",
        "WF_06_DAILY_INTELLIGENCE_REPORT": "trigger-daily-intelligence-report",
    }
    target_path = path_map.get(workflow_id, "trigger-general")
    body = payload or {"workflow_id": workflow_id, "triggered_by": "COMMAND_CENTER_UI"}
    body["workflow_id"] = workflow_id

    return await automation_service.trigger_outgoing_n8n_webhook(
        path_or_url=target_path,
        event_name="MANUAL_COMMAND_DISPATCH",
        payload=body,
    )


# -------------------------------------------------------------
# Outgoing Event Dispatches (Triggered by Backend Services)
# -------------------------------------------------------------
@router.post(
    "/events/risk",
    summary="Dispatch risk assessment completion event to n8n threshold workflow",
)
async def dispatch_risk_event(payload: dict[str, Any]) -> dict[str, Any]:
    payload["workflow_id"] = "WF_02_RISK_THRESHOLD"
    return await automation_service.trigger_outgoing_n8n_webhook(
        path_or_url="risk-threshold-check",
        event_name="RISK_ASSESSMENT_EVALUATED",
        payload=payload,
    )


@router.post(
    "/events/report",
    summary="Dispatch new citizen report event to n8n triage workflow",
)
async def dispatch_report_event(payload: dict[str, Any]) -> dict[str, Any]:
    payload["workflow_id"] = "WF_03_CITIZEN_REPORT_PROCESSING"
    return await automation_service.trigger_outgoing_n8n_webhook(
        path_or_url="citizen-report-event",
        event_name="CITIZEN_REPORT_SUBMITTED",
        payload=payload,
    )


@router.post(
    "/events/alert-approved",
    summary="Dispatch approved alert to n8n multi-channel notification workflow",
)
async def dispatch_approved_alert_event(payload: dict[str, Any]) -> dict[str, Any]:
    payload["workflow_id"] = "WF_04_ALERT_NOTIFICATION"
    return await automation_service.trigger_outgoing_n8n_webhook(
        path_or_url="alert-notification-event",
        event_name="ALERT_APPROVED_BROADCAST",
        payload=payload,
    )


# -------------------------------------------------------------
# Inbound Webhook Callbacks (Invoked by n8n Nodes)
# Protected by verify_webhook_auth
# -------------------------------------------------------------
@router.post(
    "/webhooks/risk-assessment-callback",
    summary="n8n callback logging environmental monitoring workflow execution",
)
async def webhook_risk_assessment_callback(
    payload: dict[str, Any],
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await workflow_logs_repository.log_execution(
        workflow_id=payload.get("workflow_id", "WF_01_ENV_MONITORING"),
        trigger_event="ENVIRONMENT_MONITORING_RECEIPT",
        status=payload.get("status", "SUCCESS"),
        payload=payload,
    )


@router.post(
    "/webhooks/create-alert",
    summary="n8n callback to create and persist an official public alert in MongoDB",
)
async def webhook_create_alert(
    payload: CreateAlertWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_create_alert_webhook(payload)


@router.post(
    "/webhooks/task-dispatch-callback",
    summary="n8n callback to persist a municipal response task in MongoDB",
)
async def webhook_task_dispatch(
    payload: TaskDispatchWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_task_dispatch_webhook(payload)


@router.post(
    "/webhooks/alert-delivery-callback",
    summary="n8n callback recording multi-channel broadcast delivery receipt",
)
async def webhook_alert_delivery(
    payload: AlertDeliveryWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_alert_delivery_webhook(payload)


@router.post(
    "/webhooks/daily-intelligence-callback",
    summary="n8n callback persisting daily executive situation briefing in MongoDB",
)
async def webhook_daily_intelligence(
    payload: DailyIntelligenceWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_daily_intelligence_webhook(payload)


@router.post(
    "/webhooks/notify-reviewers",
    summary="n8n callback sending notification to field coordinators and analysts",
)
async def webhook_notify_reviewers(
    payload: dict[str, Any],
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await workflow_logs_repository.log_execution(
        workflow_id="WF_03_CITIZEN_REPORT_PROCESSING",
        trigger_event="REVIEWER_NOTIFICATION_DISPATCHED",
        status="SUCCESS",
        payload=payload,
    )


@router.post(
    "/webhooks/log-workflow",
    summary="Generic n8n callback for audit trail receipts",
)
async def webhook_generic_log(
    payload: GenericWebhookLogPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_generic_log_webhook(payload)


# -------------------------------------------------------------
# Event-Driven Map Integration Callbacks (Prompt 9)
# -------------------------------------------------------------
@router.post(
    "/webhooks/incident-verified",
    summary="n8n callback to confirm a verified flood/hazard incident and update map layer",
)
async def webhook_incident_verified(
    payload: VerifiedIncidentWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_verified_incident_webhook(payload)


@router.post(
    "/webhooks/environmental-observation",
    summary="n8n callback to ingest polled environmental telemetry into map layer",
)
async def webhook_environmental_observation(
    payload: EnvironmentalObservationWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_environmental_observation_webhook(payload)


@router.post(
    "/webhooks/prediction-outcome",
    summary="n8n callback to log observed vs predicted outcome for prediction verification display",
)
async def webhook_prediction_outcome(
    payload: PredictionOutcomeWebhookPayload,
    x_webhook_secret: str | None = Header(None),
) -> dict[str, Any]:
    verify_webhook_auth(x_webhook_secret)
    return await automation_service.handle_prediction_outcome_webhook(payload)


@router.get(
    "/map-sync-status",
    response_model=MapAutomationStatusResponse,
    summary="Retrieve confirmed n8n workflow execution sync status for the Map Intelligence Studio",
)
async def get_map_sync_status() -> MapAutomationStatusResponse:
    return await automation_service.get_map_automation_sync_status()


@router.get(
    "/subscribers",
    summary="Retrieve subscribed citizen channels for target emergency zone",
)
async def get_zone_subscribers(zone: str = Query("METRO-ZONE-04")) -> dict[str, Any]:
    """Returns sample subscribed citizens for n8n multi-channel dispatch."""
    return {
        "zone": zone,
        "items": [
            {
                "user_id": "usr_civ_101",
                "name": "Ananya Sharma",
                "preferred_channel": "TELEGRAM",
                "phone": "+91-98765-43210",
            },
            {
                "user_id": "usr_civ_102",
                "name": "Karthik Raj",
                "preferred_channel": "SMS",
                "phone": "+91-98765-43211",
            },
            {
                "user_id": "usr_civ_103",
                "name": "Deepa Rao",
                "preferred_channel": "DASHBOARD",
                "phone": "+91-98765-43212",
            },
        ],
    }

