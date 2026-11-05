import logging
import math
from datetime import UTC, datetime, timedelta
from typing import Any

from pydantic import BaseModel

from app.repositories.citizen_reports_repository import citizen_reports_repository

logger = logging.getLogger("terraguard.duplicate_detector")


class DuplicateCheckResult(BaseModel):
    is_potential_duplicate: bool = False
    duplicate_of_report_id: str | None = None
    similarity_score: float = 0.0
    match_reason: str | None = None
    matched_distance_meters: float | None = None


class DuplicateDetectionService:
    """
    Identifies potentially duplicate citizen reports based on:
    1. Spatial proximity (within 150m)
    2. Temporal proximity (within past 4 hours)
    3. Category match & Image hash equivalence
    NEVER deletes any reports. Flags duplicate metadata for municipal triage.
    """

    @staticmethod
    def haversine_distance_meters(
        lat1: float, lng1: float, lat2: float, lng2: float
    ) -> float:
        """Calculates distance between two coordinate pairs in meters."""
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)

        a = (
            math.sin(delta_phi / 2.0) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    async def check_for_duplicates(
        self,
        lat: float,
        lng: float,
        category: str,
        image_hash: str | None = None,
        radius_meters: float = 150.0,
        max_age_hours: float = 4.0,
    ) -> DuplicateCheckResult:
        """
        Scan nearby active reports in MongoDB to detect duplicate submissions.
        """
        try:
            nearby_reports = await citizen_reports_repository.find_near(
                lng=lng,
                lat=lat,
                radius_meters=radius_meters,
                limit=20,
            )
        except Exception as e:
            logger.warning(f"Geospatial lookup failed during duplicate check: {e}")
            return DuplicateCheckResult()

        now = datetime.now(UTC)
        cutoff_time = now - timedelta(hours=max_age_hours)

        for report in nearby_reports:
            # Check creation timestamp
            created_at = report.get("created_at")
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except Exception:
                    created_at = now
            elif not isinstance(created_at, datetime):
                created_at = now

            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=UTC)

            if created_at < cutoff_time:
                continue

            # Exact image hash match
            cand_hash = report.get("image_hash")
            report_id = str(report.get("id") or report.get("_id", ""))

            # Calculate precise distance
            coords = report.get("location", {}).get("coordinates", [lng, lat])
            dist = self.haversine_distance_meters(lat, lng, coords[1], coords[0])

            if image_hash and cand_hash and image_hash == cand_hash:
                return DuplicateCheckResult(
                    is_potential_duplicate=True,
                    duplicate_of_report_id=report_id,
                    similarity_score=1.0,
                    match_reason=f"Identical image hash detected. Matches report #{report_id[:8]} ({dist:.0f}m away).",
                    matched_distance_meters=round(dist, 1),
                )

            # Category + Proximity match
            cand_cat = report.get("category", "")
            if cand_cat == category and dist <= radius_meters:
                mins_ago = max(1, int((now - created_at).total_seconds() / 60))
                return DuplicateCheckResult(
                    is_potential_duplicate=True,
                    duplicate_of_report_id=report_id,
                    similarity_score=0.85,
                    match_reason=(
                        f"Matching category '{category}' reported {mins_ago}m ago "
                        f"within {dist:.0f} meters (Report #{report_id[:8]})."
                    ),
                    matched_distance_meters=round(dist, 1),
                )

        return DuplicateCheckResult(is_potential_duplicate=False)


duplicate_service = DuplicateDetectionService()
