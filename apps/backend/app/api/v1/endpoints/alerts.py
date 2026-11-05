from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query, Request, status

from app.api.deps import get_current_user, require_role
from app.core.errors import AppException
from app.models.collections import AlertModel
from app.repositories.alerts_repository import alerts_repository
from app.repositories.audit_logs_repository import audit_logs_repository
from app.repositories.notification_preferences_repository import (
    notification_preferences_repository,
    notifications_repository,
)
from app.schemas.alert_admin import (
    AlertCreateRequest,
    AlertResponseDTO,
    InAppNotificationDTO,
    NotificationPreferenceDTO,
    NotificationPreferenceUpdateRequest,
)
from app.schemas.user import UserRole

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])


@router.get(
    "",
    response_model=list[AlertResponseDTO],
    summary="List Active and Historical Hazard Alerts",
)
async def list_alerts(
    target_zone: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[AlertResponseDTO]:
    raw_alerts = await alerts_repository.list_alerts(
        target_zone=target_zone,
        min_severity=severity,
        is_active=is_active,
        limit=limit,
    )
    results = []
    for a in raw_alerts:
        results.append(
            AlertResponseDTO(
                id=str(a.get("id") or a.get("_id")),
                title=a.get("title", ""),
                message=a.get("message", ""),
                severity=a.get("severity", "HIGH"),
                target_zone=a.get("target_zone", "GENERAL"),
                location=a.get("location", {"type": "Point", "coordinates": [77.5946, 12.9716]}),
                radius_km=float(a.get("radius_km", 5.0)),
                channels=a.get("channels", ["DASHBOARD"]),
                is_active=bool(a.get("is_active", True)),
                is_verified=bool(a.get("is_verified", False)),
                verified_by_user_id=a.get("verified_by_user_id"),
                acknowledged_by=a.get("acknowledged_by", []),
                created_at=a.get("created_at") or datetime.now(UTC),
                expires_at=a.get("expires_at"),
            )
        )
    return results


@router.post(
    "",
    response_model=AlertResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Create & Broadcast Official Emergency Siren / Alert",
    description="Privileged: Only authorized Response Coordinators, Analysts, or Administrators can issue official sirens.",
)
async def create_alert(
    payload: AlertCreateRequest,
    request: Request,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST)
    ),
) -> AlertResponseDTO:
    expires_at = datetime.now(UTC) + timedelta(hours=payload.expires_in_hours)
    alert_model = AlertModel(
        title=payload.title,
        message=payload.message,
        severity=payload.severity,
        target_zone=payload.target_zone,
        location={"type": "Point", "coordinates": payload.location},
        radius_km=payload.radius_km,
        channels=payload.channels,
        is_active=True,
        expires_at=expires_at,
    )
    created = await alerts_repository.create_alert(alert_model)

    # Log to audit trail
    await audit_logs_repository.log_action(
        action="ALERT_ISSUED",
        actor_user_id=current_user["id"],
        resource="alerts",
        resource_id=created["id"],
        details={
            "title": payload.title,
            "severity": payload.severity,
            "target_zone": payload.target_zone,
            "channels": payload.channels,
        },
        ip_address=request.client.host if request.client else None,
    )

    return AlertResponseDTO(
        id=created["id"],
        title=created["title"],
        message=created["message"],
        severity=created["severity"],
        target_zone=created["target_zone"],
        location=created["location"],
        radius_km=created["radius_km"],
        channels=created["channels"],
        is_active=created["is_active"],
        is_verified=created.get("is_verified", False),
        verified_by_user_id=created.get("verified_by_user_id"),
        acknowledged_by=created.get("acknowledged_by", []),
        created_at=created["created_at"],
        expires_at=created.get("expires_at"),
    )


@router.get(
    "/{alert_id}",
    response_model=AlertResponseDTO,
    summary="Get Alert Details by ID",
)
async def get_alert(alert_id: str) -> AlertResponseDTO:
    a = await alerts_repository.find_by_id(alert_id)
    if not a:
        raise AppException("Alert not found", status_code=404, error_code="ALERT_NOT_FOUND")
    return AlertResponseDTO(
        id=str(a.get("id") or a.get("_id")),
        title=a.get("title", ""),
        message=a.get("message", ""),
        severity=a.get("severity", "HIGH"),
        target_zone=a.get("target_zone", "GENERAL"),
        location=a.get("location", {}),
        radius_km=float(a.get("radius_km", 5.0)),
        channels=a.get("channels", ["DASHBOARD"]),
        is_active=bool(a.get("is_active", True)),
        is_verified=bool(a.get("is_verified", False)),
        verified_by_user_id=a.get("verified_by_user_id"),
        acknowledged_by=a.get("acknowledged_by", []),
        created_at=a.get("created_at") or datetime.now(UTC),
        expires_at=a.get("expires_at"),
    )


@router.put(
    "/{alert_id}/acknowledge",
    summary="Acknowledge Receipt of an Active Hazard Siren",
)
async def acknowledge_alert(
    alert_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    alert = await alerts_repository.acknowledge_alert(alert_id, current_user["id"])
    if not alert:
        raise AppException("Alert not found", status_code=404, error_code="ALERT_NOT_FOUND")
    return {
        "status": "ACKNOWLEDGED",
        "alert_id": alert_id,
        "user_id": current_user["id"],
        "acknowledged_at": datetime.now(UTC).isoformat(),
    }


@router.put(
    "/{alert_id}/verify",
    response_model=AlertResponseDTO,
    summary="Administratively Approve & Verify Official Alert",
    description="Privileged: Only Administrators and Response Coordinators can formally verify alerts.",
)
async def verify_alert(
    alert_id: str,
    request: Request,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR)
    ),
) -> AlertResponseDTO:
    updated = await alerts_repository.verify_alert(alert_id, current_user["id"])
    if not updated:
        raise AppException("Alert not found", status_code=404, error_code="ALERT_NOT_FOUND")

    await audit_logs_repository.log_action(
        action="ALERT_ADMIN_VERIFIED",
        actor_user_id=current_user["id"],
        resource="alerts",
        resource_id=alert_id,
        details={"verified_by": current_user["email"]},
        ip_address=request.client.host if request.client else None,
    )
    return await get_alert(alert_id)


@router.put(
    "/{alert_id}/deactivate",
    response_model=AlertResponseDTO,
    summary="Deactivate an Active Hazard Alert",
    description="Privileged: Only Administrators and Response Coordinators can cancel or deactivate sirens.",
)
async def deactivate_alert(
    alert_id: str,
    request: Request,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR)
    ),
) -> AlertResponseDTO:
    updated = await alerts_repository.deactivate_alert(alert_id)
    if not updated:
        raise AppException("Alert not found", status_code=404, error_code="ALERT_NOT_FOUND")

    await audit_logs_repository.log_action(
        action="ALERT_DEACTIVATED",
        actor_user_id=current_user["id"],
        resource="alerts",
        resource_id=alert_id,
        details={"deactivated_by": current_user["email"]},
        ip_address=request.client.host if request.client else None,
    )
    return await get_alert(alert_id)


# --- In-App Notifications Feed & Preferences ---

@router.get(
    "/notifications/feed",
    response_model=list[InAppNotificationDTO],
    summary="Get In-App Notifications Feed for Current User",
)
async def get_notification_feed(
    unread_only: bool = Query(default=False),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[InAppNotificationDTO]:
    items = await notifications_repository.list_user_notifications(
        user_id=current_user["id"], unread_only=unread_only
    )
    return [
        InAppNotificationDTO(
            id=str(n.get("id") or n.get("_id")),
            title=n.get("title", ""),
            message=n.get("message", ""),
            severity=n.get("severity", "HIGH"),
            target_zone=n.get("target_zone", "GENERAL"),
            is_read=bool(n.get("is_read", False)),
            created_at=n.get("created_at") or datetime.now(UTC),
        )
        for n in items
    ]


@router.put(
    "/notifications/{notification_id}/read",
    summary="Mark Specific In-App Notification as Read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    await notifications_repository.mark_read(notification_id, current_user["id"])
    return {"status": "READ", "notification_id": notification_id}


@router.put(
    "/notifications/mark-all-read",
    summary="Mark All In-App Notifications as Read",
)
async def mark_all_notifications_read(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    modified = await notifications_repository.mark_all_read(current_user["id"])
    return {"status": "ALL_READ", "count": modified}


@router.get(
    "/preferences/me",
    response_model=NotificationPreferenceDTO,
    summary="Get Current User Notification Preferences & Subscribed Areas",
)
async def get_preferences(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> NotificationPreferenceDTO:
    doc = await notification_preferences_repository.get_or_create(current_user["id"])
    return NotificationPreferenceDTO(
        user_id=doc["user_id"],
        email_enabled=doc.get("email_enabled", True),
        sms_enabled=doc.get("sms_enabled", False),
        telegram_enabled=doc.get("telegram_enabled", True),
        min_severity_alert=doc.get("min_severity_alert", 3),
        monitored_zones=doc.get("monitored_zones", []),
        updated_at=doc.get("updated_at") or datetime.now(UTC),
    )


@router.put(
    "/preferences/me",
    response_model=NotificationPreferenceDTO,
    summary="Update Current User Notification Delivery & Area Subscriptions",
)
async def update_preferences(
    payload: NotificationPreferenceUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> NotificationPreferenceDTO:
    updates = payload.model_dump(exclude_none=True)
    doc = await notification_preferences_repository.update_preferences(
        user_id=current_user["id"], updates=updates
    )
    return NotificationPreferenceDTO(
        user_id=doc["user_id"],
        email_enabled=doc.get("email_enabled", True),
        sms_enabled=doc.get("sms_enabled", False),
        telegram_enabled=doc.get("telegram_enabled", True),
        min_severity_alert=doc.get("min_severity_alert", 3),
        monitored_zones=doc.get("monitored_zones", []),
        updated_at=doc.get("updated_at") or datetime.now(UTC),
    )
