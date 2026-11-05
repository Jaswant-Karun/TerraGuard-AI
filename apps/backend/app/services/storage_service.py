import hashlib
import logging
import os
import uuid
from io import BytesIO
from pathlib import Path
from typing import NamedTuple

from PIL import Image

from app.core.config import settings
from app.core.errors import AppException

logger = logging.getLogger("terraguard.storage")

# Security Constraints
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
ALLOWED_PIL_FORMATS = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".py", ".php", ".js", ".html",
    ".htm", ".dll", ".so", ".bin", ".msi", ".vbs", ".ps1", ".jar"
}

# Isolated storage directory (outside of app execution code)
STORAGE_BASE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "uploads" / "hazard_media"
STORAGE_BASE_DIR.mkdir(parents=True, exist_ok=True)


class SavedMedia(NamedTuple):
    filename: str
    relative_url: str
    absolute_path: str
    sha256_hash: str
    mime_type: str
    size_bytes: int
    width: int
    height: int


class StorageService:
    """
    Secure isolated storage provider for citizen hazard media.
    Enforces MIME type validation, magic byte header verification with Pillow,
    content-addressable hashing, and filename sanitization.
    """

    @staticmethod
    def validate_and_save_image(
        file_bytes: bytes,
        original_filename: str | None = None,
        content_type: str | None = None,
    ) -> SavedMedia:
        # 1. Size constraint validation
        size_bytes = len(file_bytes)
        if size_bytes == 0:
            raise AppException(
                message="Uploaded file is empty (0 bytes).",
                status_code=400,
                error_code="EMPTY_FILE",
            )
        if size_bytes > MAX_FILE_SIZE_BYTES:
            raise AppException(
                message=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
                status_code=400,
                error_code="FILE_TOO_LARGE",
                details={"size_bytes": size_bytes, "max_allowed": MAX_FILE_SIZE_BYTES},
            )

        # 2. Check for dangerous extension in original filename if provided
        if original_filename:
            _, ext = os.path.splitext(original_filename.lower())
            if ext in DANGEROUS_EXTENSIONS:
                logger.warning(f"Rejected executable file upload attempt: {original_filename}")
                raise AppException(
                    message="Executable and script file uploads are strictly forbidden.",
                    status_code=400,
                    error_code="FORBIDDEN_FILE_TYPE",
                )

        # 3. MIME validation
        sanitized_mime = (content_type or "").lower().strip()
        if sanitized_mime not in ALLOWED_MIME_TYPES:
            # Fallback to header inspection if content_type is generic application/octet-stream
            if sanitized_mime != "application/octet-stream":
                raise AppException(
                    message=f"Unsupported file type '{sanitized_mime}'. Supported: JPEG, PNG, WEBP.",
                    status_code=400,
                    error_code="UNSUPPORTED_MEDIA_TYPE",
                )

        # 4. Deep magic byte & structural image validation with Pillow
        try:
            image_stream = BytesIO(file_bytes)
            with Image.open(image_stream) as img:
                img.verify()
                detected_format = img.format
                # Reopen to read dimensions after verify()
                img_reopened = Image.open(BytesIO(file_bytes))
                width, height = img_reopened.size
        except Exception as e:
            logger.warning(f"File failed image integrity verification: {e}")
            raise AppException(
                message="File is corrupted, truncated, or is not a valid image.",
                status_code=400,
                error_code="INVALID_IMAGE_FILE",
            )

        if not detected_format or detected_format.upper() not in ALLOWED_PIL_FORMATS:
            raise AppException(
                message=f"Detected image format '{detected_format}' is not permitted.",
                status_code=400,
                error_code="INVALID_IMAGE_FORMAT",
            )

        canonical_ext = ALLOWED_PIL_FORMATS[detected_format.upper()]

        # 5. Cryptographic hash for deduplication and integrity
        sha256_hash = hashlib.sha256(file_bytes).hexdigest()

        # 6. Generate cryptographically safe random filename (never use untrusted original name)
        safe_filename = f"hazard_{uuid.uuid4().hex}_{sha256_hash[:8]}.{canonical_ext}"
        destination_path = STORAGE_BASE_DIR / safe_filename

        # 7. Write to isolated storage
        try:
            destination_path.write_bytes(file_bytes)
        except OSError as e:
            logger.error(f"Failed to persist hazard image to disk: {e}")
            raise AppException(
                message="Storage write failed. Please try again.",
                status_code=500,
                error_code="STORAGE_ERROR",
            )

        # Build relative public URL (served by FastAPI StaticFiles)
        relative_url = f"/uploads/hazard_media/{safe_filename}"

        # If Cloudinary URL is configured, we could optionally upload to cloud storage here:
        if settings.CLOUDINARY_URL:
            # Can sync to Cloudinary if needed in production
            pass

        return SavedMedia(
            filename=safe_filename,
            relative_url=relative_url,
            absolute_path=str(destination_path),
            sha256_hash=sha256_hash,
            mime_type=f"image/{canonical_ext}",
            size_bytes=size_bytes,
            width=width,
            height=height,
        )


storage_service = StorageService()

