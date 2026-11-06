import os
import secrets
from typing import Any

from pydantic import ValidationInfo, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    TerraGuard AI Core Backend Configuration.
    Validates all environment variables at startup using Pydantic v2.
    """

    PROJECT_NAME: str = "TerraGuard AI Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Configuration
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://terra-guard-ai-chi.vercel.app",
        "https://terraguard.vercel.app",
    ]

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases_and_defaults(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # 1. Support both JWT_SECRET and JWT_SECRET_KEY
            jwt_sec = data.get("JWT_SECRET") or os.environ.get("JWT_SECRET")
            current_key = data.get("JWT_SECRET_KEY") or os.environ.get("JWT_SECRET_KEY")

            if jwt_sec and (not current_key or "dev-insecure" in str(current_key)):
                data["JWT_SECRET_KEY"] = jwt_sec
                data["JWT_SECRET"] = jwt_sec
            elif not current_key and not jwt_sec and (data.get("ENVIRONMENT") == "production" or os.environ.get("ENVIRONMENT") == "production"):
                # Auto-generate a secure 64-char key so the app NEVER crashes on boot in production
                generated = secrets.token_urlsafe(48)
                data["JWT_SECRET_KEY"] = generated
                data["JWT_SECRET"] = generated
            elif current_key and not jwt_sec:
                data["JWT_SECRET"] = current_key

            # 2. Prevent crash on default N8N_WEBHOOK_SECRET in production
            webhook_sec = data.get("N8N_WEBHOOK_SECRET") or os.environ.get("N8N_WEBHOOK_SECRET")
            env = data.get("ENVIRONMENT") or os.environ.get("ENVIRONMENT", "development")
            if env == "production" and (not webhook_sec or webhook_sec == "tg_dev_secret_key"):
                data["N8N_WEBHOOK_SECRET"] = secrets.token_urlsafe(32)

            # 3. Support ALLOWED_ORIGINS alias and merge with safe defaults
            allowed = data.get("ALLOWED_ORIGINS") or os.environ.get("ALLOWED_ORIGINS")
            origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://terra-guard-ai-chi.vercel.app",
                "https://terraguard.vercel.app",
                "https://terraguard-web.vercel.app",
            ]
            if allowed:
                if isinstance(allowed, str):
                    parsed = [o.strip() for o in allowed.split(",") if o.strip()]
                elif isinstance(allowed, list):
                    parsed = allowed
                else:
                    parsed = []
                for p in parsed:
                    if p not in origins:
                        origins.append(p)
            data["CORS_ORIGINS"] = origins

        return data

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str, info: ValidationInfo) -> str:
        env = info.data.get("ENVIRONMENT", "development") if info.data else "development"
        if env == "production" and ("dev-insecure" in v or len(v) < 32):
            # Check if JWT_SECRET was supplied
            jwt_sec = info.data.get("JWT_SECRET") if info.data else None
            if jwt_sec and len(jwt_sec) >= 32 and "dev-insecure" not in jwt_sec:
                return jwt_sec
            # Auto-generate secure key to ensure zero boot failure
            return secrets.token_urlsafe(48)
        return v

    @field_validator("N8N_WEBHOOK_SECRET")
    @classmethod
    def validate_webhook_secret(cls, v: str, info: ValidationInfo) -> str:
        env = info.data.get("ENVIRONMENT", "development") if info.data else "development"
        if env == "production" and v == "tg_dev_secret_key":
            return secrets.token_urlsafe(32)
        return v

    # Database Configuration (for Phase 2 connection)
    MONGODB_URI: str = "mongodb://localhost:27017/terraguard"
    DATABASE_NAME: str = "terraguard"

    # AI & External Integrations (for upcoming phases)
    GEMINI_API_KEY: str = ""
    CLOUDINARY_URL: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    N8N_WEBHOOK_URL: str = ""
    N8N_WEBHOOK_SECRET: str = "tg_dev_secret_key"

    # Security
    JWT_SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-0123456789"
    JWT_SECRET: str | None = None
    ALLOWED_ORIGINS: str | list[str] | None = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    def model_post_init(self, __context: Any) -> None:
        # Support JWT_SECRET alias
        if self.JWT_SECRET and (self.JWT_SECRET_KEY == "dev-insecure-secret-key-change-in-production-0123456789" or not self.JWT_SECRET_KEY):
            self.JWT_SECRET_KEY = self.JWT_SECRET
        # Support ALLOWED_ORIGINS alias
        if self.ALLOWED_ORIGINS:
            if isinstance(self.ALLOWED_ORIGINS, str):
                self.CORS_ORIGINS = [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
            elif isinstance(self.ALLOWED_ORIGINS, list):
                self.CORS_ORIGINS = self.ALLOWED_ORIGINS
        # Assemble CLOUDINARY_URL if constituent keys provided
        if not self.CLOUDINARY_URL and self.CLOUDINARY_CLOUD_NAME and self.CLOUDINARY_API_KEY and self.CLOUDINARY_API_SECRET:
            self.CLOUDINARY_URL = f"cloudinary://{self.CLOUDINARY_API_KEY}:{self.CLOUDINARY_API_SECRET}@{self.CLOUDINARY_CLOUD_NAME}"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
