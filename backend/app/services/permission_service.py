from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.models.menu import Menu
from app.models.user import User
from app.models.user_permission import UserPermission
from app.schemas.permission import PermissionItem, PermissionItemUpdate


def has_permission(
    db: Session,
    user_id: int,
    menu_key: str,
    action: str = "can_view",
) -> bool:
    try:
        user = db.scalars(
            select(User).where(User.id == user_id, User.is_deleted == False)  # noqa: E712
        ).first()
    except SQLAlchemyError:
        db.rollback()
        return False
    if not user or not user.is_active:
        return False

    try:
        row = db.scalars(
            select(UserPermission)
            .options(joinedload(UserPermission.menu))
            .join(Menu, UserPermission.menu_id == Menu.id)
            .where(
                UserPermission.user_id == user_id,
                Menu.menu_key == menu_key,
                Menu.is_deleted == False,  # noqa: E712
            )
        ).first()
    except SQLAlchemyError:
        db.rollback()
        return False
    if not row:
        return False
    return bool(getattr(row, action, False))


def list_menus(db: Session) -> list[Menu]:
    return list(
        db.scalars(
            select(Menu)
            .where(Menu.is_deleted == False, Menu.is_active == True)  # noqa: E712
            .order_by(Menu.sort_order, Menu.menu_name)
        ).all()
    )


def get_user_permissions(db: Session, user_id: int) -> list[PermissionItem]:
    user = db.scalars(
        select(User).where(User.id == user_id)
    ).first()
    if not user:
        return []

    menus = list_menus(db)
    existing = {
        p.menu_id: p
        for p in db.scalars(
            select(UserPermission).where(UserPermission.user_id == user_id)
        ).all()
    }

    items: list[PermissionItem] = []
    for m in menus:
        p = existing.get(m.id)
        items.append(
            PermissionItem(
                menu_id=m.id,
                menu_key=m.menu_key,
                menu_name=m.menu_name,
                can_view=bool(p.can_view) if p else False,
                can_create=bool(p.can_create) if p else False,
                can_edit=bool(p.can_edit) if p else False,
                can_delete=bool(p.can_delete) if p else False,
                can_export=bool(p.can_export) if p else False,
                can_upload=bool(p.can_upload) if p else False,
            )
        )
    return items


def set_user_permissions(
    db: Session,
    user_id: int,
    items: list[PermissionItemUpdate],
    *,
    updated_at: datetime | None = None,
) -> list[PermissionItem]:
    user = db.get(User, user_id)
    if not user or user.is_deleted:
        return []

    now = updated_at or datetime.utcnow()
    db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()

    for item in items:
        if not any(
            [
                item.can_view,
                item.can_create,
                item.can_edit,
                item.can_delete,
                item.can_export,
                item.can_upload,
            ]
        ):
            continue
        db.add(
            UserPermission(
                user_id=user_id,
                menu_id=item.menu_id,
                can_view=item.can_view,
                can_create=item.can_create,
                can_edit=item.can_edit,
                can_delete=item.can_delete,
                can_export=item.can_export,
                can_upload=item.can_upload,
                created_at=now,
                updated_at=now,
            )
        )

    db.commit()
    return get_user_permissions(db, user_id)
