from io import BytesIO
import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

from app.core.security import create_access_token
from app.services.duplicate_service import duplicate_service
from app.services.storage_service import storage_service
from app.services.vision_service import vision_service
from main import app


def create_dummy_image_bytes(color: tuple[int, int, int] = (30, 80, 200), format: str = "JPEG") -> bytes:
    """Creates a real in-memory image for testing."""
    img = Image.new("RGB", (120, 120), color=color)
    buf = BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


# ---------------------------------------------------------
# Unit Tests: Storage Security
# ---------------------------------------------------------
def test_storage_valid_image():
    img_bytes = create_dummy_image_bytes()
    saved = storage_service.validate_and_save_image(
        file_bytes=img_bytes,
        original_filename="street_flood.jpg",
        content_type="image/jpeg",
    )
    assert saved.filename.startswith("hazard_")
    assert saved.relative_url.startswith("/uploads/hazard_media/")
    assert saved.mime_type == "image/jpg"
    assert saved.sha256_hash is not None
    assert saved.width == 120
    assert saved.height == 120


def test_storage_rejects_empty_file():
    with pytest.raises(Exception) as exc_info:
        storage_service.validate_and_save_image(b"", "empty.jpg", "image/jpeg")
    assert "empty" in str(exc_info.value).lower()


def test_storage_rejects_executable():
    with pytest.raises(Exception) as exc_info:
        storage_service.validate_and_save_image(b"malicious shell", "exploit.sh", "application/x-sh")
    assert "forbidden" in str(exc_info.value).lower()


def test_storage_rejects_corrupted_image():
    with pytest.raises(Exception) as exc_info:
        storage_service.validate_and_save_image(b"not an image string", "fake.jpg", "image/jpeg")
    assert "corrupted" in str(exc_info.value).lower() or "not a valid image" in str(exc_info.value).lower()


# ---------------------------------------------------------
# Unit Tests: AI Vision Service
# ---------------------------------------------------------
@pytest.mark.asyncio
async def test_vision_fallback_structured_output():
    img_bytes = create_dummy_image_bytes(color=(40, 90, 220))
    result = await vision_service.analyze_hazard_image(
        image_bytes=img_bytes,
        mime_type="image/jpeg",
        user_category_hint="WATERLOGGING",
        user_description_hint="Submerged sidewalk and blocked drain",
    )
    assert result.predicted_category in {
        "WATERLOGGING", "ROAD_FLOODING", "DAMAGED_ROAD", "FALLEN_TREE", "WASTE_ACCUMULATION", "OTHER"
    }
    assert len(result.visible_evidence) > 0
    assert 0.0 <= result.confidence_estimate <= 1.0
    assert len(result.safety_precautions) > 0
    assert "not statistically calibrated" in result.confidence_calibration_notice.lower()


# ---------------------------------------------------------
# Unit Tests: Duplicate Detection
# ---------------------------------------------------------
@pytest.mark.asyncio
async def test_duplicate_detection_logic():
    # Test haversine distance helper
    dist = duplicate_service.haversine_distance_meters(12.9716, 77.5946, 12.9716, 77.5946)
    assert dist == 0.0

    dist_near = duplicate_service.haversine_distance_meters(12.9716, 77.5946, 12.9720, 77.5948)
    assert 0 < dist_near < 100.0


# ---------------------------------------------------------
# Integration Tests: Report Endpoints
# ---------------------------------------------------------
@pytest.mark.asyncio
async def test_create_report_with_image_upload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        img_bytes = create_dummy_image_bytes(color=(50, 100, 220))

        files = {
            "image": ("hazard.jpg", img_bytes, "image/jpeg"),
        }
        data = {
            "title": "Severe Waterlogging on 80 Feet Road",
            "description": "Standing water 1.5 feet deep, two-wheelers struggling to pass.",
            "category": "WATERLOGGING",
            "lat": "12.9352",
            "lng": "77.6245",
            "address": "80 Feet Rd, 4th Block, Koramangala",
            "severity": "3",
        }

        res = await ac.post("/api/v1/reports", data=data, files=files)
        assert res.status_code == 201
        body = res.json()
        assert body["title"] == "Severe Waterlogging on 80 Feet Road"
        assert body["category"] == "WATERLOGGING"
        assert body["status"] == "REPORTED"  # Unverified initially
        assert len(body["media_urls"]) == 1
        assert body["ai_analysis"] is not None
        assert body["ai_analysis"]["predicted_category"] is not None
        assert body["is_potential_duplicate"] is False
        report_id = body["id"]

        # Now submit another report nearby with same image to test duplicate detection
        res2 = await ac.post("/api/v1/reports", data=data, files=files)
        assert res2.status_code == 201
        body2 = res2.json()
        assert body2["id"] != report_id  # Not deleted, distinct report created
        assert body2["is_potential_duplicate"] is True
        assert body2["duplicate_of_report_id"] == report_id


@pytest.mark.asyncio
async def test_preview_image_analysis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        img_bytes = create_dummy_image_bytes(color=(20, 150, 50))
        files = {
            "image": ("tree_branch.jpg", img_bytes, "image/jpeg"),
        }
        data = {
            "category_hint": "FALLEN_TREE",
            "description_hint": "Large banyan branch snapped across street",
        }
        res = await ac.post("/api/v1/reports/analyze-image", data=data, files=files)
        assert res.status_code == 200
        body = res.json()
        assert body["predicted_category"] == "FALLEN_TREE"
        assert len(body["safety_precautions"]) > 0


@pytest.mark.asyncio
async def test_list_and_get_report():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create a report first
        img_bytes = create_dummy_image_bytes()
        files = {"image": ("hazard.jpg", img_bytes, "image/jpeg")}
        data = {
            "title": "Choked Storm Culvert",
            "description": "Plastic bottles and debris blocking storm drain outlet.",
            "category": "WASTE_ACCUMULATION",
            "lat": "12.9716",
            "lng": "77.5946",
        }
        create_res = await ac.post("/api/v1/reports", data=data, files=files)
        assert create_res.status_code == 201
        created_id = create_res.json()["id"]

        # List reports
        res = await ac.get("/api/v1/reports")
        assert res.status_code == 200
        body = res.json()
        assert "items" in body
        assert body["total"] >= 1

        # Get by ID
        res_single = await ac.get(f"/api/v1/reports/{created_id}")
        assert res_single.status_code == 200
        assert res_single.json()["id"] == created_id


@pytest.mark.asyncio
async def test_update_report_status_rbac():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create a report
        img_bytes = create_dummy_image_bytes()
        files = {"image": ("pothole.jpg", img_bytes, "image/jpeg")}
        data = {
            "title": "Deep Pothole on Outer Ring Road",
            "description": "Asphalt depression 15cm deep posing hazard to motorists.",
            "category": "DAMAGED_ROAD",
            "lat": "12.9250",
            "lng": "77.6800",
        }
        create_res = await ac.post("/api/v1/reports", data=data, files=files)
        assert create_res.status_code == 201
        report_id = create_res.json()["id"]

        # Without token -> 401
        patch_data = {"status": "VERIFIED", "verification_notes": "Field unit verified on-site."}
        res_unauth = await ac.patch(f"/api/v1/reports/{report_id}/status", json=patch_data)
        assert res_unauth.status_code == 401

        # With coordinator token -> 200
        from app.repositories.user_repository import UserRepository

        user = await UserRepository.create({
            "email": "coord@terraguard.ai",
            "password_hash": "dummy_hash",
            "full_name": "Field Coordinator",
            "role": "COORDINATOR",
            "is_active": True,
        })
        coord_token = create_access_token(subject=user["id"], role="COORDINATOR")
        headers = {"Authorization": f"Bearer {coord_token}"}
        res_auth = await ac.patch(
            f"/api/v1/reports/{report_id}/status", json=patch_data, headers=headers
        )
        assert res_auth.status_code == 200
        assert res_auth.json()["status"] == "VERIFIED"
        assert res_auth.json()["verification_notes"] == "Field unit verified on-site."
