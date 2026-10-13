from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.menu_catalog import AVAILABLE_MENUS, get_catalog_entry
from app.models.menu import Menu
from app.schemas.menu import MenuAddFromCatalog, MenuCatalogItem, MenuResponse, MenuUpdate


def to_response(row: Menu) -> MenuResponse:
    entry = get_catalog_entry(row.menu_key)
    return MenuResponse(
        id=row.id,
        menu_name=row.menu_name,
        menu_key=row.menu_key,
        route=entry["route"] if entry else "",
        group=entry["group"] if entry else "",
        sort_order=row.sort_order,
        is_active=row.is_active,
        is_deleted=row.is_deleted,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def list_catalog(db: Session) -> list[MenuCatalogItem]:
    rows = db.scalars(select(Menu)).all()
    registered = {r.menu_key: r for r in rows if not r.is_deleted}
    items: list[MenuCatalogItem] = []
    for entry in sorted(AVAILABLE_MENUS, key=lambda m: m["sort_order"]):
        row = registered.get(entry["menu_key"])
        items.append(
            MenuCatalogItem(
                menu_key=entry["menu_key"],
                menu_name=entry["menu_name"],
                route=entry["route"],
                group=entry["group"],
                sort_order=entry["sort_order"],
                registered=row is not None,
                id=row.id if row else None,
                is_active=row.is_active if row else None,
            )
        )
    return items


def list_available_to_add(db: Session) -> list[MenuCatalogItem]:
    """Catalog entries not currently active in the registry (never added or soft-deleted)."""
    by_key = {r.menu_key: r for r in db.scalars(select(Menu)).all()}
    items: list[MenuCatalogItem] = []
    for entry in sorted(AVAILABLE_MENUS, key=lambda m: m["sort_order"]):
        row = by_key.get(entry["menu_key"])
        if row is not None and not row.is_deleted:
            continue
        items.append(
            MenuCatalogItem(
                menu_key=entry["menu_key"],
                menu_name=entry["menu_name"],
                route=entry["route"],
                group=entry["group"],
                sort_order=entry["sort_order"],
                registered=False,
                id=row.id if row else None,
                is_active=row.is_active if row else None,
            )
        )
    return items


def list_menus(
    db: Session,
    *,
    active_only: bool = False,
    include_deleted: bool = False,
) -> list[MenuResponse]:
    q = select(Menu).order_by(Menu.sort_order, Menu.menu_name)
    if not include_deleted:
        q = q.where(Menu.is_deleted == False)  # noqa: E712
    if active_only:
        q = q.where(Menu.is_active == True)  # noqa: E712
    rows = db.scalars(q).all()
    return [to_response(r) for r in rows]


def get_menu(db: Session, menu_id: int) -> Menu | None:
    return db.get(Menu, menu_id)


def add_menu_from_catalog(db: Session, payload: MenuAddFromCatalog) -> MenuResponse:
    entry = get_catalog_entry(payload.menu_key)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This menu is not in the application catalog. Only existing sidebar features can be added.",
        )

    now = datetime.utcnow()
    existing = db.scalars(select(Menu).where(Menu.menu_key == payload.menu_key)).first()
    if existing:
        if not existing.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Menu '{entry['menu_name']}' is already registered.",
            )
        existing.menu_name = entry["menu_name"]
        existing.sort_order = entry["sort_order"]
        existing.is_active = payload.is_active
        existing.is_deleted = False
        existing.updated_at = payload.updated_at or now
        if payload.created_at and not existing.created_at:
            existing.created_at = payload.created_at
        try:
            db.commit()
            db.refresh(existing)
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Menu '{entry['menu_name']}' is already registered.",
            ) from exc
        return to_response(existing)

    row = Menu(
        menu_name=entry["menu_name"],
        menu_key=entry["menu_key"],
        sort_order=entry["sort_order"],
        is_active=payload.is_active,
        is_deleted=False,
        created_at=payload.created_at or now,
        updated_at=payload.updated_at or now,
    )
    db.add(row)
    try:
        db.commit()
        db.refresh(row)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Menu '{entry['menu_name']}' is already registered.",
        ) from exc
    return to_response(row)


def update_menu(db: Session, menu_id: int, payload: MenuUpdate) -> MenuResponse | None:
    row = db.get(Menu, menu_id)
    if not row or row.is_deleted:
        return None

    entry = get_catalog_entry(row.menu_key)
    data = payload.model_dump(exclude_unset=True)

    if "menu_name" in data and data["menu_name"]:
        data["menu_name"] = str(data["menu_name"]).strip()
    elif entry and "menu_name" not in data:
        pass

    for key, value in data.items():
        setattr(row, key, value)

    if "updated_at" not in data:
        row.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(row)
    return to_response(row)


def delete_menu(db: Session, menu_id: int) -> bool:
    row = db.get(Menu, menu_id)
    if not row or row.is_deleted:
        return False
    row.is_deleted = True
    row.is_active = False
    row.updated_at = datetime.utcnow()
    db.commit()
    return True
