from datetime import datetime

from pydantic import BaseModel, Field


class PermissionItem(BaseModel):
    menu_id: int
    menu_key: str
    menu_name: str
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_export: bool = False
    can_upload: bool = False


class PermissionItemUpdate(BaseModel):
    menu_id: int
    can_view: bool = False
    can_create: bool = False
    can_edit: bool = False
    can_delete: bool = False
    can_export: bool = False
    can_upload: bool = False


class UserPermissionsUpdate(BaseModel):
    permissions: list[PermissionItemUpdate]
    updated_at: datetime | None = None
