from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, literal
from sqlalchemy.orm import Session

from datetime import datetime
from sqlalchemy.orm import Session, aliased
from app.api.deps import get_db, get_current_user_id, require_permission
from app.models.enquiry import Enquiry
from app.models.complaint import Complaint
from app.models.user import User
from app.models.enquiry_category import EnquiryCategory
from app.models.complaint_category import ComplaintCategory
from app.models.status_master import StatusMaster
from app.models.customers import Customer
router = APIRouter(prefix="/reports", tags=["Reports"])


def _validate_date_range(from_date: datetime, to_date: datetime):
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date must be less than or equal to to_date",
        )


@router.get("")
def get_reports(
    from_date: datetime = Query(...),
    to_date: datetime = Query(...),
    type: str = Query(..., description="enquiry | complaint | both"),
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user_id: int = Depends(require_permission("reports", "can_view")),
):
    _validate_date_range(from_date, to_date)
    type = type.lower()

    customer = aliased(Customer)
    assigned_user = aliased(User)
    created_user = aliased(User)

    date_filter_enquiry = and_(
        Enquiry.created_at >= from_date,
        Enquiry.created_at <= to_date,
    )

    date_filter_complaint = and_(
        Complaint.created_at >= from_date,
        Complaint.created_at <= to_date,
    )

    result = {}

    # ---------------- ENQUIRIES ----------------
    if type in ["enquiry", "both"]:
        enquiry_query = (
            db.query(
                Enquiry.ticket_no,
                customer.full_name.label("customer_name"),
                EnquiryCategory.category_name,
                Enquiry.assigned_to,
                assigned_user.full_name.label("assigned_to_name"),
                Enquiry.order_id,
                Enquiry.enquiry_source,
                Enquiry.schedule_booking_time,
                Enquiry.enquiry_details,
                StatusMaster.status_name.label("status_name"),
                Enquiry.status_id,
                Enquiry.sla_deadline,
                Enquiry.sla_status,
                Enquiry.created_at,
                created_user.full_name.label("created_at_name"),
            )
            .outerjoin(EnquiryCategory, Enquiry.category_id == EnquiryCategory.id)
            .outerjoin(customer, Enquiry.customer_id == customer.id)
            .outerjoin(assigned_user, Enquiry.assigned_to == assigned_user.id)
            .outerjoin(created_user, Enquiry.created_by == created_user.id)
            .outerjoin(StatusMaster, Enquiry.status_id == StatusMaster.id)
            .filter(
                Enquiry.created_at >= from_date,
                Enquiry.created_at <= to_date,
            )
        )

        if category_id:
            enquiry_query = enquiry_query.filter(Enquiry.category_id == category_id)

        enquiries_rows = enquiry_query.order_by(Enquiry.created_at.desc()).all()

        result["enquiries"] = [
            {
                "ticket_no": r.ticket_no,
                "customer_name": r.customer_name,
                "category_name": r.category_name,
                "assigned_to": r.assigned_to,
                "assigned_to_name": r.assigned_to_name,
                "order_id": r.order_id,
                "enquiry_source": r.enquiry_source,
                "schedule_booking_time": r.schedule_booking_time,
                "enquiry_details": r.enquiry_details,
                "status": r.status_id,
                "status_name": r.status_name,
                "sla_deadline": r.sla_deadline,
                "sla_status": r.sla_status,
                "created_at": r.created_at,
                "created_at_name": r.created_at_name,
            }
            for r in enquiries_rows
        ]

    # ---------------- COMPLAINTS ----------------
    if type in ["complaint", "both"]:
        complaint_query = (
            db.query(
                Complaint.ticket_no,
                customer.full_name.label("customer_name"),
                ComplaintCategory.category_name,
                assigned_user.full_name.label("assigned_to_name"),
                Complaint.assigned_to,
                Complaint.order_id,
                Complaint.complaint_source,
                Complaint.schedule_booking_time,
                Complaint.complaint_details,
                StatusMaster.status_name.label("status_name"),
                Complaint.status_id,
                Complaint.priority,
                Complaint.sla_deadline,
                Complaint.sla_status,
                Complaint.first_response_at,
                Complaint.resolved_at,
                Complaint.closed_at,
                Complaint.created_at,
                created_user.full_name.label("created_at_name"),    
            )
            .outerjoin(ComplaintCategory, Complaint.category_id == ComplaintCategory.id)
            .outerjoin(customer, Complaint.customer_id == customer.id)   # fixed: Complaint.customer_id
            .outerjoin(assigned_user, Complaint.assigned_to == assigned_user.id)
            .outerjoin(created_user, Complaint.created_by == created_user.id)
            .outerjoin(StatusMaster, Complaint.status_id == StatusMaster.id)
            .filter(
                Complaint.created_at >= from_date,
                Complaint.created_at <= to_date,
            )
        )

        if category_id:
            complaint_query = complaint_query.filter(Complaint.category_id == category_id)

        complaints_rows = complaint_query.order_by(Complaint.created_at.desc()).all()

        result["complaints"] = [
            {
                "ticket_no": r.ticket_no,
                "customer_name": r.customer_name,
                "assigned_to_name": r.assigned_to_name,
                "category_name": r.category_name,
                "assigned_to": r.assigned_to,
                "order_id": r.order_id,
                "complaint_source": r.complaint_source,
                "schedule_booking_time": r.schedule_booking_time,
                "complaint_details": r.complaint_details,
                 "status_name": r.status_name,
                "status": r.status_id,
                "priority": r.priority,
                "sla_deadline": r.sla_deadline,
                "sla_status": r.sla_status,
                "first_response_at": r.first_response_at,
                "resolved_at": r.resolved_at,
                "closed_at": r.closed_at,
                "created_at": r.created_at,
                "created_at_name": r.created_at_name,
            }
            for r in complaints_rows
        ]

    return result