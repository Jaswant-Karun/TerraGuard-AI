import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.repositories.user_repository import UserRepository
from app.services.analytics_service import AnalyticsService
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


@pytest.mark.asyncio
async def test_get_analytics_overview():
    user = await get_or_create_user("analyst_test@terraguard.ai", "ANALYST", "Analyst User")
    headers = make_auth_headers(user["id"], "ANALYST")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/analytics/overview?time_range=30d", headers=headers)
        assert res.status_code == 200
        data = res.json()

        # Check all core intelligence sections exist
        assert "filters" in data
        assert data["filters"]["time_range"] == "30d"
        assert "summary" in data
        assert data["summary"]["total_citizen_reports"] >= 0
        assert "environmental_trends" in data
        assert len(data["environmental_trends"]) == 30
        assert "risk_distribution" in data
        assert len(data["risk_distribution"]) >= 1
        assert "geographic_comparisons" in data
        assert len(data["geographic_comparisons"]) >= 1
        assert "incident_history" in data
        assert len(data["incident_history"]) >= 1
        assert "alert_history" in data
        assert "response_task_stats" in data
        assert "data_sources" in data
        assert len(data["data_sources"]) >= 3
        assert "model_evaluations" in data
        assert len(data["model_evaluations"]) >= 2
        assert "data_disclaimer" in data


@pytest.mark.asyncio
async def test_analytics_overview_filtering():
    user = await get_or_create_user("coordinator_test@terraguard.ai", "COORDINATOR", "Coordinator User")
    headers = make_auth_headers(user["id"], "COORDINATOR")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Filter for Bellandur & 7d & FLOOD
        res = await client.get(
            "/api/v1/analytics/overview?time_range=7d&location=Bellandur&risk_category=FLOOD",
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["environmental_trends"]) == 7
        assert len(data["risk_distribution"]) == 1
        assert data["risk_distribution"][0]["category"] == "FLOOD"
        # Check geographic comparison filtered
        for g in data["geographic_comparisons"]:
            assert "bellandur" in g["zone_code"].lower() or "bellandur" in g["zone_name"].lower()


@pytest.mark.asyncio
async def test_export_report_csv():
    user = await get_or_create_user("citizen_export@terraguard.ai", "CITIZEN", "Citizen User")
    headers = make_auth_headers(user["id"], "CITIZEN")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/analytics/reports/export?format=csv&time_range=7d", headers=headers)
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert "attachment" in res.headers.get("content-disposition", "")
        csv_text = res.text

        # Strict mandate verification: check section headers
        assert "SECTION 1: OBSERVED ENVIRONMENTAL MEASUREMENTS" in csv_text
        assert "SECTION 2: VERIFIED MUNICIPAL INCIDENTS" in csv_text
        assert "SECTION 3: MODEL-BASED RISK ESTIMATES" in csv_text
        assert "SECTION 4: AI-GENERATED SUMMARIES" in csv_text
        assert "SECTION 5: MODEL EVALUATION BENCHMARKS" in csv_text
        assert "DISCLAIMER" in csv_text


@pytest.mark.asyncio
async def test_export_report_pdf():
    user = await get_or_create_user("admin_export@terraguard.ai", "ADMIN", "Admin User")
    headers = make_auth_headers(user["id"], "ADMIN")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/analytics/reports/export?format=pdf&time_range=30d", headers=headers)
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        assert "attachment" in res.headers.get("content-disposition", "")

        # Verify PDF header magic bytes '%PDF-'
        pdf_bytes = res.content
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 1000


@pytest.mark.asyncio
async def test_analytics_service_direct_unit():
    service = AnalyticsService()
    overview = await service.get_analytics_overview(time_range="30d")
    assert overview.filters["days"] == 30
    assert len(overview.environmental_trends) == 30
    assert overview.summary["data_sources_online"] >= 3

    # Generate CSV and verify non-empty
    csv_str = service.generate_csv_report(overview)
    assert len(csv_str) > 500

    # Generate PDF and verify valid binary
    pdf_bytes = service.generate_pdf_report(overview)
    assert len(pdf_bytes) > 2000
    assert pdf_bytes[:5] == b"%PDF-"
