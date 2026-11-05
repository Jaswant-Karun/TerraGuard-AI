from typing import Any, Literal

from fastapi import APIRouter, Depends, Query, Response

from app.api.deps import get_current_user
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Advanced Analytics & Report Generation"])


@router.get(
    "/overview",
    response_model=AnalyticsOverviewResponse,
    summary="Get Comprehensive Analytics Overview",
    description="Returns aggregated environmental trends, risk distributions, geographic comparisons, "
    "incident history, alert telemetry, response task statistics, data source coverage, and model evaluation metrics.",
)
async def get_analytics_overview(
    time_range: str = Query("30d", description="Time range: 7d, 30d, 90d, or custom"),
    start_date: str | None = Query(None, description="Start date ISO string for custom range"),
    end_date: str | None = Query(None, description="End date ISO string for custom range"),
    location: str = Query("all", description="Location or zone code filter (e.g. all, Bellandur, Koramangala)"),
    risk_category: str = Query("all", description="Risk category filter (all, FLOOD, HEAT, AIR_QUALITY, INFRASTRUCTURE_HAZARD)"),
    verification_status: str = Query("all", description="Verification filter (all, VERIFIED, UNVERIFIED, REJECTED, IN_REVIEW)"),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AnalyticsOverviewResponse:
    service = AnalyticsService()
    return await service.get_analytics_overview(
        time_range=time_range,
        start_date=start_date,
        end_date=end_date,
        location=location,
        risk_category=risk_category,
        verification_status=verification_status,
    )


@router.get(
    "/reports/export",
    summary="Export Downloadable Intelligence Report (PDF or CSV)",
    description="Generates an official downloadable municipal report in CSV or PDF format strictly separating "
    "observed measurements, verified incidents, model-based estimates, and AI-generated summaries.",
)
async def export_analytics_report(
    format: Literal["csv", "pdf"] = Query("csv", description="Export file format: csv or pdf"),
    time_range: str = Query("30d", description="Time range: 7d, 30d, 90d, or custom"),
    start_date: str | None = Query(None, description="Start date ISO string"),
    end_date: str | None = Query(None, description="End date ISO string"),
    location: str = Query("all", description="Location or zone filter"),
    risk_category: str = Query("all", description="Risk category filter"),
    verification_status: str = Query("all", description="Verification status filter"),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    service = AnalyticsService()
    overview = await service.get_analytics_overview(
        time_range=time_range,
        start_date=start_date,
        end_date=end_date,
        location=location,
        risk_category=risk_category,
        verification_status=verification_status,
    )

    clean_loc = location.replace(" ", "_").lower()
    filename_base = f"terraguard_analytics_{time_range}_{clean_loc}"

    if format == "csv":
        csv_content = service.generate_csv_report(overview)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{filename_base}.csv"',
                "Content-Type": "text/csv; charset=utf-8",
            },
        )
    else:
        pdf_bytes = service.generate_pdf_report(overview)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename_base}.pdf"',
                "Content-Type": "application/pdf",
            },
        )
