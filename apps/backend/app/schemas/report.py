from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.collections import GeoJSONPoint


class VisionAnalysisDTO(BaseModel):
    predicted_category: str
    short_description: str
    visible_evidence: list[str]
    confidence_estimate: float
    suggested_verification_status: str
    safety_precautions: list[str]
    model_name: str
    is_live_gemini: bool = False
    confidence_calibration_notice: str = (
        "AI confidence is a heuristic model estimate and not statistically calibrated."
    )


class ReportCreateJSONRequest(BaseModel):
    """Payload when submitting hazard without multipart form (e.g. pre-uploaded media URL)."""

    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5)
    category: str | None = Field(
        default=None,
        description="Optional category hint (if omitted, AI vision classifies)",
    )
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    address: str | None = None
    media_url: str | None = None
    severity: int = Field(default=2, ge=1, le=5)


class ReportResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    severity: int
    status: str
    location: GeoJSONPoint
    address: str | None = None
    media_urls: list[str] = Field(default_factory=list)
    image_hash: str | None = None
    reported_by_user_id: str | None = None
    ai_analysis: dict[str, Any] = Field(default_factory=dict)
    is_potential_duplicate: bool = False
    duplicate_of_report_id: str | None = None
    duplicate_metadata: dict[str, Any] = Field(default_factory=dict)
    verification_notes: str | None = None
    verified_by_user_id: str | None = None
    created_at: str
    updated_at: str | None = None


class ReportStatusUpdateRequest(BaseModel):
    status: Literal[
        "REPORTED",
        "AI_ANALYZED",
        "VERIFIED",
        "DISPATCHED",
        "RESOLVED",
        "REJECTED",
    ] = Field(..., description="New verification and triage status")
    verification_notes: str | None = Field(
        default=None, description="Field notes or triage justification"
    )


class ReportListResponse(BaseModel):
    items: list[ReportResponse]
    total: int
    page: int
    page_size: int
