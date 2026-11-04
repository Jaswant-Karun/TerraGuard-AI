from pydantic import field_validator
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
        "https://terraguard.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration (for Phase 2 connection)
    MONGODB_URI: str = "mongodb://localhost:27017/terraguard"
    DATABASE_NAME: str = "terraguard"

    # AI & External Integrations (for upcoming phases)
    GEMINI_API_KEY: str = ""
    CLOUDINARY_URL: str = ""
    N8N_WEBHOOK_URL: str = ""
    N8N_WEBHOOK_SECRET: str = "tg_dev_secret_key"

    # Security
    JWT_SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-0123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
