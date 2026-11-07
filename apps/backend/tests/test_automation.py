import pytest
from httpx import ASGITransport, AsyncClient

from main import app

VALID_SECRET = "tg_dev_secret_key"
AUTH_HEADERS = {"X-Webhook-Secret": VALID_SECRET, "X-TerraGuard-Origin": "n8n"}


@pytest.mark.asyncio
async def test_get_workflow_catalog():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/automation/workflows")
        assert res.status_code == 200
        workflows = res.json()
        assert len(workflows) == 6
        ids = {w["id"] for w in workflows}
        expected = {
            "WF_01_ENV_MONITORING",
            "WF_02_RISK_THRESHOLD",
            "WF_03_CITIZEN_REPORT_PROCESSING",
            "WF_04_ALERT_NOTIFICATION",
            "WF_05_RESPONSE_TASK_CREATION",
            "WF_06_DAILY_INTELLIGENCE_REPORT",
        }
        assert ids == expected


@pytest.mark.asyncio
async def test_webhook_auth_enforcement():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "title": "Severe Flood Warning",
            "message": "Water levels rising rapidly",
            "severity": "HIGH",
            "target_zone": "BLR-TEST-ZONE",
            "lat": 12.9352,
            "lng": 77.6245,
            "radius_km": 5.0,
        }
        # 1. Missing secret header -> 401
        res_no_auth = await ac.post("/api/v1/automation/webhooks/create-alert", json=payload)
        assert res_no_auth.status_code == 401

        # 2. Invalid secret header -> 401
        res_bad_auth = await ac.post(
            "/api/v1/automation/webhooks/create-alert",
            json=payload,
            headers={"X-Webhook-Secret": "invalid_wrong_secret"},
        )
        assert res_bad_auth.status_code == 401


@pytest.mark.asyncio
async def test_create_alert_and_deduplication():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        zone = "BLR-DEDUP-01"
        payload = {
            "title": "Critical Inundation Alert",
            "message": "Stormwater culverts overwhelmed",
            "severity": "CRITICAL",
            "target_zone": zone,
            "lat": 12.9352,
            "lng": 77.6245,
            "radius_km": 5.0,
        }

        # 1. First alert creates MongoDB document
        res1 = await ac.post(
            "/api/v1/automation/webhooks/create-alert", json=payload, headers=AUTH_HEADERS
        )
        assert res1.status_code == 200
        data1 = res1.json()
        assert "id" in data1
        assert data1["title"] == "Critical Inundation Alert"
        assert data1["target_zone"] == zone

        # 2. Immediate second alert in same zone is suppressed by cooldown
        res2 = await ac.post(
            "/api/v1/automation/webhooks/create-alert", json=payload, headers=AUTH_HEADERS
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2.get("created") is False
        assert data2.get("reason") == "COOLDOWN_ACTIVE"


@pytest.mark.asyncio
async def test_task_dispatch_callback():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "workflow_id": "WF_05_RESPONSE_TASK_CREATION",
            "status": "DISPATCHED",
            "title": "Deploy 3 Trailer Dewatering Pumps",
            "assigned_department": "MUNICIPAL_STORMWATER_CORPS",
            "priority": "HIGH",
            "instructions": "Place pumps at Koramangala 80ft Rd junction.",
            "location": {"type": "Point", "coordinates": [77.6245, 12.9352]},
            "requires_human_approval": False,
        }
        res = await ac.post(
            "/api/v1/automation/webhooks/task-dispatch-callback",
            json=payload,
            headers=AUTH_HEADERS,
        )
        assert res.status_code == 200
        body = res.json()
        assert "id" in body
        assert body["assigned_department"] == "MUNICIPAL_STORMWATER_CORPS"
        assert body["status"] == "DISPATCHED"


@pytest.mark.asyncio
async def test_daily_intelligence_and_workflow_logs():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Submit daily briefing callback
        briefing_payload = {
            "workflow_id": "WF_06_DAILY_INTELLIGENCE_REPORT",
            "status": "SUCCESS",
            "report_date": "2026-11-05",
            "title": "Daily Briefing Test",
            "summary_text": "Situation normal across monitored sectors.",
            "total_incidents": 5,
        }
        res_cb = await ac.post(
            "/api/v1/automation/webhooks/daily-intelligence-callback",
            json=briefing_payload,
            headers=AUTH_HEADERS,
        )
        assert res_cb.status_code == 200

        # Query logs
        res_logs = await ac.get("/api/v1/automation/logs", params={"workflow_id": "WF_06_DAILY_INTELLIGENCE_REPORT"})
        assert res_logs.status_code == 200
        logs_body = res_logs.json()
        assert "items" in logs_body
        assert logs_body["total"] >= 1
        assert logs_body["items"][0]["workflow_id"] == "WF_06_DAILY_INTELLIGENCE_REPORT"


@pytest.mark.asyncio
async def test_trigger_workflow_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/automation/trigger/WF_01_ENV_MONITORING")
        assert res.status_code == 200
        body = res.json()
        assert body.get("dispatched") is True


@pytest.mark.asyncio
async def test_incident_verified_webhook_and_deduplication():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "workflow_id": "WF_02_RISK_THRESHOLD",
            "title": "Verified Storm Inundation at Silk Board",
            "category": "FLOOD",
            "severity": 4,
            "lat": 12.9175,
            "lng": 77.6234,
            "depth_m": 0.85,
            "response_unit": "BBMP Quick Reaction Pumping Squad QRF-4",
            "verified_by": "EOC_AUTOMATED_SATELLITE_AUDIT",
            "notes": "Verified by rain gauge correlation and field telemetry",
            "status": "VERIFIED",
        }

        # 1. First verification succeeds and returns GeoJSON feature
        res1 = await ac.post(
            "/api/v1/automation/webhooks/incident-verified",
            json=payload,
            headers=AUTH_HEADERS,
        )
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["verified"] is True
        assert "geojson_feature" in data1
        assert data1["geojson_feature"]["properties"]["depth_m"] == 0.85

        # 2. Duplicate submission within 30 min is cleanly suppressed
        res2 = await ac.post(
            "/api/v1/automation/webhooks/incident-verified",
            json=payload,
            headers=AUTH_HEADERS,
        )
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["verified"] is False
        assert data2["reason"] == "DUPLICATE_SUPPRESSED"


@pytest.mark.asyncio
async def test_environmental_observation_webhook_escalation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # High rainfall triggers elevated risk alert
        payload = {
            "workflow_id": "WF_01_ENV_MONITORING",
            "station_id": "AWS-BLR-KOR-TEST",
            "station_name": "Koramangala AWS Test Station",
            "lat": 12.9280,
            "lng": 77.6250,
            "rainfall_rate_mm_h": 45.0,
            "temperature_c": 24.5,
            "humidity_pct": 92.0,
            "aqi": 110,
            "source": "Open-Meteo & IMD Telemetry",
        }
        res = await ac.post(
            "/api/v1/automation/webhooks/environmental-observation",
            json=payload,
            headers=AUTH_HEADERS,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["ingested"] is True
        assert data["risk_escalated"] is True
        assert data["layer_refreshed"] == "environmental_telemetry"


@pytest.mark.asyncio
async def test_prediction_outcome_webhook_accuracy():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "workflow_id": "WF_01_ENV_MONITORING",
            "prediction_id": "PRED-2026-TEST-01",
            "sector_name": "Koramangala Lowland Basin",
            "lat": 12.9352,
            "lng": 77.6245,
            "predicted_depth_m": 0.60,
            "observed_depth_m": 0.65,
            "model_version": "v2.4-hydrological-ensemble",
        }
        res = await ac.post(
            "/api/v1/automation/webhooks/prediction-outcome",
            json=payload,
            headers=AUTH_HEADERS,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["verified"] is True
        assert data["error_m"] == 0.05
        assert data["accuracy_pct"] >= 80.0


@pytest.mark.asyncio
async def test_map_sync_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/automation/map-sync-status")
        assert res.status_code == 200
        data = res.json()
        assert data["is_connected"] is True
        assert data["active_workflows_count"] == 6
        assert "confirmed_executions_24h" in data
        assert "recent_confirmed_events" in data

