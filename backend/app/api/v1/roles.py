from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db, require_permission
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from app.services import role_service as svc

router = APIRouter(prefix="/roles", tags=["roles"])

_view = Depends(require_permission("roles", "can_view"))
_create = Depends(require_permission("roles", "can_create"))
_edit = Depends(require_permission("roles", "can_edit"))
_delete = Depends(require_permission("roles", "can_delete"))


@router.get("/dropdown", response_model=list[RoleResponse])
def list_roles_dropdown(
    db: Session = Depends(get_db),
    _user_id: int = Depends(get_current_user_id),
):
    """Active roles for user forms (does not require roles menu permission)."""
    return svc.list_roles(db, active_only=True, include_deleted=False)


@router.get("", response_model=list[RoleResponse])
def list_roles(
    active_only: bool = Query(False),
    include_deleted: bool = Query(False),
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    return svc.list_roles(db, active_only=active_only, include_deleted=include_deleted)


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    row = svc.get_role(db, role_id)
    if not row or row.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return RoleResponse.model_validate(row)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    _user_id: int = _create,
):
    return svc.create_role(db, payload)


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    _user_id: int = _edit,
):
    updated = svc.update_role(db, role_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return updated


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _user_id: int = _delete,
):
    if not svc.delete_role(db, role_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
