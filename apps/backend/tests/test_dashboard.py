import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.mark.asyncio
async def test_get_dashboard_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()

    assert "location" in data
    assert "environmental_status" in data
    assert "active_incidents_count" in data
    assert "risk_distribution" in data
    assert "recent_citizen_reports" in data
    assert "recent_alerts" in data
    assert "risk_trends" in data
    assert "geographic_risk_summary" in data
    assert "ai_insights" in data

    # Check environmental status fields
    env = data["environmental_status"]
    assert "status" in env
    assert "source" in env

    # Check risk distribution
    rd = data["risk_distribution"]
    assert "CRITICAL" in rd
    assert "HIGH" in rd
    assert "MODERATE" in rd
    assert "LOW" in rd

    # Check risk trends structure (default 24h -> 8 points)
    assert len(data["risk_trends"]) == 8
    first_trend = data["risk_trends"][0]
    assert "label" in first_trend
    assert "flood_risk" in first_trend
    assert "air_risk" in first_trend
    assert "composite_risk" in first_trend


@pytest.mark.asyncio
async def test_get_dashboard_summary_time_ranges():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res_7d = await ac.get("/api/v1/dashboard/summary?time_range=7d")
        assert res_7d.status_code == 200
        assert len(res_7d.json()["risk_trends"]) == 7

        res_30d = await ac.get("/api/v1/dashboard/summary?time_range=30d")
        assert res_30d.status_code == 200
        assert len(res_30d.json()["risk_trends"]) == 6


@pytest.mark.asyncio
async def test_get_dashboard_locations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/locations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["id"] == "ALL_METRO"


@pytest.mark.asyncio
async def test_get_dashboard_notifications():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/notifications")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "title" in data[0]
    assert "severity" in data[0]

