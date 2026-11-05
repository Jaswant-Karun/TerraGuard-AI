from typing import Any

from pydantic import BaseModel, Field


class CurrentEnvironmentResponse(BaseModel):
    source: str = Field(description="Primary telemetry provider (OPEN_METEO, OPENAQ, MUNICIPAL_TELEMETRY)")
    location: dict[str, Any] = Field(description="GeoJSON Point with coordinates [lng, lat]")
    temperature_c: float | None = Field(default=None, description="Current ambient temperature in Celsius")
    rainfall_mm: float | None = Field(default=None, description="Current precipitation rate in mm/hour")
    precipitation_probability_pct: float | None = Field(default=None, description="Precipitation probability 0-100%")
    humidity_pct: float | None = Field(default=None, description="Relative humidity percentage")
    wind_speed_kmh: float | None = Field(default=None, description="Wind speed at 10m in km/h")
    wind_direction_deg: float | None = Field(default=None, description="Wind direction in degrees")
    weather_condition: str = Field(default="Unknown", description="Human-readable WMO condition description")
    weather_code: int | None = Field(default=None, description="WMO weather classification code")
    elevation_m: float | None = Field(default=None, description="Terrain elevation above sea level in meters")
    aqi: float | None = Field(default=None, description="Air Quality Index")
    pm25: float | None = Field(default=None, description="Particulate Matter PM2.5 in µg/m³")
    pm10: float | None = Field(default=None, description="Particulate Matter PM10 in µg/m³")
    units: dict[str, str] = Field(default_factory=dict, description="Standard physical measurement units")
    observed_at: str = Field(description="Timestamp of physical sensor or forecast observation")
    retrieved_at: str = Field(description="Timestamp when TerraGuard backend retrieved the telemetry")
    is_cached: bool = Field(default=False, description="Whether returned from in-memory TTL cache")
    data_quality: dict[str, Any] = Field(default_factory=dict, description="Reliability, coverage, and sensor status")
    attribution: str = Field(description="Mandatory legal data source attribution")


class HourlyForecastDTO(BaseModel):
    time: str
    temperature_c: float | None = None
    precipitation_mm: float | None = None
    precipitation_probability_pct: float | None = None
    wind_speed_kmh: float | None = None


class DailyForecastDTO(BaseModel):
    date: str
    weather_condition: str
    temp_max_c: float | None = None
    temp_min_c: float | None = None
    precipitation_sum_mm: float | None = None
    precipitation_probability_max_pct: float | None = None


class ForecastEnvironmentResponse(BaseModel):
    source: str
    location: dict[str, Any]
    forecast_days: int
    daily: list[DailyForecastDTO]
    hourly: list[HourlyForecastDTO]
    retrieved_at: str
    attribution: str


class AirQualityDetailsResponse(BaseModel):
    source: str
    location: dict[str, Any]
    us_aqi: float | None = None
    european_aqi: float | None = None
    pm25: float | None = None
    pm10: float | None = None
    carbon_monoxide_ugm3: float | None = None
    nitrogen_dioxide_ugm3: float | None = None
    sulphur_dioxide_ugm3: float | None = None
    ozone_ugm3: float | None = None
    category: str = "Unknown"
    openaq_coverage: str = "UNAVAILABLE"
    observed_at: str
    retrieved_at: str
    attribution: str


class HistoricalEnvironmentResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int
    page: int
    page_size: int
    location: dict[str, Any]

