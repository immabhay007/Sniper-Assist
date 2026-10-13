import secrets
import string
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.initialize_environment import settings
import bcrypt

BCRYPT_ROUNDS = 12
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"


def _password_bytes(plain: str) -> bytes:
    """Bcrypt accepts at most 72 bytes."""
    return plain.encode("utf-8")[:72]


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(_password_bytes(plain), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(plain), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def generate_temporary_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: int) -> str:
    expire = _utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "token_type": TOKEN_TYPE_ACCESS,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: int) -> str:
    expire = _utcnow() + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "token_type": TOKEN_TYPE_REFRESH,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_token_pair(user_id: int) -> tuple[str, str, int]:
    """Returns (access_token, refresh_token, access_expires_in_seconds)."""
    return (
        create_access_token(user_id),
        create_refresh_token(user_id),
        settings.access_token_expire_minutes * 60,
    )


def decode_token(token: str, *, expected_type: str | None = None) -> dict:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if expected_type and payload.get("token_type") != expected_type:
        raise JWTError("Invalid token type")
    return payload


def user_id_from_token(token: str, *, expected_type: str) -> int:
    try:
        payload = decode_token(token, expected_type=expected_type)
        return int(payload["sub"])
    except (JWTError, ValueError, TypeError) as exc:
        raise ValueError("Invalid or expired token") from exc
