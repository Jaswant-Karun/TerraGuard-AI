from datetime import UTC, datetime
from typing import Any
from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_user, require_role
from app.core.config import settings
from app.core.errors import AppException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    ForgotPasswordRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UserRole,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen or emergency user",
)
async def register(request: UserRegisterRequest) -> UserResponse:
    existing = await UserRepository.find_by_email(request.email)
    if existing:
        raise AppException(
            message=f"An account with email '{request.email}' already exists.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="EMAIL_ALREADY_EXISTS",
        )

    hashed = hash_password(request.password)
    user_data = {
        "email": request.email,
        "hashed_password": hashed,
        "full_name": request.full_name,
        "role": request.role.value,
        "phone": request.phone,
    }

    created = await UserRepository.create(user_data)
    return UserResponse(
        id=created["id"],
        email=created["email"],
        full_name=created["full_name"],
        role=created["role"],
        is_active=created["is_active"],
        created_at=created["created_at"],
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue JWT tokens",
)
async def login(request: UserLoginRequest) -> TokenResponse:
    user = await UserRepository.find_by_email(request.email)
    if not user:
        raise AppException(
            message="Invalid email or password.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
        )

    if not verify_password(request.password, user.get("hashed_password", "")):
        raise AppException(
            message="Invalid email or password.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
        )

    if not user.get("is_active", True):
        raise AppException(
            message="Your account has been deactivated. Contact city administrator.",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="ACCOUNT_DEACTIVATED",
        )

    user_id = user["id"]
    role = user.get("role", "CITIZEN")

    access_token = create_access_token(subject=user_id, role=role)
    refresh_token = create_refresh_token(subject=user_id)

    # Save active refresh token in database for session tracking
    now = datetime.now(UTC)
    await UserRepository.update(
        user_id,
        {
            "refresh_token": refresh_token,
            "last_login_at": now,
        },
    )

    user_response = UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        role=role,
        is_active=user["is_active"],
        created_at=user.get("created_at", now),
        last_login_at=now,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token using valid refresh token",
)
async def refresh_token(request: RefreshTokenRequest) -> TokenResponse:
    payload = decode_token(request.refresh_token, expected_type="refresh")
    user_id = payload.get("sub")
    if not user_id:
        raise AppException(
            message="Invalid refresh token payload.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_TOKEN",
        )

    user = await UserRepository.find_by_id(user_id)
    if not user:
        raise AppException(
            message="User not found.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="USER_NOT_FOUND",
        )

    # Validate that the token has not been revoked
    if user.get("refresh_token") != request.refresh_token:
        raise AppException(
            message="Refresh token has been revoked or replaced. Please login again.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="TOKEN_REVOKED",
        )

    new_access_token = create_access_token(
        subject=user_id, role=user.get("role", "CITIZEN")
    )

    user_response = UserResponse(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        role=user.get("role", "CITIZEN"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at", datetime.now(UTC)),
        last_login_at=user.get("last_login_at"),
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=request.refresh_token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Revoke active user refresh token",
)
async def logout(current_user: dict[str, Any] = Depends(get_current_user)) -> dict:
    await UserRepository.revoke_refresh_token(current_user["id"])
    return {
        "status": "success",
        "message": "User session logged out and refresh token revoked successfully.",
    }


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user profile",
)
async def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user.get("role", "CITIZEN"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at", datetime.now(UTC)),
        last_login_at=current_user.get("last_login_at"),
    )


@router.get(
    "/privileged-dispatch",
    status_code=status.HTTP_200_OK,
    summary="Privileged route restricted to Coordinators and Administrators",
)
async def privileged_dispatch(
    current_user: dict[str, Any] = Depends(
        require_role(UserRole.COORDINATOR, UserRole.ADMIN)
    ),
) -> dict:
    return {
        "status": "success",
        "message": "Authorized for emergency dispatch controls.",
        "user_role": current_user.get("role"),
    }


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Initiate password recovery workflow",
)
async def forgot_password(request: ForgotPasswordRequest) -> dict:
    user = await UserRepository.find_by_email(request.email)
    if user:
        reset_token = create_refresh_token(subject=user["id"])
        await UserRepository.update(user["id"], {"reset_token": reset_token})
        # In production, dispatch email via SendGrid/SMTP. For testing, token is returned.
        return {
            "status": "success",
            "message": "Password reset instructions dispatched.",
            "reset_token": reset_token,
        }

    return {
        "status": "success",
        "message": "If an account with this email exists, password reset instructions were dispatched.",
    }


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Complete password reset with verified token",
)
async def reset_password(request: ResetPasswordRequest) -> dict:
    payload = decode_token(request.token, expected_type="refresh")
    user_id = payload.get("sub")
    if not user_id:
        raise AppException(
            message="Invalid reset token payload.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_RESET_TOKEN",
        )

    user = await UserRepository.find_by_id(user_id)
    if not user or user.get("reset_token") != request.token:
        raise AppException(
            message="Reset token is invalid or has already been used.",
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_RESET_TOKEN",
        )

    new_hash = hash_password(request.new_password)
    await UserRepository.update(
        user_id,
        {
            "hashed_password": new_hash,
            "reset_token": None,
            "refresh_token": None,  # Invalidate existing sessions
        },
    )

    return {
        "status": "success",
        "message": "Password updated successfully. Please login with your new credentials.",
    }
