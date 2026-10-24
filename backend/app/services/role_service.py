from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate


def list_roles(
    db: Session,
    *,
    active_only: bool = False,
    include_deleted: bool = False,
) -> list[RoleResponse]:
    q = select(Role).order_by(Role.role_name)
    if not include_deleted:
        q = q.where(Role.is_deleted == False)  # noqa: E712
    if active_only:
        q = q.where(Role.is_active == True)  # noqa: E712
    rows = db.scalars(q).all()
    return [RoleResponse.model_validate(r) for r in rows]


def get_role(db: Session, role_id: int) -> Role | None:
    return db.get(Role, role_id)


def create_role(db: Session, payload: RoleCreate) -> RoleResponse:
    name = payload.role_name.strip()
    clash = db.scalars(
        select(Role).where(Role.role_name == name, Role.is_deleted == False)  # noqa: E712
    ).first()
    if clash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A role with this name already exists.",
        )

    now = datetime.utcnow()
    row = Role(
        role_name=name,
        description=payload.description,
        is_active=payload.is_active,
        is_deleted=False,
        created_at=payload.created_at or now,
        updated_at=payload.updated_at or now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return RoleResponse.model_validate(row)


def update_role(db: Session, role_id: int, payload: RoleUpdate) -> RoleResponse | None:
    row = db.get(Role, role_id)
    if not row or row.is_deleted:
        return None

    data = payload.model_dump(exclude_unset=True)
    if "role_name" in data and data["role_name"]:
        name = str(data["role_name"]).strip()
        clash = db.scalars(
            select(Role).where(
                Role.role_name == name,
                Role.id != role_id,
                Role.is_deleted == False,  # noqa: E712
            )
        ).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A role with this name already exists.",
            )
        data["role_name"] = name

    for key, value in data.items():
        setattr(row, key, value)

    if "updated_at" not in data:
        row.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(row)
    return RoleResponse.model_validate(row)


def delete_role(db: Session, role_id: int) -> bool:
    row = db.get(Role, role_id)
    if not row or row.is_deleted:
        return False

    in_use = db.scalars(
        select(User).where(
            User.role == row.role_name,          # ← match by string
            User.is_deleted == False,            # noqa: E712
        ).limit(1)
    ).first()
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a role that is assigned to users.",
        )

    row.is_deleted = True
    row.is_active = False
    row.updated_at = datetime.utcnow()
    db.commit()
    return True
