from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ComplaintBase(BaseModel):
    ticket_no: str
    category_id: int
    created_by: int
    assigned_to: Optional[int] = None
    order_id: Optional[int] = None
    complaint_source: str
    schedule_booking_time: Optional[datetime] = None
    services_booked: Optional[str] = None
    complaint_details: str
    status_id: int
    priority: str
    sla_deadline: Optional[datetime] = None
    sla_status: Optional[str] = None
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

# In app/schemas/complaint.py

class ComplaintCreate(BaseModel):
    customer_id: int
    category_id: int
    created_by: int
    assigned_to: Optional[int] = None
    order_id: Optional[int] = None
    complaint_source: str
    schedule_booking_time: Optional[datetime] = None
    services_booked: Optional[str] = None
    complaint_details: str
    status_id: int
    priority: str
    sla_deadline: Optional[datetime] = None
    sla_status: Optional[str] = None
    first_response_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    # ticket_no is removed

class ComplaintUpdate(BaseModel):
    assigned_to: Optional[int] = None

    category_id: Optional[int] = None

    complaint_source: Optional[str] = None
    complaint_details: Optional[str] = None

    status_id: Optional[int] = None

    priority: Optional[str] = None

    sla_status: Optional[str] = None
    sla_deadline: Optional[datetime] = None

class ComplaintResponse(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_name: Optional[str] = None