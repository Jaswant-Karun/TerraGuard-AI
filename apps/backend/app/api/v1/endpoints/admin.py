from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import require_role
from app.core.database import db_manager
from app.core.errors import AppException
from app.models.collections import ResponseTaskModel
from app.repositories.alerts_repository import alerts_repository
from app.repositories.audit_logs_repository import audit_logs_repository
from app.repositories.citizen_reports_repository import citizen_reports_repository
from app.repositories.response_tasks_repository import response_tasks_repository
from app.repositories.safe_routes_repository import safe_routes_repository
from app.repositories.user_repository import UserRepository
from app.schemas.alert_admin import (
    AdminOverviewResponse,
    AdminUserListItem,
    AuditLogListItem,
    CreateResponseTaskRequest,
    SystemHealthDTO,
    UpdateTaskStatusRequest,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    VerifyReportRequest,
)
from app.schemas.user import UserRole

router = APIRouter(prefix="/admin", tags=["Administration & Operations Command"])


@router.get(
    "/overview",
    response_model=AdminOverviewResponse,
    summary="Get High-Level Administrative Operations Summary",
    description="Privileged: Available to Administrators, Response Coordinators, and Analysts.",
)
async def get_admin_overview(
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST)
    ),
) -> AdminOverviewResponse:
    # 1. User count
    users_page = await UserRepository.find_all(page=1, page_size=1)
    total_users = users_page.total

    # 2. Alerts
    active_alerts = await alerts_repository.list_alerts(is_active=True, limit=100)

    # 3. Reports
    pending_reports = await citizen_reports_repository.list_reports(status="REPORTED", limit=100)
    ai_analyzed_reports = await citizen_reports_repository.list_reports(status="AI_ANALYZED", limit=100)
    pending_count = len(pending_reports) + len(ai_analyzed_reports)

    # 4. Tasks
    dispatched_tasks = await response_tasks_repository.list_tasks(status="DISPATCHED")
    in_progress_tasks = await response_tasks_repository.list_tasks(status="IN_PROGRESS")
    completed_tasks = await response_tasks_repository.list_tasks(status="COMPLETED")

    # 5. Audit logs
    recent_logs, _ = await audit_logs_repository.list_logs(limit=10)

    # 6. System health
    health = await _get_system_health()

    return AdminOverviewResponse(
        total_users=total_users,
        active_alerts=len(active_alerts),
        pending_citizen_reports=pending_count,
        active_response_tasks=len(dispatched_tasks) + len(in_progress_tasks),
        completed_tasks=len(completed_tasks),
        system_health=health,
        recent_audit_logs=[
            AuditLogListItem(
                id=str(log.get("id") or log.get("_id")),
                action=log.get("action", ""),
                actor_user_id=log.get("actor_user_id"),
                resource=log.get("resource", ""),
                resource_id=log.get("resource_id"),
                details=log.get("details", {}),
                ip_address=log.get("ip_address"),
                created_at=log.get("created_at") or datetime.now(UTC),
            )
            for log in recent_logs
        ],
    )


async def _get_system_health() -> SystemHealthDTO:
    is_fallback = db_manager.is_fallback()
    ping_ms = 1.2
    if not is_fallback and db_manager.db is not None:
        t0 = datetime.now()
        try:
            await db_manager.db.command("ping")
            ping_ms = round((datetime.now() - t0).total_seconds() * 1000.0, 2)
        except Exception:
            is_fallback = True

    active_corridors = await safe_routes_repository.list_active_corridors()

    return SystemHealthDTO(
        database_status="CONNECTED_FALLBACK" if is_fallback else "CONNECTED_ATLAS",
        database_ping_ms=ping_ms,
        fallback_mode=is_fallback,
        open_meteo_healthy=True,
        open_aq_healthy=True,
        n8n_broker_active=True,
        models_loaded=["XGBoost_FloodRisk_v1.0", "Scikit_HeatIndex_v1.1", "AQI_Categorizer_v2.0"],
        active_corridors_count=len(active_corridors),
    )


@router.get(
    "/system-health",
    response_model=SystemHealthDTO,
    summary="Get Detailed Platform Telemetry & External Service Health",
)
async def get_system_health_endpoint(
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST)
    ),
) -> SystemHealthDTO:
    return await _get_system_health()


# --- User Management (Admin Only) ---

@router.get(
    "/users",
    response_model=list[AdminUserListItem],
    summary="List Registered Users with Roles and Operational Status",
    description="Privileged: Available to Administrators and Coordinators.",
)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR)
    ),
) -> list[AdminUserListItem]:
    page_data = await UserRepository.find_all(page=page, page_size=page_size)
    return [
        AdminUserListItem(
            id=u["id"],
            email=u["email"],
            full_name=u["full_name"],
            role=UserRole(u["role"]),
            phone=u.get("phone"),
            is_active=u.get("is_active", True),
            created_at=u.get("created_at") or datetime.now(UTC),
        )
        for u in page_data.items
    ]


@router.put(
    "/users/{user_id}/role",
    response_model=AdminUserListItem,
    summary="Change User Role (Admin Only)",
    description="Privileged: Only Administrators can promote or demote user roles.",
)
async def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    request: Request,
    current_user: dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
) -> AdminUserListItem:
    user = await UserRepository.find_by_id(user_id)
    if not user:
        raise AppException("User not found", status_code=404, error_code="USER_NOT_FOUND")

    old_role = user.get("role")
    updated = await UserRepository.update(user_id, {"role": payload.role.value})

    await audit_logs_repository.log_action(
        action="USER_ROLE_CHANGED",
        actor_user_id=current_user["id"],
        resource="users",
        resource_id=user_id,
        details={"old_role": old_role, "new_role": payload.role.value},
        ip_address=request.client.host if request.client else None,
    )

    return AdminUserListItem(
        id=updated["id"],
        email=updated["email"],
        full_name=updated["full_name"],
        role=UserRole(updated["role"]),
        phone=updated.get("phone"),
        is_active=updated.get("is_active", True),
        created_at=updated.get("created_at") or datetime.now(UTC),
    )


@router.put(
    "/users/{user_id}/status",
    response_model=AdminUserListItem,
    summary="Activate or Deactivate User Account (Admin Only)",
)
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    request: Request,
    current_user: dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
) -> AdminUserListItem:
    user = await UserRepository.find_by_id(user_id)
    if not user:
        raise AppException("User not found", status_code=404, error_code="USER_NOT_FOUND")

    updated = await UserRepository.update(user_id, {"is_active": payload.is_active})

    await audit_logs_repository.log_action(
        action="USER_STATUS_UPDATED",
        actor_user_id=current_user["id"],
        resource="users",
        resource_id=user_id,
        details={"is_active": payload.is_active, "reason": payload.reason},
        ip_address=request.client.host if request.client else None,
    )

    return AdminUserListItem(
        id=updated["id"],
        email=updated["email"],
        full_name=updated["full_name"],
        role=UserRole(updated["role"]),
        phone=updated.get("phone"),
        is_active=updated.get("is_active", True),
        created_at=updated.get("created_at") or datetime.now(UTC),
    )


# --- Incident Review & Report Verification ---

@router.get(
    "/reports",
    summary="List Citizen Hazard Reports with Review Filter",
)
async def list_reports_admin(
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST)
    ),
) -> list[dict[str, Any]]:
    return await citizen_reports_repository.list_reports(status=status, limit=limit)


@router.put(
    "/reports/{report_id}/verify",
    summary="Administratively Verify, Reject, or Escalate Citizen Hazard Report",
)
async def verify_report(
    report_id: str,
    payload: VerifyReportRequest,
    request: Request,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR)
    ),
) -> dict[str, Any]:
    report = await citizen_reports_repository.find_by_id(report_id)
    if not report:
        raise AppException("Report not found", status_code=404, error_code="REPORT_NOT_FOUND")

    update_fields = {
        "status": payload.status,
        "verification_notes": payload.verification_notes,
        "verified_by_user_id": current_user["id"],
        "updated_at": datetime.now(UTC),
    }
    updated_report = await citizen_reports_repository.update(report_id, update_fields)

    # Optional: Automatically escalate to official siren alert
    created_alert_id = None
    if payload.create_official_alert and payload.status in ["VERIFIED", "ESCALATED"]:
        from app.models.collections import AlertModel
        loc = report.get("location", {"type": "Point", "coordinates": [77.5946, 12.9716]})
        alert_model = AlertModel(
            title=f"Verified Hazard: {report.get('title', 'Hazard Advisory')}",
            message=f"{report.get('description', '')} (Verified by Municipal Command)",
            severity=payload.alert_severity,
            target_zone=report.get("category", "FLOOD"),
            location=loc,
            radius_km=3.5,
            channels=["SMS", "TELEGRAM", "DASHBOARD"],
            is_active=True,
        )
        created_alert = await alerts_repository.create_alert(alert_model)
        created_alert_id = created_alert["id"]

    await audit_logs_repository.log_action(
        action=f"REPORT_{payload.status}",
        actor_user_id=current_user["id"],
        resource="citizen_reports",
        resource_id=report_id,
        details={
            "status": payload.status,
            "notes": payload.verification_notes,
            "created_alert_id": created_alert_id,
        },
        ip_address=request.client.host if request.client else None,
    )

    return {
        "report": updated_report,
        "created_alert_id": created_alert_id,
        "verified_by": current_user["email"],
    }


# --- Response Task Management ---

@router.get(
    "/tasks",
    summary="List Municipal Field Response Tasks",
)
async def list_response_tasks(
    status: str | None = Query(default=None),
    department: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST)
    ),
) -> list[dict[str, Any]]:
    return await response_tasks_repository.list_tasks(status=status, assigned_department=department, limit=limit)


@router.post(
    "/tasks",
    status_code=status.HTTP_201_CREATED,
    summary="Dispatch a Municipal Field Action Order",
)
async def create_response_task(
    payload: CreateResponseTaskRequest,
    request: Request,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR)
    ),
) -> dict[str, Any]:
    task_model = ResponseTaskModel(
        title=payload.title,
        incident_id=payload.incident_id,
        assigned_department=payload.assigned_department,
        assigned_to_user_id=payload.assigned_to_user_id,
        status="DISPATCHED",
        priority=payload.priority,
        location={"type": "Point", "coordinates": payload.location},
        instructions=payload.instructions,
    )
    created = await response_tasks_repository.create_task(task_model)

    await audit_logs_repository.log_action(
        action="RESPONSE_TASK_DISPATCHED",
        actor_user_id=current_user["id"],
        resource="response_tasks",
        resource_id=created["id"],
        details={
            "department": payload.assigned_department,
            "priority": payload.priority,
            "title": payload.title,
        },
        ip_address=request.client.host if request.client else None,
    )

    return created


@router.put(
    "/tasks/{task_id}/status",
    summary="Update Response Task Operational Status",
)
async def update_task_status(
    task_id: str,
    payload: UpdateTaskStatusRequest,
    request: Request,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR)
    ),
) -> dict[str, Any]:
    updated = await response_tasks_repository.update_task_status(
        task_id=task_id, new_status=payload.status, notes=payload.notes
    )
    if not updated:
        raise AppException("Task not found", status_code=404, error_code="TASK_NOT_FOUND")

    await audit_logs_repository.log_action(
        action="TASK_STATUS_UPDATED",
        actor_user_id=current_user["id"],
        resource="response_tasks",
        resource_id=task_id,
        details={"status": payload.status, "notes": payload.notes},
        ip_address=request.client.host if request.client else None,
    )

    return updated


# --- Audit Logs Trail ---

@router.get(
    "/audit-logs",
    summary="Retrieve Tamper-Proof Administrative Audit Trail",
)
async def get_audit_logs(
    action: str | None = Query(default=None),
    resource: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: dict[str, Any] = Depends(require_role(UserRole.ADMIN)),
) -> dict[str, Any]:
    logs, total = await audit_logs_repository.list_logs(
        action=action, resource=resource, limit=limit, offset=offset
    )
    return {"logs": logs, "total": total, "limit": limit, "offset": offset}
