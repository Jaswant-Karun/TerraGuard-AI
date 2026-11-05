import math

from app.ml.base import RiskSubscore, score_to_risk_level


def calculate_noaa_heat_index(temp_c: float, humidity_pct: float) -> float:
    """Calculates the atmospheric Heat Index in Celsius using the standard NOAA / NWS Steadman equations."""
    # Convert Celsius to Fahrenheit
    t_f = (temp_c * 9.0 / 5.0) + 32.0
    rh = max(0.0, min(100.0, humidity_pct))

    # If temperature is below 80°F (approx 26.7°C), heat index is close to ambient
    if t_f < 80.0:
        hi_simple = 0.5 * (t_f + 61.0 + ((t_f - 68.0) * 1.2) + (rh * 0.094))
        hi_f = hi_simple
    else:
        # Full Rothfusz regression equation
        hi_f = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 0.00683783 * t_f * t_f
            - 0.05481717 * rh * rh
            + 0.00122874 * t_f * t_f * rh
            + 0.00085282 * t_f * rh * rh
            - 0.00000199 * t_f * t_f * rh * rh
        )

        # Adjustments for dry air or humid air
        if rh < 13.0 and 80.0 <= t_f <= 112.0:
            adjustment = ((13.0 - rh) / 4.0) * math.sqrt((17.0 - abs(t_f - 95.0)) / 17.0)
            hi_f -= adjustment
        elif rh > 85.0 and 80.0 <= t_f <= 87.0:
            adjustment = ((rh - 85.0) / 10.0) * ((87.0 - t_f) / 5.0)
            hi_f += adjustment

    # Convert back to Celsius
    hi_c = (hi_f - 32.0) * 5.0 / 9.0
    return round(hi_c, 1)


class HeatRiskEstimator:
    """Estimates thermal stress risk based on NOAA heat index, humidity, and forecast highs."""

    MODEL_VERSION = "NOAA_STEADMAN_THERMAL_V1"

    def estimate(
        self,
        temperature_c: float | None,
        humidity_pct: float | None,
        forecast_temp_max_c: float | None = None,
        historical_temp_anomaly_c: float = 0.0,
    ) -> RiskSubscore:
        temp = temperature_c if temperature_c is not None else 25.0
        rh = humidity_pct if humidity_pct is not None else 50.0

        heat_idx = calculate_noaa_heat_index(temp, rh)
        peak_forecast = forecast_temp_max_c if forecast_temp_max_c is not None else temp

        # Map Heat Index to 0-100 Risk Score based on NWS Hazard Thresholds
        # < 27°C: 0-25 (Normal / Low)
        # 27°C - 32°C: 25-50 (Caution / Moderate)
        # 33°C - 41°C: 50-75 (Extreme Caution / High)
        # >= 42°C: 75-100 (Danger & Extreme Danger / Critical)
        if heat_idx < 27.0:
            score = max(0.0, (heat_idx / 27.0) * 25.0)
            level_desc = "Thermal comfort is within safe baselines."
        elif heat_idx < 33.0:
            score = 25.0 + ((heat_idx - 27.0) / (33.0 - 27.0)) * 25.0
            level_desc = "Moderate thermal fatigue possible with prolonged outdoor physical exertion."
        elif heat_idx < 42.0:
            score = 50.0 + ((heat_idx - 33.0) / (42.0 - 33.0)) * 25.0
            level_desc = "High heat stress hazard: Heat cramps and exhaustion probable."
        else:
            score = min(100.0, 75.0 + ((heat_idx - 42.0) / 12.0) * 25.0)
            level_desc = "Critical extreme heat hazard: Heat stroke imminent under direct sunlight."

        # Peak forecast amplification if upcoming hours are significantly hotter
        if peak_forecast > temp + 3.0:
            forecast_boost = min(15.0, (peak_forecast - temp) * 2.0)
            score = min(100.0, score + forecast_boost)

        score = round(score, 1)
        level = score_to_risk_level(score)

        # Factor weighting breakdown for explainability
        t_weight = round(max(10.0, min(60.0, (temp / 45.0) * 50.0)), 1)
        rh_weight = round(max(10.0, min(40.0, (rh / 100.0) * 35.0)), 1)
        fc_weight = round(max(5.0, 100.0 - (t_weight + rh_weight)), 1)

        factors = {
            "ambient_temperature": t_weight,
            "relative_humidity": rh_weight,
            "forecast_peak_trend": fc_weight,
        }

        explanation = (
            f"Heat Index calculated at {heat_idx}°C (Ambient: {temp}°C, Humidity: {rh}%). {level_desc}"
        )

        return RiskSubscore(
            category="EXTREME_HEAT",
            score=score,
            level=level,
            contributing_factors=factors,
            explanation=explanation,
            raw_inputs={
                "temperature_c": temp,
                "humidity_pct": rh,
                "heat_index_c": heat_idx,
                "forecast_temp_max_c": peak_forecast,
                "historical_anomaly_c": historical_temp_anomaly_c,
            },
            model_version=self.MODEL_VERSION,
            confidence=95.0,
            is_rule_based=True,
            provenance_label="Transparent NWS Rothfusz Thermodynamic Regression",
        )


heat_risk_estimator = HeatRiskEstimator()

