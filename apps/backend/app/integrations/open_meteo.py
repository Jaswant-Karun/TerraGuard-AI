import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger("terraguard.integrations.open_meteo")

WMO_WEATHER_CODES: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense intensity drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy intensity rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def decode_wmo_code(code: int | None) -> str:
    if code is None:
        return "Unknown"
    return WMO_WEATHER_CODES.get(code, f"Weather code {code}")


class OpenMeteoClient:
    """Async API client for Open-Meteo Weather, Air Quality, and Elevation APIs.

    Free public API with no API keys required. Source attribution: Open-Meteo.com (CC BY 4.0).
    """

    BASE_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
    BASE_AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
    BASE_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"

    def __init__(self, timeout_seconds: float = 8.0, max_retries: int = 2) -> None:
        self.timeout = timeout_seconds
        self.max_retries = max_retries

    async def _get_with_retry(self, url: str, params: dict[str, Any]) -> dict[str, Any] | None:
        """Executes GET request with exponential backoff on transient errors."""
        backoff = 0.5
        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        return resp.json()
                    elif resp.status_code in (429, 500, 502, 503, 504):
                        logger.warning("Open-Meteo transient status %s. Retrying in %ss...", resp.status_code, backoff)
                        await asyncio.sleep(backoff)
                        backoff *= 2
                    else:
                        logger.warning("Open-Meteo returned status %s: %s", resp.status_code, resp.text)
                        return None
            except (httpx.TimeoutException, httpx.NetworkError) as err:
                if attempt < self.max_retries:
                    logger.warning("Open-Meteo request attempt %d failed (%s). Retrying in %ss...", attempt + 1, err, backoff)
                    await asyncio.sleep(backoff)
                    backoff *= 2
                else:
                    logger.error("Open-Meteo request exhausted retries: %s", err)
                    return None
            except Exception as err:
                logger.error("Unexpected error querying Open-Meteo: %s", err)
                return None
        return None

    async def fetch_current_weather(self, lat: float, lng: float) -> dict[str, Any] | None:
        """Fetches current real-time atmospheric readings."""
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m",
            "timezone": "auto",
        }
        return await self._get_with_retry(self.BASE_FORECAST_URL, params)

    async def fetch_forecast(self, lat: float, lng: float, days: int = 7) -> dict[str, Any] | None:
        """Fetches hourly and daily multi-day predictive forecast."""
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,precipitation_probability,precipitation,rain,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
            "forecast_days": min(max(days, 1), 14),
            "timezone": "auto",
        }
        return await self._get_with_retry(self.BASE_FORECAST_URL, params)

    async def fetch_air_quality(self, lat: float, lng: float) -> dict[str, Any] | None:
        """Fetches atmospheric pollutant and aerosol telemetry."""
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
            "current": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi",
            "timezone": "auto",
        }
        return await self._get_with_retry(self.BASE_AIR_QUALITY_URL, params)

    async def fetch_elevation(self, lat: float, lng: float) -> float | None:
        """Fetches geographic terrain elevation in meters above sea level."""
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lng, 4),
        }
        data = await self._get_with_retry(self.BASE_ELEVATION_URL, params)
        if data and "elevation" in data and len(data["elevation"]) > 0:
            return float(data["elevation"][0])
        return None


open_meteo_client = OpenMeteoClient()

