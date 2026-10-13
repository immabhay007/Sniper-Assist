from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ComplaintCategoryBase(BaseModel):
    category_name: str
    sla_hours: int
    is_active: Optional[bool] = True
    category_icon: Optional[str] = None      # new
    color_code: Optional[str] = None         # new

class ComplaintCategoryCreate(ComplaintCategoryBase):
    pass

class ComplaintCategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    sla_hours: Optional[int] = None
    is_active: Optional[bool] = None
    category_icon: Optional[str] = None      # new
    color_code: Optional[str] = None         # new

class ComplaintCategoryResponse(ComplaintCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]