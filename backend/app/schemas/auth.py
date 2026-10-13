from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class AuthenticatedUser(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str | None = None

    # users.role -> varchar/string
    role: str

    # users.is_active -> tinyint/bool
    is_active: bool

    # users.is_deleted -> tinyint/bool
    is_deleted: bool

    # users.created_at -> datetime
    created_at: datetime | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AuthenticatedUser


class TokenResponse(LoginResponse):
    pass


class RefreshRequest(RefreshTokenRequest):
    pass


class MeResponse(BaseModel):
    user: AuthenticatedUser


class ProfileUpdateRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)


class ForgotPasswordOtpRequest(BaseModel):
    email: EmailStr


class ForgotPasswordOtpResponse(BaseModel):
    message: str
    hint: str | None = None
    otp_sent: bool = False


class ForgotPasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$"
    )
    new_password: str = Field(
        ...,
        min_length=6,
        max_length=128
    )


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        ...,
        min_length=1,
        max_length=128
    )
    new_password: str = Field(
        ...,
        min_length=6,
        max_length=128
    )


class MessageResponse(BaseModel):
    message: str