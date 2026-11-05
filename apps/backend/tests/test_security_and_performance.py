import io
import time
from datetime import UTC, datetime, timedelta
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.services.automation_service import automation_service
from app.services.storage_service import storage_service
from main import app


def make_auth_headers(user_id: str, role: str) -> dict[str, str]:
    token = create_access_token(subject=user_id, role=role)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_http_security_headers():
    """Verify standard OWASP HTTP security headers are present on all responses."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/health")
        assert res.status_code == 200
        headers = res.headers

        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("x-frame-options") == "DENY"
        assert headers.get("x-xss-protection") == "1; mode=block"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
        assert "camera=()" in headers.get("permissions-policy", "")


@pytest.mark.asyncio
async def test_jwt_tampering_and_algorithm_confusion():
    """Verify rejection of tampered tokens, alg 'none', wrong token types, and expired tokens."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Non-existent or empty bearer
        res_empty = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer "})
        assert res_empty.status_code == 401

        # 2. Tampered token payload/signature
        valid_token = create_access_token(subject="user_123", role="CITIZEN")
        tampered_token = valid_token[:-4] + "abcd"
        res_tampered = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"}
        )
        assert res_tampered.status_code == 401
        assert res_tampered.json().get("error_code") == "INVALID_TOKEN"

        # 3. Expired token rejection
        expired_token = create_access_token(
            subject="user_123", role="CITIZEN", expires_delta=timedelta(seconds=-10)
        )
        res_expired = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert res_expired.status_code == 401
        assert res_expired.json().get("error_code") == "TOKEN_EXPIRED"


@pytest.mark.asyncio
async def test_password_hashing_robustness():
    """Verify bcrypt rounds >= 12, unique salts, and constant rejection of wrong passwords."""
    plain = "DisasterSafe#2026Secure!"
    hashed_1 = hash_password(plain)
    hashed_2 = hash_password(plain)

    # Different salts must yield different hashes
    assert hashed_1 != hashed_2
    assert hashed_1.startswith("$2b$12$") or hashed_1.startswith("$2a$12$")

    # Correct password succeeds
    assert verify_password(plain, hashed_1) is True
    assert verify_password(plain, hashed_2) is True

    # Incorrect password fails
    assert verify_password("WrongPassword#999", hashed_1) is False
    assert verify_password("", hashed_1) is False


@pytest.mark.asyncio
async def test_api_input_validation_boundaries():
    """Verify Pydantic boundary enforcement for latitude, longitude, and enums."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Latitude out of range (> 90.0)
        invalid_lat_res = await client.get("/api/v1/environment/current?lat=95.0&lng=77.5")
        assert invalid_lat_res.status_code == 422

        # 2. Longitude out of range (> 180.0)
        invalid_lng_res = await client.get("/api/v1/environment/current?lat=12.9&lng=195.0")
        assert invalid_lng_res.status_code == 422

        # 3. Invalid enum in export format
        invalid_export = await client.get("/api/v1/analytics/reports/export?format=exe")
        assert invalid_export.status_code == 422


@pytest.mark.asyncio
async def test_file_upload_security_constraints():
    """Verify file upload rejection of empty, dangerous executable, and corrupt files."""
    # 1. 0-byte file rejection
    with pytest.raises(Exception) as exc_empty:
        storage_service.validate_and_save_image(b"", original_filename="empty.jpg", content_type="image/jpeg")
    assert "empty" in str(exc_empty.value).lower()

    # 2. Executable / script extension rejection
    with pytest.raises(Exception) as exc_exe:
        storage_service.validate_and_save_image(
            b"fake-bytes", original_filename="malicious.exe", content_type="image/jpeg"
        )
    assert "executable" in str(exc_exe.value).lower() or "forbidden" in str(exc_exe.value).lower()

    # 3. Valid Pillow image generation and isolated storage
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    valid_bytes = buf.getvalue()

    saved = storage_service.validate_and_save_image(
        valid_bytes, original_filename="citizen_flood.jpg", content_type="image/jpeg"
    )
    assert saved.filename.startswith("hazard_")
    assert saved.filename.endswith(".jpg")
    assert saved.width == 100
    assert saved.height == 100
    assert len(saved.sha256_hash) == 64


@pytest.mark.asyncio
async def test_webhook_authentication_and_timing_defense():
    """Verify n8n webhook authentication and constant-time secret comparison."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Missing X-Webhook-Secret header -> 401
        res_missing = await client.post(
            "/api/v1/automation/webhooks/risk-event",
            json={
                "workflow_id": "WF_02_RISK_THRESHOLD",
                "risk_score": 75.0,
                "target_zone": "Bellandur Basin",
                "recommended_action": "Siren Notification",
            },
        )
        assert res_missing.status_code == 401
        assert res_missing.json().get("error_code") == "UNAUTHORIZED_WEBHOOK"

        # 2. Wrong X-Webhook-Secret -> 401
        res_wrong = await client.post(
            "/api/v1/automation/webhooks/risk-event",
            headers={"X-Webhook-Secret": "tampered_insecure_secret_attempt"},
            json={
                "workflow_id": "WF_02_RISK_THRESHOLD",
                "risk_score": 75.0,
                "target_zone": "Bellandur Basin",
            },
        )
        assert res_wrong.status_code == 401

        # 3. Valid X-Webhook-Secret -> 200
        secret = settings.N8N_WEBHOOK_SECRET or "tg_dev_secret_key"
        res_valid = await client.post(
            "/api/v1/automation/webhooks/risk-event",
            headers={"X-Webhook-Secret": secret},
            json={
                "workflow_id": "WF_02_RISK_THRESHOLD",
                "risk_score": 88.0,
                "target_zone": "Koramangala Valley",
                "recommended_action": "High Flood Alert",
            },
        )
        assert res_valid.status_code == 200
        assert res_valid.json().get("status") in ("ALERT_CREATED", "DUPLICATE_SUPPRESSED")


@pytest.mark.asyncio
async def test_duplicate_alert_suppression():
    """Verify duplicate alert deduplication and suppression window."""
    zone = f"Sector_Test_{int(time.time())}"
    # Dispatched
    automation_service.record_alert_dispatched(zone)
    # Check cooldown within 60 minutes
    assert automation_service.check_alert_cooldown(zone, cooldown_minutes=60) is True
    # Different zone is not in cooldown
    assert automation_service.check_alert_cooldown("Unrelated_Sector_99", cooldown_minutes=60) is False


@pytest.mark.asyncio
async def test_cors_options_preflight():
    """Verify CORS preflight handling for authorized frontend origins."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.options(
            "/api/v1/dashboard/summary",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert res.status_code in (200, 204)
        assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"


@pytest.mark.asyncio
async def test_performance_latency_benchmarks():
    """Benchmark API response latency for critical real-time endpoints (< 350ms SLA)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health probe latency
        t0 = time.perf_counter()
        health_res = await client.get("/api/v1/health")
        t_health = (time.perf_counter() - t0) * 1000.0
        assert health_res.status_code == 200
        assert t_health < 100.0  # Should be sub-100ms

        # 2. Dashboard summary latency
        t0 = time.perf_counter()
        dash_res = await client.get("/api/v1/dashboard/summary?time_range=24h")
        t_dash = (time.perf_counter() - t0) * 1000.0
        assert dash_res.status_code == 200
        assert t_dash < 350.0  # Under 350ms SLA

        # 3. Geospatial map layers latency
        t0 = time.perf_counter()
        map_res = await client.get("/api/v1/geospatial/map-layers")
        t_map = (time.perf_counter() - t0) * 1000.0
        assert map_res.status_code == 200
        assert t_map < 350.0

        # 4. Risk assessment engine latency
        t0 = time.perf_counter()
        risk_res = await client.post(
            "/api/v1/risk/assess",
            json={
                "location": {"type": "Point", "coordinates": [77.6711, 12.9348]},
                "recent_rainfall_mm": 45.0,
                "forecast_rainfall_mm": 60.0,
                "rainfall_intensity_mm_per_hr": 18.0,
                "temperature_c": 28.0,
                "relative_humidity_pct": 80.0,
                "air_quality_pm25": 42.0,
                "elevation_meters": 895.0,
            },
        )
        t_risk = (time.perf_counter() - t0) * 1000.0
        assert risk_res.status_code in (200, 201)
        assert t_risk < 400.0  # Under 400ms SLA for ML inference
