"""Unit and integration tests for Unified Map Backend Integration API (Prompt 5)."""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.mark.asyncio
async def test_get_maps_layers_catalog():
    """Verify /api/v1/maps/layers returns full catalog with all required layer types and metadata."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/layers")

    assert response.status_code == 200
    data = response.json()
    assert "layers" in data
    assert data["total"] >= 8
    assert "categories" in data
    assert any(layer["id"] == "flood" for layer in data["layers"])
    assert any(layer["id"] == "water-bodies" for layer in data["layers"])
    assert any(layer["id"] == "rainfall" for layer in data["layers"])
    assert any(layer["id"] == "reports" for layer in data["layers"])


@pytest.mark.asyncio
async def test_get_maps_geojson_flood():
    """Verify /api/v1/maps/geojson/flood returns valid GeoJSON with provenance and pagination."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/flood?page=1&page_size=3")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) <= 3
    assert "pagination" in data
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 3
    assert data["pagination"]["total_features"] >= 5

    first = data["features"][0]
    props = first["properties"]
    assert "risk_category" in props
    assert "area_sqkm" in props
    assert "data_source" in props
    assert "model_version" in props
    assert "uncertainty_range" in props
    assert "timestamp" in props


@pytest.mark.asyncio
async def test_get_maps_geojson_flood_filter_level():
    """Verify flood GeoJSON filtering by risk level."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/flood?min_risk_level=CRITICAL")

    assert response.status_code == 200
    data = response.json()
    assert all(f["properties"]["risk_category"] == "CRITICAL" for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_geojson_heat():
    """Verify /api/v1/maps/geojson/heat returns thermal anomalies."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/heat")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 3
    assert all("heat_index_c" in f["properties"] for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_geojson_air_quality():
    """Verify /api/v1/maps/geojson/air-quality returns AQI stations."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/air-quality")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 3
    assert all("aqi" in f["properties"] for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_geojson_reports_pii_redacted():
    """Verify citizen reports are returned with strict PII scrubbing (no email, phone, or password)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/reports")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    for feature in data["features"]:
        props = feature["properties"]
        assert "email" not in props
        assert "reporter_email" not in props
        assert "phone" not in props
        assert "contact_phone" not in props
        assert "hashed_password" not in props
        assert "user_id" not in props
        assert props.get("pii_redacted") is True


@pytest.mark.asyncio
async def test_get_maps_geojson_verified_incidents():
    """Verify /api/v1/maps/geojson/verified-incidents returns verified status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/verified-incidents?hazard_type=FLOOD")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert all(f["properties"]["category"] == "FLOOD" for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_geojson_infrastructure():
    """Verify /api/v1/maps/geojson/infrastructure returns emergency facilities."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/infrastructure?category=HOSPITAL")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert all(f["properties"]["category"] == "HOSPITAL" for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_geojson_water_bodies():
    """Verify /api/v1/maps/geojson/water-bodies returns lake polygons."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/water-bodies")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 4
    assert all(f["geometry"]["type"] == "Polygon" for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_geojson_rainfall():
    """Verify /api/v1/maps/geojson/rainfall returns precipitation stations."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/rainfall")

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 3
    assert all("observed_rainfall_mmh" in f["properties"] for f in data["features"])


@pytest.mark.asyncio
async def test_get_maps_legend():
    """Verify /api/v1/maps/legend returns cartographic symbology."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/legend")

    assert response.status_code == 200
    data = response.json()
    assert "layers" in data
    assert len(data["layers"]) >= 5


@pytest.mark.asyncio
async def test_get_maps_metadata():
    """Verify /api/v1/maps/metadata returns CRS, MongoDB stats, and endpoint catalog."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/metadata")

    assert response.status_code == 200
    data = response.json()
    assert "coordinate_reference_system" in data
    assert "mongodb_status" in data
    assert len(data["available_endpoints"]) == 11


@pytest.mark.asyncio
async def test_maps_bounds_validation_error():
    """Verify invalid bounding box (min_lat > max_lat) triggers HTTP 400 Bad Request."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/geojson/flood?min_lat=15.0&max_lat=12.0&min_lng=77.0&max_lng=78.0")

    assert response.status_code == 400
    data = response.json()
    assert "message" in data or "detail" in data


@pytest.mark.asyncio
async def test_get_contextual_area_analytics():
    """Verify /api/v1/maps/analytics/context returns complete contextual intelligence (Prompt 7)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/maps/analytics/context?lat=12.9250&lng=77.6250&radius_km=3.0")

    assert response.status_code == 200
    data = response.json()
    assert "area_name" in data
    assert "Koramangala" in data["area_name"]
    assert "coordinates" in data
    assert data["coordinates"]["lat"] == 12.9250
    assert "current_conditions" in data
    assert data["current_conditions"]["rainfall_intensity_mm_h"] > 0
    assert "flood_risk" in data
    assert data["flood_risk"]["risk_level"] in ["CRITICAL", "HIGH", "MODERATE", "LOW"]
    assert "heat_risk" in data
    assert "nearby_citizen_reports" in data
    assert "nearby_verified_incidents" in data
    assert "nearby_facilities" in data
    assert "data_freshness" in data
    assert len(data["data_freshness"]) >= 4
    assert "historical_series" in data
    assert len(data["historical_series"]) >= 5
    assert "comparison_metrics" in data
    assert "city_avg_flood_score" in data["comparison_metrics"]

