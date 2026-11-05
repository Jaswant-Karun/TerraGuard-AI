from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    Query,
    UploadFile,
)

from app.api.deps import get_optional_current_user, require_role
from app.schemas.report import (
    ReportListResponse,
    ReportResponse,
    ReportStatusUpdateRequest,
    VisionAnalysisDTO,
)
from app.schemas.user import UserRole
from app.services.report_service import report_service
from app.services.storage_service import storage_service
from app.services.vision_service import vision_service

router = APIRouter(prefix="/reports", tags=["Citizen Hazard Reports & AI Vision"])


@router.post(
    "",
    response_model=ReportResponse,
    status_code=201,
    summary="Submit a citizen hazard report with image upload and AI vision validation",
)
async def create_report(
    title: str = Form(..., min_length=3, max_length=150),
    description: str = Form(..., min_length=5),
    lat: float = Form(..., ge=-90.0, le=90.0),
    lng: float = Form(..., ge=-180.0, le=180.0),
    category: str | None = Form(
        None, description="Hazard category or leave empty for AI auto-classification"
    ),
    address: str | None = Form(None),
    severity: int = Form(2, ge=1, le=5),
    image: UploadFile | None = File(
        None, description="Photographic evidence (JPEG, PNG, WEBP, max 10MB)"
    ),
    current_user: dict[str, Any] | None = Depends(get_optional_current_user),
) -> ReportResponse:
    """
    Submits an environmental or municipal hazard report.
    - Validates file type, size, and header magic bytes.
    - Runs Gemini 2.0 Flash Multimodal Vision inspection.
    - Runs geospatial duplicate detection against recent reports.
    - Persists report to MongoDB with unverified 'REPORTED' status for map display.
    """
    image_bytes = None
    original_filename = None
    content_type = None

    if image and image.filename:
        image_bytes = await image.read()
        original_filename = image.filename
        content_type = image.content_type

    user_id = current_user.get("id") if current_user else None

    return await report_service.create_hazard_report(
        title=title,
        description=description,
        lat=lat,
        lng=lng,
        image_bytes=image_bytes,
        original_filename=original_filename,
        content_type=content_type,
        user_category=category,
        address=address,
        severity=severity,
        reported_by_user_id=user_id,
    )


@router.post(
    "/analyze-image",
    response_model=VisionAnalysisDTO,
    summary="Preview AI vision classification for an uploaded hazard image",
)
async def analyze_image_preview(
    image: UploadFile = File(..., description="Image to inspect with AI Vision"),
    category_hint: str | None = Form(None),
    description_hint: str | None = Form(None),
) -> VisionAnalysisDTO:
    """
    Interactive AI assistant endpoint. Allows citizens to upload an image and
    preview AI category prediction, visible evidence, and safety precautions
    before submitting a full report.
    """
    content = await image.read()
    # Validate image security
    saved = storage_service.validate_and_save_image(
        file_bytes=content,
        original_filename=image.filename,
        content_type=image.content_type,
    )

    result = await vision_service.analyze_hazard_image(
        image_bytes=content,
        mime_type=saved.mime_type,
        user_category_hint=category_hint,
        user_description_hint=description_hint,
    )

    return VisionAnalysisDTO(**result.model_dump())


@router.get(
    "",
    response_model=ReportListResponse,
    summary="List citizen reports with geospatial radius and status filters",
)
async def list_reports(
    lat: float | None = Query(None, ge=-90.0, le=90.0),
    lng: float | None = Query(None, ge=-180.0, le=180.0),
    radius_meters: float = Query(5000.0, ge=100.0, le=50000.0),
    category: str | None = Query(None),
    status: str | None = Query(None),
    is_duplicate: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> ReportListResponse:
    """Retrieves paginated hazard reports, optionally filtered by geospatial coordinate radius."""
    return await report_service.list_reports(
        lat=lat,
        lng=lng,
        radius_meters=radius_meters,
        category=category,
        status=status,
        is_duplicate=is_duplicate,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{report_id}",
    response_model=ReportResponse,
    summary="Retrieve a single hazard report by ID with full AI analysis",
)
async def get_report_by_id(report_id: str) -> ReportResponse:
    """Fetches full report document including AI vision findings and duplicate attribution."""
    return await report_service.get_report_by_id(report_id)


@router.patch(
    "/{report_id}/status",
    response_model=ReportResponse,
    summary="Update report verification status (Restricted to Coordinators and Analysts)",
)
async def update_report_status(
    report_id: str,
    payload: ReportStatusUpdateRequest,
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.ANALYST)
    ),
) -> ReportResponse:
    """
    Updates the verification lifecycle of a report:
    REPORTED -> AI_ANALYZED -> VERIFIED -> DISPATCHED -> RESOLVED (or REJECTED).
    """
    return await report_service.update_report_status(
        report_id=report_id,
        new_status=payload.status,
        notes=payload.verification_notes,
        verified_by_user_id=current_user.get("id"),
    )
