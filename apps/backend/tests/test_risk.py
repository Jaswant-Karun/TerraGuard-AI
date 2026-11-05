import pytest
from httpx import ASGITransport, AsyncClient

from app.ml.air_quality_risk import air_quality_risk_estimator
from app.ml.flood_risk import flood_risk_estimator
from app.ml.heat_risk import calculate_noaa_heat_index, heat_risk_estimator
from app.ml.model_trainer import train_and_save_flood_model
from main import app


def test_noaa_heat_index_calculation():
    # Hot & humid: 35°C with 75% RH produces extreme heat index (>48°C)
    hi_extreme = calculate_noaa_heat_index(35.0, 75.0)
    assert hi_extreme > 45.0

    # Mild: 20°C with 50% RH produces mild heat index
    hi_mild = calculate_noaa_heat_index(20.0, 50.0)
    assert 18.0 <= hi_mild <= 22.0


def test_heat_risk_estimator():
    # Extreme heat scenario
    res_extreme = heat_risk_estimator.estimate(temperature_c=38.0, humidity_pct=70.0)
    assert res_extreme.level in ["HIGH", "CRITICAL"]
    assert res_extreme.score >= 50.0
    assert "ambient_temperature" in res_extreme.contributing_factors
    assert res_extreme.is_rule_based is True
    assert "NWS" in res_extreme.provenance_label

    # Safe scenario
    res_safe = heat_risk_estimator.estimate(temperature_c=22.0, humidity_pct=45.0)
    assert res_safe.level == "LOW"
    assert res_safe.score < 25.0


def test_air_quality_risk_estimator():
    # Hazardous PM2.5 spike (180 µg/m³)
    res_severe = air_quality_risk_estimator.estimate(pm25=180.0, pm10=260.0)
    assert res_severe.level in ["HIGH", "CRITICAL"]
    assert res_severe.score >= 50.0
    assert "PM2.5" in res_severe.raw_inputs["primary_pollutant"]

    # Clean air scenario (5 µg/m³)
    res_clean = air_quality_risk_estimator.estimate(pm25=5.0, pm10=12.0)
    assert res_clean.level == "LOW"
    assert res_clean.score < 25.0


def test_flood_model_training_and_inference():
    # Verify model trainer runs, splits 80/20, evaluates performance and saves provenance
    prov = train_and_save_flood_model()
    assert prov["is_ml_validated"] is True
    assert prov["test_r2_score"] is not None
    assert "feature_importances_pct" in prov
    assert len(prov["feature_names"]) == 7

    # Severe cloudburst conditions
    res_flood = flood_risk_estimator.estimate(
        recent_rainfall_mm=60.0,
        forecast_rainfall_sum_mm=80.0,
        rainfall_intensity_mmh=45.0,
        elevation_m=890.0,
        historical_flood_incidents_in_radius=5,
    )
    assert res_flood.level in ["HIGH", "CRITICAL"]
    assert res_flood.score >= 50.0
    assert "rainfall_intensity" in res_flood.explanation.lower()

    # Dry weather
    res_dry = flood_risk_estimator.estimate(
        recent_rainfall_mm=0.0,
        forecast_rainfall_sum_mm=0.0,
        rainfall_intensity_mmh=0.0,
        elevation_m=950.0,
    )
    assert res_dry.level == "LOW"
    assert res_dry.score < 25.0


@pytest.mark.asyncio
async def test_api_assess_risk():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/risk/assess",
            json={
                "lat": 12.9716,
                "lng": 77.5946,
                "zone_code": "TEST-ZONE-01",
                "rainfall_intensity_mmh": 55.0,
                "forecast_rainfall_sum_mm": 70.0,
            },
        )
    assert res.status_code == 201
    data = res.json()

    assert "id" in data
    assert "composite_risk_score" in data
    assert "risk_level" in data
    assert "primary_hazard" in data
    assert "flood_risk" in data
    assert "heat_risk" in data
    assert "air_quality_risk" in data
    assert "input_factors" in data
    assert "explanation" in data
    assert "mitigation_directives" in data
    assert "data_sources" in data
    assert "model_version" in data
    assert "confidence" in data
    assert "provenance_label" in data


@pytest.mark.asyncio
async def test_api_get_current_risk():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get(
            "/api/v1/risk/current",
            params={"lat": 12.9716, "lng": 77.5946},
        )
    assert res.status_code == 200
    data = res.json()
    assert "composite_risk_score" in data
    assert "risk_level" in data
    assert data["location"]["type"] == "Point"


@pytest.mark.asyncio
async def test_api_get_risk_history_and_explain():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create an assessment first
        post_res = await ac.post(
            "/api/v1/risk/assess",
            json={"lat": 12.9716, "lng": 77.5946, "rainfall_intensity_mmh": 40.0},
        )
        assert post_res.status_code == 201
        created_id = post_res.json()["id"]

        # 1. Query history
        hist_res = await ac.get("/api/v1/risk/history", params={"page": 1, "page_size": 10})
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert "items" in hist_data
        assert hist_data["total"] >= 1

        # 2. Query explanation
        exp_res = await ac.get(f"/api/v1/risk/explain/{created_id}")
        assert exp_res.status_code == 200
        exp_data = exp_res.json()
        assert exp_data["assessment_id"] == created_id
        assert "contributing_factors_breakdown" in exp_data
        assert "model_provenance" in exp_data
        assert "mitigation_directives" in exp_data
