from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.enquiry_category import EnquiryCategory
from app.schemas.enquiry_category import EnquiryCategoryCreate, EnquiryCategoryUpdate, EnquiryCategoryResponse
from app.api.deps import get_current_user_id, get_db, require_permission   
from app.models.enquiry import Enquiry
from sqlalchemy import exists

router = APIRouter(prefix="/enquiry-categories", tags=["Enquiry Categories"])

_view = Depends(require_permission("categories", "can_view"))
_create = Depends(require_permission("categories", "can_create"))
_edit = Depends(require_permission("categories", "can_edit"))
_delete = Depends(require_permission("categories", "can_delete"))

@router.get("/", response_model=List[EnquiryCategoryResponse])
def get_all(db: Session = Depends(get_db), _user_id: int = _view,):
    return (
        db.query(EnquiryCategory)
        .filter(EnquiryCategory.is_active.is_(True))
        .order_by(EnquiryCategory.id)
        .all()
    )

@router.get("/{id}", response_model=EnquiryCategoryResponse)
def get_one(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = _view,
):
    obj = (
        db.query(EnquiryCategory)
        .filter(
            EnquiryCategory.id == id,
            EnquiryCategory.is_active.is_(True),
        )
        .first()
    )

    if not obj:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Enquiry category not found"
        )

    return obj

@router.post("/", response_model=EnquiryCategoryResponse, status_code=status.HTTP_201_CREATED)
def create(data: EnquiryCategoryCreate, db: Session = Depends(get_db), _user_id: int = _create,):
    obj = EnquiryCategory(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{id}", response_model=EnquiryCategoryResponse)
def update(id: int, data: EnquiryCategoryUpdate, db: Session = Depends(get_db), _user_id: int = _edit,):
    obj = db.query(EnquiryCategory).filter(EnquiryCategory.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Enquiry category not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = _delete
):
    obj = db.query(EnquiryCategory).filter(
        EnquiryCategory.id == id
    ).first()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry category not found"
        )

    # Check if category is used in any enquiry
    used_in_enquiry = (
        db.query(Enquiry.id)
        .filter(Enquiry.category_id == id)
        .first()
        is not None
    )

    if used_in_enquiry:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category is already used in one or more enquiries and cannot be deactivated."
        )

    # Soft delete
    obj.is_active = False
    db.commit()