"""Unit and integration tests for TerraGuard AI 2.0 Additive Map Intelligence Studio endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.mark.asyncio
async def test_get_map_studio_layers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/map-studio/layers")
    assert response.status_code == 200
    data = response.json()
    assert "layers" in data
    assert data["total"] >= 5
    assert "hazards" in data["categories"]
    assert any(l["id"] == "flood_risk_zones" for l in data["layers"])
    assert any(l["id"] == "water_bodies" for l in data["layers"])


@pytest.mark.asyncio
async def test_get_map_studio_flood_zones():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/map-studio/zones")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 4
    assert "metadata" in data
    assert data["metadata"]["total_population_at_risk"] > 0
    assert data["metadata"]["critical_zones_count"] >= 1


@pytest.mark.asyncio
async def test_get_map_studio_flood_zones_filtered():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/map-studio/zones?min_risk_level=CRITICAL")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    for feature in data["features"]:
        assert feature["properties"]["risk_level"] == "CRITICAL"


@pytest.mark.asyncio
async def test_get_map_studio_telemetry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/map-studio/telemetry?sector_id=zone-blr-koramangala-01")
    assert response.status_code == 200
    data = response.json()
    assert data["live_rainfall_rate_mm_h"] > 0
    assert len(data["hyetograph_history"]) >= 4
    assert len(data["forecast_progression"]) >= 6
    assert data["drainage_saturation_pct"] > 50.0


@pytest.mark.asyncio
async def test_get_map_studio_presets():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/map-studio/presets")
    assert response.status_code == 200
    data = response.json()
    assert len(data["presets"]) >= 4
    assert data["default_centroid"] == [77.5946, 12.9716]
    assert any(p["id"] == "koramangala" for p in data["presets"])
