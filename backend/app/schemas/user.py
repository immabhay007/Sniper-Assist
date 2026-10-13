from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(default=None, max_length=50)

    # updated from role_id -> role
    role: str = Field(..., min_length=1, max_length=255)

    password: str = Field(..., min_length=6, max_length=128)

    is_active: bool = True
    is_deleted: bool = False

    created_at: datetime | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None

    full_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    phone: str | None = Field(
        default=None,
        max_length=50,
    )


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None

    # updated from role_id/role_name -> role
    role: str

    is_active: bool
    is_deleted: bool

    created_at: datetime | None

    model_config = {
        "from_attributes": True
    }


class UserCreateResponse(UserResponse):
    temporary_password: str | None = None
    onboarding_email_sent: bool = False
    onboarding_email_error: str | None = None