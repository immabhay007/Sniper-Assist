from datetime import datetime
from typing import List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.ticket_note import TicketNote
from app.models.enquiry import Enquiry
from app.models.complaint import Complaint
from app.models.user import User
from app.models.customers import Customer
from app.models.enquiry_category import EnquiryCategory
from app.models.complaint_category import ComplaintCategory
from app.models.status_master import StatusMaster
from app.api.deps import get_db
from app.models.ticket_note import TicketNote
from app.schemas.ticket_note import (
    TicketNoteCreate,
    TicketNoteUpdate,
    TicketNoteResponse,
)
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional
from app.utils.convert_date_to_utc import convert_to_utc
from datetime import datetime
from zoneinfo import ZoneInfoNotFoundError
from fastapi import Query
from sqlalchemy import case, and_
from sqlalchemy.orm import aliased

def ist_now() -> datetime:
    return datetime.now(ZoneInfo("Asia/Kolkata")).replace(tzinfo=None)

router = APIRouter(
    prefix="/ticket-notes",
    tags=["Ticket Notes"],
)

def update_parent_ticket(
    db: Session,
    module_type: str,
    module_id: int,
    next_action_item: Optional[str] = None,
    status_id: Optional[int] = None,
) -> None:
    """Update the parent Enquiry or Complaint record."""
    if module_type == "Enquiry":
        parent = db.query(Enquiry).filter(Enquiry.id == module_id).first()
    elif module_type == "Complaint":
        parent = db.query(Complaint).filter(Complaint.id == module_id).first()
    else:
        return  # unknown type, ignore

    if not parent:
        raise HTTPException(
            status_code=404,
            detail=f"{module_type} with id {module_id} not found"
        )

    if next_action_item is not None:
        parent.next_action_item = next_action_item
    if status_id is not None:
        parent.status_id = status_id

@router.get("/{ticket_no}")
def get_ticket_details(
    ticket_no: str,
    db: Session = Depends(get_db),
):
    creator = User.__table__.alias("creator")
    assigned = User.__table__.alias("assigned")
    customer = Customer.__table__.alias("customer")

    # =====================================================
    # TRY ENQUIRY
    # =====================================================
    enquiry = (
        db.query(
            Enquiry,
            customer.c.full_name.label("customer_name"),
            customer.c.email.label("customer_email"),
            customer.c.phone.label("customer_phone"),
            EnquiryCategory.category_name.label("category_name"),
            creator.c.full_name.label("created_by_name"),
            assigned.c.full_name.label("assigned_to_name"),
            StatusMaster.status_name.label("status_name"),
        )
        .outerjoin(customer, Enquiry.customer_id == customer.c.id)
        .outerjoin(
            EnquiryCategory,
            Enquiry.category_id == EnquiryCategory.id,
        )
        .outerjoin(
            creator,
            Enquiry.created_by == creator.c.id,
        )
        .outerjoin(
            assigned,
            Enquiry.assigned_to == assigned.c.id,
        )
        .outerjoin(
            StatusMaster,
            Enquiry.status_id == StatusMaster.id,
        )
        .filter(Enquiry.ticket_no == ticket_no)
        .first()
    )

    if enquiry:
        e = enquiry[0]

        now = datetime.now(timezone.utc)

        sla_status = None

        if e.sla_deadline:
            deadline = e.sla_deadline

            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)

            if deadline <= now:
                sla_status = "Breached"
            elif deadline <= now + timedelta(hours=4):
                sla_status = "Approaching"
            else:
                sla_status = "On Track"

        return {
            "ticket_type": "Enquiry",
            "ticket_no": e.ticket_no,
            "module_id": e.id,
            "customer_name": enquiry.customer_name,
            "customer_email": enquiry.customer_email,
            "customer_phone": enquiry.customer_phone,

            "category_name": enquiry.category_name,

            "created_by_name": enquiry.created_by_name,
            "assigned_to_name": enquiry.assigned_to_name,
            "assigned_to": e.assigned_to,

            "status_id": e.status_id,
            "status_name": enquiry.status_name,

            "enquiry_source": e.enquiry_source,
            "schedule_booking_time": e.schedule_booking_time,
            "services_booked": e.services_booked,
            "enquiry_details": e.enquiry_details,
            "next_action_item": e.next_action_item,
            "next_followup_date": e.next_followup_date,
            "sla_deadline": e.sla_deadline,
            "sla_status": sla_status,
            "created_at": e.created_at,
        }

    # =====================================================
    # TRY COMPLAINT
    # =====================================================
    complaint = (
        db.query(
            Complaint,
            customer.c.full_name.label("customer_name"),
            customer.c.email.label("customer_email"),
            customer.c.phone.label("customer_phone"),
            ComplaintCategory.category_name.label("category_name"),
            creator.c.full_name.label("created_by_name"),
            assigned.c.full_name.label("assigned_to_name"),
            StatusMaster.status_name.label("status_name"),
        )
        .outerjoin(customer, Complaint.customer_id == customer.c.id)
        .outerjoin(
            ComplaintCategory,
            Complaint.category_id == ComplaintCategory.id,
        )
        .outerjoin(
            creator,
            Complaint.created_by == creator.c.id,
        )
        .outerjoin(
            assigned,
            Complaint.assigned_to == assigned.c.id,
        )
        .outerjoin(
            StatusMaster,
            Complaint.status_id == StatusMaster.id,
        )
        .filter(Complaint.ticket_no == ticket_no)
        .first()
    )

    if complaint:
        c = complaint[0]

        now = datetime.now(timezone.utc)

        sla_status = None

        if c.sla_deadline:
            deadline = c.sla_deadline

            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)

            if deadline <= now:
                sla_status = "Breached"
            elif deadline <= now + timedelta(hours=4):
                sla_status = "Approaching"
            else:
                sla_status = "On Track"

        return {
            "ticket_type": "Complaint",
            "ticket_no": c.ticket_no,
            "module_id":c.id,

            "customer_name": complaint.customer_name,
            "customer_email": complaint.customer_email,
            "customer_phone": complaint.customer_phone,

            "category_name": complaint.category_name,

            "created_by_name": complaint.created_by_name,
            "assigned_to_name": complaint.assigned_to_name,
            "assigned_to": c.assigned_to,
            "status_id": c.status_id,
            "status_name": complaint.status_name,

            "complaint_source": c.complaint_source,
            "schedule_booking_time": c.schedule_booking_time,
            "services_booked": c.services_booked,
            "complaint_details": c.complaint_details,
            "priority": c.priority,
            "sla_deadline": c.sla_deadline,
            "sla_status": sla_status,
            "resolved_at": c.resolved_at,
            "closed_at": c.closed_at,
            "created_at": c.created_at,
        }

    raise HTTPException(
        status_code=404,
        detail="Ticket not found",
    )

# ==========================================================
# CREATE
# ==========================================================

@router.post("", response_model=TicketNoteResponse)
def create_ticket_note(
    payload: TicketNoteCreate,
    created_at: Optional[datetime] = Query(None),
    timezone_str: Optional[str] = Query("Asia/Calcutta"),
    db: Session = Depends(get_db),
):
    # Determine the note's creation timestamp in UTC
    if created_at is not None:
        try:
            now_utc = convert_to_utc(created_at, timezone_str)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {timezone_str}")
    else:
        now_utc = datetime.utcnow()   # naive UTC

    note = TicketNote(
        ticket_no=payload.ticket_no,
        module_type=payload.module_type,
        module_id=payload.module_id,
        note_text=payload.note_text,
        assigned_to=payload.assigned_to or None,
        created_by=payload.created_by,
        status_id=payload.status_id or None,
        is_deleted=False,
        created_at=now_utc,
        updated_at=None,
    )
    db.add(note)

    # Update parent ticket if next_action_item or status_id is provided
    if payload.next_action_item is not None or payload.status_id is not None:
        update_parent_ticket(
            db,
            module_type=payload.module_type,
            module_id=payload.module_id,
            next_action_item=payload.next_action_item,
            status_id=payload.status_id,
        )

    db.commit()
    db.refresh(note)
    return note

# ==========================================================
# UPDATE
# ==========================================================

@router.put("/{id}", response_model=TicketNoteResponse)
def update_ticket_note(
    id: int,
    payload: TicketNoteUpdate,
    updated_at: Optional[datetime] = Query(None),
    timezone_str: Optional[str] = Query("Asia/Calcutta"),
    db: Session = Depends(get_db),
):
    note = (
        db.query(TicketNote)
        .filter(TicketNote.id == id, TicketNote.is_deleted == False)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Ticket note not found")

    # Determine updated_at in UTC
    if updated_at is not None:
        try:
            updated_at_utc = convert_to_utc(updated_at, timezone_str)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {timezone_str}")
    else:
        updated_at_utc = datetime.utcnow()

    # Update note fields
    update_data = payload.model_dump(exclude_unset=True)
    update_data["assigned_to"] = update_data.get("assigned_to") or None
    update_data["status_id"] = update_data.get("status_id") or None

    # next_action_item is handled separately (not stored on TicketNote)
    next_action_item = update_data.pop("next_action_item", None)

    for key, value in update_data.items():
        setattr(note, key, value)

    note.updated_at = updated_at_utc

    # Update parent ticket if next_action_item or status_id is provided
    if next_action_item is not None or payload.status_id is not None:
        update_parent_ticket(
            db,
            module_type=note.module_type,
            module_id=note.module_id,
            next_action_item=next_action_item,
            status_id=payload.status_id,  # status_id may be in payload
        )

    db.commit()
    db.refresh(note)
    return note

# ==========================================================
# SOFT DELETE
# ==========================================================

@router.delete("/{id}")
def delete_ticket_note(
    id: int,
    db: Session = Depends(get_db),
):
    note = (
        db.query(TicketNote)
        .filter(
            TicketNote.id == id,
            TicketNote.is_deleted == False,
        )
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Ticket note not found",
        )

    note.is_deleted = True
    note.updated_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": "Ticket note deleted successfully",
    }


@router.get("/notes/{ticket_no}")
def get_ticket_notes_by_ticket_no(
    ticket_no: str,
    db: Session = Depends(get_db),
):
    note_creator = User.__table__.alias("note_creator")
    note_updater = User.__table__.alias("note_updater")

    enquiry = Enquiry.__table__.alias("enquiry")
    complaint = Complaint.__table__.alias("complaint")
    
    notes = (
        db.query(
            TicketNote,
            note_creator.c.full_name.label("note_created_by"),
            note_updater.c.full_name.label("note_updated_by"),
            case(
                (TicketNote.module_type == "enquiry", enquiry.c.next_action_item),
                (TicketNote.module_type == "complaint", complaint.c.next_action_item),
                else_=None
            ).label("next_action_item")
        )
        .outerjoin(
            note_creator,
            TicketNote.created_by == note_creator.c.id,
        )
        .outerjoin(
            note_updater,
            TicketNote.updated_by == note_updater.c.id,
        )
        .outerjoin(
            enquiry,
            and_(
                TicketNote.module_id == enquiry.c.id,
                TicketNote.module_type == "enquiry"
            )
        )
        .outerjoin(
            complaint,
            and_(
                TicketNote.module_id == complaint.c.id,
                TicketNote.module_type == "complaint"
            )
        )
        .filter(
            TicketNote.ticket_no == ticket_no,
            TicketNote.is_deleted == False,
        )
        .order_by(TicketNote.created_at.desc())
        .all()
    )

    response = []

    for row in notes:
        note = row[0]
        next_action = row.next_action_item 
        response.append(
            {
                "id": note.id,
                "ticket_no": note.ticket_no,
                "module_type": note.module_type,
                "module_id": note.module_id,
                "note_text": note.note_text,

                "assigned_to": note.assigned_to,

                "created_by": note.created_by,
                "note_created_by": row.note_created_by,

                "updated_by": note.updated_by,
                "note_updated_by": row.note_updated_by,

                "status_id": note.status_id,

                "created_at": note.created_at,
                "updated_at": note.updated_at,
                "next_action_item": next_action
            }
        )

    return response
