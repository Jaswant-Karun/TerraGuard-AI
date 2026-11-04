from fastapi import APIRouter, Query

from app.schemas.environment import (
    AirQualityDetailsResponse,
    CurrentEnvironmentResponse,
    ForecastEnvironmentResponse,
    HistoricalEnvironmentResponse,
)
from app.services.environmental_service import environmental_service

router = APIRouter()


@router.get(
    "/current",
    response_model=CurrentEnvironmentResponse,
    summary="Get Real-Time Live Environmental Telemetry",
    description="Fetches live rainfall, ambient temperature, humidity, wind, AQI, and elevation using Open-Meteo & OpenAQ.",
)
async def get_current_environment(
    lat: float = Query(default=12.9716, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(default=77.5946, ge=-180.0, le=180.0, description="Longitude coordinate"),
    bypass_cache: bool = Query(default=False, description="Force fresh external API retrieval bypassing TTL cache"),
) -> CurrentEnvironmentResponse:
    return await environmental_service.get_current_environment(
        lat=lat, lng=lng, bypass_cache=bypass_cache
    )


@router.get(
    "/forecast",
    response_model=ForecastEnvironmentResponse,
    summary="Get Multi-Day Weather & Precipitation Risk Forecast",
    description="Returns hourly and daily forecast projections including rainfall sums and precipitation probability.",
)
async def get_environmental_forecast(
    lat: float = Query(default=12.9716, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(default=77.5946, ge=-180.0, le=180.0, description="Longitude coordinate"),
    days: int = Query(default=7, ge=1, le=14, description="Forecast horizon in days (max 14)"),
) -> ForecastEnvironmentResponse:
    return await environmental_service.get_forecast(lat=lat, lng=lng, days=days)


@router.get(
    "/air-quality",
    response_model=AirQualityDetailsResponse,
    summary="Get Atmospheric Pollutant & Aerosol Breakdown",
    description="Detailed PM2.5, PM10, Carbon Monoxide, Nitrogen Dioxide, Ozone, and US/European AQI.",
)
async def get_air_quality(
    lat: float = Query(default=12.9716, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(default=77.5946, ge=-180.0, le=180.0, description="Longitude coordinate"),
) -> AirQualityDetailsResponse:
    return await environmental_service.get_air_quality(lat=lat, lng=lng)


@router.get(
    "/history",
    response_model=HistoricalEnvironmentResponse,
    summary="Query Recorded Environmental Telemetry from MongoDB",
    description="Retrieves historical normalized environmental sensor documents with pagination.",
)
async def get_environmental_history(
    lat: float = Query(default=12.9716, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(default=77.5946, ge=-180.0, le=180.0, description="Longitude coordinate"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
) -> HistoricalEnvironmentResponse:
    return await environmental_service.get_history(
        lat=lat, lng=lng, page=page, page_size=page_size
    )

