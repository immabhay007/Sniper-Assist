from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AttachmentBase(BaseModel):
    module_type: str
    module_id: int
    file_name: Optional[str] = None
    file_url: str
    file_type: Optional[str] = None
    uploaded_by: int

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentUpdate(BaseModel):
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None

class AttachmentResponse(AttachmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    uploaded_at: Optional[datetime]
