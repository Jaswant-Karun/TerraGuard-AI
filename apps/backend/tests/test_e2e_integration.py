import io
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.core.security import create_access_token
from app.repositories.user_repository import UserRepository
from main import app


def make_auth_headers(user_id: str, role: str) -> dict[str, str]:
    token = create_access_token(subject=user_id, role=role)
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


def create_sample_png() -> bytes:
    img = Image.new("RGB", (100, 100), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_e2e_critical_journeys():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # =====================================================================
        # JOURNEY 1: Authentication & RBAC
        # =====================================================================
        citizen = await get_or_create_user("citizen_e2e@terraguard.ai", "CITIZEN", "Citizen E2E")
        admin = await get_or_create_user("admin_e2e@terraguard.ai", "ADMIN", "Admin E2E")

        citizen_headers = make_auth_headers(citizen["id"], "CITIZEN")
        admin_headers = make_auth_headers(admin["id"], "ADMIN")

        # Test auth me endpoint
        me_res = await client.get("/api/v1/auth/me", headers=citizen_headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "citizen_e2e@terraguard.ai"

        # =====================================================================
        # JOURNEY 2: Command Dashboard & Live Telemetry
        # =====================================================================
        dash_res = await client.get("/api/v1/dashboard/summary?time_range=24h")
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert "location" in dash_data
        assert "environmental_status" in dash_data

        locs_res = await client.get("/api/v1/dashboard/locations")
        assert locs_res.status_code == 200
        assert len(locs_res.json()) >= 1

        notif_res = await client.get("/api/v1/dashboard/notifications")
        assert notif_res.status_code == 200

        # =====================================================================
        # JOURNEY 3: GIS Map Layers & Geospatial Infrastructure
        # =====================================================================
        map_res = await client.get("/api/v1/geospatial/map-layers")
        assert map_res.status_code == 200
        map_data = map_res.json()
        assert "risk_zones" in map_data
        assert "facilities" in map_data
        assert "citizen_reports" in map_data

        # =====================================================================
        # JOURNEY 4: Environmental Data Collection & Risk Engine
        # =====================================================================
        env_res = await client.get("/api/v1/environment/current?lat=12.9716&lng=77.5946")
        assert env_res.status_code == 200
        env_data = env_res.json()
        assert "temperature_c" in env_data
        assert "rainfall_mm" in env_data

        aq_res = await client.get("/api/v1/environment/air-quality?lat=12.9716&lng=77.5946")
        assert aq_res.status_code == 200
        assert "us_aqi" in aq_res.json()

        # Assess Risk via Scikit / XGBoost models
        risk_req = {
            "location": {"type": "Point", "coordinates": [77.6711, 12.9348]},
            "recent_rainfall_mm": 55.0,
            "forecast_rainfall_mm": 70.0,
            "rainfall_intensity_mm_per_hr": 22.0,
            "temperature_c": 29.5,
            "relative_humidity_pct": 82.0,
            "air_quality_pm25": 48.0,
            "elevation_meters": 890.0,
        }
        risk_res = await client.post("/api/v1/risk/assess", json=risk_req)
        assert risk_res.status_code in (200, 201)
        risk_data = risk_res.json()
        assert risk_data["composite_risk_score"] > 0
        assert risk_data["flood_risk"]["model_version"] is not None

        # =====================================================================
        # JOURNEY 5: AI Vision & Citizen Hazard Reporting
        # =====================================================================
        img_bytes = create_sample_png()

        # Preview image analysis
        preview_res = await client.post(
            "/api/v1/reports/analyze-image",
            files={"image": ("test_hazard.png", img_bytes, "image/png")},
            data={"category_hint": "WATERLOGGING"},
        )
        assert preview_res.status_code == 200
        preview_data = preview_res.json()
        assert "predicted_category" in preview_data
        assert "safety_precautions" in preview_data

        # Submit citizen report
        report_form = {
            "title": "Severe Waterlogging near Bellandur Gate",
            "description": "Standing water 18 inches deep submerging curb and sidewalk.",
            "category": "WATERLOGGING",
            "severity": 4,
            "lat": 12.9352,
            "lng": 77.6669,
            "address": "Outer Ring Road, Bellandur",
        }
        submit_res = await client.post(
            "/api/v1/reports",
            data=report_form,
            files={"image": ("hazard.png", img_bytes, "image/png")},
            headers=citizen_headers,
        )
        assert submit_res.status_code == 201
        new_report = submit_res.json()
        assert new_report["status"] in ("REPORTED", "UNVERIFIED")
        report_id = new_report["id"]

        # =====================================================================
        # JOURNEY 6: AI Multi-Agent Command Center
        # =====================================================================
        agents_res = await client.get("/api/v1/agent/agents")
        assert agents_res.status_code == 200
        assert len(agents_res.json()) >= 9

        chat_res = await client.post(
            "/api/v1/agent/chat",
            json={
                "message": "What is the inundation threat in Bellandur Basin?",
                "lat": 12.9352,
                "lng": 77.6669,
            },
            headers=citizen_headers,
        )
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert chat_data["assigned_agent"] is not None
        assert "explanation" in chat_data

        # =====================================================================
        # JOURNEY 7: n8n Automation Engine & Webhooks
        # =====================================================================
        workflows_res = await client.get("/api/v1/automation/workflows")
        assert workflows_res.status_code == 200
        workflows = workflows_res.json()
        assert len(workflows) == 6

        # Trigger manual execution
        trigger_res = await client.post(
            f"/api/v1/automation/workflows/{workflows[0]['id']}/trigger",
            json={"trigger_reason": "E2E verification probe"},
            headers=citizen_headers,
        )
        assert trigger_res.status_code == 200

        logs_res = await client.get("/api/v1/automation/logs?limit=5")
        assert logs_res.status_code == 200

        # =====================================================================
        # JOURNEY 8: Safe Navigation & Routing Intelligence
        # =====================================================================
        route_res = await client.post(
            "/api/v1/navigation/routes",
            json={
                "origin": [77.5946, 12.9716],
                "destination": [77.6669, 12.9352],
                "route_mode": "DRIVING",
            },
        )
        assert route_res.status_code == 200
        route_data = route_res.json()
        assert len(route_data["routes"]) >= 1
        assert route_data["disclaimer"] is not None

        facilities_res = await client.get(
            "/api/v1/navigation/facilities/nearby?lng=77.6669&lat=12.9352&radius_km=15"
        )
        assert facilities_res.status_code == 200
        assert len(facilities_res.json()["facilities"]) >= 1

        # =====================================================================
        # JOURNEY 9: Alerts & Notification Management
        # =====================================================================
        alerts_res = await client.get("/api/v1/alerts")
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        assert len(alerts) >= 1
        test_alert_id = alerts[0]["id"]

        # Citizen acknowledges alert
        ack_res = await client.put(f"/api/v1/alerts/{test_alert_id}/acknowledge", headers=citizen_headers)
        assert ack_res.status_code == 200

        # Notification Feed & Preferences
        feed_res = await client.get("/api/v1/alerts/notifications/feed", headers=citizen_headers)
        assert feed_res.status_code == 200

        pref_res = await client.get("/api/v1/alerts/preferences/me", headers=citizen_headers)
        assert pref_res.status_code == 200

        update_pref_res = await client.put(
            "/api/v1/alerts/preferences/me",
            json={"email_enabled": True, "sms_enabled": False, "monitored_zones": ["Bellandur Basin"]},
            headers=citizen_headers,
        )
        assert update_pref_res.status_code == 200
        assert update_pref_res.json()["monitored_zones"] == ["Bellandur Basin"]

        # =====================================================================
        # JOURNEY 10: 3D City Digital Twin
        # =====================================================================
        dt_res = await client.get("/api/v1/digital-twin/summary")
        assert dt_res.status_code == 200
        dt_data = dt_res.json()
        assert len(dt_data["timeline_slices"]) == 5

        bld_res = await client.get("/api/v1/digital-twin/buildings")
        assert bld_res.status_code == 200

        # =====================================================================
        # JOURNEY 11: Analytics & Report Generation
        # =====================================================================
        analytics_res = await client.get("/api/v1/analytics/overview?time_range=30d", headers=citizen_headers)
        assert analytics_res.status_code == 200
        analytics_data = analytics_res.json()
        assert len(analytics_data["environmental_trends"]) == 30
        assert len(analytics_data["geographic_comparisons"]) >= 1

        # CSV Export
        csv_res = await client.get("/api/v1/analytics/reports/export?format=csv", headers=citizen_headers)
        assert csv_res.status_code == 200
        assert "SECTION 1: OBSERVED ENVIRONMENTAL MEASUREMENTS" in csv_res.text

        # PDF Export
        pdf_res = await client.get("/api/v1/analytics/reports/export?format=pdf", headers=citizen_headers)
        assert pdf_res.status_code == 200
        assert pdf_res.content.startswith(b"%PDF-")

        # =====================================================================
        # JOURNEY 12: Admin Operations & Strict Security RBAC Check
        # =====================================================================
        # 1. Non-admin citizen is strictly FORBIDDEN from accessing admin overview
        forbidden_res = await client.get("/api/v1/admin/overview", headers=citizen_headers)
        assert forbidden_res.status_code == 403

        # 2. Non-admin citizen cannot broadcast an official siren alert
        forbidden_alert = await client.post(
            "/api/v1/alerts",
            json={
                "title": "Unauthorized Siren",
                "message": "Should be blocked",
                "severity": "CRITICAL",
                "target_zone": "Citywide",
            },
            headers=citizen_headers,
        )
        assert forbidden_alert.status_code == 403

        # 3. Admin successfully accesses overview
        admin_overview_res = await client.get("/api/v1/admin/overview", headers=admin_headers)
        assert admin_overview_res.status_code == 200
        assert "stats" in admin_overview_res.json()

        # 4. Admin verifies citizen report
        verify_res = await client.put(
            f"/api/v1/admin/reports/{report_id}/verify",
            json={"status": "VERIFIED", "verification_notes": "Ground-truthed by BBMP Patrol Squad 3"},
            headers=admin_headers,
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["status"] == "VERIFIED"

        # 5. Admin creates response task
        task_res = await client.post(
            "/api/v1/admin/tasks",
            json={
                "title": "Deploy Dewatering Pump at Bellandur Outflow",
                "task_type": "DEWATERING_PUMP_DEPLOYMENT",
                "priority": "HIGH",
                "target_zone": "Bellandur Basin",
                "assigned_team": "BBMP Quick Response Squad 4",
                "notes": "Clear culvert blockage immediately.",
            },
            headers=admin_headers,
        )
        assert task_res.status_code == 201

        # 6. Admin inspects audit logs
        audit_res = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
        assert audit_res.status_code == 200
        assert len(audit_res.json()["logs"]) >= 1
