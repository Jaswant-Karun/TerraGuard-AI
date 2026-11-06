from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

try:
    import email_validator  # noqa: F401
    from pydantic import EmailStr
except ImportError:
    EmailStr = Annotated[str, StringConstraints(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]  # type: ignore


class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    ANALYST = "ANALYST"
    COORDINATOR = "COORDINATOR"
    ADMIN = "ADMIN"


class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(description="User primary email address")
    password: str = Field(min_length=8, description="Password with minimum 8 characters")
    full_name: str = Field(min_length=2, max_length=100, description="User full display name")
    role: UserRole = Field(
        default=UserRole.CITIZEN, description="Assigned role in TerraGuard platform"
    )
    phone: str | None = Field(
        default=None, description="Optional phone number for emergency SMS alerts"
    )


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(description="User primary email address")
    password: str = Field(description="User secret password")


class UserResponse(BaseModel):
    id: str = Field(description="Unique user identifier")
    email: str = Field(description="Primary email address")
    full_name: str = Field(description="Full name")
    role: UserRole = Field(description="User platform role")
    is_active: bool = Field(default=True, description="Account active status")
    created_at: datetime = Field(description="Account creation timestamp")
    last_login_at: datetime | None = Field(default=None, description="Last login timestamp")


class TokenResponse(BaseModel):
    access_token: str = Field(description="JWT Bearer access token")
    refresh_token: str = Field(description="Longer-lived refresh token")
    token_type: str = Field(default="bearer", description="Token authentication type")
    expires_in_seconds: int = Field(description="Access token lifespan in seconds")
    user: UserResponse = Field(description="Authenticated user profile summary")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(description="Valid JWT refresh token")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(description="Account email to dispatch reset token to")


class ResetPasswordRequest(BaseModel):
    token: str = Field(description="Password reset verification token")
    new_password: str = Field(
        min_length=8, description="New secret password (minimum 8 characters)"
    )
