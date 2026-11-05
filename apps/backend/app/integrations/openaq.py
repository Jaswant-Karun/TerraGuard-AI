import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger("terraguard.integrations.openaq")


class OpenAQClient:
    """Async API client for OpenAQ air quality network.

    Gracefully detects location coverage without assuming all cities have active ground stations.
    Never fabricates missing data.
    """

    BASE_URL = "https://api.openaq.org/v2/latest"

    def __init__(self, timeout_seconds: float = 6.0, max_retries: int = 1) -> None:
        self.timeout = timeout_seconds
        self.max_retries = max_retries

    async def fetch_air_quality(
        self, lat: float, lng: float, radius_meters: int = 25000
    ) -> dict[str, Any]:
        """Queries OpenAQ ground monitoring stations within geographical radius.

        Returns normalized dictionary with coverage status.
        """
        params = {
            "coordinates": f"{round(lat, 4)},{round(lng, 4)}",
            "radius": radius_meters,
            "limit": 1,
        }

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.get(self.BASE_URL, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        results = data.get("results", [])
                        if results:
                            station = results[0]
                            meas_dict = {}
                            for m in station.get("measurements", []):
                                meas_dict[m.get("parameter")] = {
                                    "value": m.get("value"),
                                    "unit": m.get("unit"),
                                    "last_updated": m.get("lastUpdated"),
                                }
                            return {
                                "status": "AVAILABLE",
                                "coverage": "AVAILABLE",
                                "provider": "OPENAQ",
                                "station_name": station.get("location"),
                                "city": station.get("city"),
                                "country": station.get("country"),
                                "distance_meters": station.get("distance"),
                                "measurements": meas_dict,
                                "attribution": "OpenAQ Community Data (CC BY 4.0)",
                            }
                        else:
                            return {
                                "status": "NO_STATIONS_IN_RADIUS",
                                "coverage": "UNAVAILABLE",
                                "provider": "OPENAQ",
                                "measurements": {},
                                "attribution": "OpenAQ Community Data (CC BY 4.0)",
                            }
                    elif resp.status_code in [401, 403, 410]:
                        logger.info("OpenAQ API endpoint status %s. Marking coverage UNAVAILABLE.", resp.status_code)
                        return {
                            "status": "UNAVAILABLE",
                            "coverage": "UNAVAILABLE",
                            "provider": "OPENAQ",
                            "measurements": {},
                            "note": f"OpenAQ service status HTTP {resp.status_code}",
                        }
                    else:
                        logger.warning("OpenAQ HTTP %s: %s", resp.status_code, resp.text)
            except (httpx.TimeoutException, httpx.NetworkError) as err:
                if attempt < self.max_retries:
                    await asyncio.sleep(0.5)
                else:
                    logger.info("OpenAQ network unreachable (%s). Using fallback without fabricating.", err)
            except Exception as err:
                logger.warning("OpenAQ unexpected error: %s", err)

        return {
            "status": "UNAVAILABLE",
            "coverage": "UNAVAILABLE",
            "provider": "OPENAQ",
            "measurements": {},
            "attribution": "OpenAQ Community Data (CC BY 4.0)",
        }


openaq_client = OpenAQClient()

