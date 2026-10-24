from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.enquiry import Enquiry
from app.models.user import User
from app.models.enquiry_category import EnquiryCategory
from app.models.status_master import StatusMaster
from datetime import datetime, timezone
from app.schemas.enquiry import EnquiryCreate, EnquiryUpdate, EnquiryResponse
from app.api.deps import get_current_user_id, get_db, require_permission   
from app.utils.get_base64 import get_base64_from_url
from zoneinfo import ZoneInfo   
from app.models.customers import Customer
from datetime import datetime, timezone
from zoneinfo import ZoneInfoNotFoundError
from app.utils.convert_date_to_utc import convert_to_utc

router = APIRouter(prefix="/enquiries", tags=["Enquiries"])

import random
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Query
from app.services.blob_storage import upload_complaint_enquiry_file
from app.models.attachment import Attachment
now = datetime.now(timezone.utc)

@router.get("/", response_model=List[EnquiryResponse])
def get_all(
    customer_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    to_date: Optional[datetime] = Query(None, description="End date (ISO format)"),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_view")),
):
    # aliases for multiple joins on users table
    creator = User.__table__.alias("creator")
    assigned = User.__table__.alias("assigned")
    customer = Customer.__table__.alias("customer")

    query = (
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
        .outerjoin(EnquiryCategory, Enquiry.category_id == EnquiryCategory.id)
        .outerjoin(creator, Enquiry.created_by == creator.c.id)
        .outerjoin(assigned, Enquiry.assigned_to == assigned.c.id)
        .outerjoin(StatusMaster, Enquiry.status_id == StatusMaster.id)
    )

    query = query.filter(Enquiry.is_deleted == False)

    # filters
    if customer_id and customer_id != 0:
        query = query.filter(Enquiry.customer_id == customer_id)

    if from_date:
        query = query.filter(Enquiry.created_at >= from_date)

    if to_date:
        query = query.filter(Enquiry.created_at <= to_date)

    results = query.order_by(Enquiry.created_at.desc()).all()

    # --- Fetch attachments for all enquiries in one go ---
    enquiry_ids = [row[0].id for row in results]
    attachments_by_enquiry = {}
    if enquiry_ids:
        attachments = (
            db.query(Attachment)
            .filter(Attachment.module_type == "enquiry")
            .filter(Attachment.module_id.in_(enquiry_ids))
            .all()
        )
        for att in attachments:
            attachments_by_enquiry.setdefault(att.module_id, []).append(att)

    # Build response
    response = []

    for row in results:
        enquiry = row[0]

        # Get attachments for this enquiry
        attachments_list = []
        for att in attachments_by_enquiry.get(enquiry.id, []):
            b64_data = get_base64_from_url(att.file_url)
            if b64_data:
                attachments_list.append({
                    "file_name": att.file_name,
                    "file_type": att.file_type,
                    "base64_data": b64_data,
                })

        response.append({
            "id": enquiry.id,
            "ticket_no": enquiry.ticket_no,
            "customer_id": enquiry.customer_id,
            "customer_name": row.customer_name,
            "category_id": enquiry.category_id,
            "category_name": row.category_name,
            "created_by": enquiry.created_by,
            "created_by_name": row.created_by_name,
            "assigned_to": enquiry.assigned_to,
            "assigned_to_name": row.assigned_to_name,
            "status_id": enquiry.status_id,
            "status_name": row.status_name,
            "sla_deadline": enquiry.sla_deadline,   # returned as-is
            "enquiry_details": enquiry.enquiry_details,
            "created_at": enquiry.created_at,       # returned as-is
            "attachments": attachments_list,
        })

    return response

@router.get("/{id}", response_model=EnquiryResponse)
def get_one(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_view")),
):

    creator = User.__table__.alias("creator")
    assigned = User.__table__.alias("assigned")
    customer = Customer.__table__.alias("customer")

    obj = (
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
            Enquiry.category_id == EnquiryCategory.id
        )

        .outerjoin(
            creator,
            Enquiry.created_by == creator.c.id
        )

        .outerjoin(
            assigned,
            Enquiry.assigned_to == assigned.c.id
        )

        .outerjoin(
            StatusMaster,
            Enquiry.status_id == StatusMaster.id
        )

        .filter(Enquiry.id == id)
        .first()
    )

    if not obj:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    enquiry = obj[0]

    # SLA Status Calculation
    sla_status = None

    if enquiry.sla_deadline:
        deadline = enquiry.sla_deadline

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
        .filter(Attachment.module_type == "enquiry")
        .filter(Attachment.module_id == enquiry.id)
        .all()
    )
    for att in attachments:
        b64_data = get_base64_from_url(att.file_url)   # ✅ using your utility
        if b64_data:
            attachments_list.append({
                "file_name": att.file_name,
                "file_type": att.file_type,
                "base64_data": b64_data,
            })

    return {
        "id": enquiry.id,
        "ticket_no": enquiry.ticket_no,

        "customer_id": enquiry.customer_id,
        "customer_name": obj.customer_name,
        "email": obj.customer_email,
        "phone": obj.customer_phone,
        "category_id": enquiry.category_id,
        "category_name": obj.category_name,

        "created_by": enquiry.created_by,
        "created_by_name": obj.created_by_name,

        "assigned_to": enquiry.assigned_to,
        "assigned_to_name": obj.assigned_to_name,

        "status_id": enquiry.status_id,
        "status_name": obj.status_name,

        "enquiry_details": enquiry.enquiry_details,

        "enquiry_source": enquiry.enquiry_source,
        "next_action_item": enquiry.next_action_item,
        "next_followup_date": enquiry.next_followup_date,

        "sla_deadline": enquiry.sla_deadline,
        "sla_status": sla_status,

        "created_at": enquiry.created_at,
        "attachments": attachments_list,   # new field
    }

@router.post("/", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_enquiry(
    # ---------------- Customer fields ----------------
    customer_id: Optional[int] = Form(None),
    is_new_customer: int = Form(...),  # 0 = existing, 1 = new

    customer_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    state: Optional[str] = Form(None),

    # ---------------- Enquiry fields ----------------
    category_id: int = Form(...),
    created_by: int = Form(...),
    assigned_to: Optional[int] = Form(None),
    order_id: Optional[int] = Form(None),
    enquiry_source: str = Form(...),
    schedule_booking_time: Optional[datetime] = Form(None),
    services_booked: Optional[str] = Form(None),
    enquiry_details: str = Form(...),
    status_id: int = Form(...),

    sla_deadline: Optional[datetime] = Form(None),
    sla_status: Optional[str] = Form(None),
    first_response_at: Optional[datetime] = Form(None),
    resolved_at: Optional[datetime] = Form(None),
    closed_at: Optional[datetime] = Form(None),

    # ---------------- Frontend provided timestamps ----------------
    created_at: datetime = Form(...),                     # required
    timezone_str: str = Form("Asia/Calcutta"),            # default if omitted

    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_create")),
):
    try:
        # Convert all incoming datetimes to UTC using the provided (or default) timezone
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

        # ---------------- Customer Handling ----------------
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
            customer_name = existing_customer.full_name

        # ---------------- SLA fallback ----------------
        category = db.query(EnquiryCategory).filter(EnquiryCategory.id == category_id).first()
        if not category:
            raise HTTPException(404, f"Category with id {category_id} not found")

        sla_hours = category.sla_hours if category.sla_hours is not None else 48
        sla_deadline_utc = created_at_utc + timedelta(hours=sla_hours)
        sla_status = "On Track"

        print("=" * 60)
        print("Incoming created_at:", created_at)
        print("Timezone:", timezone_str)
        print("created_at_utc:", created_at_utc)
        print("SLA hours:", sla_hours)
        print("sla_deadline_utc:", sla_deadline_utc)
        print("=" * 60)

        # ---------------- Build Enquiry Data ----------------
        enquiry_data = EnquiryCreate(
            customer_id=customer_id,
            category_id=category_id,
            created_by=created_by,
            assigned_to=assigned_to,
            order_id=order_id,
            enquiry_source=enquiry_source,
            schedule_booking_time=schedule_booking_utc,
            services_booked=services_booked,
            enquiry_details=enquiry_details,
            status_id=status_id,
            sla_deadline=sla_deadline_utc,
            sla_status=sla_status,
            first_response_at=first_response_utc,
            resolved_at=resolved_utc,
            closed_at=closed_utc,
        )

        # ---------------- Ticket Generation ----------------
        today = datetime.now().strftime("%Y%m%d")
        random_suffix = str(random.randint(100000, 999999))
        ticket_no = f"ENQ-{today}-{random_suffix}"
        while db.query(Enquiry).filter(Enquiry.ticket_no == ticket_no).first():
            random_suffix = str(random.randint(100000, 999999))
            ticket_no = f"ENQ-{today}-{random_suffix}"

        # ---------------- Create Enquiry ----------------
        obj = Enquiry(
            ticket_no=ticket_no,
            created_at=created_at_utc,
            **enquiry_data.dict()
        )

        db.add(obj)
        db.flush()

        # ---------------- File Uploads ----------------
        if files:
            for file in files:
                try:
                    file_url, display_name, blob_name = upload_complaint_enquiry_file(file)
                except HTTPException as e:
                    db.rollback()
                    raise e
                attachment = Attachment(
                    module_type="enquiry",
                    module_id=obj.id,
                    file_name=display_name,
                    file_url=file_url,
                    file_type=file.content_type,
                    uploaded_by=created_by,
                )
                db.add(attachment)

        db.commit()
        db.refresh(obj)

        return {
            "id": obj.id,
            "ticket_no": obj.ticket_no,
            "customer_id": customer_id,
            "customer_name": customer_name,
            "category_id": obj.category_id,
            "category_name": None,
            "created_by": obj.created_by,
            "created_by_name": None,
            "assigned_to": obj.assigned_to,
            "assigned_to_name": None,
            "status_id": obj.status_id,
            "status_name": None,
            "enquiry_details": obj.enquiry_details,
            "created_at": obj.created_at,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error creating enquiry: {str(e)}")

@router.put("/{id}", response_model=EnquiryResponse)
def update(
    id: int,
    # ---------- Optional fields ----------
    category_id: Optional[int] = Form(None),
    assigned_to: Optional[int] = Form(None),
    status_id: Optional[int] = Form(None),
    enquiry_source: Optional[str] = Form(None),
    enquiry_details: Optional[str] = Form(None),
    next_action_item: Optional[str] = Form(None),
    next_followup_date: Optional[datetime] = Form(None),
    sla_deadline: Optional[datetime] = Form(None),
    sla_status: Optional[str] = Form(None),
    # ---------- Frontend timestamps ----------
    updated_at: Optional[datetime] = Form(None),
    timezone_str: Optional[str] = Form("Asia/Calcutta"),   # default if omitted
    # ---------- Files ----------
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_edit")),
):
    # 1. Fetch existing enquiry
    obj = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")

    # 2. Convert datetime fields to UTC if provided (use default timezone if none given)
    #    The default is already set, so we don't need to check again.
    try:
        updated_at_utc = None
        if updated_at is not None:
            updated_at_utc = convert_to_utc(updated_at, timezone_str)

        next_followup_utc = None
        if next_followup_date is not None:
            next_followup_utc = convert_to_utc(next_followup_date, timezone_str)

        sla_deadline_utc = None
        if sla_deadline is not None:
            sla_deadline_utc = convert_to_utc(sla_deadline, timezone_str)
    except ZoneInfoNotFoundError:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: {timezone_str}")

    # 3. Build update_data from provided fields
    update_data = {}
    if category_id is not None:
        update_data["category_id"] = category_id
    if assigned_to is not None:
        update_data["assigned_to"] = assigned_to if assigned_to != 0 else None
    if status_id is not None:
        update_data["status_id"] = status_id
    if enquiry_source is not None:
        update_data["enquiry_source"] = enquiry_source
    if enquiry_details is not None:
        update_data["enquiry_details"] = enquiry_details
    if next_action_item is not None:
        update_data["next_action_item"] = next_action_item
    if next_followup_utc is not None:
        update_data["next_followup_date"] = next_followup_utc
    if sla_deadline_utc is not None:
        update_data["sla_deadline"] = sla_deadline_utc
    if sla_status is not None:
        update_data["sla_status"] = sla_status
    if updated_at_utc is not None:
        update_data["updated_at"] = updated_at_utc

    

    # 5. Apply updates
    for key, value in update_data.items():
        setattr(obj, key, value)

    db.commit()
    db.refresh(obj)

    # 6. File uploads
    if files:
        for file in files:
            try:
                file_url, display_name, blob_name = upload_complaint_enquiry_file(file)
            except HTTPException as e:
                db.rollback()
                raise e
            attachment = Attachment(
                module_type="enquiry",
                module_id=obj.id,
                file_name=display_name,
                file_url=file_url,
                file_type=file.content_type,
                uploaded_by=_user_id,
            )
            db.add(attachment)
        db.commit()
        db.refresh(obj)

    # 7. Return response
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
        "enquiry_details": obj.enquiry_details,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
    }


@router.put("/{id}/status", response_model=EnquiryResponse)
def update_status(
    id: int,
    status_id: int,
    updated_at: Optional[datetime] = Form(None),
    timezone_str: Optional[str] = Form("Asia/Calcutta"),
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_edit")),
):
    obj = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry not found")

    # Determine updated_at value (UTC)
    if updated_at is not None:
        try:
            updated_at_utc = convert_to_utc(updated_at, timezone_str)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {timezone_str}")
    else:
        # Fallback: current UTC time (naive)
        updated_at_utc = datetime.utcnow()

    # Apply updates
    obj.status_id = status_id
    obj.updated_at = updated_at_utc

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
        "enquiry_details": obj.enquiry_details,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
    }


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(id: int, db: Session = Depends(get_db), _user_id: int = Depends(require_permission("complaints", "can_delete")),):
    obj = db.query(Enquiry).filter(Enquiry.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint not found")
    obj.is_deleted = True
    db.commit()
    return


@router.put("/{id}/assigned-ticket", response_model=EnquiryResponse)
def update_status(
    id: int,
    assigned_to: Optional[int] = Form(None),
    updated_at: Optional[datetime] = Form(None),
    timezone_str: str = Form(...),   # renamed to avoid shadowing
    db: Session = Depends(get_db),
    _user_id: int = Depends(require_permission("enquiries", "can_edit")),
):
    obj = db.query(Enquiry).filter(Enquiry.id == id).first()
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
        "enquiry_details": obj.enquiry_details,
        "created_at": obj.created_at,
        "updated_at": obj.updated_at,
    }