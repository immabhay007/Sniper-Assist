from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, literal, select, union_all
from sqlalchemy.orm import Session
from app.models.customers import Customer
from app.models.user import User
from app.utils.get_sla_status import get_sla_status
from app.api.deps import get_current_user_id, get_db, require_permission

from app.models.complaint import Complaint
from app.models.enquiry import Enquiry
from app.models.status_master import StatusMaster
from app.models.customers import Customer

from app.schemas.dashboard import (
    DashboardCategoryVolume,
    DashboardRecentTicket,
    DashboardResponse,
    DashboardSummaries,
)

from app.models.complaint_category import ComplaintCategory
from app.models.enquiry_category import EnquiryCategory
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, literal, select, union_all
from sqlalchemy.orm import Session

from app.models.customers import Customer
from app.models.user import User
from app.utils.get_sla_status import get_sla_status
from app.api.deps import get_current_user_id, get_db
from app.models.complaint import Complaint
from app.models.enquiry import Enquiry
from app.models.status_master import StatusMaster
from app.models.customers import Customer
from app.schemas.dashboard import (
    DashboardCategoryVolume,
    DashboardRecentTicket,
    DashboardResponse,
    DashboardSummaries,
)
from app.models.complaint_category import ComplaintCategory
from app.models.enquiry_category import EnquiryCategory


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def _validate_date_range(from_date: datetime, to_date: datetime) -> None:
    if from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="from_date must be less than or equal to to_date",
        )

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    from_date: datetime = Query(...),
    to_date: datetime = Query(...),
    db: Session = Depends(get_db),
    user_id: int = Depends(require_permission("dashboard", "can_view")),
):
    _validate_date_range(from_date, to_date)

    customer = Customer.__table__.alias("customer")
    created_user = User.__table__.alias("created_user")
    assigned_user = User.__table__.alias("assigned_user")

    # Date filters + exclude deleted records
    enquiry_date_filter = [
        Enquiry.created_at >= from_date,
        Enquiry.created_at <= to_date,
        Enquiry.is_deleted == False,          # <-- ADDED
    ]

    complaint_date_filter = [
        Complaint.created_at >= from_date,
        Complaint.created_at <= to_date,
        Complaint.is_deleted == False,        # <-- ADDED
    ]

    # ---------------- SUMMARY ----------------
    tickets_union = union_all(
        select(Enquiry.status_id.label("status_id")).where(*enquiry_date_filter),
        select(Complaint.status_id.label("status_id")).where(*complaint_date_filter),
    ).subquery()

    # Join with StatusMaster to get status names
    status_joined = (
        select(tickets_union.c.status_id, StatusMaster.status_name)
        .select_from(tickets_union)
        .join(StatusMaster, tickets_union.c.status_id == StatusMaster.id)
    ).subquery()

    summaries_row = (
        db.query(
            func.sum(case((status_joined.c.status_name == 'Open', 1), else_=0)).label("open_tickets"),
            func.sum(case((status_joined.c.status_name == 'In Progress', 1), else_=0)).label("in_progress_tickets"),
            func.sum(case((status_joined.c.status_name == 'Resolved', 1), else_=0)).label("resolved_tickets"),
            func.sum(case((status_joined.c.status_name == 'Closed', 1), else_=0)).label("closed_tickets"),
        )
        .one()
    )

    summaries = DashboardSummaries(
        open_tickets=int(summaries_row[0] or 0),
        in_progress_tickets=int(summaries_row[1] or 0),
        resolved_tickets=int(summaries_row[2] or 0),
        closed_tickets=int(summaries_row[3] or 0),
    )

    # ---------------- RECENT ENQUIRIES ----------------
    # Already includes is_deleted filter via enquiry_date_filter
    recent_enquiries_rows = (
        db.query(
            Enquiry,
            customer.c.full_name.label("customer_name"),
            EnquiryCategory.category_name.label("category_name"),
            StatusMaster.status_name.label("status_name"),
        )
        .outerjoin(customer, Enquiry.customer_id == customer.c.id)
        .outerjoin(EnquiryCategory, Enquiry.category_id == EnquiryCategory.id)
        .outerjoin(StatusMaster, Enquiry.status_id == StatusMaster.id)
        .filter(*enquiry_date_filter)
        .order_by(Enquiry.id.desc())
        .limit(10)
        .all()
    )

    recent_enquiries = [
        {
            "id": row[0].id,
            "ticket_no": row[0].ticket_no,
            "customer_id": row[0].customer_id,
            "customer_name": row.customer_name,
            "category_id": row[0].category_id,
            "category_name": row.category_name,
            "created_by": row[0].created_by,
            "created_by_name": None,
            "assigned_to": row[0].assigned_to,
            "assigned_to_name": None,
            "status_id": row[0].status_id,
            "status_name": row.status_name,
            "enquiry_details": row[0].enquiry_details,
            "created_at": row[0].created_at,
            "sla_status": (
                get_sla_status(
                    sla_deadline=row[0].sla_deadline,
                    created_at=row[0].created_at,
                )
                if row[0].sla_deadline
                else None
            ),
        }
        for row in recent_enquiries_rows
    ]

    # ---------------- RECENT COMPLAINTS ----------------
    # Already includes is_deleted filter via complaint_date_filter
    recent_complaints_rows = (
        db.query(
            Complaint,
            customer.c.full_name.label("customer_name"),
            ComplaintCategory.category_name.label("category_name"),
            StatusMaster.status_name.label("status_name"),
        )
        .outerjoin(customer, Complaint.customer_id == customer.c.id)
        .outerjoin(ComplaintCategory, Complaint.category_id == ComplaintCategory.id)
        .outerjoin(StatusMaster, Complaint.status_id == StatusMaster.id)
        .filter(*complaint_date_filter)
        .order_by(Complaint.id.desc())
        .limit(10)
        .all()
    )

    recent_complaints = [
        {
            "id": row[0].id,
            "ticket_no": row[0].ticket_no,
            "customer_id": row[0].customer_id,
            "customer_name": row.customer_name,
            "category_id": row[0].category_id,
            "category_name": row.category_name,
            "created_by": row[0].created_by,
            "created_by_name": None,
            "assigned_to": row[0].assigned_to,
            "assigned_to_name": None,
            "status_id": row[0].status_id,
            "status_name": row.status_name,
            "complaint_details": row[0].complaint_details,
            "created_at": row[0].created_at,
            "sla_status": (
                get_sla_status(
                    sla_deadline=row[0].sla_deadline,
                    created_at=row[0].created_at,
                )
                if row[0].sla_deadline
                else None
            ),
            "complaint_source": row[0].complaint_source,
            "priority": row[0].priority,
            "updated_at": row[0].updated_at,
        }
        for row in recent_complaints_rows
    ]

    # ---------------- CATEGORY VOLUME ----------------
    # Add is_deleted filters inside each union select
    volume_union = union_all(
        select(
            Enquiry.category_id.label("category_id"),
            EnquiryCategory.category_name.label("category_name"),
            literal("Enquiry").label("module_type"),
        )
        .join(EnquiryCategory, EnquiryCategory.id == Enquiry.category_id, isouter=True)
        .where(
            Enquiry.created_at >= from_date,
            Enquiry.created_at <= to_date,
            Enquiry.is_deleted == False,      # <-- ADDED
        ),

        select(
            Complaint.category_id.label("category_id"),
            ComplaintCategory.category_name.label("category_name"),
            literal("Complaint").label("module_type"),
        )
        .join(ComplaintCategory, ComplaintCategory.id == Complaint.category_id, isouter=True)
        .where(
            Complaint.created_at >= from_date,
            Complaint.created_at <= to_date,
            Complaint.is_deleted == False,    # <-- ADDED
        ),
    ).subquery()

    volume_rows = (
        db.query(
            volume_union.c.category_id,
            volume_union.c.category_name,
            volume_union.c.module_type,
            func.count().label("total"),
        )
        .group_by(
            volume_union.c.category_id,
            volume_union.c.category_name,
            volume_union.c.module_type,
        )
        .all()
    )

    volume_by_category = [
        DashboardCategoryVolume(
            category_id=row.category_id,
            category_name=row.category_name,
            total=row.total,
            module_type=row.module_type,
        )
        for row in volume_rows
        if row.category_id is not None
    ]

    # ---------------- RECENT TICKETS ----------------
    # Add is_deleted filters in both branches of the union
    recent_tickets_union = union_all(
        select(
            Enquiry.id.label("id"),
            Enquiry.ticket_no.label("ticket_no"),
            Enquiry.customer_id.label("customer_id"),
            Enquiry.category_id.label("category_id"),
            Enquiry.created_by.label("created_by"),
            Enquiry.assigned_to.label("assigned_to"),
            Enquiry.status_id.label("status_id"),
            Enquiry.sla_deadline.label("sla_deadline"),
            Enquiry.created_at.label("created_at"),
            EnquiryCategory.category_name.label("category_name"),
            literal("Enquiry").label("module_type"),
        )
        .outerjoin(EnquiryCategory, EnquiryCategory.id == Enquiry.category_id)
        .where(
            Enquiry.created_at >= from_date,
            Enquiry.created_at <= to_date,
            Enquiry.is_deleted == False,      # <-- ADDED
        ),

        select(
            Complaint.id.label("id"),
            Complaint.ticket_no.label("ticket_no"),
            Complaint.customer_id.label("customer_id"),
            Complaint.category_id.label("category_id"),
            Complaint.created_by.label("created_by"),
            Complaint.assigned_to.label("assigned_to"),
            Complaint.status_id.label("status_id"),
            Complaint.sla_deadline.label("sla_deadline"),
            Complaint.created_at.label("created_at"),
            ComplaintCategory.category_name.label("category_name"),
            literal("Complaint").label("module_type"),
        )
        .outerjoin(ComplaintCategory, ComplaintCategory.id == Complaint.category_id)
        .where(
            Complaint.created_at >= from_date,
            Complaint.created_at <= to_date,
            Complaint.is_deleted == False,    # <-- ADDED
        ),
    ).subquery()

    recent_tickets_rows = (
        db.query(
            recent_tickets_union.c.id,
            recent_tickets_union.c.ticket_no,
            recent_tickets_union.c.module_type,
            recent_tickets_union.c.category_id,
            recent_tickets_union.c.category_name,
            recent_tickets_union.c.customer_id,
            customer.c.full_name.label("customer_name"),
            recent_tickets_union.c.created_by,
            created_user.c.full_name.label("created_by_name"),
            recent_tickets_union.c.assigned_to,
            assigned_user.c.full_name.label("assigned_to_name"),
            recent_tickets_union.c.status_id,
            StatusMaster.status_name,
            recent_tickets_union.c.sla_deadline,
            recent_tickets_union.c.created_at,
        )
        .outerjoin(customer, customer.c.id == recent_tickets_union.c.customer_id)
        .outerjoin(created_user, created_user.c.id == recent_tickets_union.c.created_by)
        .outerjoin(assigned_user, assigned_user.c.id == recent_tickets_union.c.assigned_to)
        .outerjoin(StatusMaster, StatusMaster.id == recent_tickets_union.c.status_id)
        .order_by(recent_tickets_union.c.created_at.desc())
        .limit(10)
        .all()
    )

    recent_tickets = [
        {
            "id": row.id,
            "ticket_no": row.ticket_no,
            "module_type": row.module_type,
            "category_id": row.category_id,
            "category_name": row.category_name,
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "created_by": row.created_by,
            "created_by_name": row.created_by_name,
            "assigned_to": row.assigned_to,
            "assigned_to_name": row.assigned_to_name,
            "status_id": row.status_id,
            "status_name": row.status_name,
            "sla_deadline": row.sla_deadline,
            "sla_status": (
                get_sla_status(
                    sla_deadline=row.sla_deadline,
                    created_at=row.created_at,
                )
                if row.sla_deadline
                else None
            ),
            "created_at": row.created_at,
        }
        for row in recent_tickets_rows
    ]

    # ---------------- FINAL RESPONSE ----------------
    return DashboardResponse(
        summaries=summaries,
        recent_enquiries=recent_enquiries,
        recent_complaints=recent_complaints,
        volume_by_category=volume_by_category,
        recent_tickets=recent_tickets,
    )