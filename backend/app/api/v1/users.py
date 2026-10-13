from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.utils.get_sla_status import get_sla_status
from app.api.deps import get_current_user_id, get_db, require_permission
from app.schemas.user import UserCreate, UserCreateResponse, UserResponse, UserUpdate
from app.models.user import User
from app.models.complaint import Complaint
from app.models.enquiry import Enquiry
from app.models.complaint_category import ComplaintCategory
from app.models.enquiry_category import EnquiryCategory
from app.models.status_master import StatusMaster
from app.services import user_service as svc
from app.models.orders import Order
from app.models.order_items import OrderItem
from app.models.service_types import ServiceType
from app.models.customers import Customer
from sqlalchemy.orm import aliased
from sqlalchemy import and_, or_
from app.models.attachment import Attachment
from app.utils.get_base64 import get_base64_from_url

router = APIRouter(prefix="/users", tags=["users"])

_view = Depends(require_permission("teams", "can_view"))
_create = Depends(require_permission("teams", "can_create"))
_edit = Depends(require_permission("teams", "can_edit"))
_delete = Depends(require_permission("teams", "can_delete"))


# @router.get("", response_model=list[UserResponse])
# def list_users(
#     active_only: bool = Query(False),
#     include_deleted: bool = Query(False),
#     db: Session = Depends(get_db),
#     _user_id: int = _view,
# ):
#     return svc.list_users(db, active_only=active_only, include_deleted=include_deleted)

@router.get("", response_model=list[UserResponse])
def list_users(
    active_only: bool = Query(False),
    include_deleted: bool = Query(False),
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    return svc.list_users(
        db,
        active_only=active_only,
        include_deleted=include_deleted,
    )


@router.get("/customers", response_model=list[UserResponse])
def list_customers(
    db: Session = Depends(get_db),
     _user_id: int = _view,
):
    users = (
        db.query(User)
        .filter(
            # User.role == "customer",
            User.is_active == True,
            User.is_deleted == False,
        )
        .order_by(User.id.desc())
        .all()
    )

    return [
        UserResponse(
            id=row.id,
            email=row.email,
            full_name=row.full_name,
            phone=row.phone,
            role=row.role,
            is_active=row.is_active,
            is_deleted=row.is_deleted,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
        for row in users
    ]


# @router.get("/{user_id}", response_model=UserResponse)
# def get_user(user_id: int, db: Session = Depends(get_db), _user_id: int = _view):
#     row = svc.get_user(db, user_id)
#     if not row or row.is_deleted:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
#     return svc.to_response(row)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
     _user_id: int = _view,
):
    row = svc.get_user(db, user_id)

    if not row or row.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return svc.to_response(row)

# @router.post("", response_model=UserCreateResponse, status_code=status.HTTP_201_CREATED)
# def create_user(payload: UserCreate, db: Session = Depends(get_db), _user_id: int = _create):
#     return svc.create_user(db, payload)

@router.post(
    "",
    response_model=UserCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _user_id: int = _create,
):
    return svc.create_user(db, payload)

# @router.patch("/{user_id}", response_model=UserResponse)
# def update_user(
#     user_id: int,
#     payload: UserUpdate,
#     db: Session = Depends(get_db),
#     _user_id: int = _edit,
# ):
#     updated = svc.update_user(db, user_id, payload)
#     if not updated:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
#     return updated

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _user_id: int = _edit, 
):
    updated = svc.update_user(db, user_id, payload)

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return updated


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _user_id: int = _delete,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    
    user.is_deleted = True
    user.is_active = False   # or 0, depending on your column type
    db.commit()
    # 204 No Content sent automatically


@router.get("/my-assignments/{user_id}")
def get_my_assignments(
    user_id: int,
    from_date: Optional[datetime] = Query(None, description="Start date"),
    to_date: Optional[datetime] = Query(None, description="End date"),
    db: Session = Depends(get_db),
    auth_user_id: int = Depends(require_permission("my_assignments", "can_view")),
):
    # ---------------------------------------------------
    # Check user exists and role is admin/officer
    # ---------------------------------------------------
    user = (
        db.query(User)
        .filter(User.id == user_id, User.role.in_(["admin", "officer"]))
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not authorized"
        )

    # ---------------------------------------------------
    # USER aliases
    # ---------------------------------------------------
    customer = Customer.__table__.alias("customer")
    creator = User.__table__.alias("creator")
    assigned = User.__table__.alias("assigned")

    # ---------------------------------------------------
    # COMPLAINT QUERY
    # ---------------------------------------------------
    complaint_query = (
        db.query(
            Complaint,
            customer.c.full_name.label("customer_name"),
            ComplaintCategory.category_name.label("category_name"),
            creator.c.full_name.label("created_by_name"),
            assigned.c.full_name.label("assigned_to_name"),
            StatusMaster.status_name.label("status_name"),
        )
        .outerjoin(customer, Complaint.customer_id == customer.c.id)
        .outerjoin(ComplaintCategory, Complaint.category_id == ComplaintCategory.id)
        .outerjoin(creator, Complaint.created_by == creator.c.id)
        .outerjoin(assigned, Complaint.assigned_to == assigned.c.id)
        .outerjoin(StatusMaster, Complaint.status_id == StatusMaster.id)
        .filter(Complaint.assigned_to == user_id)
    )
    if from_date:
        complaint_query = complaint_query.filter(Complaint.created_at >= from_date)
    if to_date:
        complaint_query = complaint_query.filter(Complaint.created_at <= to_date)

    complaints = complaint_query.order_by(Complaint.created_at.desc()).all()

    # ---------------------------------------------------
    # ENQUIRY QUERY
    # ---------------------------------------------------
    enquiry_query = (
        db.query(
            Enquiry,
            customer.c.full_name.label("customer_name"),
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
        .filter(Enquiry.assigned_to == user_id)
    )
    if from_date:
        enquiry_query = enquiry_query.filter(Enquiry.created_at >= from_date)
    if to_date:
        enquiry_query = enquiry_query.filter(Enquiry.created_at <= to_date)

    enquiries = enquiry_query.order_by(Enquiry.created_at.desc()).all()

    # ---------------------------------------------------
    # Load attachments for complaints & enquiries
    # ---------------------------------------------------
    complaint_ids = [row[0].id for row in complaints]
    enquiry_ids = [row[0].id for row in enquiries]

    attachments = (
        db.query(Attachment)
        .filter(
            or_(
                and_(
                    Attachment.module_type == "complaint",
                    Attachment.module_id.in_(complaint_ids)
                ),
                and_(
                    Attachment.module_type == "enquiry",
                    Attachment.module_id.in_(enquiry_ids)
                )
            )
        )
        .all()
    )

    attachments_map = {}
    for att in attachments:
        key = (att.module_type.lower(), att.module_id)
        if key not in attachments_map:
            attachments_map[key] = []
        attachments_map[key].append(att)

    # ---------------------------------------------------
    # Complaint response
    # ---------------------------------------------------
    complaint_data = []
    for row in complaints:
        c = row[0]
        attachments_list = []
        for att in attachments_map.get(("complaint", c.id), []):
            b64_data = get_base64_from_url(att.file_url)
            if b64_data:
                attachments_list.append({
                    "file_name": att.file_name,
                    "file_type": att.file_type,
                    "base64_data": b64_data,
                })

        complaint_data.append({
            "id": c.id,
            "ticket_no": c.ticket_no,
            "customer_name": row.customer_name,
            "category_id": c.category_id,
            "category_name": row.category_name,
            "created_by": c.created_by,
            "created_by_name": row.created_by_name,
            "assigned_to": c.assigned_to,
            "assigned_to_name": row.assigned_to_name,
            "status_id": c.status_id,
            "status_name": row.status_name,
            "complaint_source": c.complaint_source,
            "complaint_details": c.complaint_details,
            "priority": c.priority,
            "sla_status": get_sla_status(
                sla_deadline=c.sla_deadline,
                created_at=c.created_at,
            ) if c.sla_deadline else None,
            "sla_deadline": c.sla_deadline,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "attachments": attachments_list,   # <-- ADDED
            "type": "complaint"
        })

    # ---------------------------------------------------
    # Enquiry response
    # ---------------------------------------------------
    enquiry_data = []
    for row in enquiries:
        e = row[0]
        attachments_list = []
        for att in attachments_map.get(("enquiry", e.id), []):
            b64_data = get_base64_from_url(att.file_url)
            if b64_data:
                attachments_list.append({
                    "file_name": att.file_name,
                    "file_type": att.file_type,
                    "base64_data": b64_data,
                })

        enquiry_data.append({
            "id": e.id,
            "ticket_no": e.ticket_no,
            "customer_name": row.customer_name,
            "category_id": e.category_id,
            "category_name": row.category_name,
            "created_by": e.created_by,
            "created_by_name": row.created_by_name,
            "assigned_to": e.assigned_to,
            "assigned_to_name": row.assigned_to_name,
            "status_id": e.status_id,
            "status_name": row.status_name,
            "enquiry_source": e.enquiry_source,
            "enquiry_details": e.enquiry_details,
            "attachments": attachments_list,
            "next_action_item": e.next_action_item,
            "next_followup_date": e.next_followup_date,
            "sla_status": get_sla_status(
                sla_deadline=e.sla_deadline,
                created_at=e.created_at,
            ) if e.sla_deadline else None,
            "sla_deadline": e.sla_deadline,
            "created_at": e.created_at,
            "updated_at": e.updated_at,
            "type": "enquiry"
        })

    # ---------------------------------------------------
    # Final response
    # ---------------------------------------------------
    return {
        "user_id": user.id,
        "user_name": user.full_name,
        "role": user.role,
        "from_date": from_date,
        "to_date": to_date,
        "total_complaints": len(complaint_data),
        "total_enquiries": len(enquiry_data),
        "complaints": complaint_data,
        "enquiries": enquiry_data
    }


@router.get("/customer-orders/{customer_name}")
def get_customer_orders(
    customer_name: int,
    db: Session = Depends(get_db)
):

    # ---------------------------------------------------
    # USER alias
    # ---------------------------------------------------
    customer = User.__table__.alias("customer")

    # ---------------------------------------------------
    # ORDERS QUERY
    # ---------------------------------------------------
    orders = (
        db.query(
            Order,

            customer.c.full_name.label("customer_name"),
        )

        .outerjoin(
            customer,
            Order.customer_id == customer.c.id
        )

        .filter(Order.customer_id == customer_name)

        .order_by(Order.created_at.desc())

        .all()
    )

    # ---------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------
    orders_data = []

    for row in orders:

        o = row[0]

        # ---------------------------------------------------
        # GET ALL SERVICES FOR ORDER
        # ---------------------------------------------------
        services = (
            db.query(
                OrderItem.service_type_id,
                ServiceType.name.label("service_type_name")
            )

            .outerjoin(
                ServiceType,
                OrderItem.service_type_id == ServiceType.id
            )

            .filter(OrderItem.order_id == o.id)

            .all()
        )

        service_data = []

        for service in services:
            service_data.append({
                "service_type_id": service.service_type_id,
                "service_type_name": service.service_type_name
            })

        orders_data.append({
            "id": o.id,

            "customer_id": o.customer_id,
            "customer_name": row.customer_name,

            "order_type": o.order_type,

            "services": service_data,

            "scheduled_date": o.scheduled_date,
            "scheduled_time": o.scheduled_time,

            "service_address": o.service_address,

            "created_at": o.created_at,
            "updated_at": o.updated_at,
        })

    # ---------------------------------------------------
    # FINAL RESPONSE
    # ---------------------------------------------------
    return {
        "customer_name": customer_name,

        "total_orders": len(orders_data),

        "orders": orders_data
    }








