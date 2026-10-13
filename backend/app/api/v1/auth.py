from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordOtpRequest,
    ForgotPasswordOtpResponse,
    ForgotPasswordResetRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
    MessageResponse,
    ProfileUpdateRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.user import UserUpdate
from app.services import auth_service as svc
from app.services import password_reset_service as reset_svc
from app.services import user_service as user_svc

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        result = svc.login(db, payload.email, payload.password)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    except PermissionError as exc:
        if str(exc) == "INACTIVE_USER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )
        if str(exc) == "UNAUTHORIZED_ROLE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not authorized to login",
            )
        raise
    except RuntimeError as exc:
        if str(exc) == "DB_UNAVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service unavailable",
            )
        if str(exc) == "DB_FAILURE":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            )
        raise
    return result


@router.post("/refresh-token", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        result = svc.refresh_tokens(db, payload.refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    except PermissionError as exc:
        if str(exc) == "INACTIVE_USER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )
        if str(exc) == "UNAUTHORIZED_ROLE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not authorized to login",
            )
        raise
    except RuntimeError as exc:
        if str(exc) == "DB_UNAVAILABLE":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service unavailable",
            )
        if str(exc) == "DB_FAILURE":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            )
        raise
    return result


@router.post("/refresh", response_model=TokenResponse, include_in_schema=False)
def refresh_legacy(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    return refresh_token(payload, db)


@router.get("/me", response_model=MeResponse)
def me(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = svc.get_me(db, user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return MeResponse(user=result)


@router.patch("/me", response_model=MeResponse)
def update_me(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    updated = user_svc.update_user(
        db,
        user_id,
        UserUpdate(
            full_name=payload.full_name.strip(),
            email=payload.email,
            phone=payload.phone,
        ),
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    result = svc.get_me(db, user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return MeResponse(user=result)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(_user_id: int = Depends(get_current_user_id)):
    """Client should discard tokens; no server-side session store."""
    return None


@router.post("/forgot-password/request-otp", response_model=ForgotPasswordOtpResponse)
def forgot_password_request_otp(
    payload: ForgotPasswordOtpRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = request.client.host if request.client else None
    message, hint = reset_svc.request_password_reset_otp(
        db,
        email=payload.email,
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
    )
    return ForgotPasswordOtpResponse(message=message, hint=hint, otp_sent=True)


@router.post("/forgot-password/reset", response_model=MessageResponse)
def forgot_password_reset(payload: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    reset_svc.reset_password_with_otp(
        db,
        email=payload.email,
        otp=payload.otp,
        new_password=payload.new_password,
    )
    return MessageResponse(message="Password reset successfully. You can sign in with your new password.")


@router.post("/change-password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    reset_svc.change_password(
        db,
        user_id=user_id,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return MessageResponse(message="Password updated successfully.")
