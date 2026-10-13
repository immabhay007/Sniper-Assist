from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db, require_permission
from app.schemas.menu import MenuAddFromCatalog, MenuCatalogItem, MenuResponse, MenuUpdate
from app.services import menu_service as svc

router = APIRouter(prefix="/menus", tags=["menus"])

_view = Depends(require_permission("menus", "can_view"))
_create = Depends(require_permission("menus", "can_create"))
_edit = Depends(require_permission("menus", "can_edit"))
_delete = Depends(require_permission("menus", "can_delete"))


@router.get("/catalog", response_model=list[MenuCatalogItem])
def list_catalog(
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    return svc.list_catalog(db)


@router.get("/available", response_model=list[MenuCatalogItem])
def list_available(
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    return svc.list_available_to_add(db)


# @router.get("", response_model=list[MenuResponse])
# def list_menus(
#     active_only: bool = Query(False),
#     include_deleted: bool = Query(False),
#     db: Session = Depends(get_db),
#     _user_id: int = _view,
# ):
#     return svc.list_menus(db, active_only=active_only, include_deleted=include_deleted)

@router.get("", response_model=list[MenuResponse])
def list_menus(
    active_only: bool = Query(False),
    include_deleted: bool = Query(False),
    db: Session = Depends(get_db),
):
    return svc.list_menus(db, active_only=active_only, include_deleted=include_deleted)

@router.get("/{menu_id}", response_model=MenuResponse)
def get_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    row = svc.get_menu(db, menu_id)
    if not row or row.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return svc.to_response(row)


@router.post("", response_model=MenuResponse, status_code=status.HTTP_201_CREATED)
def add_menu(
    payload: MenuAddFromCatalog,
    db: Session = Depends(get_db),
    _user_id: int = _create,
):
    return svc.add_menu_from_catalog(db, payload)


@router.patch("/{menu_id}", response_model=MenuResponse)
def update_menu(
    menu_id: int,
    payload: MenuUpdate,
    db: Session = Depends(get_db),
    _user_id: int = _edit,
):
    updated = svc.update_menu(db, menu_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return updated


# In your service module (e.g., menu_service.py)
def delete_menu(db: Session, menu_id: int) -> bool:
    menu = db.query(Menu).filter(Menu.id == menu_id).first()
    if not menu:
        return False
    
    # Soft delete: mark as deleted and inactive
    menu.is_deleted = 1
    menu.is_active = 0
    db.commit()
    return True
