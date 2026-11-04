import asyncio
from datetime import UTC, datetime
from typing import Any

from app.integrations.open_meteo import decode_wmo_code, open_meteo_client
from app.integrations.openaq import openaq_client
from app.repositories.base_repository import BaseRepository
from app.schemas.environment import (
    AirQualityDetailsResponse,
    CurrentEnvironmentResponse,
    DailyForecastDTO,
    ForecastEnvironmentResponse,
    HistoricalEnvironmentResponse,
    HourlyForecastDTO,
)
from app.services.cache_service import cache_service


def classify_aqi(aqi: float | None) -> str:
    if aqi is None:
        return "Unknown"
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


class EnvironmentalService:
    """Orchestrator for multi-provider environmental telemetry ingestion and persistence."""

    def __init__(self) -> None:
        self.repo = BaseRepository("environmental_data")
        self._background_tasks: set[asyncio.Task] = set()

    async def get_current_environment(
        self, lat: float, lng: float, bypass_cache: bool = False
    ) -> CurrentEnvironmentResponse:
        """Retrieves and normalizes current multi-hazard environmental telemetry."""
        cache_key = f"current_env:{round(lat, 3)}:{round(lng, 3)}"
        if not bypass_cache:
            cached = cache_service.get(cache_key)
            if cached:
                cached.is_cached = True
                return cached

        # Concurrently query external sources
        weather_task = open_meteo_client.fetch_current_weather(lat, lng)
        aq_task = open_meteo_client.fetch_air_quality(lat, lng)
        elev_task = open_meteo_client.fetch_elevation(lat, lng)
        openaq_task = openaq_client.fetch_air_quality(lat, lng)

        weather_res, aq_res, elev_res, openaq_res = await asyncio.gather(
            weather_task, aq_task, elev_task, openaq_task, return_exceptions=True
        )

        now = datetime.now(UTC)
        now_str = now.isoformat()

        # Handle weather
        weather_data = weather_res if isinstance(weather_res, dict) else {}
        current_w = weather_data.get("current", {})
        temp = current_w.get("temperature_2m")
        rainfall = current_w.get("rain") or current_w.get("precipitation") or 0.0
        humidity = current_w.get("relative_humidity_2m")
        wind_speed = current_w.get("wind_speed_10m")
        wind_dir = current_w.get("wind_direction_10m")
        wmo_code = current_w.get("weather_code")
        condition = decode_wmo_code(wmo_code)
        observed_at = current_w.get("time", now_str)

        # Handle air quality
        aq_data = aq_res if isinstance(aq_res, dict) else {}
        current_aq = aq_data.get("current", {})
        us_aqi = current_aq.get("us_aqi")
        pm25 = current_aq.get("pm2_5")
        pm10 = current_aq.get("pm10")

        # Check OpenAQ
        openaq_data = openaq_res if isinstance(openaq_res, dict) else {}
        openaq_cov = openaq_data.get("coverage", "UNAVAILABLE")
        if openaq_cov == "AVAILABLE" and "measurements" in openaq_data:
            m = openaq_data["measurements"]
            if "pm25" in m:
                pm25 = m["pm25"].get("value", pm25)
            if "pm10" in m:
                pm10 = m["pm10"].get("value", pm10)

        elevation = elev_res if isinstance(elev_res, (int, float)) else None

        # Determine data quality
        quality = {
            "weather_provider": "OPEN_METEO" if weather_data else "UNAVAILABLE",
            "air_quality_provider": "OPEN_METEO",
            "openaq_ground_coverage": openaq_cov,
            "elevation_available": elevation is not None,
            "is_anomaly": bool(rainfall > 60.0 or (us_aqi and us_aqi > 200)),
        }

        response = CurrentEnvironmentResponse(
            source="OPEN_METEO",
            location={"type": "Point", "coordinates": [round(lng, 4), round(lat, 4)]},
            temperature_c=temp,
            rainfall_mm=rainfall,
            precipitation_probability_pct=None,
            humidity_pct=humidity,
            wind_speed_kmh=wind_speed,
            wind_direction_deg=wind_dir,
            weather_condition=condition,
            weather_code=wmo_code,
            elevation_m=elevation,
            aqi=us_aqi,
            pm25=pm25,
            pm10=pm10,
            units={
                "temperature": "°C",
                "rainfall": "mm/h",
                "wind_speed": "km/h",
                "humidity": "%",
                "pm25": "µg/m³",
                "pm10": "µg/m³",
                "elevation": "meters",
            },
            observed_at=observed_at,
            retrieved_at=now_str,
            is_cached=False,
            data_quality=quality,
            attribution="Weather & AQ data by Open-Meteo.com (CC BY 4.0), OpenStreetMap contributors",
        )

        # Store normalized record in MongoDB asynchronously
        persist_task = asyncio.create_task(
            self.persist_normalized_record(
                lat=lat,
                lng=lng,
                response=response,
                now=now,
            )
        )
        self._background_tasks.add(persist_task)
        persist_task.add_done_callback(self._background_tasks.discard)

        # Cache response for 10 minutes
        cache_service.set(cache_key, response, ttl_seconds=600)
        return response

    async def persist_normalized_record(
        self, lat: float, lng: float, response: CurrentEnvironmentResponse, now: datetime
    ) -> None:
        """Stores normalized reading in MongoDB environmental_data collection."""
        try:
            record: dict[str, Any] = {
                "station_id": f"OM-VIRTUAL-{round(lat, 2)}-{round(lng, 2)}",
                "source": "OPEN_METEO",
                "location": {"type": "Point", "coordinates": [round(lng, 4), round(lat, 4)]},
                "metrics": {
                    "precipitation_mm": float(response.rainfall_mm or 0.0),
                    "temperature_c": float(response.temperature_c or 0.0),
                    "humidity_pct": float(response.humidity_pct or 0.0),
                    "wind_speed_kmh": float(response.wind_speed_kmh or 0.0),
                    "aqi": float(response.aqi or 0.0),
                    "pm25": float(response.pm25 or 0.0),
                    "pm10": float(response.pm10 or 0.0),
                },
                "timestamp": now,
                "is_anomaly": response.data_quality.get("is_anomaly", False),
                "metadata": {
                    "weather_condition": response.weather_condition,
                    "elevation_m": response.elevation_m,
                    "openaq_coverage": response.data_quality.get("openaq_ground_coverage"),
                    "retrieved_at": response.retrieved_at,
                    "attribution": response.attribution,
                },
            }
            await self.repo.create(record)
        except Exception:
            pass

    async def get_forecast(
        self, lat: float, lng: float, days: int = 7
    ) -> ForecastEnvironmentResponse:
        """Retrieves multi-day hourly and daily predictive forecast."""
        cache_key = f"forecast:{round(lat, 3)}:{round(lng, 3)}:{days}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached

        raw = await open_meteo_client.fetch_forecast(lat, lng, days)
        now_str = datetime.now(UTC).isoformat()

        daily_dtos: list[DailyForecastDTO] = []
        hourly_dtos: list[HourlyForecastDTO] = []

        if raw:
            daily_data = raw.get("daily", {})
            times = daily_data.get("time", [])
            w_codes = daily_data.get("weather_code", [])
            max_temps = daily_data.get("temperature_2m_max", [])
            min_temps = daily_data.get("temperature_2m_min", [])
            precip_sums = daily_data.get("precipitation_sum", [])
            precip_probs = daily_data.get("precipitation_probability_max", [])

            for i in range(len(times)):
                daily_dtos.append(
                    DailyForecastDTO(
                        date=times[i],
                        weather_condition=decode_wmo_code(w_codes[i] if i < len(w_codes) else None),
                        temp_max_c=max_temps[i] if i < len(max_temps) else None,
                        temp_min_c=min_temps[i] if i < len(min_temps) else None,
                        precipitation_sum_mm=precip_sums[i] if i < len(precip_sums) else None,
                        precipitation_probability_max_pct=precip_probs[i] if i < len(precip_probs) else None,
                    )
                )

            hourly_data = raw.get("hourly", {})
            h_times = hourly_data.get("time", [])[:48]  # Limit to 48 hours
            h_temps = hourly_data.get("temperature_2m", [])[:48]
            h_precip = hourly_data.get("precipitation", [])[:48]
            h_prob = hourly_data.get("precipitation_probability", [])[:48]
            h_wind = hourly_data.get("wind_speed_10m", [])[:48]

            for i in range(len(h_times)):
                hourly_dtos.append(
                    HourlyForecastDTO(
                        time=h_times[i],
                        temperature_c=h_temps[i] if i < len(h_temps) else None,
                        precipitation_mm=h_precip[i] if i < len(h_precip) else None,
                        precipitation_probability_pct=h_prob[i] if i < len(h_prob) else None,
                        wind_speed_kmh=h_wind[i] if i < len(h_wind) else None,
                    )
                )

        resp = ForecastEnvironmentResponse(
            source="OPEN_METEO",
            location={"type": "Point", "coordinates": [round(lng, 4), round(lat, 4)]},
            forecast_days=days,
            daily=daily_dtos,
            hourly=hourly_dtos,
            retrieved_at=now_str,
            attribution="Forecast by Open-Meteo.com (CC BY 4.0)",
        )
        cache_service.set(cache_key, resp, ttl_seconds=1800)  # 30 mins
        return resp

    async def get_air_quality(self, lat: float, lng: float) -> AirQualityDetailsResponse:
        """Retrieves specialized particulate, pollutant, and atmospheric aerosol readings."""
        cache_key = f"air_quality:{round(lat, 3)}:{round(lng, 3)}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached

        aq_task = open_meteo_client.fetch_air_quality(lat, lng)
        openaq_task = openaq_client.fetch_air_quality(lat, lng)

        aq_res, openaq_res = await asyncio.gather(aq_task, openaq_task, return_exceptions=True)
        now_str = datetime.now(UTC).isoformat()

        aq_data = aq_res if isinstance(aq_res, dict) else {}
        current_aq = aq_data.get("current", {})
        us_aqi = current_aq.get("us_aqi")
        eu_aqi = current_aq.get("european_aqi")
        pm25 = current_aq.get("pm2_5")
        pm10 = current_aq.get("pm10")
        co = current_aq.get("carbon_monoxide")
        no2 = current_aq.get("nitrogen_dioxide")
        so2 = current_aq.get("sulphur_dioxide")
        o3 = current_aq.get("ozone")

        openaq_data = openaq_res if isinstance(openaq_res, dict) else {}
        cov = openaq_data.get("coverage", "UNAVAILABLE")

        resp = AirQualityDetailsResponse(
            source="OPEN_METEO",
            location={"type": "Point", "coordinates": [round(lng, 4), round(lat, 4)]},
            us_aqi=us_aqi,
            european_aqi=eu_aqi,
            pm25=pm25,
            pm10=pm10,
            carbon_monoxide_ugm3=co,
            nitrogen_dioxide_ugm3=no2,
            sulphur_dioxide_ugm3=so2,
            ozone_ugm3=o3,
            category=classify_aqi(us_aqi),
            openaq_coverage=cov,
            observed_at=current_aq.get("time", now_str),
            retrieved_at=now_str,
            attribution="Air Quality telemetry by Open-Meteo.com & OpenAQ Community (CC BY 4.0)",
        )
        cache_service.set(cache_key, resp, ttl_seconds=600)
        return resp

    async def get_history(
        self, lat: float, lng: float, page: int = 1, page_size: int = 20
    ) -> HistoricalEnvironmentResponse:
        """Queries recorded environmental observations stored in MongoDB Atlas."""
        paginated = await self.repo.find_paginated(
            page=page,
            page_size=page_size,
            sort_field="timestamp",
            sort_asc=False,
        )
        return HistoricalEnvironmentResponse(
            items=paginated.items,
            total=paginated.total,
            page=paginated.page,
            page_size=paginated.page_size,
            location={"type": "Point", "coordinates": [round(lng, 4), round(lat, 4)]},
        )


environmental_service = EnvironmentalService()

