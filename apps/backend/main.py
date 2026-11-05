import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.database import db_manager
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.services.storage_service import STORAGE_BASE_DIR

# Initialize structured logging
setup_logging()
logger = logging.getLogger("terraguard.main")

# Initialize global IP rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for startup and shutdown procedures."""
    logger.info(f"Starting {settings.PROJECT_NAME} in [{settings.ENVIRONMENT}] mode")
    await db_manager.connect()
    yield
    await db_manager.disconnect()
    logger.info(f"Shutting down {settings.PROJECT_NAME}")


def create_application() -> FastAPI:
    """Factory function for creating the FastAPI app instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description=(
            "TerraGuard AI — Enterprise Urban Risk Intelligence, "
            "Prediction & Disaster Prevention Platform. Predict. Prevent. Protect."
        ),
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Rate Limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Register centralized exception handlers
    register_exception_handlers(app)

    # Securely mount media storage for uploaded hazard images (read-only)
    app.mount(
        "/uploads/hazard_media",
        StaticFiles(directory=str(STORAGE_BASE_DIR)),
        name="hazard_media",
    )

    # Mount API v1 router
    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "tagline": "Predict. Prevent. Protect.",
            "version": "1.0.0",
            "api_v1_docs": f"{settings.API_V1_STR}/docs",
            "health_check": f"{settings.API_V1_STR}/health",
        }

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
