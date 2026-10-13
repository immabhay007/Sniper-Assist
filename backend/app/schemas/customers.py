from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


# ---------------------------------------------------
# BASE
# ---------------------------------------------------
class CustomerBase(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_new_customer: bool = True
    is_active: bool = True
    is_deleted: bool = False


# ---------------------------------------------------
# CREATE
# ---------------------------------------------------
class CustomerCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_new_customer: bool = True
    is_active: bool = True
    is_deleted: bool = False


# ---------------------------------------------------
# UPDATE
# ---------------------------------------------------
class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_new_customer: Optional[bool] = None
    is_active: Optional[bool] = None
    is_deleted: Optional[bool] = None


# ---------------------------------------------------
# RESPONSE
# ---------------------------------------------------
class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime]