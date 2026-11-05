import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.database import db_manager
from app.core.errors import AppException
from app.ml.aggregator import hazard_aggregator
from app.repositories.base_repository import BaseRepository
from app.repositories.geospatial_repository import geospatial_repository
from app.schemas.risk import (
    HistoricalRiskResponse,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskExplanationResponse,
    SubscoreDTO,
)
from app.services.environmental_service import environmental_service


class RiskService:
    """Orchestrates multi-hazard environmental risk intelligence, explainable ML, and MongoDB storage."""

    def __init__(self) -> None:
        self.repo = BaseRepository("risk_assessments")

    async def assess_risk(self, req: RiskAssessmentRequest) -> RiskAssessmentResponse:
        """Executes full multi-hazard risk assessment using live external telemetry and ML models."""
        lat = req.lat
        lng = req.lng
        now = datetime.now(UTC)

        # 1. Fetch live telemetry from Open-Meteo & OpenAQ
        env_current = await environmental_service.get_current_environment(lat=lat, lng=lng)
        env_forecast = await environmental_service.get_forecast(lat=lat, lng=lng, days=2)
        env_aqi = await environmental_service.get_air_quality(lat=lat, lng=lng)

        # 2. Query nearby historical / active flood incidents (3km radius)
        nearby_reports = await geospatial_repository.find_reports_near(
            lng=lng,
            lat=lat,
            radius_meters=3000.0,
            category="FLOOD",
            limit=20,
        )
        hist_count = len(nearby_reports)

        # 3. Resolve features with simulation overrides if supplied
        rainfall_intensity = (
            req.rainfall_intensity_mmh
            if req.rainfall_intensity_mmh is not None
            else (env_current.rainfall_mm or 0.0)
        )
        forecast_rf = (
            req.forecast_rainfall_sum_mm
            if req.forecast_rainfall_sum_mm is not None
            else (
                env_forecast.daily[0].precipitation_sum_mm
                if env_forecast.daily and env_forecast.daily[0].precipitation_sum_mm is not None
                else 0.0
            )
        )
        temp = (
            req.temperature_c
            if req.temperature_c is not None
            else (env_current.temperature_c or 26.0)
        )
        humidity = (
            req.humidity_pct
            if req.humidity_pct is not None
            else (env_current.humidity_pct or 65.0)
        )
        aqi_val = req.aqi if req.aqi is not None else env_current.aqi
        elevation = env_current.elevation_m if env_current.elevation_m is not None else 920.0
        drainage_deficit = (
            req.drainage_capacity_deficit_pct
            if req.drainage_capacity_deficit_pct is not None
            else 35.0
        )

        # 4. Invoke Multi-Hazard Risk Aggregator (ML & Hydrological Pipelines)
        agg = hazard_aggregator.aggregate(
            recent_rainfall_mm=rainfall_intensity * 1.5,
            forecast_rainfall_sum_mm=forecast_rf,
            rainfall_intensity_mmh=rainfall_intensity,
            elevation_m=elevation,
            terrain_slope_pct=2.0,
            historical_flood_incidents_in_radius=hist_count,
            drainage_capacity_deficit_pct=drainage_deficit,
            temperature_c=temp,
            humidity_pct=humidity,
            forecast_temp_max_c=env_forecast.daily[0].temp_max_c if env_forecast.daily else None,
            pm25=env_aqi.pm25,
            pm10=env_aqi.pm10,
            direct_aqi=aqi_val,
        )

        zone_code = req.zone_code or f"ZONE-GPS-{round(lat, 2)}N-{round(lng, 2)}E"
        assessment_id = f"RSK-{uuid.uuid4().hex[:8].upper()}"

        data_sources = [
            env_current.source,
            "Open-Meteo Weather API",
            "Open-Meteo Elevation Service",
            "TerraGuard 2dsphere Incident Spatial Index",
        ]
        if env_aqi.openaq_coverage == "AVAILABLE":
            data_sources.append("OpenAQ Ground Stations")

        # 5. Format Subscore DTOs
        flood_dto = SubscoreDTO(
            category=agg.flood_risk.category,
            score=agg.flood_risk.score,
            level=agg.flood_risk.level,
            contributing_factors=agg.flood_risk.contributing_factors,
            explanation=agg.flood_risk.explanation,
            model_version=agg.flood_risk.model_version,
            confidence=agg.flood_risk.confidence,
            is_rule_based=agg.flood_risk.is_rule_based,
            provenance_label=agg.flood_risk.provenance_label,
        )

        heat_dto = SubscoreDTO(
            category=agg.heat_risk.category,
            score=agg.heat_risk.score,
            level=agg.heat_risk.level,
            contributing_factors=agg.heat_risk.contributing_factors,
            explanation=agg.heat_risk.explanation,
            model_version=agg.heat_risk.model_version,
            confidence=agg.heat_risk.confidence,
            is_rule_based=agg.heat_risk.is_rule_based,
            provenance_label=agg.heat_risk.provenance_label,
        )

        aqi_dto = SubscoreDTO(
            category=agg.air_quality_risk.category,
            score=agg.air_quality_risk.score,
            level=agg.air_quality_risk.level,
            contributing_factors=agg.air_quality_risk.contributing_factors,
            explanation=agg.air_quality_risk.explanation,
            model_version=agg.air_quality_risk.model_version,
            confidence=agg.air_quality_risk.confidence,
            is_rule_based=agg.air_quality_risk.is_rule_based,
            provenance_label=agg.air_quality_risk.provenance_label,
        )

        resp = RiskAssessmentResponse(
            id=assessment_id,
            risk_category=agg.primary_hazard,
            composite_risk_score=agg.composite_risk_score,
            risk_level=agg.risk_level,
            primary_hazard=agg.primary_hazard,
            location={"type": "Point", "coordinates": [round(lng, 4), round(lat, 4)]},
            zone_code=zone_code,
            timestamp=now.isoformat(),
            flood_risk=flood_dto,
            heat_risk=heat_dto,
            air_quality_risk=aqi_dto,
            input_factors={
                "rainfall_intensity_mmh": rainfall_intensity,
                "forecast_rainfall_sum_mm": forecast_rf,
                "temperature_c": temp,
                "humidity_pct": humidity,
                "elevation_m": elevation,
                "governing_aqi": aqi_val,
                "historical_flood_incidents_in_radius": hist_count,
            },
            explanation=agg.explanation,
            mitigation_directives=agg.mitigation_directives,
            data_sources=data_sources,
            model_version=f"TG_MULTI_HAZARD_{agg.flood_risk.model_version}",
            confidence=agg.overall_confidence,
            is_rule_based=agg.is_rule_based_overall,
            provenance_label=(
                "Transparent Hydrological & EPA Baseline"
                if agg.is_rule_based_overall
                else "Validated Scikit-Learn ML + Hydrological Ensemble"
            ),
        )

        # 6. Store assessment asynchronously in MongoDB
        doc_to_save = resp.model_dump()
        doc_to_save["id"] = assessment_id
        await self.repo.create(doc_to_save)

        return resp

    async def get_current_risk(
        self, lat: float = 12.9716, lng: float = 77.5946, zone_code: str | None = None
    ) -> RiskAssessmentResponse:
        """Retrieves or computes active real-time risk profile."""
        req = RiskAssessmentRequest(lat=lat, lng=lng, zone_code=zone_code)
        return await self.assess_risk(req)

    async def get_history(
        self, page: int = 1, page_size: int = 20
    ) -> HistoricalRiskResponse:
        """Queries stored historical assessments with pagination."""
        paginated = await self.repo.find_paginated(
            page=page,
            page_size=page_size,
            sort_field="timestamp",
            sort_asc=False,
        )
        return HistoricalRiskResponse(
            items=paginated.items,
            total=paginated.total,
            page=paginated.page,
            page_size=paginated.page_size,
        )

    async def explain_assessment(self, assessment_id: str) -> RiskExplanationResponse:
        """Provides deep explainable root cause breakdown and model provenance for an assessment."""
        doc = await self.repo.find_by_id(assessment_id)
        if not doc:
            raise AppException(
                message=f"Assessment '{assessment_id}' not found.",
                status_code=404,
                error_code="ASSESSMENT_NOT_FOUND",
            )

        flood = doc.get("flood_risk", {})
        heat = doc.get("heat_risk", {})
        aqi = doc.get("air_quality_risk", {})

        factors_breakdown = {
            "flood_contributing_factors": flood.get("contributing_factors", {}),
            "heat_contributing_factors": heat.get("contributing_factors", {}),
            "air_quality_contributing_factors": aqi.get("contributing_factors", {}),
            "raw_measurements": doc.get("input_factors", {}),
        }

        provenance = {
            "model_version": doc.get("model_version"),
            "confidence_pct": doc.get("confidence"),
            "is_rule_based": doc.get("is_rule_based"),
            "provenance_label": doc.get("provenance_label"),
            "data_sources": doc.get("data_sources", []),
            "flood_model_provenance": flood.get("provenance_label"),
            "heat_model_provenance": heat.get("provenance_label"),
            "aqi_model_provenance": aqi.get("provenance_label"),
        }

        return RiskExplanationResponse(
            assessment_id=assessment_id,
            primary_hazard=doc.get("primary_hazard", "GENERAL"),
            composite_score=float(doc.get("composite_risk_score", 0.0)),
            risk_level=doc.get("risk_level", "LOW"),
            detailed_explanation=doc.get("explanation", ""),
            contributing_factors_breakdown=factors_breakdown,
            model_provenance=provenance,
            mitigation_directives=doc.get("mitigation_directives", []),
        )


risk_service = RiskService()
