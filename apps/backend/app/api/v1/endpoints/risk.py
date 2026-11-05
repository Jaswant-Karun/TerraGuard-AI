from fastapi import APIRouter, Query, status

from app.schemas.risk import (
    HistoricalRiskResponse,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskExplanationResponse,
)
from app.services.risk_service import risk_service

router = APIRouter()


@router.post(
    "/assess",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Compute Multi-Hazard Environmental Risk Assessment",
    description="Evaluates flood, heat, and air-quality threats using Scikit-Learn pipelines, hydrological baselines, and live telemetry.",
)
async def assess_risk(req: RiskAssessmentRequest) -> RiskAssessmentResponse:
    return await risk_service.assess_risk(req)


@router.get(
    "/current",
    response_model=RiskAssessmentResponse,
    summary="Retrieve Active Real-Time Risk Profile for Location",
    description="Returns the latest computed risk index or computes live telemetry assessment.",
)
async def get_current_risk(
    lat: float = Query(default=12.9716, ge=-90.0, le=90.0, description="Latitude coordinate"),
    lng: float = Query(default=77.5946, ge=-180.0, le=180.0, description="Longitude coordinate"),
    zone_code: str | None = Query(default=None, description="Optional administrative zone code"),
) -> RiskAssessmentResponse:
    return await risk_service.get_current_risk(lat=lat, lng=lng, zone_code=zone_code)


@router.get(
    "/history",
    response_model=HistoricalRiskResponse,
    summary="List Stored Historical Risk Assessments",
    description="Queries past risk evaluations stored in MongoDB with pagination.",
)
async def get_risk_history(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
) -> HistoricalRiskResponse:
    return await risk_service.get_history(page=page, page_size=page_size)


@router.get(
    "/explain/{assessment_id}",
    response_model=RiskExplanationResponse,
    summary="Explainable AI Factor Breakdown and Model Provenance",
    description="Returns contributing feature importance weights, raw physical inputs, algorithm provenance, and pre-emptive directives.",
)
async def explain_risk_assessment(assessment_id: str) -> RiskExplanationResponse:
    return await risk_service.explain_assessment(assessment_id)

