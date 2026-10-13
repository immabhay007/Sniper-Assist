from datetime import datetime

from pydantic import BaseModel, Field


class MenuCatalogItem(BaseModel):
    menu_key: str
    menu_name: str
    route: str
    group: str
    sort_order: int
    registered: bool = False
    id: int | None = None
    is_active: bool | None = None


class MenuAddFromCatalog(BaseModel):
    menu_key: str = Field(..., min_length=1, max_length=100)
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class MenuUpdate(BaseModel):
    menu_name: str | None = Field(default=None, min_length=1, max_length=150)
    sort_order: int | None = None
    is_active: bool | None = None
    updated_at: datetime | None = None


class MenuResponse(BaseModel):
    id: int
    menu_name: str
    menu_key: str
    route: str
    group: str
    sort_order: int | None
    is_active: bool
    is_deleted: bool
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}
