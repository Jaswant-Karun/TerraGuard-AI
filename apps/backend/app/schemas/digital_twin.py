from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class TimelineSliceDTO(BaseModel):
    """An empirical or model-estimated observation slice at an exact timestamp."""
    slice_id: str
    timestamp: datetime
    label: str
    phase: Literal["HISTORICAL", "RECENT_PAST", "CURRENT_LIVE", "PROJECTED_12H", "PROJECTED_24H"]
    is_live: bool = False
    is_projection: bool = False
    precipitation_mm: float
    rainfall_intensity_mmh: float
    temperature_c: float
    aqi_pm25: float
    active_incidents_count: int
    composite_risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    water_level_m: float
    summary: str
    data_provenance: str


class SectorComparisonDTO(BaseModel):
    """Area-level statistics comparing vulnerability across metropolitan sectors."""
    sector_id: str
    name: str
    zone_code: str
    centroid: list[float] = Field(..., description="[lng, lat]")
    elevation_meters: float
    topography_type: str
    drainage_infrastructure_index: float = Field(..., ge=0.0, le=100.0)
    impervious_surface_pct: float = Field(..., ge=0.0, le=100.0)
    population_density_sqkm: int
    estimated_affected_population: int
    current_risk_score: float
    current_risk_level: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    primary_hazard: str
    active_incidents: int
    safe_facilities_nearby: int


class HistoricalBenchmarkDTO(BaseModel):
    """Verified historical natural disaster occurrence for model baseline comparison."""
    id: str
    event_type: str
    title: str
    description: str
    occurred_at: datetime
    peak_severity: int = Field(..., ge=1, le=5)
    location: list[float] = Field(..., description="[lng, lat]")
    peak_rainfall_mm: float | None = None
    damage_estimate_usd: float | None = None
    casualties_count: int = 0
    inundation_depth_meters: float | None = None
    lessons_learned: str


class DigitalTwinSummaryResponse(BaseModel):
    """Comprehensive digital twin metadata, layers, and simulation provenance."""
    city: str = "Bengaluru Metropolitan Region"
    reference_center: list[float] = [77.5946, 12.9716]
    generated_at: datetime
    timeline_slices: list[TimelineSliceDTO]
    sectors: list[SectorComparisonDTO]
    historical_benchmarks: list[HistoricalBenchmarkDTO]
    disclaimer: str = (
        "SCIENTIFIC INTEGRITY NOTICE: 3D extrusions and spatial overlays represent empirical sensor "
        "measurements and statistical risk models. They are visual decision aids and must not be "
        "interpreted as certified sub-surface geotechnical simulations."
    )
