import pytest
from httpx import ASGITransport, AsyncClient

from app.services.cache_service import cache_service
from main import app


@pytest.fixture(autouse=True)
def flush_cache():
    cache_service.clear()
    yield
    cache_service.clear()


@pytest.mark.asyncio
async def test_get_current_environment():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/environment/current", params={"lat": 12.9716, "lng": 77.5946})
    assert res.status_code == 200
    data = res.json()

    assert data["source"] == "OPEN_METEO"
    assert data["location"]["type"] == "Point"
    assert len(data["location"]["coordinates"]) == 2
    assert "temperature_c" in data
    assert "rainfall_mm" in data
    assert "humidity_pct" in data
    assert "wind_speed_kmh" in data
    assert "weather_condition" in data
    assert "units" in data
    assert "retrieved_at" in data
    assert "attribution" in data
    assert "Open-Meteo" in data["attribution"]


@pytest.mark.asyncio
async def test_get_current_environment_caching():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First request: fetches and populates cache
        res1 = await ac.get("/api/v1/environment/current", params={"lat": 12.9716, "lng": 77.5946})
        assert res1.status_code == 200
        assert res1.json()["is_cached"] is False

        # Second request: served from cache
        res2 = await ac.get("/api/v1/environment/current", params={"lat": 12.9716, "lng": 77.5946})
        assert res2.status_code == 200
        assert res2.json()["is_cached"] is True


@pytest.mark.asyncio
async def test_get_environmental_forecast():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/environment/forecast", params={"lat": 12.9716, "lng": 77.5946, "days": 5})
    assert res.status_code == 200
    data = res.json()

    assert "daily" in data
    assert "hourly" in data
    assert len(data["daily"]) >= 1
    assert "date" in data["daily"][0]
    assert "weather_condition" in data["daily"][0]
    assert len(data["hourly"]) >= 1
    assert "precipitation_mm" in data["hourly"][0]


@pytest.mark.asyncio
async def test_get_air_quality():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/environment/air-quality", params={"lat": 12.9716, "lng": 77.5946})
    assert res.status_code == 200
    data = res.json()

    assert "us_aqi" in data
    assert "category" in data
    assert "attribution" in data
    assert data["category"] in [
        "Good",
        "Moderate",
        "Unhealthy for Sensitive Groups",
        "Unhealthy",
        "Very Unhealthy",
        "Hazardous",
        "Unknown",
    ]


@pytest.mark.asyncio
async def test_get_environmental_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/environment/history", params={"lat": 12.9716, "lng": 77.5946})
    assert res.status_code == 200
    data = res.json()

    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)


def test_cache_service_logic():
    cache_service.clear()
    assert cache_service.get("nonexistent") is None

    cache_service.set("sample_key", {"temp": 28.5}, ttl_seconds=2)
    cached = cache_service.get("sample_key")
    assert cached == {"temp": 28.5}

    cache_service.delete("sample_key")
    assert cache_service.get("sample_key") is None

