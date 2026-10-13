from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from sqlalchemy import or_
from app.api.deps import get_db, require_permission   
from app.api.deps import get_current_user_id
from app.models.enquiry import Enquiry
from app.models.complaint import Complaint
from app.models.customers import Customer
from app.schemas.customers import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse
)

router = APIRouter(prefix="/customers", tags=["Customers"])

_view = Depends(require_permission("customers", "can_view"))
_create = Depends(require_permission("customers", "can_create"))
_edit = Depends(require_permission("customers", "can_edit"))
_delete = Depends(require_permission("customers", "can_delete"))

# ---------------------------------------------------
# GET ALL CUSTOMERS
# ---------------------------------------------------

@router.get("/customers", response_model=List[CustomerResponse])
def get_all_customers(
    db: Session = Depends(get_db),
    _user_id: int = _view,   # if authentication is required
):
    """
    Retrieve all active, non-deleted customers.
    """
    customers = db.query(Customer).filter(
        Customer.is_deleted == 0,
        Customer.is_active == 1
    ).all()
    return customers

@router.get("/", response_model=List[CustomerResponse])
def get_all(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _user_id: int = _view,
):

    query = db.query(Customer).filter(
        Customer.is_deleted == 0
    )
    
    if search:
        query = query.filter(
            Customer.full_name.ilike(f"%{search}%")
        )

    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)

    return query.order_by(Customer.created_at.desc()).all()


# ---------------------------------------------------
# GET CUSTOMER BY ID
# ---------------------------------------------------
@router.get("/customers/{id}", response_model=CustomerResponse)
def get_one(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = _view,
):

    obj = db.query(Customer).filter(Customer.id == id).first()

    if not obj:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return obj


# ---------------------------------------------------
# CREATE CUSTOMER
# ---------------------------------------------------
@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _user_id: int = _create,
):

    # Prevent duplicate email
    existing = db.query(Customer).filter(Customer.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    obj = Customer(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


# ---------------------------------------------------
# UPDATE CUSTOMER
# ---------------------------------------------------
@router.put("/{id}", response_model=CustomerResponse)
def update(
    id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    _user_id: int = _edit,
):

    obj = db.query(Customer).filter(Customer.id == id).first()

    if not obj:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    update_data = data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(obj, key, value)

    db.commit()
    db.refresh(obj)

    return obj


# ---------------------------------------------------
# DELETE CUSTOMER (soft delete recommended)
# ---------------------------------------------------
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = _delete,
):
    obj = db.query(Customer).filter(Customer.id == id).first()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Check if customer is used in any enquiry
    enquiry_exists = (
        db.query(Enquiry.id)
        .filter(Enquiry.customer_id == id)
        .first()
        is not None
    )

    if enquiry_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer is referenced by one or more enquiries and cannot be deleted."
        )

    # Check if customer is used in any complaint
    complaint_exists = (
        db.query(Complaint.id)
        .filter(Complaint.customer_id == id)
        .first()
        is not None
    )

    if complaint_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer is referenced by one or more complaints and cannot be deleted."
        )

    # Soft delete
    obj.is_deleted = True
    obj.is_active = False

    db.commit()


@router.get("/search", response_model=List[CustomerResponse])  # Returns a LIST of customers
def search_customers(
    q: str = Query(..., min_length=1, description="Search by phone, name, or email"),
    limit: int = Query(10, ge=1, le=50, description="Max results to return"),
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    """
    Live search endpoint for the enquiry/complaint form.
    Agents type in a phone number or name, and this returns matching customers.
    """
    # Prepare the search term with wildcards for partial matching
    search_term = f"%{q}%"  # SQL 'contains' pattern
    
    # Search across multiple columns
    results = db.query(Customer).filter(
        or_(
            Customer.phone.ilike(search_term),       # Search phone number
            Customer.full_name.ilike(search_term),  # Search first name
            Customer.email.ilike(search_term)        # Search email
        )
    ).limit(limit).all()
    
    # Return the list (even if empty, just return [])
    return results

