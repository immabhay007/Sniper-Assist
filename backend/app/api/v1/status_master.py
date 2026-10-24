from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.status_master import StatusMaster
from app.schemas.status_master import StatusMasterCreate, StatusMasterUpdate, StatusMasterResponse
from app.api.deps import get_current_user_id, get_db

router = APIRouter(prefix="/status-master", tags=["Status Master"])

@router.get("/", response_model=List[StatusMasterResponse])
def get_all(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user_id: int = Depends(get_current_user_id)
):
    return (
        db.query(StatusMaster)
        .filter(StatusMaster.is_active.is_(True))
        .order_by(StatusMaster.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.get("/{id}", response_model=StatusMasterResponse)
def get_one(
    id: int,
    db: Session = Depends(get_db),
    _user_id: int = Depends(get_current_user_id)
):
    obj = (
        db.query(StatusMaster)
        .filter(
            StatusMaster.id == id,
            StatusMaster.is_active.is_(True),
        )
        .first()
    )

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found"
        )

    return obj

@router.post("/", response_model=StatusMasterResponse, status_code=status.HTTP_201_CREATED)
def create(data: StatusMasterCreate, db: Session = Depends(get_db), _user_id: int = Depends(get_current_user_id)):
    obj = StatusMaster(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/{id}", response_model=StatusMasterResponse)
def update(id: int, data: StatusMasterUpdate, db: Session = Depends(get_db), _user_id: int = Depends(get_current_user_id)):
    obj = db.query(StatusMaster).filter(StatusMaster.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Status not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(id: int, db: Session = Depends(get_db), _user_id: int = Depends(get_current_user_id)):
    obj = db.query(StatusMaster).filter(StatusMaster.id == id).first()
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Status not found")
    
    # Soft delete: mark as inactive
    obj.is_active = False   # or False if boolean
    db.commit()
    # No return needed, 204 No Content sent automatically