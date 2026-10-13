from datetime import datetime

from pydantic import BaseModel, Field


class RoleCreate(BaseModel):
    role_name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RoleUpdate(BaseModel):
    role_name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    updated_at: datetime | None = None


class RoleResponse(BaseModel):
    id: int
    role_name: str
    description: str | None
    is_active: bool
    is_deleted: bool
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}
