from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.complaint import ComplaintResponse
from app.schemas.enquiry import EnquiryResponse


class DashboardSummaries(BaseModel):
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int


class DashboardCategoryVolume(BaseModel):
    category_id: int
    category_name: str | None = None
    total: int
    module_type: str


class DashboardRecentTicket(BaseModel):
    id: int
    ticket_no: str
    module_type: str

    category_id: Optional[int]
    category_name: Optional[str]

    customer_id: Optional[int]
    customer_name: Optional[str]

    created_by: Optional[int]
    created_by_name: Optional[str]

    assigned_to: Optional[int]
    assigned_to_name: Optional[str]

    status_id: Optional[int]
    status_name: Optional[str]

    sla_deadline: Optional[datetime]
    sla_status: Optional[str]

    created_at: datetime

class DashboardResponse(BaseModel):
    summaries: DashboardSummaries
    recent_enquiries: list[EnquiryResponse]
    recent_complaints: list[ComplaintResponse]
    volume_by_category: list[DashboardCategoryVolume]
    recent_tickets: list[DashboardRecentTicket]
