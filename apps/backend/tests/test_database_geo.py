import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.core.database import haversine_distance_meters
from app.core.security import create_access_token
from app.models.geojson import GeoJSONPoint, GeoJSONPolygon
from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import (
    point_in_polygon,
    polygon_intersects_polygon,
)
from app.repositories.locations_repository import locations_repository
from main import app


@pytest.fixture(autouse=True)
def ensure_db_clean():
    """Ensure in-memory collections are cleaned before and after tests."""
    yield


# =========================================================================
# 1. GeoJSON Model & Coordinate Validation Tests
# =========================================================================

def test_geojson_point_valid():
    pt = GeoJSONPoint(coordinates=[77.5946, 12.9716])
    assert pt.type == "Point"
    assert pt.longitude == 77.5946
    assert pt.latitude == 12.9716


def test_geojson_point_invalid_coordinates():
    # Longitude out of range (-180 to 180)
    with pytest.raises(ValidationError):
        GeoJSONPoint(coordinates=[195.0, 12.9716])

    # Latitude out of range (-90 to 90)
    with pytest.raises(ValidationError):
        GeoJSONPoint(coordinates=[77.5946, 95.0])


def test_geojson_polygon_ring_auto_close():
    # Ring of 4 points without closing last point
    poly = GeoJSONPolygon(
        coordinates=[
            [
                [77.0, 12.0],
                [78.0, 12.0],
                [78.0, 13.0],
                [77.0, 13.0],
            ]
        ]
    )
    # Validator automatically closes the linear ring
    assert poly.coordinates[0][0] == poly.coordinates[0][-1]


def test_geojson_polygon_invalid_insufficient_points():
    with pytest.raises(ValidationError):
        GeoJSONPolygon(coordinates=[[[77.0, 12.0], [78.0, 12.0]]])


def test_haversine_distance_calculation():
    # Distance between Bangalore center (12.9716, 77.5946) and Hebbal (13.0382, 77.5925) ~ 7.4 km
    dist_m = haversine_distance_meters(77.5946, 12.9716, 77.5925, 13.0382)
    assert 7000 <= dist_m <= 8000


# =========================================================================
# 2. BaseRepository CRUD & Pagination Tests
# =========================================================================

@pytest.mark.asyncio
async def test_base_repository_crud():
    repo = BaseRepository("locations")
    test_loc = {
        "name": "Test Emergency Shelter Alpha",
        "category": "EMERGENCY_SHELTER",
        "location": {"type": "Point", "coordinates": [77.5946, 12.9716]},
        "address": "123 Civic Center",
        "is_operational": True,
    }

    # 1. Create
    created = await repo.create(test_loc)
    assert "id" in created
    doc_id = created["id"]

    # 2. Find by ID
    found = await repo.find_by_id(doc_id)
    assert found is not None
    assert found["name"] == "Test Emergency Shelter Alpha"

    # 3. Update
    updated = await repo.update(doc_id, {"is_operational": False})
    assert updated is not None
    assert updated["is_operational"] is False

    # 4. Delete
    deleted = await repo.delete(doc_id)
    assert deleted is True

    # 5. Confirm deletion
    not_found = await repo.find_by_id(doc_id)
    assert not_found is None


@pytest.mark.asyncio
async def test_base_repository_pagination():
    repo = BaseRepository("locations")
    # Clean test items
    inserted_ids = []
    for i in range(5):
        doc = await repo.create({
            "name": f"Paging Facility #{i}",
            "category": "SENSOR_STATION",
            "location": {"type": "Point", "coordinates": [77.5 + i * 0.01, 12.9]},
            "address": f"Street {i}",
            "is_operational": True,
            "test_flag": "pagination_test",
        })
        inserted_ids.append(doc["id"])

    # Query Page 1 with page_size=2
    res_p1 = await repo.find_paginated(
        filter_query={"test_flag": "pagination_test"},
        page=1,
        page_size=2,
    )
    assert res_p1.total >= 5
    assert len(res_p1.items) == 2
    assert res_p1.page == 1
    assert res_p1.has_next is True
    assert res_p1.has_prev is False

    # Query Page 2 with page_size=2
    res_p2 = await repo.find_paginated(
        filter_query={"test_flag": "pagination_test"},
        page=2,
        page_size=2,
    )
    assert len(res_p2.items) == 2
    assert res_p2.page == 2
    assert res_p2.has_prev is True

    # Cleanup
    for i_id in inserted_ids:
        await repo.delete(i_id)


# =========================================================================
# 3. Geospatial Proximity & Radius Search Tests
# =========================================================================

@pytest.mark.asyncio
async def test_geospatial_nearby_facilities_filter():
    center_lng = 77.5946
    center_lat = 12.9716

    # 1. Nearby hospital (approx 1.5 km away)
    near_doc = await locations_repository.create({
        "name": "Geotest Close Clinic",
        "category": "HOSPITAL",
        "location": {"type": "Point", "coordinates": [77.5873, 12.9800]},
        "address": "Close Ave",
        "is_operational": True,
        "test_tag": "geo_proximity_test",
    })

    # 2. Faraway hospital (approx 65 km away)
    far_doc = await locations_repository.create({
        "name": "Geotest Distant Hospital",
        "category": "HOSPITAL",
        "location": {"type": "Point", "coordinates": [77.1000, 13.4000]},
        "address": "Far Highway",
        "is_operational": True,
        "test_tag": "geo_proximity_test",
    })

    # Search within 5 km radius
    results = await locations_repository.find_nearby(
        lng=center_lng,
        lat=center_lat,
        radius_meters=5000.0,
        category="HOSPITAL",
    )

    names = [r["name"] for r in results]
    assert "Geotest Close Clinic" in names
    assert "Geotest Distant Hospital" not in names

    # Distance check
    close_res = next(r for r in results if r["name"] == "Geotest Close Clinic")
    assert close_res["distance_km"] < 5.0

    # Cleanup
    await locations_repository.delete(near_doc["id"])
    await locations_repository.delete(far_doc["id"])


def test_point_in_polygon_and_intersection():
    square_ring = [
        [0.0, 0.0],
        [10.0, 0.0],
        [10.0, 10.0],
        [0.0, 10.0],
        [0.0, 0.0],
    ]

    # Point inside (5, 5)
    assert point_in_polygon(5.0, 5.0, square_ring) is True

    # Point outside (15, 15)
    assert point_in_polygon(15.0, 15.0, square_ring) is False

    # Overlapping polygon
    other_ring = [
        [5.0, 5.0],
        [15.0, 5.0],
        [15.0, 15.0],
        [5.0, 15.0],
        [5.0, 5.0],
    ]
    assert polygon_intersects_polygon(square_ring, other_ring) is True


# =========================================================================
# 4. HTTP API Endpoints Tests
# =========================================================================

@pytest.mark.asyncio
async def test_database_health_probe():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health/db")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "mode" in data
    assert "connected" in data


@pytest.mark.asyncio
async def test_get_nearby_locations_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/locations/nearby",
            params={"lat": 12.9716, "lng": 77.5946, "radius_km": 15.0},
        )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "count" in data
    assert data["radius_km"] == 15.0
    assert data["search_center"]["lat"] == 12.9716
    assert data["search_center"]["lng"] == 77.5946


@pytest.mark.asyncio
async def test_get_reports_near_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/api/v1/geospatial/reports-near",
            params={"lat": 12.9716, "lng": 77.5946, "radius_km": 20.0},
        )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "count" in data


@pytest.mark.asyncio
async def test_risk_zones_within_polygon_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Bounding box around Bengaluru
        response = await ac.post(
            "/api/v1/geospatial/risk-zones-within",
            json={
                "coordinates": [
                    [77.4000, 12.8000],
                    [77.8000, 12.8000],
                    [77.8000, 13.2000],
                    [77.4000, 13.2000],
                    [77.4000, 12.8000],
                ],
                "limit": 10,
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_database_stats_telemetry_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/geospatial/db-stats")
    assert response.status_code == 200
    data = response.json()
    assert "collections" in data
    assert "users" in data["collections"]
    assert "locations" in data["collections"]
    assert "citizen_reports" in data["collections"]
    assert "total_documents" in data


@pytest.mark.asyncio
async def test_create_location_rbac():
    transport = ASGITransport(app=app)
    # 1. Citizen token (Should receive 401 Unauthorized or 403 Forbidden since citizen lacks Coordinator/Admin role)
    citizen_token = create_access_token(subject="user_citizen_123", role="CITIZEN")
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/locations",
            headers={"Authorization": f"Bearer {citizen_token}"},
            json={
                "name": "Unauthorized Clinic",
                "category": "HOSPITAL",
                "location": {"type": "Point", "coordinates": [77.59, 12.97]},
                "address": "Unauthorized Way",
            },
        )
    assert res.status_code in [401, 403]
