"""Unit and integration tests for Flood Risk Visualization Engine (Prompt 4)."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.mark.asyncio
async def test_get_analytical_flood_layers():
    """Verify that all analytical GeoJSON layers, metadata, and uncertainty bounds are served correctly."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/flood-visualization/layers?lat=12.9716&lng=77.5946")

    assert response.status_code == 200
    data = response.json()

    # Verify all layers mandated by Prompt 4 exist in response
    assert "susceptibility_zones" in data
    assert "observed_rainfall" in data
    assert "forecast_rainfall" in data
    assert "historical_incidents" in data
    assert "waterlogging_reports" in data
    assert "water_bodies" in data
    assert "elevation_benchmarks" in data
    assert "drainage_network" in data
    assert "layer_registry" in data
    assert "metadata" in data

    # Verify susceptibility zones features have documented source data and no arbitrary polygons
    zones = data["susceptibility_zones"]
    assert zones["type"] == "FeatureCollection"
    assert len(zones["features"]) >= 5

    first_zone = zones["features"][0]
    props = first_zone["properties"]
    assert "zone_id" in props
    assert "risk_category" in props
    assert props["risk_category"] in ["CRITICAL", "HIGH", "MODERATE", "LOW"]
    assert "data_source" in props
    assert "model_version" in props
    assert "confidence_pct" in props
    assert "uncertainty_range" in props
    assert "area_sqkm" in props
    assert "risk_explanation" in props
    assert len(props["risk_explanation"]["contributing_factors"]) >= 3

    # Verify observed rainfall has point markers
    rf = data["observed_rainfall"]
    assert rf["type"] == "FeatureCollection"
    assert len(rf["features"]) >= 3
    assert all(f["geometry"]["type"] == "Point" for f in rf["features"])

    # Verify waterlogging reports heatmap structure
    wlog = data["waterlogging_reports"]
    assert wlog["type"] == "FeatureCollection"
    assert len(wlog["features"]) >= 5
    assert all("weight" in f["properties"] for f in wlog["features"])

    # Verify layer registry has documentation for each layer
    registry = data["layer_registry"]
    assert len(registry) >= 7
    for reg in registry:
        assert "data_source" in reg
        assert "model_version" in reg
        assert "confidence" in reg
        assert "uncertainty" in reg


@pytest.mark.asyncio
async def test_get_flood_zone_explanation_valid():
    """Verify zone explanation endpoint returns detailed hydrological rationale and factor breakdown."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/flood-visualization/explanation/ZONE-BLR-KOR-01")

    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE-BLR-KOR-01"
    assert data["risk_category"] == "CRITICAL"
    assert data["flood_depth_m"] > 0
    assert "data_source" in data
    assert "model_version" in data
    assert "explanation" in data

    explanation = data["explanation"]
    assert "headline" in explanation
    assert "primary_driver" in explanation
    assert "hydrological_rationale" in explanation
    assert len(explanation["contributing_factors"]) >= 3
    assert "mitigation_protocol" in explanation


@pytest.mark.asyncio
async def test_get_flood_zone_explanation_not_found():
    """Verify zone explanation endpoint returns 404 for nonexistent zone."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/flood-visualization/explanation/ZONE-NON-EXISTENT-99")

    assert response.status_code == 404
    data = response.json()
    assert data.get("status") == "error" or "message" in data
