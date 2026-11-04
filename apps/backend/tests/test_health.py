import pytest
from httpx import ASGITransport, AsyncClient
from main import app


@pytest.mark.asyncio
async def test_root_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "TerraGuard AI" in data["name"]
    assert data["tagline"] == "Predict. Prevent. Protect."


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert "uptime_seconds" in data
    assert data["services"]["api"] == "operational"


@pytest.mark.asyncio
async def test_readiness_probe():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/ready")
    assert response.status_code == 200
    assert response.json()["ready"] is True


@pytest.mark.asyncio
async def test_404_centralized_error_handling():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/non-existent-route-xyz")
    assert response.status_code == 404
    data = response.json()
    assert data["status"] == "error"
    assert "error_code" in data
