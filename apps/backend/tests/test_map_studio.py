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


@pytest.mark.asyncio
async def test_list_all_11_experiences():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/map-studio/experiences")
    assert response.status_code == 200
    experiences = response.json()
    assert len(experiences) == 11
    ids = [e["id"] for e in experiences]
    assert "operational-satellite-gis" in ids
    assert "flood-risk-intelligence" in ids
    assert "live-rainfall-monitoring" in ids
    assert "elevation-terrain" in ids
    assert "drainage-water-body" in ids
    assert "extreme-heat-risk" in ids
    assert "air-quality-intelligence" in ids
    assert "citizen-hazard-report" in ids
    assert "verified-incident" in ids
    assert "infrastructure-emergency-facility" in ids
    assert "safe-navigation-risk-aware" in ids


@pytest.mark.asyncio
async def test_get_experience_details():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test Flood Risk (Map 2)
        res_flood = await ac.get("/api/v1/map-studio/experiences/flood-risk-intelligence")
        assert res_flood.status_code == 200
        d_flood = res_flood.json()
        assert d_flood["meta"]["id"] == "flood-risk-intelligence"
        assert d_flood["geojson"]["type"] == "FeatureCollection"
        assert len(d_flood["legend_items"]) >= 4

        # Test Safe Navigation (Map 11)
        res_nav = await ac.get("/api/v1/map-studio/experiences/safe-navigation-risk-aware")
        assert res_nav.status_code == 200
        d_nav = res_nav.json()
        assert any(f["properties"].get("type") == "RECOMMENDED_SAFE" for f in d_nav["geojson"]["features"])
        assert any(f["properties"].get("type") == "HIGH_HAZARD_CONFLICT" for f in d_nav["geojson"]["features"])

