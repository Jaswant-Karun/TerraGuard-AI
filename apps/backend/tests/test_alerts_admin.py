import pytest
from httpx import ASGITransport, AsyncClient

from core.security import create_access_token
from main import app
from repositories.user_repository import UserRepository


def make_auth_headers(user_id: str, role: str) -> dict[str, str]:
    token = create_access_token({"sub": user_id, "role": role})
    return {"Authorization": f"Bearer {token}"}


async def get_or_create_user(email: str, role: str, name: str) -> dict:
    existing = await UserRepository.find_by_email(email)
    if existing:
        return existing
    return await UserRepository.create({
        "email": email,
        "hashed_password": "dummy_hashed_password",
        "full_name": name,
        "role": role,
    })


@pytest.mark.asyncio
async def test_list_alerts_and_acknowledgement():
    citizen_user = await get_or_create_user("citizen_ack@terraguard.ai", "CITIZEN", "Citizen Ack")
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Public alerts list
        res = await client.get("/api/v1/alerts")
        assert res.status_code == 200
        alerts = res.json()
        assert len(alerts) >= 1
        first_id = alerts[0]["id"]

        # Citizen acknowledges alert
        headers = make_auth_headers(citizen_user["id"], "CITIZEN")
        ack_res = await client.put(f"/api/v1/alerts/{first_id}/acknowledge", headers=headers)
        assert ack_res.status_code == 200
        data = ack_res.json()
        assert data["status"] == "ACKNOWLEDGED"


@pytest.mark.asyncio
async def test_rbac_alert_creation():
    """Verifies that ordinary citizens CANNOT issue official sirens (HTTP 403),
    while response coordinators CAN (HTTP 201).
    """
    citizen_user = await get_or_create_user("citizen_siren@terraguard.ai", "CITIZEN", "Citizen Siren")
    coordinator_user = await get_or_create_user("coord_siren@terraguard.ai", "COORDINATOR", "Coordinator Siren")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        alert_payload = {
            "title": "Severe Cloudburst Siren",
            "message": "Water levels exceeding 0.8m. Evacuate basement parking.",
            "severity": "CRITICAL",
            "target_zone": "BLR-ZONE-BELLANDUR-01",
            "location": [77.6680, 12.9360],
            "radius_km": 5.0,
            "channels": ["SMS", "DASHBOARD"],
            "expires_in_hours": 12,
        }

        # 1. Citizen attempt -> Must fail with 403
        citizen_headers = make_auth_headers(citizen_user["id"], "CITIZEN")
        res_citizen = await client.post("/api/v1/alerts", json=alert_payload, headers=citizen_headers)
        assert res_citizen.status_code == 403
        assert "FORBIDDEN_INSUFFICIENT_ROLE" in res_citizen.text

        # 2. Coordinator attempt -> Must succeed with 201
        coord_headers = make_auth_headers(coordinator_user["id"], "COORDINATOR")
        res_coord = await client.post("/api/v1/alerts", json=alert_payload, headers=coord_headers)
        assert res_coord.status_code == 201
        created = res_coord.json()
        assert created["title"] == alert_payload["title"]
        assert created["severity"] == "CRITICAL"


@pytest.mark.asyncio
async def test_notifications_feed_and_preferences():
    citizen_user = await get_or_create_user("citizen_feed@terraguard.ai", "CITIZEN", "Citizen Feed")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = make_auth_headers(citizen_user["id"], "CITIZEN")

        # 1. Feed
        feed_res = await client.get("/api/v1/alerts/notifications/feed", headers=headers)
        assert feed_res.status_code == 200
        assert isinstance(feed_res.json(), list)

        # 2. Preferences retrieval
        pref_res = await client.get("/api/v1/alerts/preferences/me", headers=headers)
        assert pref_res.status_code == 200
        pref = pref_res.json()
        assert "monitored_zones" in pref

        # 3. Preferences update
        update_payload = {
            "sms_enabled": True,
            "monitored_zones": ["BLR-ZONE-BELLANDUR-01", "BLR-ZONE-WHITEFIELD-04"],
            "min_severity_alert": 4,
        }
        update_res = await client.put(
            "/api/v1/alerts/preferences/me", json=update_payload, headers=headers
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["sms_enabled"] is True
        assert len(updated["monitored_zones"]) == 2


@pytest.mark.asyncio
async def test_admin_panel_operations():
    """Verifies complete administrative command flow: overview, user role update,
    response task dispatch, and audit logging.
    """
    admin_user = await get_or_create_user("admin_cmd@terraguard.ai", "ADMIN", "Admin Cmd")
    citizen_user = await get_or_create_user("citizen_target@terraguard.ai", "CITIZEN", "Target Citizen")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        admin_headers = make_auth_headers(admin_user["id"], "ADMIN")

        # 1. Admin Overview
        overview_res = await client.get("/api/v1/admin/overview", headers=admin_headers)
        assert overview_res.status_code == 200
        overview = overview_res.json()
        assert "total_users" in overview
        assert "system_health" in overview

        # 2. Update user role
        role_res = await client.put(
            f"/api/v1/admin/users/{citizen_user['id']}/role",
            json={"role": "ANALYST"},
            headers=admin_headers,
        )
        assert role_res.status_code == 200
        assert role_res.json()["role"] == "ANALYST"

        # 3. Dispatch response task
        task_payload = {
            "title": "Clear Silt Culvert #7",
            "assigned_department": "MUNICIPAL_STORMWATER_CORPS",
            "priority": "HIGH",
            "location": [77.6245, 12.9352],
            "instructions": "Emergency excavator deployment to unblock stormwater siphon.",
        }
        task_res = await client.post("/api/v1/admin/tasks", json=task_payload, headers=admin_headers)
        assert task_res.status_code == 201
        task = task_res.json()
        assert task["status"] == "DISPATCHED"

        # 4. Check audit logs for the actions performed
        audit_res = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
        assert audit_res.status_code == 200
        audit_data = audit_res.json()
        assert audit_data["total"] >= 2
        actions = [log["action"] for log in audit_data["logs"]]
        assert "USER_ROLE_CHANGED" in actions
        assert "RESPONSE_TASK_DISPATCHED" in actions
