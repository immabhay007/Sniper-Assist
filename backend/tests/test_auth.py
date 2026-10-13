from unittest.mock import patch

from app.schemas.auth import AuthenticatedUser, LoginResponse, TokenResponse


def _mock_user():
    return AuthenticatedUser(
        id=1,
        email="admin@example.com",
        full_name="Admin",
        phone=None,
        role="admin",
        is_active=True,
        is_deleted=False,
        created_at=None,
        updated_at=None,
    )


def test_valid_login(client):
    payload = LoginResponse(
        access_token="access",
        refresh_token="refresh",
        token_type="bearer",
        user=_mock_user(),
    )
    with patch("app.api.v1.auth.svc.login", return_value=payload):
        resp = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "Pass1234"})

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@example.com"


def test_invalid_password(client):
    with patch("app.api.v1.auth.svc.login", side_effect=ValueError("INVALID_CREDENTIALS")):
        resp = client.post("/api/v1/auth/login", json={"email": "officer@example.com", "password": "WrongPass"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Incorrect email or password"


def test_inactive_user_login(client):
    with patch("app.api.v1.auth.svc.login", side_effect=PermissionError("INACTIVE_USER")):
        resp = client.post("/api/v1/auth/login", json={"email": "inactive@example.com", "password": "Pass1234"})

    assert resp.status_code == 403
    assert resp.json()["detail"] == "User account is inactive"


def test_unauthorized_role_login(client):
    with patch("app.api.v1.auth.svc.login", side_effect=PermissionError("UNAUTHORIZED_ROLE")):
        resp = client.post("/api/v1/auth/login", json={"email": "agent@example.com", "password": "Pass1234"})

    assert resp.status_code == 403
    assert resp.json()["detail"] == "User is not authorized to login"


def test_refresh_with_invalid_token(client):
    with patch("app.api.v1.auth.svc.refresh_tokens", side_effect=ValueError("INVALID_REFRESH_TOKEN")):
        resp = client.post("/api/v1/auth/refresh-token", json={"refresh_token": "invalid.token"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid refresh token"


def test_refresh_with_non_refresh_token(client):
    with patch("app.api.v1.auth.svc.refresh_tokens", side_effect=ValueError("INVALID_REFRESH_TOKEN")):
        resp = client.post("/api/v1/auth/refresh-token", json={"refresh_token": "access.token.value"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid refresh token"


def test_protected_route_missing_bearer_token(client):
    resp = client.get("/api/v1/users")

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Not authenticated"
