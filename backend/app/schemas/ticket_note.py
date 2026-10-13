from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class TicketNoteBase(BaseModel):
    module_type: str
    module_id: int
    note_text: str

    ticket_no: Optional[str] = None

    assigned_to: Optional[int] = None
    status_id: Optional[int] = None
    


class TicketNoteCreate(TicketNoteBase):
    created_by: int
    next_action_item: Optional[str] = None


class TicketNoteUpdate(BaseModel):
    note_text: Optional[str] = None
    ticket_no: Optional[str] = None

    assigned_to: Optional[int] = None
    updated_by: Optional[int] = None
    status_id: Optional[int] = None
    next_action_item: Optional[str] = None


class TicketNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    module_type: str
    module_id: int
    ticket_no: Optional[str] = None
    note_text: str

    created_by: int
    assigned_to: Optional[int] = None
    updated_by: Optional[int] = None
    status_id: Optional[int] = None

    is_deleted: bool

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None