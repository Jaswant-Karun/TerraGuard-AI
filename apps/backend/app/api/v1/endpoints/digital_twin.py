from typing import Any
from fastapi import APIRouter, status

from app.schemas.digital_twin import DigitalTwinSummaryResponse
from app.services.digital_twin_service import digital_twin_service

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin & 3D Spatial Analytics"])


@router.get(
    "/summary",
    response_model=DigitalTwinSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get 3D Digital Twin Timeline, Sectors, and Historical Benchmarks",
    description=(
        "Retrieves multi-temporal observation slices with actual timestamps, "
        "comparative sector vulnerabilities, and verified disaster benchmarks."
    ),
)
async def get_digital_twin_summary() -> DigitalTwinSummaryResponse:
    return await digital_twin_service.get_digital_twin_summary()


@router.get(
    "/buildings",
    response_model=dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Get 3D Extruded Building Footprints (GeoJSON)",
    description="Returns lightweight 3D building polygons with elevations, heights, and flood vulnerability attributes.",
)
async def get_3d_buildings() -> dict[str, Any]:
    return digital_twin_service.get_3d_buildings_geojson()
