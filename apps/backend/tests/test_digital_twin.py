import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.mark.asyncio
async def test_get_digital_twin_summary():
    """Verifies retrieval of digital twin timeline slices, sectors, and historical benchmarks."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/digital-twin/summary")
        assert res.status_code == 200
        data = res.json()

        assert "timeline_slices" in data
        assert len(data["timeline_slices"]) >= 5

        # Check timeline slice sequence
        slices = data["timeline_slices"]
        assert slices[0]["phase"] == "HISTORICAL"
        assert slices[2]["phase"] == "CURRENT_LIVE"
        assert slices[2]["is_live"] is True
        assert slices[3]["is_projection"] is True

        # Check sectors comparison
        assert "sectors" in data
        assert len(data["sectors"]) >= 3
        sector_names = [s["name"] for s in data["sectors"]]
        assert any("Bellandur" in n for n in sector_names)
        assert any("Whitefield" in n for n in sector_names)

        # Check historical benchmarks
        assert "historical_benchmarks" in data
        assert len(data["historical_benchmarks"]) >= 1
        first_event = data["historical_benchmarks"][0]
        assert "Cloudburst" in first_event["title"] or "URBAN" in first_event["event_type"]
        assert first_event["peak_severity"] >= 4

        # Verify scientific integrity disclaimer
        assert "disclaimer" in data
        assert "SCIENTIFIC INTEGRITY NOTICE" in data["disclaimer"]


@pytest.mark.asyncio
async def test_get_3d_buildings_geojson():
    """Verifies 3D extruded building footprint polygons formatted for MapLibre GL JS."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/digital-twin/buildings")
        assert res.status_code == 200
        data = res.json()

        assert data["type"] == "FeatureCollection"
        assert "features" in data
        assert len(data["features"]) >= 5

        first_bldg = data["features"][0]
        assert first_bldg["geometry"]["type"] == "Polygon"
        props = first_bldg["properties"]
        assert "height" in props
        assert props["height"] > 0
        assert "min_height" in props
        assert "flood_vulnerability" in props
