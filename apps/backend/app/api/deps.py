from collections.abc import Callable
from typing import Any

from fastapi import Depends, Header

from app.core.errors import AppException
from app.core.security import decode_token
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRole


async def get_current_user(
    authorization: str | None = Header(None, description="Bearer <JWT Access Token>"),
) -> dict[str, Any]:
    """Dependency that extracts, decodes, and verifies the active JWT user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise AppException(
            message="Missing or invalid Authorization header. Expected 'Bearer <TOKEN>'.",
            status_code=401,
            error_code="UNAUTHORIZED",
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    payload = decode_token(token, expected_type="access")

    user_id = payload.get("sub")
    if not user_id:
        raise AppException(
            message="Token payload is missing subject identifier.",
            status_code=401,
            error_code="INVALID_TOKEN",
        )

    user = await UserRepository.find_by_id(user_id)
    if not user:
        raise AppException(
            message="User associated with this token was not found.",
            status_code=401,
            error_code="USER_NOT_FOUND",
        )

    if not user.get("is_active", True):
        raise AppException(
            message="User account is deactivated.",
            status_code=403,
            error_code="ACCOUNT_DEACTIVATED",
        )

    return user


async def get_optional_current_user(
    authorization: str | None = Header(None, description="Bearer <JWT Access Token>"),
) -> dict[str, Any] | None:
    """Dependency that extracts user if Authorization header is present, or returns None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        token = authorization.split("Bearer ", 1)[1].strip()
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await UserRepository.find_by_id(user_id)
        if not user or not user.get("is_active", True):
            return None
        return user
    except Exception:
        return None


def require_role(*allowed_roles: UserRole) -> Callable:
    """Dependency factory for enforcing Role-Based Access Control (RBAC)."""

    async def role_checker(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in [r.value for r in allowed_roles]:
            raise AppException(
                message=(
                    f"Access forbidden. Role '{user_role}' does not have sufficient "
                    f"privileges. Required: {[r.value for r in allowed_roles]}."
                ),
                status_code=403,
                error_code="FORBIDDEN_INSUFFICIENT_ROLE",
                details={
                    "user_role": user_role,
                    "required_roles": [r.value for r in allowed_roles],
                },
            )
        return current_user

    return role_checker
