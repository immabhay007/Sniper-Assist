from sqlalchemy import select
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.security import create_token_pair, verify_password
from app.models.user import User
from app.schemas.auth import (
    AuthenticatedUser,
    LoginResponse,
    TokenResponse,
)

# matches users.role values in DB
ALLOWED_ROLES = {"admin", "officer"}


def _to_auth_user(user: User) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        is_active=bool(user.is_active),
        is_deleted=bool(user.is_deleted),
        created_at=user.created_at,
    )


def _get_user_by_email_with_retry(
    db: Session,
    email: str,
) -> User | None:
    query = select(User).where(
        User.email == email.strip().lower(),
        User.is_deleted == False,  # noqa: E712
    )

    try:
        return db.scalars(query).first()

    except OperationalError:
        db.rollback()

        try:
            return db.scalars(query).first()

        except OperationalError:
            db.rollback()
            raise


def login(
    db: Session,
    email: str,
    password: str,
) -> LoginResponse:
    try:
        row = _get_user_by_email_with_retry(db, email)

    except OperationalError:
        raise RuntimeError("DB_UNAVAILABLE") from None

    except SQLAlchemyError:
        db.rollback()
        raise RuntimeError("DB_FAILURE") from None

    if not row:
        raise ValueError("INVALID_CREDENTIALS")

    if not verify_password(password, row.password_hash):
        raise ValueError("INVALID_CREDENTIALS")

    if not row.is_active:
        raise PermissionError("INACTIVE_USER")

    # case-insensitive role validation
    if row.role.lower() not in ALLOWED_ROLES:
        raise PermissionError("UNAUTHORIZED_ROLE")

    access, refresh, _expires_in = create_token_pair(row.id)

    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        user=_to_auth_user(row),
    )


def refresh_tokens(
    db: Session,
    refresh_token: str,
) -> TokenResponse:
    from app.core.security import (
        TOKEN_TYPE_REFRESH,
        user_id_from_token,
    )

    try:
        user_id = user_id_from_token(
            refresh_token,
            expected_type=TOKEN_TYPE_REFRESH,
        )

    except ValueError:
        raise ValueError("INVALID_REFRESH_TOKEN")

    try:
        user = db.scalars(
            select(User).where(
                User.id == user_id,
                User.is_deleted == False,  # noqa: E712
            )
        ).first()

    except OperationalError:
        db.rollback()
        raise RuntimeError("DB_UNAVAILABLE") from None

    except SQLAlchemyError:
        db.rollback()
        raise RuntimeError("DB_FAILURE") from None

    if not user:
        raise LookupError("USER_NOT_FOUND")

    if not user.is_active:
        raise PermissionError("INACTIVE_USER")

    if user.role.lower() not in ALLOWED_ROLES:
        raise PermissionError("UNAUTHORIZED_ROLE")

    access, refresh, _expires_in = create_token_pair(user.id)

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        user=_to_auth_user(user),
    )


def get_me(
    db: Session,
    user_id: int,
) -> AuthenticatedUser | None:
    user = db.scalars(
        select(User).where(
            User.id == user_id,
            User.is_deleted == False,  # noqa: E712
        )
    ).first()

    if not user:
        return None

    return _to_auth_user(user)