import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.emails.mailer import get_mailer
from app.models.password_reset_otp import PasswordResetOtp
from app.models.user import User

logger = logging.getLogger(__name__)

OTP_LENGTH = 6
OTP_EXPIRE_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 60


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _user_by_email(db: Session, email: str) -> User | None:
    return db.scalars(select(User).where(User.email == email)).first()


def _eligible_user_for_password_reset(db: Session, email: str) -> User | None:
    """User must exist with is_active=1 and is_deleted=0."""
    user = _user_by_email(db, email)
    if not user or user.is_deleted or not user.is_active:
        return None
    return user


def _generate_otp() -> str:
    return f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"


def _invalidate_pending_otps(db: Session, email: str) -> None:
    db.execute(
        update(PasswordResetOtp)
        .where(
            PasswordResetOtp.email == email,
            PasswordResetOtp.is_deleted == False,  # noqa: E712
            PasswordResetOtp.verified == False,  # noqa: E712
        )
        .values(is_deleted=True),
    )


def _recent_otp_sent(db: Session, email: str) -> PasswordResetOtp | None:
    cutoff = _utcnow() - timedelta(seconds=RESEND_COOLDOWN_SECONDS)
    return db.scalars(
        select(PasswordResetOtp)
        .where(
            PasswordResetOtp.email == email,
            PasswordResetOtp.is_deleted == False,  # noqa: E712
            PasswordResetOtp.verified == False,  # noqa: E712
            PasswordResetOtp.created_at >= cutoff,
        )
        .order_by(PasswordResetOtp.id.desc())
    ).first()


def request_password_reset_otp(
    db: Session,
    *,
    email: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[str, str | None]:
    """Send OTP email only when the account exists, is active, and not deleted."""
    normalized = _normalize_email(email)
    sent_message = (
        "A one-time code has been sent to your email. "
        "Check your inbox and spam folder."
    )

    user = _user_by_email(db, normalized)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account exists with this email.",
        )
    if user.is_deleted or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive. Please contact your administrator.",
        )

    if _recent_otp_sent(db, normalized):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Please wait {RESEND_COOLDOWN_SECONDS} seconds "
                "before requesting another code."
            ),
        )

    mailer = get_mailer()
    if not mailer.enabled:
        logger.error("Password reset OTP skipped: Zepto mail is not configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is temporarily unavailable. Please try again later.",
        )

    otp = _generate_otp()
    now = _utcnow()
    _invalidate_pending_otps(db, normalized)

    row = PasswordResetOtp(
        email=normalized,
        otp=otp,
        expiry=now + timedelta(minutes=OTP_EXPIRE_MINUTES),
        verified=False,
        is_deleted=False,
        ip_address=ip_address,
        user_agent=(user_agent or "")[:500] or None,
        created_at=now,
    )
    db.add(row)
    sent = mailer.send_reset_password_otp(normalized, otp=otp)
    if not sent:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send the verification email. Please try again later.",
        )
    db.commit()

    return sent_message, f"The code expires in {OTP_EXPIRE_MINUTES} minutes."


def reset_password_with_otp(
    db: Session,
    *,
    email: str,
    otp: str,
    new_password: str,
) -> None:
    normalized = _normalize_email(email)
    code = otp.strip()

    if len(code) != OTP_LENGTH or not code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    now = _utcnow()
    row = db.scalars(
        select(PasswordResetOtp)
        .where(
            PasswordResetOtp.email == normalized,
            PasswordResetOtp.is_deleted == False,  # noqa: E712
            PasswordResetOtp.verified == False,  # noqa: E712
            PasswordResetOtp.expiry > now,
        )
        .order_by(PasswordResetOtp.id.desc())
    ).first()

    if not row or not secrets.compare_digest(row.otp, code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    user = _eligible_user_for_password_reset(db, normalized)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    if verify_password(new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    user.password_hash = hash_password(new_password)
    user.updated_at = now
    db.execute(delete(PasswordResetOtp).where(PasswordResetOtp.email == normalized))
    db.commit()

    mailer = get_mailer()
    if mailer.enabled:
        mailer.send_password_reset_success(normalized)


def change_password(
    db: Session,
    *,
    user_id: int,
    current_password: str,
    new_password: str,
) -> None:
    user = db.scalars(
        select(User).where(User.id == user_id, User.is_deleted == False)  # noqa: E712
    ).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if verify_password(new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    user.password_hash = hash_password(new_password)
    user.updated_at = _utcnow()
    db.commit()
