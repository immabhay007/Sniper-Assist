from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class StatusMasterBase(BaseModel):
    module_type: str
    status_name: str
    is_active: Optional[bool] = True

class StatusMasterCreate(StatusMasterBase):
    pass

class StatusMasterUpdate(BaseModel):
    module_type: Optional[str] = None
    status_name: Optional[str] = None
    is_active: Optional[bool] = None

class StatusMasterResponse(StatusMasterBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]