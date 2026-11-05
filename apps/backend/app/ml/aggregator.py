from dataclasses import dataclass

from app.ml.air_quality_risk import air_quality_risk_estimator
from app.ml.base import RiskLevel, RiskSubscore, score_to_risk_level
from app.ml.flood_risk import flood_risk_estimator
from app.ml.heat_risk import heat_risk_estimator


@dataclass
class AggregatedRiskAssessment:
    composite_risk_score: float
    risk_level: RiskLevel
    primary_hazard: str
    explanation: str
    flood_risk: RiskSubscore
    heat_risk: RiskSubscore
    air_quality_risk: RiskSubscore
    overall_confidence: float
    is_rule_based_overall: bool
    mitigation_directives: list[str]


class HazardAggregator:
    """Aggregates flood, extreme heat, and air quality risk indices into a unified urban risk profile."""

    def aggregate(
        self,
        # Flood features
        recent_rainfall_mm: float = 0.0,
        forecast_rainfall_sum_mm: float = 0.0,
        rainfall_intensity_mmh: float = 0.0,
        elevation_m: float = 920.0,
        terrain_slope_pct: float = 2.0,
        historical_flood_incidents_in_radius: int = 0,
        drainage_capacity_deficit_pct: float = 30.0,
        # Heat features
        temperature_c: float = 26.0,
        humidity_pct: float = 65.0,
        forecast_temp_max_c: float | None = None,
        # Air Quality features
        pm25: float | None = None,
        pm10: float | None = None,
        direct_aqi: float | None = None,
    ) -> AggregatedRiskAssessment:
        # 1. Compute individual subscores
        flood_sub = flood_risk_estimator.estimate(
            recent_rainfall_mm=recent_rainfall_mm,
            forecast_rainfall_sum_mm=forecast_rainfall_sum_mm,
            rainfall_intensity_mmh=rainfall_intensity_mmh,
            elevation_m=elevation_m,
            terrain_slope_pct=terrain_slope_pct,
            historical_flood_incidents_in_radius=historical_flood_incidents_in_radius,
            drainage_capacity_deficit_pct=drainage_capacity_deficit_pct,
        )

        heat_sub = heat_risk_estimator.estimate(
            temperature_c=temperature_c,
            humidity_pct=humidity_pct,
            forecast_temp_max_c=forecast_temp_max_c,
        )

        aqi_sub = air_quality_risk_estimator.estimate(
            pm25=pm25,
            pm10=pm10,
            direct_aqi=direct_aqi,
        )

        # 2. Identify primary hazard and acute threat
        subscores = [flood_sub, heat_sub, aqi_sub]
        primary = max(subscores, key=lambda s: s.score)

        # 3. Multi-hazard composite scoring
        # Acute hazard dominates (70%) while secondary factors provide baseline context (30%)
        # This prevents a critical 95/100 flood from being averaged away into false safety
        max_score = primary.score
        other_scores = [s.score for s in subscores if s != primary]
        mean_others = (sum(other_scores) / len(other_scores)) if other_scores else 0.0

        composite_score = round((max_score * 0.70) + (mean_others * 0.30), 1)
        composite_level = score_to_risk_level(composite_score)

        # 4. Formulate pre-emptive municipal mitigation directives
        directives: list[str] = []
        if primary.category == "FLASH_FLOOD" and primary.score >= 50.0:
            directives.append("Alert Stormwater Corps: Pre-deploy portable suction pumps at lowland culverts.")
            directives.append("Notify Traffic Control: Activate road diversion corridor away from underpasses.")
        elif primary.category == "EXTREME_HEAT" and primary.score >= 50.0:
            directives.append("Broadcast Heat Advisory: Open municipal air-conditioned cooling centers.")
            directives.append("Suspend outdoor construction and intense civic activities between 11:30 and 16:00.")
        elif primary.category == "AIR_POLLUTION" and primary.score >= 50.0:
            directives.append("Issue Industrial Notice: Enforce particulate emission reductions in industrial sector.")
            directives.append("Advise vulnerable populations and schools to utilize N95 filtration and stay indoors.")
        else:
            directives.append("Maintain standard civic telemetry monitoring. Environmental parameters nominal.")

        explanation = (
            f"Composite Threat Index: {composite_score}/100 ({composite_level}). "
            f"Governing threat is {primary.category.replace('_', ' ')} (Score: {primary.score}/100, {primary.level}). "
            f"{primary.explanation}"
        )

        overall_conf = round((flood_sub.confidence + heat_sub.confidence + aqi_sub.confidence) / 3.0, 1)
        is_all_rule_based = flood_sub.is_rule_based and heat_sub.is_rule_based and aqi_sub.is_rule_based

        return AggregatedRiskAssessment(
            composite_risk_score=composite_score,
            risk_level=composite_level,
            primary_hazard=primary.category,
            explanation=explanation,
            flood_risk=flood_sub,
            heat_risk=heat_sub,
            air_quality_risk=aqi_sub,
            overall_confidence=overall_conf,
            is_rule_based_overall=is_all_rule_based,
            mitigation_directives=directives,
        )


hazard_aggregator = HazardAggregator()

