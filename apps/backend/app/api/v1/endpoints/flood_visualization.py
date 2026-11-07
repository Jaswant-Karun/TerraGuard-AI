"""FastAPI endpoints for TerraGuard AI Dedicated Flood Risk Visualization Engine.

Consumes physical environmental telemetry and hydrological models to serve
auditable GeoJSON layers, multi-factor explainability panels, and uncertainty metrics.
"""

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.flood_visualization import (
    FloodVisualizationLayersResponse,
    FloodZoneExplanationResponse,
)
from app.services.flood_visualization_service import flood_visualization_service

router = APIRouter(prefix="/flood-visualization", tags=["Flood Risk Visualization Engine"])


@router.get(
    "/layers",
    response_model=FloodVisualizationLayersResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Analytical Flood Visualization Layers",
    description=(
        "Returns multi-layer GeoJSON geometries for flood susceptibility zones, observed rainfall stations, "
        "forecast rainfall isohyets, historical verified incidents, citizen waterlogging heatmap, "
        "water bodies, elevation benchmarks, and primary drainage network with explicit metadata and provenance."
    ),
)
async def get_analytical_flood_layers(
    lat: float = Query(12.9716, description="Central latitude coordinate", ge=-90.0, le=90.0),
    lng: float = Query(77.5946, description="Central longitude coordinate", ge=-180.0, le=180.0),
) -> FloodVisualizationLayersResponse:
    """Retrieve all analytical GeoJSON layers for the flood visualization map."""
    return await flood_visualization_service.get_analytical_layers(lat=lat, lng=lng)


@router.get(
    "/explanation/{zone_id}",
    response_model=FloodZoneExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve Explainable AI Rationale for a Flood Zone",
    description=(
        "Explains why a catchment area is classified into its specific risk category (High, Moderate, Low), "
        "including primary drivers, hydrological rationale, factor weights, and mitigation protocols."
    ),
)
async def get_flood_zone_explanation(
    zone_id: str = Path(..., description="Unique zone identifier (e.g. ZONE-BLR-KOR-01)"),
) -> FloodZoneExplanationResponse:
    """Explains why a specific zone is categorized as Critical, High, Moderate, or Low risk."""
    explanation = await flood_visualization_service.get_zone_explanation(zone_id=zone_id)
    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flood susceptibility zone '{zone_id}' not found in registry.",
        )
    return explanation
