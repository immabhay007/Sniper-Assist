from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    generate_temporary_password,
    hash_password,
)
from app.emails.onboarding import send_onboarding_emails
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserCreateResponse,
    UserResponse,
    UserUpdate,
)


def to_response(row: User) -> UserResponse:
    return UserResponse(
        id=row.id,
        email=row.email,
        full_name=row.full_name,
        phone=row.phone,
        role=row.role,
        is_active=bool(row.is_active),
        is_deleted=bool(row.is_deleted),
        created_at=row.created_at,
    )


def list_users(
    db: Session,
    *,
    active_only: bool = False,
    include_deleted: bool = False,
) -> list[UserResponse]:

    q = select(User).order_by(User.full_name)

    if not include_deleted:
        q = q.where(User.is_deleted == False)  # noqa: E712

    if active_only:
        q = q.where(User.is_active == True)  # noqa: E712

    rows = db.scalars(q).all()

    return [to_response(r) for r in rows]


def get_user(
    db: Session,
    user_id: int,
) -> User | None:

    return db.scalars(
        select(User).where(User.id == user_id)
    ).first()


def create_user(
    db: Session,
    payload: UserCreate,
) -> UserCreateResponse:

    existing = db.scalars(
        select(User).where(
            User.email == payload.email.strip().lower()
        )
    ).first()

    if existing and not existing.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    temp_password: str | None = None

    plain = payload.password

    if not plain:
        temp_password = generate_temporary_password()
        plain = temp_password

    row = User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(plain),
        full_name=payload.full_name.strip(),
        phone=payload.phone,

        # direct string role
        role=payload.role.lower(),

        is_active=payload.is_active,
        is_deleted=False,

        created_at=datetime.utcnow(),
    )

    db.add(row)
    db.commit()
    db.refresh(row)

    row = get_user(db, row.id)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User create failed.",
        )

    email_results = send_onboarding_emails(
        row,
        temporary_password=temp_password,
    )

    return UserCreateResponse(
        **to_response(row).model_dump(),
        temporary_password=temp_password,
        onboarding_email_sent=bool(
            email_results.get("user")
        ),
        onboarding_email_error=email_results.get(
            "user_error"
        ),
    )


def update_user(
    db: Session,
    user_id: int,
    payload: UserUpdate,
) -> UserResponse | None:

    row = get_user(db, user_id)

    if not row or row.is_deleted:
        return None

    data = payload.model_dump(exclude_unset=True)

    if "email" in data and data["email"]:

        email = data["email"].strip().lower()

        clash = db.scalars(
            select(User).where(
                User.email == email,
                User.id != user_id,
                User.is_deleted == False,  # noqa: E712
            )
        ).first()

        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

        data["email"] = email

    if "password" in data:

        pwd = data.pop("password")

        if pwd:
            row.password_hash = hash_password(pwd)

    if "role" in data and data["role"]:
        data["role"] = data["role"].lower()

    for key, value in data.items():

        if key == "full_name" and value:
            value = str(value).strip()

        setattr(row, key, value)

    db.commit()
    db.refresh(row)

    row = get_user(db, user_id)

    return to_response(row)


def delete_user(
    db: Session,
    user_id: int,
) -> bool:

    row = db.get(User, user_id)

    if not row or row.is_deleted:
        return False

    row.is_deleted = True
    row.is_active = False

    db.commit()

    return True