from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.complaint import Complaint
from app.models.attachment import Attachment
from app.models.user import User
from app.models.complaint_category import ComplaintCategory
from app.models.status_master import StatusMaster
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate, ComplaintResponse
from app.api.deps import get_current_user_id, get_db, require_permission    
import json
import random
from app.services.blob_storage import upload_complaint_enquiry_file
from datetime import datetime, timedelta, timezone
from app.utils.get_base64 import get_base64_from_url
from zoneinfo import ZoneInfo   
from app.models.customers import Customer
from datetime import datetime, timezone
from zoneinfo import ZoneInfoNotFoundError
from app.utils.convert_date_to_utc import convert_to_utc

router = APIRouter(prefix="/complaints", tags=["Complaints"])

from datetime import datetime
from typing import Optional
from fastapi import Query

@router.get("/")
def get_all(
    customer_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("complaints", "can_view")),
):

    creator = User.__table__.alias("creator")
    assigned = User.__table__.alias("assigned")
    customer = Customer.__table__.alias("customer")

    query = (
        db.query(
            Complaint,
            customer.c.full_name.label("customer_name"),   # ✅ FIXED
            ComplaintCategory.category_name.label("category_name"),
            creator.c.full_name.label("created_by_name"),
            assigned.c.full_name.label("assigned_to_name"),
            StatusMaster.status_name.label("status_name"),
        )
        .outerjoin(customer, Complaint.customer_id == customer.c.id)   # ✅ IMPORTANT
        .outerjoin(ComplaintCategory, Complaint.category_id == ComplaintCategory.id)
        .outerjoin(creator, Complaint.created_by == creator.c.id)
        .outerjoin(assigned, Complaint.assigned_to == assigned.c.id)
        .outerjoin(StatusMaster, Complaint.status_id == StatusMaster.id)
    )

    query = query.filter(Complaint.is_deleted == False)

    if from_date:
        query = query.filter(Complaint.created_at >= from_date)

    if to_date:
        query = query.filter(Complaint.created_at <= to_date)

    results = query.order_by(Complaint.created_at.desc()).all()

    complaint_ids = [row[0].id for row in results]

    attachments_by_complaint = {}
    if complaint_ids:
        attachments = (
            db.query(Attachment)
            .filter(Attachment.module_type == "complaint")
            .filter(Attachment.module_id.in_(complaint_ids))
            .all()
        )
        for att in attachments:
            attachments_by_complaint.setdefault(att.module_id, []).append(att)

    response = []
    now = datetime.now(timezone.utc)

    for row in results:
        complaint = row[0]

        sla_status = None
        if getattr(complaint, "sla_deadline", None):
            deadline = complaint.sla_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)

            if deadline <= now:
                sla_status = "Breached"
            elif deadline <= now + timedelta(hours=4):
                sla_status = "Approaching"
            else:
                sla_status = "On Track"

        attachments_list = []
        for att in attachments_by_complaint.get(complaint.id, []):
            b64_data = get_base64_from_url(att.file_url)
            if b64_data:
                attachments_list.append({
                    "file_name": att.file_name,
                    "file_type": att.file_type,
                    "base64_data": b64_data,
                })

        response.append({
            "id": complaint.id,
            "ticket_no": complaint.ticket_no,

            "customer_id": complaint.customer_id,
            "customer_name": row.customer_name,   # ✅ FIXED

            "category_id": complaint.category_id,
            "category_name": row.category_name,

            "created_by": complaint.created_by,
            "created_by_name": row.created_by_name,

            "assigned_to": complaint.assigned_to,
            "assigned_to_name": row.assigned_to_name,

            "status_id": complaint.status_id,
            "status_name": row.status_name,

            "complaint_details": complaint.complaint_details,

            "sla_deadline": complaint.sla_deadline,
            "sla_status": sla_status,

            "created_at": complaint.created_at,
            "attachments": attachments_list,
        })

    return response

@router.get("/{id}")
def get_one(
    id: int,
    db: Session = Depends(get_db),
   _user_id: int = Depends(require_permission("complaints", "can_view")),
):

    creator = User.__table__.alias("creator")
    assigned = User.__table__.alias("assigned")
    customer = Customer.__table__.alias("customer")

    obj = (
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
        .outerjoin(customer, Complaint.customer_id == customer.c.id)   # ✅ FIXED
        .outerjoin(ComplaintCategory, Complaint.category_id == ComplaintCategory.id)
        .outerjoin(creator, Complaint.created_by == creator.c.id)
        .outerjoin(assigned, Complaint.assigned_to == assigned.c.id)
        .outerjoin(StatusMaster, Complaint.status_id == StatusMaster.id)
        .filter(Complaint.id == id)
        .first()
    )

    if not obj:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint = obj[0]

    sla_status = None
    if getattr(complaint, "sla_deadline", None):
        deadline = complaint.sla_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)

        if deadline <= now:
            sla_status = "Breached"
        elif deadline <= now + timedelta(hours=4):
            sla_status = "Approaching"
        else:
            sla_status = "On Track"

    attachments_list = []
    attachments = (
        db.query(Attachment)
        .filter(Attachment.module_type == "complaint")
        .filter(Attachment.module_id == complaint.id)
        .all()
    )

    for att in attachments:
        b64_data = get_base64_from_url(att.file_url)
        if b64_data:
            attachments_list.append({
                "file_name": att.file_name,
                "file_type": att.file_type,
                "base64_data": b64_data,
            })

    return {
        "id": complaint.id,
        "ticket_no": complaint.ticket_no,

        "customer_id": complaint.customer_id,
        "customer_name": obj.customer_name,   # ✅ FIXED
        "email": obj.customer_email,
        "phone": obj.customer_phone,
        "category_id": complaint.category_id,
        "category_name": obj.category_name,

        "created_by": complaint.created_by,
        "created_by_name": obj.created_by_name,

        "assigned_to": complaint.assigned_to,
        "assigned_to_name": obj.assigned_to_name,

        "status_id": complaint.status_id,
        "status_name": obj.status_name,

        "complaint_details": complaint.complaint_details,

        "complaint_source": getattr(complaint, "complaint_source", None),
        "sla_deadline": complaint.sla_deadline,
        "sla_status": sla_status,

        "resolved_at": getattr(complaint, "resolved_at", None),
        "closed_at": getattr(complaint, "closed_at", None),

        "created_at": complaint.created_at,
        "attachments": attachments_list,
    }

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create(
    # ---------- Customer fields ----------
    customer_id: Optional[int] = Form(None),
    is_new_customer: int = Form(...),  # 0 = existing, 1 = new

    customer_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),

    # ---------- Complaint fields ----------
    category_id: int = Form(...),
    created_by: int = Form(...),
    assigned_to: Optional[int] = Form(None),
    order_id: Optional[int] = Form(None),
    complaint_source: str = Form(...),
    schedule_booking_time: Optional[datetime] = Form(None),
    services_booked: Optional[str] = Form(None),
    complaint_details: Optional[str] = Form(None),
    status_id: int = Form(...),
    priority: str = Form(...),
    sla_deadline: Optional[datetime] = Form(None),      # will be overridden
    sla_status: Optional[str] = Form(None),             # will be overridden
    first_response_at: Optional[datetime] = Form(None),
    resolved_at: Optional[datetime] = Form(None),
    closed_at: Optional[datetime] = Form(None),

    # ---------- New fields from frontend ----------
    created_at: datetime = Form(...),                   # required
    timezone_str: str = Form("Asia/Calcutta"),          # default if omitted

    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("complaints", "can_create")),
):
    try:
        # ------------------------------------------------------------------
        # 1. Convert all incoming datetimes to UTC using provided timezone
        # ------------------------------------------------------------------
        try:
            created_at_utc = convert_to_utc(created_at, timezone_str)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {timezone_str}")

        schedule_booking_utc = None
        if schedule_booking_time is not None:
            schedule_booking_utc = convert_to_utc(schedule_booking_time, timezone_str)

        first_response_utc = None
        if first_response_at is not None:
            first_response_utc = convert_to_utc(first_response_at, timezone_str)

        resolved_utc = None
        if resolved_at is not None:
            resolved_utc = convert_to_utc(resolved_at, timezone_str)

        closed_utc = None
        if closed_at is not None:
            closed_utc = convert_to_utc(closed_at, timezone_str)

        # ---------------- CUSTOMER HANDLING ----------------
        if is_new_customer == 1:
            if not customer_name:
                raise HTTPException(400, "customer_name is required when is_new_customer = 1")
            if not email:
                raise HTTPException(400, "email is required when is_new_customer = 1")

            customer = Customer(
                full_name=customer_name,
                email=email,
                phone=phone,
                address=address,
                city=city,
                state=state,
                is_new_customer=1
            )
            db.add(customer)
            db.flush()
            customer_id = customer.id
        else:
            if not customer_id:
                raise HTTPException(400, "customer_id is required when is_new_customer = 0")
            existing_customer = db.query(Customer).filter(Customer.id == customer_id).first()
            if not existing_customer:
                raise HTTPException(404, f"Customer with id {customer_id} not found")

        # ---------------- SLA CALCULATION ----------------
        category = db.query(ComplaintCategory).filter(ComplaintCategory.id == category_id).first()
        if not category:
            raise HTTPException(404, f"Category with id {category_id} not found")

        if category.sla_hours is None:
            raise HTTPException(400, f"Complaint category '{category.name}' does not have SLA hours configured.")

        # SLA deadline based on the provided created_at (in UTC)
        sla_deadline_utc = created_at_utc + timedelta(hours=category.sla_hours)
        sla_status = "On Track"   # initial status

        # ---------------- BUILD COMPLAINT DATA ----------------
        complaint_create = ComplaintCreate(
            customer_id=customer_id,
            category_id=category_id,
            created_by=created_by,
            assigned_to=assigned_to,
            order_id=order_id,
            complaint_source=complaint_source,
            schedule_booking_time=schedule_booking_utc,
            services_booked=services_booked,
            complaint_details=complaint_details,
            status_id=status_id,
            priority=priority,
            sla_deadline=sla_deadline_utc,
            sla_status=sla_status,
            first_response_at=first_response_utc,
            resolved_at=resolved_utc,
            closed_at=closed_utc,
        )

        # ---------------- TICKET NUMBER ----------------
        today = datetime.now().strftime("%Y%m%d")
        random_suffix = str(random.randint(100000, 999999))
        ticket_no = f"CMP-{today}-{random_suffix}"
        while db.query(Complaint).filter(Complaint.ticket_no == ticket_no).first():
            random_suffix = str(random.randint(100000, 999999))
            ticket_no = f"CMP-{today}-{random_suffix}"

        # ---------------- CREATE COMPLAINT ----------------
        complaint = Complaint(
            ticket_no=ticket_no,
            created_at=created_at_utc,   # use converted UTC time
            **complaint_create.dict()
        )

        db.add(complaint)
        db.flush()

        # ---------------- FILE UPLOADS ----------------
        if files:
            for file in files:
                try:
                    file_url, display_name, blob_name = upload_complaint_enquiry_file(file)
                except HTTPException as e:
                    db.rollback()
                    raise e
                attachment = Attachment(
                    module_type="complaint",
                    module_id=complaint.id,
                    file_name=display_name,
                    file_url=file_url,
                    file_type=file.content_type,
                    uploaded_by=created_by,
                )
                db.add(attachment)

        db.commit()
        db.refresh(complaint)
        return complaint

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error creating complaint: {str(e)}")


@router.put("/{id}", response_model=ComplaintResponse)
def update(
    id: int,
    # ---------- Optional complaint fields ----------
    category_id: Optional[int] = Form(None),
    assigned_to: Optional[int] = Form(None),
    complaint_source: Optional[str] = Form(None),
    complaint_details: Optional[str] = Form(None),
    status_id: Optional[int] = Form(None),
    priority: Optional[str] = Form(None),
    sla_deadline: Optional[datetime] = Form(None),
    sla_status: Optional[str] = Form(None),
    first_response_at: Optional[datetime] = Form(None),
    resolved_at: Optional[datetime] = Form(None),
    closed_at: Optional[datetime] = Form(None),
    # ---------- Frontend timestamps ----------
    updated_at: Optional[datetime] = Form(None),
    timezone_str: Optional[str] = Form("Asia/Calcutta"),   # default if omitted
    # ---------- Files ----------
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("complaints", "can_edit")),
):
    # 1. Fetch existing complaint
    obj = db.query(Complaint).filter(Complaint.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")

    # 2. Convert datetime fields to UTC if provided (use default timezone)
    try:
        # Convert each optional datetime
        first_response_utc = None
        if first_response_at is not None:
            first_response_utc = convert_to_utc(first_response_at, timezone_str)

        resolved_utc = None
        if resolved_at is not None:
            resolved_utc = convert_to_utc(resolved_at, timezone_str)

        closed_utc = None
        if closed_at is not None:
            closed_utc = convert_to_utc(closed_at, timezone_str)

        sla_deadline_utc = None
        if sla_deadline is not None:
            sla_deadline_utc = convert_to_utc(sla_deadline, timezone_str)

        updated_at_utc = None
        if updated_at is not None:
            updated_at_utc = convert_to_utc(updated_at, timezone_str)
    except ZoneInfoNotFoundError:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {timezone_str}")

    # 3. Build update_data from provided fields (using converted UTC values)
    update_data = {}
    if category_id is not None:
        update_data["category_id"] = category_id
    if assigned_to is not None:
        update_data["assigned_to"] = assigned_to if assigned_to != 0 else None
    if complaint_source is not None:
        update_data["complaint_source"] = complaint_source
    if complaint_details is not None:
        update_data["complaint_details"] = complaint_details
    if status_id is not None:
        update_data["status_id"] = status_id
    if priority is not None:
        update_data["priority"] = priority
    if sla_deadline_utc is not None:
        update_data["sla_deadline"] = sla_deadline_utc
    if sla_status is not None:
        update_data["sla_status"] = sla_status
    if first_response_utc is not None:
        update_data["first_response_at"] = first_response_utc
    if resolved_utc is not None:
        update_data["resolved_at"] = resolved_utc
    if closed_utc is not None:
        update_data["closed_at"] = closed_utc

    # 5. Always set updated_at: either from frontend or current UTC time
    if updated_at_utc is not None:
        update_data["updated_at"] = updated_at_utc
    else:
        # Update timestamp to current UTC time (since this is an update operation)
        update_data["updated_at"] = datetime.utcnow()

    # 6. Apply updates to the object
    for key, value in update_data.items():
        setattr(obj, key, value)

    # 7. File uploads (unchanged)
    if files:
        for file in files:
            try:
                file_url, display_name, blob_name = upload_complaint_enquiry_file(file)
            except HTTPException as e:
                db.rollback()
                raise e
            attachment = Attachment(
                module_type="complaint",
                module_id=obj.id,
                file_name=display_name,
                file_url=file_url,
                file_type=file.content_type,
                uploaded_by=_user_id,
            )
            db.add(attachment)
        db.commit()
        db.refresh(obj)

    db.commit()
    db.refresh(obj)

    # 8. Return response
    return {
        "id": obj.id,
        "ticket_no": obj.ticket_no,
        "customer_id": obj.customer_id,
        "category_id": obj.category_id,
        "category_name": None,
        "created_by": obj.created_by,
        "created_by_name": None,
        "assigned_to": obj.assigned_to,
        "assigned_to_name": None,
        "status_id": obj.status_id,
        "status_name": None,
        "complaint_source": obj.complaint_source,
        "complaint_details": obj.complaint_details,
        "priority": obj.priority,
        "sla_status": obj.sla_status,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
    }

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(id: int, db: Session = Depends(get_db), _user_id: int = Depends(require_permission("complaints", "can_delete")),):
    obj = db.query(Complaint).filter(Complaint.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")
    obj.is_deleted = 1 
    db.commit()
    return

@router.put("/{id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    id: int,
    status_id: int,
    updated_at: Optional[datetime] = Form(None),
    timezone_str: Optional[str] = Form("Asia/Calcutta"),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("complaints", "can_edit")),
):
    obj = db.query(Complaint).filter(Complaint.id == id).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    # Determine updated_at value (UTC)
    if updated_at is not None:
        try:
            updated_at_utc = convert_to_utc(updated_at, timezone_str)
        except ZoneInfoNotFoundError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid timezone: {timezone_str}"
            )
    else:
        # Fallback: current UTC time (naive)
        updated_at_utc = datetime.utcnow()

    # Apply updates
    obj.status_id = status_id
    obj.updated_at = updated_at_utc

    # Get status (if it exists)
    status_obj = (
        db.query(StatusMaster)
        .filter(StatusMaster.id == status_id)
        .first()
    )

    # Update timestamps based on status name
    if status_obj:
        status_name = (status_obj.status_name or "").strip().lower()

        if status_name == "resolved":
            obj.resolved_at = updated_at_utc

        elif status_name == "closed":
            obj.closed_at = updated_at_utc

    db.commit()
    db.refresh(obj)

    return {
        "id": obj.id,
        "ticket_no": obj.ticket_no,
        "customer_name": None,
        "email": None,
        "phone": None,
        "category_id": obj.category_id,
        "category_name": None,
        "created_by": obj.created_by,
        "created_by_name": None,
        "assigned_to": obj.assigned_to,
        "assigned_to_name": None,
        "status_id": obj.status_id,
        "status_name": None,
        "complaint_source": obj.complaint_source,
        "complaint_details": obj.complaint_details,
        "priority": obj.priority,
        "sla_status": obj.sla_status,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
        "resolved_at": obj.resolved_at,
        "closed_at": obj.closed_at,
    }


@router.put("/{id}/assigned-ticket", response_model=ComplaintResponse)
def update_status(
    id: int,
    assigned_to: Optional[int] = Form(None),
    updated_at: Optional[datetime] = Form(None),
    timezone_str: str = Form(...),   # renamed to avoid shadowing
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_edit")),
):
    obj = db.query(Complaint).filter(Complaint.id == id).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found"
        )

    if assigned_to is not None:
        obj.assigned_to = assigned_to if assigned_to != 0 else None

    if updated_at is not None:
        try:
            obj.updated_at = convert_to_utc(updated_at, timezone_str)  # use renamed param
        except ZoneInfoNotFoundError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid timezone: {timezone_str}"
            )
    else:
        # now `timezone` refers to the imported module, not shadowed
        obj.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    db.commit()
    db.refresh(obj)

    return {
        "id": obj.id,
        "ticket_no": obj.ticket_no,
        "customer_id": obj.customer_id,
        "category_id": obj.category_id,
        "category_name": None,
        "created_by": obj.created_by,
        "created_by_name": None,
        "assigned_to": obj.assigned_to,
        "assigned_to_name": None,
        "status_id": obj.status_id,
        "status_name": None,
        "complaint_source": obj.complaint_source,    # added
        "complaint_details": obj.complaint_details,  # added
        "priority": obj.priority,                 
        "enquiry_details": obj.complaint_details,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
    }