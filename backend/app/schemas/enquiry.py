from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from typing import List, Optional

class EnquiryBase(BaseModel):
    customer_id: int
    category_id: int
    created_by: int
    assigned_to: Optional[int] = None
    order_id: Optional[int] = None
    enquiry_source: str
    schedule_booking_time: Optional[datetime] = None
    services_booked: Optional[str] = None
    enquiry_details: str
    next_action_item: Optional[str] = None
    next_followup_date: Optional[datetime] = None
    status_id: int
    sla_deadline: Optional[datetime] = None
    sla_status: Optional[str] = None


class EnquiryCreate(EnquiryBase):
    pass

class AttachmentData(BaseModel):
    file_name: str
    file_type: str
    base64_data: str
    
class EnquiryResponse(BaseModel):
    id: int
    ticket_no: str

    customer_id: int
    customer_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None

    created_by: Optional[int] = None
    created_by_name: Optional[str] = None

    assigned_to: Optional[int] = None
    assigned_to_name: Optional[str] = None

    status_id: Optional[int] = None
    status_name: Optional[str] = None

    enquiry_details: Optional[str] = None

    # ✅ NEW FIELDS ADDED
    enquiry_source: Optional[str] = None
    next_action_item: Optional[str] = None
    next_followup_date: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None
    sla_status: Optional[str] = None

    created_at: datetime
    attachments: List[AttachmentData] = []
    class Config:
        from_attributes = True



class EnquiryUpdate(BaseModel):
    customer_id: Optional[int] = None
    category_id: Optional[int] = None

    created_by: Optional[int] = None
    assigned_to: Optional[int] = None   # 🔥 REQUIRED FIX

    status_id: Optional[int] = None
    enquiry_details: Optional[str] = None

    enquiry_source: Optional[str] = None
    next_action_item: Optional[str] = None
    next_followup_date: Optional[datetime] = None

    sla_deadline: Optional[datetime] = None
    sla_status: Optional[str] = None
