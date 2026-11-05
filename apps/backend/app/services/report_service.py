import logging
from typing import Any

from app.core.errors import AppException
from app.models.collections import CitizenReportModel, GeoJSONPoint
from app.repositories.citizen_reports_repository import citizen_reports_repository
from app.schemas.report import ReportListResponse, ReportResponse
from app.services.duplicate_service import duplicate_service
from app.services.storage_service import storage_service
from app.services.vision_service import vision_service

logger = logging.getLogger("terraguard.reports")


class ReportService:
    """Orchestrates citizen hazard reporting, secure media upload, AI vision, and duplicate detection."""

    async def create_hazard_report(
        self,
        title: str,
        description: str,
        lat: float,
        lng: float,
        image_bytes: bytes | None = None,
        original_filename: str | None = None,
        content_type: str | None = None,
        user_category: str | None = None,
        address: str | None = None,
        severity: int = 2,
        reported_by_user_id: str | None = None,
    ) -> ReportResponse:
        media_urls: list[str] = []
        image_hash: str | None = None
        ai_analysis_dict: dict[str, Any] = {}

        # 1. Secure Media Processing
        if image_bytes and len(image_bytes) > 0:
            saved_media = storage_service.validate_and_save_image(
                file_bytes=image_bytes,
                original_filename=original_filename,
                content_type=content_type,
            )
            media_urls.append(saved_media.relative_url)
            image_hash = saved_media.sha256_hash

            # 2. AI Vision Analysis (Gemini 2.0 Flash / Heuristic)
            ai_result = await vision_service.analyze_hazard_image(
                image_bytes=image_bytes,
                mime_type=saved_media.mime_type,
                user_category_hint=user_category,
                user_description_hint=description,
            )
            ai_analysis_dict = ai_result.model_dump()

            # 3. Backend AI Validation & Category Selection
            if not user_category or user_category.upper() == "AUTO" or user_category.upper() == "OTHER":
                resolved_category = ai_result.predicted_category
            else:
                resolved_category = vision_service.normalize_category(user_category)
        else:
            resolved_category = vision_service.normalize_category(user_category)
            ai_analysis_dict = {
                "predicted_category": resolved_category,
                "short_description": "Manual text report submitted without photographic evidence.",
                "visible_evidence": ["No image supplied"],
                "confidence_estimate": 0.50,
                "suggested_verification_status": "PENDING_FIELD_CHECK",
                "safety_precautions": ["Field inspection required to verify hazard"],
                "model_name": "manual_entry",
                "is_live_gemini": False,
                "confidence_calibration_notice": "AI confidence is a heuristic model estimate and not statistically calibrated.",
            }

        # 4. Duplicate Detection (NEVER deletes; attaches triage flags)
        dup_result = await duplicate_service.check_for_duplicates(
            lat=lat,
            lng=lng,
            category=resolved_category,
            image_hash=image_hash,
            radius_meters=150.0,
            max_age_hours=4.0,
        )

        duplicate_metadata = {}
        if dup_result.is_potential_duplicate:
            duplicate_metadata = {
                "matched_report_id": dup_result.duplicate_of_report_id,
                "similarity_score": dup_result.similarity_score,
                "reason": dup_result.match_reason,
                "distance_meters": dup_result.matched_distance_meters,
            }

        # 5. Build and persist model
        report_model = CitizenReportModel(
            title=title.strip(),
            description=description.strip(),
            category=resolved_category,  # type: ignore[arg-type]
            severity=max(1, min(severity, 5)),
            status="REPORTED",  # Always begins as unverified / reported on map
            location=GeoJSONPoint(type="Point", coordinates=[lng, lat]),
            address=address,
            media_urls=media_urls,
            image_hash=image_hash,
            reported_by_user_id=reported_by_user_id,
            ai_analysis=ai_analysis_dict,
            is_potential_duplicate=dup_result.is_potential_duplicate,
            duplicate_of_report_id=dup_result.duplicate_of_report_id,
            duplicate_metadata=duplicate_metadata,
        )

        saved = await citizen_reports_repository.create_report(report_model)
        logger.info(
            f"Citizen hazard report filed #{saved.get('id')} [{resolved_category}] "
            f"dup={dup_result.is_potential_duplicate}"
        )

        return ReportResponse(**saved)

    async def get_report_by_id(self, report_id: str) -> ReportResponse:
        doc = await citizen_reports_repository.find_by_id(report_id)
        if not doc:
            raise AppException(
                message=f"Hazard report '{report_id}' was not found.",
                status_code=404,
                error_code="REPORT_NOT_FOUND",
            )
        return ReportResponse(**doc)

    async def update_report_status(
        self,
        report_id: str,
        new_status: str,
        notes: str | None = None,
        verified_by_user_id: str | None = None,
    ) -> ReportResponse:
        updated = await citizen_reports_repository.update_status(
            report_id=report_id,
            status=new_status,
            verification_notes=notes,
            verified_by_user_id=verified_by_user_id,
        )
        if not updated:
            raise AppException(
                message=f"Hazard report '{report_id}' not found for status update.",
                status_code=404,
                error_code="REPORT_NOT_FOUND",
            )
        logger.info(f"Report #{report_id} status updated -> {new_status}")
        return ReportResponse(**updated)

    async def list_reports(
        self,
        lat: float | None = None,
        lng: float | None = None,
        radius_meters: float = 5000.0,
        category: str | None = None,
        status: str | None = None,
        is_duplicate: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> ReportListResponse:
        skip = (page - 1) * page_size

        if lat is not None and lng is not None:
            # Geospatial proximity query
            raw_reports = await citizen_reports_repository.find_near(
                lng=lng,
                lat=lat,
                radius_meters=radius_meters,
                category=category,
                status=status,
                limit=page_size,
            )
            # Filter duplicates if requested
            if is_duplicate is not None:
                raw_reports = [
                    r for r in raw_reports if r.get("is_potential_duplicate") == is_duplicate
                ]
            items = [ReportResponse(**r) for r in raw_reports]
            return ReportListResponse(
                items=items,
                total=len(items),
                page=page,
                page_size=page_size,
            )

        # Standard filtered query
        raw_reports, total = await citizen_reports_repository.find_filtered(
            category=category,
            status=status,
            is_duplicate=is_duplicate,
            skip=skip,
            limit=page_size,
        )

        items = [ReportResponse(**r) for r in raw_reports]
        return ReportListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )


report_service = ReportService()

