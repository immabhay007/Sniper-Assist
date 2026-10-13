"""
Onboarding email helpers — invoked after user create.
"""

import logging
from datetime import datetime

from app.core.initialize_environment import settings
from app.emails.mailer import get_mailer
from app.models.user import User

logger = logging.getLogger(__name__)


def format_datetime_ist(
    dt: datetime | None,
) -> str:

    if dt is None:
        dt = datetime.utcnow()

    return dt.strftime("%d %b %Y, %I:%M %p UTC")


def _password_line(
    temporary_password: str | None,
) -> str:

    if temporary_password:
        return (
            "<li><strong>Temporary password:</strong> "
            f'<code style="background:#fff;padding:2px 6px;border-radius:4px;">'
            f"{temporary_password}"
            "</code></li>"
        )

    return (
        "<li><strong>Password:</strong> "
        "Use the password your administrator shared with you."
        "</li>"
    )


def _security_note(
    temporary_password: str | None,
) -> str:

    if temporary_password:
        return (
            "Please change your password after your first login. "
            "Do not share these details with anyone."
        )

    return (
        "Keep your password private and do not share your account with anyone."
    )


def send_onboarding_emails(
    user: User,
    *,
    temporary_password: str | None,
    admin_notify_email: str | None = None,
    login_url: str | None = None,
) -> dict[str, bool]:

    """
    Send welcome email to the user and optional admin notification.
    Returns {"user": bool, "admin": bool}.
    Failures are logged, not raised.
    """

    mailer = get_mailer()

    if not mailer.enabled:
        logger.warning(
            "Onboarding emails skipped: Zepto Mail is not configured"
        )

        return {
            "user": False,
            "admin": False,
        }

    # role is now direct string column
    role_name = (
        user.role.upper()
        if user.role
        else "USER"
    )

    login = (
        login_url
        or settings.app_login_url
        or "https://cleo-care-web-dev-ci-as.azurewebsites.net/login"
    )

    if login and not login.startswith(
        ("http://", "https://")
    ):
        login = f"https://{login.lstrip('/')}"

    results: dict[str, bool | str | None] = {
        "user": False,
        "admin": False,
        "user_error": None,
    }

    try:

        results["user"] = mailer.send_onboarding_user(
            user.email,
            full_name=user.full_name,
            email=user.email,
            role=role_name,
            temporary_password=temporary_password,
            login_url=login,
            password_line=_password_line(
                temporary_password
            ),
            security_note=_security_note(
                temporary_password
            ),
        )

        if not results["user"]:
            results["user_error"] = (
                mailer.last_error
                or "Welcome email could not be sent."
            )

    except Exception as exc:

        results["user_error"] = str(exc)

        logger.exception(
            "Failed to send onboarding email to user %s",
            user.email,
        )

    admin_to = (
        admin_notify_email
        or settings.admin_notify_email
    )

    if admin_to:

        try:

            results["admin"] = (
                mailer.send_onboarding_admin(
                    admin_to,
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    phone=user.phone or "N/A",
                    role=role_name,
                    registered_at=format_datetime_ist(
                        user.created_at
                    ),
                )
            )

        except Exception:

            logger.exception(
                "Failed to send onboarding admin email for user %s",
                user.id,
            )

    return results