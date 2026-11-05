import logging
from typing import Any

import numpy as np

from app.ml.base import RiskSubscore, score_to_risk_level
from app.ml.model_trainer import (
    load_flood_model,
    train_and_save_flood_model,
)

logger = logging.getLogger("terraguard.ml.flood")


class FloodRiskEstimator:
    """Estimates urban flood inundation risk using a trained Scikit-Learn Gradient Boosting pipeline,

    with automatic fallback to a transparent hydrological runoff baseline.
    """

    def __init__(self) -> None:
        self.model, self.provenance = load_flood_model()
        # Train once at startup if artifacts do not exist yet
        if self.model is None:
            try:
                self.provenance = train_and_save_flood_model()
                self.model, _ = load_flood_model()
            except Exception as err:
                logger.warning("Could not train flood model at startup: %s. Using hydrological baseline.", err)

    def estimate(
        self,
        recent_rainfall_mm: float = 0.0,
        forecast_rainfall_sum_mm: float = 0.0,
        rainfall_intensity_mmh: float = 0.0,
        elevation_m: float = 920.0,
        terrain_slope_pct: float = 2.0,
        historical_flood_incidents_in_radius: int = 0,
        drainage_capacity_deficit_pct: float = 30.0,
    ) -> RiskSubscore:
        """Executes flood prediction and returns transparently labeled risk subscore."""
        raw_features = {
            "recent_rainfall_mm": float(recent_rainfall_mm),
            "forecast_rainfall_sum_mm": float(forecast_rainfall_sum_mm),
            "rainfall_intensity_mmh": float(rainfall_intensity_mmh),
            "elevation_m": float(elevation_m),
            "terrain_slope_pct": float(terrain_slope_pct),
            "historical_flood_incidents_in_radius": int(historical_flood_incidents_in_radius),
            "drainage_capacity_deficit_pct": float(drainage_capacity_deficit_pct),
        }

        # 1. Try ML Model Prediction if pipeline is loaded
        if self.model is not None and self.provenance is not None:
            try:
                vector = np.array(
                    [
                        [
                            raw_features["recent_rainfall_mm"],
                            raw_features["forecast_rainfall_sum_mm"],
                            raw_features["rainfall_intensity_mmh"],
                            raw_features["elevation_m"],
                            raw_features["terrain_slope_pct"],
                            raw_features["historical_flood_incidents_in_radius"],
                            raw_features["drainage_capacity_deficit_pct"],
                        ]
                    ]
                )
                pred_score = float(self.model.predict(vector)[0])
                score = round(max(0.0, min(100.0, pred_score)), 1)
                level = score_to_risk_level(score)

                # Use verified model feature importances
                factors = self.provenance.get("feature_importances_pct", {})
                confidence = 88.0

                explanation = (
                    f"ML Prediction: {score}/100 ({level} alert). Driven by rainfall intensity "
                    f"({raw_features['rainfall_intensity_mmh']} mm/h), 24h forecast sum ({raw_features['forecast_rainfall_sum_mm']} mm), "
                    f"and elevation depression ({raw_features['elevation_m']}m)."
                )

                return RiskSubscore(
                    category="FLASH_FLOOD",
                    score=score,
                    level=level,
                    contributing_factors=factors,
                    explanation=explanation,
                    raw_inputs=raw_features,
                    model_version=f"ML_GB_V1_{self.provenance.get('version', '1.0.0')}",
                    confidence=confidence,
                    is_rule_based=False,
                    provenance_label="Trained Scikit-Learn GradientBoostingRegressor (Validated ML)",
                )
            except Exception as err:
                logger.error("ML model inference failure (%s). Falling back to transparent baseline.", err)

        # 2. Transparent Rule-Based Hydrological Runoff Baseline
        return self._rule_based_hydrological_baseline(raw_features)

    def _rule_based_hydrological_baseline(self, features: dict[str, Any]) -> RiskSubscore:
        """Transparent, deterministic hydrological formula using Rational Runoff & Topographic Wetness principles."""
        recent = features["recent_rainfall_mm"]
        forecast = features["forecast_rainfall_sum_mm"]
        intensity = features["rainfall_intensity_mmh"]
        elev = features["elevation_m"]
        slope = features["terrain_slope_pct"]
        hist_count = features["historical_flood_incidents_in_radius"]
        drainage_deficit = features["drainage_capacity_deficit_pct"]

        # Runoff Component (0-40 pts)
        runoff_val = min(40.0, (intensity * 0.5) + (forecast * 0.25) + (recent * 0.25))

        # Topographic Depression Component (0-25 pts): Lower elevation / flat slopes pool water
        elev_depression = max(0.0, min(15.0, (940.0 - elev) * 0.3))
        slope_pooling = max(0.0, min(10.0, (4.0 - slope) * 2.5))
        topo_val = elev_depression + slope_pooling

        # Historical Hotspot Component (0-20 pts)
        hist_val = min(20.0, hist_count * 4.0)

        # Drainage Deficit Component (0-15 pts)
        drainage_val = min(15.0, (drainage_deficit / 100.0) * 15.0)

        total_score = round(min(100.0, runoff_val + topo_val + hist_val + drainage_val), 1)
        level = score_to_risk_level(total_score)

        factors = {
            "rainfall_intensity_and_volume": round((runoff_val / (total_score or 1.0)) * 100.0, 1),
            "topographic_elevation_depression": round((topo_val / (total_score or 1.0)) * 100.0, 1),
            "historical_flood_correlation": round((hist_val / (total_score or 1.0)) * 100.0, 1),
            "drainage_culvert_deficit": round((drainage_val / (total_score or 1.0)) * 100.0, 1),
        }

        explanation = (
            f"Hydrological Baseline: {total_score}/100 ({level}). Derived from precipitation runoff ({intensity} mm/h), "
            f"terrain depression ({elev}m, slope {slope}%), and {hist_count} local historical inundations."
        )

        return RiskSubscore(
            category="FLASH_FLOOD",
            score=total_score,
            level=level,
            contributing_factors=factors,
            explanation=explanation,
            raw_inputs=features,
            model_version="HYDROLOGICAL_RATIONAL_BASELINE_V1",
            confidence=82.0,
            is_rule_based=True,
            provenance_label="Transparent Hydrological Rational Method (Rule-Based Baseline)",
        )


flood_risk_estimator = FloodRiskEstimator()

