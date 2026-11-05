import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.repositories.citizen_reports_repository import citizen_reports_repo


@pytest.mark.asyncio
async def test_compute_safe_routes_basic():
    """Tests basic routing calculation between two urban coordinates."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # From Bengaluru Central to Whitefield
        payload = {
            "origin": [77.5946, 12.9716],
            "destination": [77.7499, 12.9698],
            "mode": "driving",
            "avoid_hazards": True,
            "max_alternatives": 3,
        }
        res = await client.post("/api/v1/navigation/routes", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert "primary_route" in data
        assert "alternatives" in data
        assert "nearby_facilities" in data
        assert "disclaimer" in data
        assert "Official emergency" in data["disclaimer"]

        # Validate primary route structure
        primary = data["primary_route"]
        assert primary["distance_km"] > 0
        assert primary["duration_minutes"] > 0
        assert primary["path_geojson"]["type"] == "LineString"
        assert len(primary["path_geojson"]["coordinates"]) >= 2
        assert primary["safety_status"] in [
            "VERIFIED_SAFER_ROUTE",
            "STANDARD_ROUTE",
            "CAUTION_ROUTE",
            "HAZARDOUS_ROUTE",
        ]


@pytest.mark.asyncio
async def test_truth_in_routing_insufficient_hazard_data():
    """A route must only be described as safer when available hazard data supports that conclusion.
    If no hazard reports exist in the corridor, it MUST be labeled STANDARD_ROUTE, not verified safe.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Isolated coordinates where no sample hazard reports are placed
        payload = {
            "origin": [77.1000, 13.5000],
            "destination": [77.1500, 13.5500],
            "mode": "driving",
            "max_alternatives": 1,
        }
        res = await client.post("/api/v1/navigation/routes", json=payload)
        assert res.status_code == 200
        data = res.json()

        primary = data["primary_route"]
        # Must NOT claim verified safe when data is insufficient
        assert primary["safety_status"] == "STANDARD_ROUTE"
        assert primary["data_sufficiency"] == "INSUFFICIENT"
        assert "Insufficient hazard telemetry" in primary["safety_label"]


@pytest.mark.asyncio
async def test_hazard_avoidance_and_safety_classification():
    """Injects an active flood hazard directly along a corridor and tests hazard detection."""
    # Seed a temporary active flood hazard at coordinate [77.6250, 12.9350]
    hazard_doc = {
        "id": "TEST-REP-FLOOD-01",
        "_id": "TEST-REP-FLOOD-01",
        "title": "Severe Submerged Underpass",
        "description": "Underpass submerged in 1.2m of water, impassable for light vehicles",
        "category": "FLOOD",
        "severity": 5,
        "status": "VERIFIED",
        "location": {"type": "Point", "coordinates": [77.6250, 12.9350]},
    }
    store = citizen_reports_repo._get_memory_store()
    store["TEST-REP-FLOOD-01"] = hazard_doc

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Origin and destination bracketing the flood coordinate
        payload = {
            "origin": [77.6200, 12.9350],
            "destination": [77.6300, 12.9350],
            "mode": "driving",
            "max_alternatives": 3,
        }
        res = await client.post("/api/v1/navigation/routes", json=payload)
        assert res.status_code == 200
        data = res.json()

        all_routes = [data["primary_route"]] + data["alternatives"]
        # Confirm at least one route detected the nearby flood hazard
        hazard_statuses = [r["safety_status"] for r in all_routes]
        assert any(
            status in ["HAZARDOUS_ROUTE", "CAUTION_ROUTE", "VERIFIED_SAFER_ROUTE"]
            for status in hazard_statuses
        )

    # Clean up test hazard
    store.pop("TEST-REP-FLOOD-01", None)


@pytest.mark.asyncio
async def test_get_nearby_emergency_facilities():
    """Verifies retrieval of genuine hospitals, emergency shelters, and fire stations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Near Victoria Hospital / Kalasipalyam
        res = await client.get(
            "/api/v1/navigation/facilities/nearby",
            params={"lng": 77.5738, "lat": 12.9642, "radius_km": 10.0},
        )
        assert res.status_code == 200
        data = res.json()

        assert "facilities" in data
        assert data["total"] > 0
        facilities = data["facilities"]

        # Confirm facilities contain verified fields without fabricated data
        hospitals = [f for f in facilities if f["category"] == "HOSPITAL"]
        assert len(hospitals) >= 1
        assert "Victoria Hospital" in hospitals[0]["name"]
        assert hospitals[0]["distance_km"] <= 1.0
        assert hospitals[0]["contact_phone"] is not None
        assert hospitals[0]["is_operational"] is True


@pytest.mark.asyncio
async def test_get_evacuation_corridors():
    """Verifies retrieval of designated municipal evacuation corridors."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/navigation/corridors")
        assert res.status_code == 200
        corridors = res.json()
        assert isinstance(corridors, list)
        assert len(corridors) >= 1
        first = corridors[0]
        assert "name" in first
        assert "path" in first
        assert first["path"]["type"] == "LineString"
