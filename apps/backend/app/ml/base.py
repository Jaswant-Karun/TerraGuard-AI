from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal

RiskLevel = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]


def score_to_risk_level(score: float) -> RiskLevel:
    """Converts a normalized 0-100 risk score into standard municipal alert levels."""
    if score >= 75.0:
        return "CRITICAL"
    elif score >= 50.0:
        return "HIGH"
    elif score >= 25.0:
        return "MODERATE"
    return "LOW"


@dataclass
class RiskSubscore:
    category: str
    score: float
    level: RiskLevel
    contributing_factors: dict[str, float]
    explanation: str
    raw_inputs: dict[str, Any]
    model_version: str
    confidence: float
    is_rule_based: bool
    provenance_label: str


@dataclass
class ModelProvenance:
    version: str
    algorithm: str
    trained_at: str | None = None
    training_data_source: str = "BENCHMARK_HISTORICAL_EVENTS"
    evaluation_metric: str = "RMSE_AND_R2"
    metric_value: float | None = None
    is_ml_validated: bool = False
    notes: str = ""
