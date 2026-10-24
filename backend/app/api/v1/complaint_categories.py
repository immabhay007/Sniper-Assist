from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.complaint_category import ComplaintCategory
from app.schemas.complaint_category import ComplaintCategoryCreate, ComplaintCategoryUpdate, ComplaintCategoryResponse
from app.api.deps import get_current_user_id, get_db, require_permission   
from app.models.complaint import Complaint
from sqlalchemy import exists

router = APIRouter(prefix="/complaint-categories", tags=["Complaint Categories"])

_view = Depends(require_permission("categories", "can_view"))
_create = Depends(require_permission("categories", "can_create"))
_edit = Depends(require_permission("categories", "can_edit"))
_delete = Depends(require_permission("categories", "can_delete"))

@router.get("/", response_model=List[ComplaintCategoryResponse])
def get_all(db: Session = Depends(get_db), _user_id: int = _view,):
    return (
        db.query(ComplaintCategory)
        .filter(ComplaintCategory.is_active.is_(True))
        .order_by(ComplaintCategory.id)
        .all()
    )

@router.get("/{id}", response_model=ComplaintCategoryResponse)
def get_one(id: int, db: Session = Depends(get_db), _user_id: int = _view,):
    obj = (
        db.query(ComplaintCategory)
        .filter(ComplaintCategory.id == id, ComplaintCategory.is_active.is_(True),)   # add active filter
        .first()
    )
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint category not found")
    return obj

@router.post("/", response_model=ComplaintCategoryResponse, status_code=status.HTTP_201_CREATED)
def create(data: ComplaintCategoryCreate, db: Session = Depends(get_db), _user_id: int = _create,):
    obj = ComplaintCategory(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{id}", response_model=ComplaintCategoryResponse)
def update(id: int, data: ComplaintCategoryUpdate, db: Session = Depends(get_db), _user_id: int = _edit,):
    obj = db.query(ComplaintCategory).filter(ComplaintCategory.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Complaint category not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = _delete
):
    obj = db.query(ComplaintCategory).filter(
        ComplaintCategory.id == id
    ).first()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint category not found"
        )

    # Check whether the category is used in any complaint
    used_in_complaint = (
        db.query(Complaint.id)
        .filter(Complaint.category_id == id)
        .first()
        is not None
    )

    if used_in_complaint:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category is already used in one or more complaints and cannot be deactivated."
        )

    obj.is_active = False
    db.commit()