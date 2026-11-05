
from app.ml.base import RiskSubscore, score_to_risk_level

PM25_BREAKPOINTS = [
    (0.0, 12.0, 0, 50),
    (12.1, 35.4, 51, 100),
    (35.5, 55.4, 101, 150),
    (55.5, 150.4, 151, 200),
    (150.5, 250.4, 201, 300),
    (250.5, 500.4, 301, 500),
]

PM10_BREAKPOINTS = [
    (0, 54, 0, 50),
    (55, 154, 51, 100),
    (155, 254, 101, 150),
    (255, 354, 151, 200),
    (355, 424, 201, 300),
    (425, 604, 301, 500),
]


def calculate_pollutant_subindex(conc: float, breakpoints: list[tuple[float, float, int, int]]) -> float:
    """Calculates standardized AQI for a single pollutant using linear interpolation across breakpoints."""
    if conc <= 0.0:
        return 0.0

    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= conc <= c_high:
            sub = ((i_high - i_low) / (c_high - c_low)) * (conc - c_low) + i_low
            return round(sub, 1)

    # Above max bracket
    max_bracket = breakpoints[-1]
    return float(max_bracket[3])


def aqi_to_risk_score(aqi: float) -> float:
    """Normalizes 0-500 AQI scale into a 0-100 urban vulnerability threat score."""
    if aqi <= 50.0:
        return (aqi / 50.0) * 25.0
    elif aqi <= 100.0:
        return 25.0 + ((aqi - 50.0) / 50.0) * 25.0
    elif aqi <= 200.0:
        return 50.0 + ((aqi - 100.0) / 100.0) * 25.0
    elif aqi <= 300.0:
        return 75.0 + ((aqi - 200.0) / 100.0) * 15.0
    else:
        return min(100.0, 90.0 + ((aqi - 300.0) / 200.0) * 10.0)


class AirQualityRiskEstimator:
    """Estimates atmospheric health hazard based on EPA / WHO particulate standards."""

    MODEL_VERSION = "EPA_BREAKPOINT_AQI_V1"

    def estimate(
        self,
        pm25: float | None = None,
        pm10: float | None = None,
        direct_aqi: float | None = None,
        carbon_monoxide: float | None = None,
        nitrogen_dioxide: float | None = None,
        ozone: float | None = None,
    ) -> RiskSubscore:
        subindices: dict[str, float] = {}

        if pm25 is not None:
            subindices["PM2.5"] = calculate_pollutant_subindex(pm25, PM25_BREAKPOINTS)
        if pm10 is not None:
            subindices["PM10"] = calculate_pollutant_subindex(pm10, PM10_BREAKPOINTS)

        # If subindices were computed, governing AQI is the maximum
        if subindices:
            primary_pollutant, governing_aqi = max(subindices.items(), key=lambda x: x[1])
        elif direct_aqi is not None:
            governing_aqi = direct_aqi
            primary_pollutant = "Reported AQI Index"
        else:
            governing_aqi = 45.0
            primary_pollutant = "Baseline Urban Background"

        score = round(aqi_to_risk_score(governing_aqi), 1)
        level = score_to_risk_level(score)

        # Factor contributions
        total_sub = sum(subindices.values()) or 1.0
        factors = {}
        for k, v in subindices.items():
            factors[k] = round((v / total_sub) * 100.0, 1)

        if not factors:
            factors["aqi_aggregate"] = 100.0

        if score < 25.0:
            desc = "Air quality is satisfactory and poses minimal hazard."
        elif score < 50.0:
            desc = "Moderate air quality. Unusually sensitive individuals should limit prolonged outdoor exertion."
        elif score < 75.0:
            desc = f"Unhealthy particulate levels driven primarily by {primary_pollutant}. Vulnerable groups at risk."
        else:
            desc = f"Critical air hazard ({primary_pollutant} spike). Emergency advisory recommended."

        explanation = f"Governing AQI: {round(governing_aqi, 1)} (Primary driver: {primary_pollutant}). {desc}"

        return RiskSubscore(
            category="AIR_POLLUTION",
            score=score,
            level=level,
            contributing_factors=factors,
            explanation=explanation,
            raw_inputs={
                "pm25": pm25,
                "pm10": pm10,
                "governing_aqi": governing_aqi,
                "primary_pollutant": primary_pollutant,
                "carbon_monoxide": carbon_monoxide,
                "nitrogen_dioxide": nitrogen_dioxide,
                "ozone": ozone,
            },
            model_version=self.MODEL_VERSION,
            confidence=92.0,
            is_rule_based=True,
            provenance_label="Standard EPA/WHO Linear Breakpoint AQI Interpolation",
        )


air_quality_risk_estimator = AirQualityRiskEstimator()

