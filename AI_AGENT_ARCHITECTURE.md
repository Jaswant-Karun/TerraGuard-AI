# TerraGuard AI — AI & ML Agent Architecture Specification
**INFINEX 2K26 — Global AI Hackathon**

---

## 1. AI System Overview
TerraGuard AI integrates a hybrid intelligence architecture:
1. **Perception Engine (Multimodal Gemini Vision):** Rapid visual classification of citizen and field hazard photos into structured disaster intelligence.
2. **Predictive Engine (XGBoost / Scikit-Learn):** Geospatial and temporal risk forecasting trained on topographic, meteorological, and infrastructure variables.
3. **Explainability Engine (XAI):** Decomposes black-box predictions into transparent, accountable factor attributions for urban administrators.
4. **Action Synthesis Engine (Gemini LLM):** Generates actionable, context-aware disaster mitigation playbooks and automated dispatch instructions.

```
                      +-----------------------------+
                      |   Citizen Photo / Ingest    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  Gemini 2.0 Vision Engine   |
                      |  - Hazard Classification    |
                      |  - Severity Rating (1-5)    |
                      |  - Water Depth / Damage Est |
                      +--------------+--------------+
                                     |
                                     v
+------------------------+    +--------------+    +-----------------------+
| Real-time Telemetry    |--->| XGBoost Risk |--->| Explainable AI (XAI)  |
| (Precipitation/AQI/Dem)|    | Scoring (0-100)   | Factor Attribution    |
+------------------------+    +-------+------+    +-----------------------+
                                      |
                                      v
                      +-----------------------------+
                      |  Gemini Mitigation Agent    |
                      |  - Playbook Formulation     |
                      |  - Automated Triage Rules   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  n8n Multi-Channel Dispatch |
                      +-----------------------------+
```

---

## 2. Gemini 2.0 Vision Hazard Perception Engine

### 2.1 Multimodal Prompt Strategy
The system feeds image payloads alongside localized context (GPS, address, weather at submission) to Gemini 2.0 with a strict JSON schema contract:

```
SYSTEM PROMPT:
You are TerraGuard Vision Sentinel, an elite disaster assessment AI. Analyze the provided urban hazard photograph and contextual metadata.
Classify the hazard accurately into: FLOOD, AIR_POLLUTION, FIRE, LANDSLIDE, INFRASTRUCTURE_FAILURE, or OTHER.
Score severity from 1 (minor/advisory) to 5 (life-threatening/critical).
Estimate hazard physical metrics (e.g., water depth in meters, flame height, crack breadth) where visually inferable.
Identify key visual artifacts and propose immediate, life-saving municipal response directives.
Output ONLY strict JSON matching the schema provided.
```

### 2.2 Pydantic Validation Schema
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class GeminiHazardAnalysis(BaseModel):
    category: str = Field(description="Primary hazard category")
    severity: int = Field(ge=1, le=5, description="Hazard severity level from 1 to 5")
    confidence: float = Field(ge=0.0, le=1.0, description="Detection confidence score")
    detected_objects: List[str] = Field(description="Visual objects detected (e.g. stalled_vehicle, submerged_curb)")
    estimated_water_depth_m: Optional[float] = Field(default=None, description="Estimated flood depth in meters")
    structural_damage_detected: bool = Field(default=False)
    immediate_mitigation: str = Field(description="Actionable guidance for first responders")
    citizen_safety_instructions: str = Field(description="Clear safety directive for the public")
```

---

## 3. Predictive Risk Machine Learning Engine

### 3.1 Model Architecture (XGBoost Regressor & Classifier)
- **Model 1: Urban Flood Inundation Probability (0.0 to 1.0)**
  - Algorithm: `XGBClassifier` with early stopping and logloss objective.
- **Model 2: Composite Urban Risk Index (0.0 to 100.0)**
  - Algorithm: `XGBRegressor` with Huber loss for outlier resilience.

### 3.2 Input Feature Vector
1. `precip_rate_mm_h`: Current precipitation rate from Open-Meteo.
2. `precip_accum_24h_mm`: Cumulative 24-hour rainfall.
3. `elevation_m`: Ground elevation derived from digital elevation models (DEM).
4. `topographic_wetness_index`: Spatial measure of hydrological accumulation.
5. `storm_drain_capacity_index`: Urban drainage infrastructure baseline score (0–10).
6. `soil_saturation_index`: Estimated antecedent moisture condition.
7. `nearby_active_incidents_count`: Number of verified hazard reports within 1.5 km.
8. `population_density_per_ha`: Census demographic exposure metric.

---

## 4. Explainable AI (XAI) Architecture

Municipal decision-makers must never rely on opaque black-box recommendations during emergencies. The XAI module calculates feature contribution values for each spatial prediction:

```json
{
  "composite_risk_score": 84.6,
  "risk_classification": "CRITICAL",
  "explanation": {
    "primary_driver": "Extreme 24-Hour Cumulative Rainfall (72.4mm)",
    "feature_attributions": [
      { "factor": "24h Accumulated Rainfall", "impact_percentage": 42.5 },
      { "factor": "Topographic Lowland Depression", "impact_percentage": 28.1 },
      { "factor": "Drainage Inflow Saturation", "impact_percentage": 18.4 },
      { "factor": "Active Citizen Reports Proximity", "impact_percentage": 11.0 }
    ],
    "natural_language_summary": "Zone URBAN-ZONE-04A has exceeded the critical flood threshold primarily due to 72.4mm of sustained rainfall converging into a low-elevation drainage basin where municipal outflow is operating at 95% capacity."
  }
}
```

---

## 5. Agentic Mitigation & Tactical Playbook Generation

When an incident or zone transitions to Severity 4 or 5, the Agentic Mitigation Planner synthesizes a tactical action checklist:
1. **Resource Allocation:** Computes number of high-capacity water pumps, barriers, or evacuation buses required based on zone population and inundation depth.
2. **Dynamic Route Diversion:** Analyzes unobstructed adjacent roads to compute safe ingress/egress corridors for emergency medical vehicles.
3. **Automated Escalation Triggers:** Emits structured payloads directly to n8n webhook pipelines to notify police dispatch, public utility boards, and citizen alert broadcast channels without human lag.

