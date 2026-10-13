from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.schemas.permission import PermissionItem, UserPermissionsUpdate
from app.services import permission_service as perm_svc

router = APIRouter(prefix="/permissions", tags=["permissions"])

_users_view = Depends(require_permission("users", "can_view"))
_users_edit = Depends(require_permission("users", "can_edit"))


@router.get("/menus", response_model=list[dict])
def list_menus(db: Session = Depends(get_db), _user_id: int = _users_view):
    menus = perm_svc.list_menus(db)
    return [
        {"id": m.id, "menu_name": m.menu_name, "menu_key": m.menu_key, "sort_order": m.sort_order}
        for m in menus
    ]


@router.get("/users/{user_id}", response_model=list[PermissionItem])
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    # _actor: int = _users_view,
):
    from app.models.user import User

    if not db.get(User, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return perm_svc.get_user_permissions(db, user_id)


@router.put("/users/{user_id}", response_model=list[PermissionItem])
def set_user_permissions(
    user_id: int,
    payload: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    # _actor: int = _users_edit,
):
    from app.models.user import User

    if not db.get(User, user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return perm_svc.set_user_permissions(
        db, user_id, payload.permissions, updated_at=payload.updated_at
    )
