import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from app.repositories.user_repository import UserRepository


@pytest.fixture(autouse=True)
def clear_db():
    UserRepository._in_memory_users.clear()
    yield
    UserRepository._in_memory_users.clear()


@pytest.mark.asyncio
async def test_user_registration_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "sarah.chen@city.gov",
                "password": "SecurePassword123!",
                "full_name": "Dr. Sarah Chen",
                "role": "ANALYST",
                "phone": "+1-555-0199",
            },
        )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "sarah.chen@city.gov"
    assert data["full_name"] == "Dr. Sarah Chen"
    assert data["role"] == "ANALYST"
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_user_registration_duplicate_email():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First registration
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "sentinel@terraguard.ai",
                "password": "SecurePassword123!",
                "full_name": "Sentinel Operator",
                "role": "CITIZEN",
            },
        )
        # Duplicate registration attempt
        dup = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "sentinel@terraguard.ai",
                "password": "AnotherPassword456!",
                "full_name": "Clone Operator",
                "role": "CITIZEN",
            },
        )
    assert dup.status_code == 400
    assert dup.json()["error_code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_user_registration_short_password_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "short@city.gov",
                "password": "123",  # Under 8 chars
                "full_name": "Short Pass User",
                "role": "CITIZEN",
            },
        )
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_user_login_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "commander@city.gov",
                "password": "CommanderPassword2026!",
                "full_name": "Chief Elena Rostova",
                "role": "COORDINATOR",
            },
        )
        # Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "commander@city.gov",
                "password": "CommanderPassword2026!",
            },
        )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "commander@city.gov"
    assert data["user"]["role"] == "COORDINATOR"


@pytest.mark.asyncio
async def test_user_login_invalid_credentials():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@city.gov",
                "password": "WrongPassword!",
            },
        )
    assert res.status_code == 401
    assert res.json()["error_code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_protected_me_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register and login
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "analyst@city.gov",
                "password": "AnalystPassword2026!",
                "full_name": "Alex Mercer",
                "role": "ANALYST",
            },
        )
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "analyst@city.gov",
                "password": "AnalystPassword2026!",
            },
        )
        token = login_res.json()["access_token"]

        # Call /me with Bearer token
        me_res = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "analyst@city.gov"
        assert me_res.json()["role"] == "ANALYST"

        # Call /me without token -> 401
        unauth_res = await ac.get("/api/v1/auth/me")
        assert unauth_res.status_code == 401
        assert unauth_res.json()["error_code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_refresh_token_and_logout():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register and login
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "citizen@city.gov",
                "password": "CitizenPassword2026!",
                "full_name": "John Sentinel",
                "role": "CITIZEN",
            },
        )
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "citizen@city.gov",
                "password": "CitizenPassword2026!",
            },
        )
        access_token = login_res.json()["access_token"]
        refresh_token = login_res.json()["refresh_token"]

        # Refresh token
        refresh_res = await ac.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_res.status_code == 200
        new_access = refresh_res.json()["access_token"]
        assert new_access is not None

        # Logout with access token
        logout_res = await ac.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {new_access}"},
        )
        assert logout_res.status_code == 200

        # Attempting refresh after logout should fail because token was revoked
        revoked_res = await ac.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert revoked_res.status_code == 401
        assert revoked_res.json()["error_code"] == "TOKEN_REVOKED"


@pytest.mark.asyncio
async def test_forgot_and_reset_password():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "reset.user@city.gov",
                "password": "OldPassword123!",
                "full_name": "Reset Test User",
                "role": "CITIZEN",
            },
        )

        # Forgot password request
        forgot_res = await ac.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset.user@city.gov"},
        )
        assert forgot_res.status_code == 200
        reset_token = forgot_res.json()["reset_token"]

        # Reset password
        reset_res = await ac.post(
            "/api/v1/auth/reset-password",
            json={
                "token": reset_token,
                "new_password": "NewBrandNewPassword2026!",
            },
        )
        assert reset_res.status_code == 200

        # Login with old password fails
        old_login = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "reset.user@city.gov",
                "password": "OldPassword123!",
            },
        )
        assert old_login.status_code == 401

        # Login with new password succeeds
        new_login = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": "reset.user@city.gov",
                "password": "NewBrandNewPassword2026!",
            },
        )
        assert new_login.status_code == 200

@pytest.mark.asyncio
async def test_role_based_access_control():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register a Citizen
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "regular.citizen@city.gov",
                "password": "CitizenPass1234!",
                "full_name": "Citizen Jane",
                "role": "CITIZEN",
            },
        )
        login_cit = await ac.post(
            "/api/v1/auth/login",
            json={"email": "regular.citizen@city.gov", "password": "CitizenPass1234!"},
        )
        cit_token = login_cit.json()["access_token"]

        # Citizen attempts to access privileged dispatch -> 403 Forbidden
        cit_access = await ac.get(
            "/api/v1/auth/privileged-dispatch",
            headers={"Authorization": f"Bearer {cit_token}"},
        )
        assert cit_access.status_code == 403
        assert cit_access.json()["error_code"] == "FORBIDDEN_INSUFFICIENT_ROLE"

        # 2. Register an Administrator
        await ac.post(
            "/api/v1/auth/register",
            json={
                "email": "root.admin@city.gov",
                "password": "AdminPass1234!",
                "full_name": "Super Admin",
                "role": "ADMIN",
            },
        )
        login_adm = await ac.post(
            "/api/v1/auth/login",
            json={"email": "root.admin@city.gov", "password": "AdminPass1234!"},
        )
        adm_token = login_adm.json()["access_token"]

        # Admin accesses privileged dispatch -> 200 OK
        adm_access = await ac.get(
            "/api/v1/auth/privileged-dispatch",
            headers={"Authorization": f"Bearer {adm_token}"},
        )
        assert adm_access.status_code == 200
        assert adm_access.json()["status"] == "success"
        assert adm_access.json()["user_role"] == "ADMIN"
