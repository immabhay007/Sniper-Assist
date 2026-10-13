import logging
from typing import Sequence

from app.emails import templates as tpl
from app.emails.renderer import render_template
from app.emails.zepto_client import ZeptoMailClient

logger = logging.getLogger(__name__)


class EmailMailer:
    """
    Reusable mailer: pick a template key, pass context, send to one or many recipients.
    """

    def __init__(self, client: ZeptoMailClient | None = None) -> None:
        self._client = client or ZeptoMailClient()
        self.last_error: str | None = None

    @property
    def enabled(self) -> bool:
        return self._client.is_configured

    def send(
        self,
        template_key: str,
        to: str | Sequence[str],
        context: dict[str, str | int | float | None],
        *,
        subject: str | None = None,
        cc: Sequence[str] | None = None,
        bcc: Sequence[str] | None = None,
    ) -> bool:
        """
        Render template and send. Returns True on success, False if mail is disabled or send fails.
        """
        self.last_error = None
        if not self.enabled:
            self.last_error = "Zepto Mail is not configured (ZEPTO_API_TOKEN, ZEPTO_FROM_EMAIL)."
            logger.warning("Email skipped (Zepto not configured): template=%s", template_key)
            return False

        subject_line = subject or tpl.TEMPLATE_SUBJECTS.get(template_key, "Sniper care")
        subject_line = subject_line.format(**{k: str(v) for k, v in context.items()})

        try:
            html = render_template(template_key, context)
            self._client.send_html(to, subject_line, html, cc=cc, bcc=bcc)
            return True
        except Exception as exc:
            self.last_error = str(exc)
            logger.exception("Failed to send email template=%s to=%s", template_key, to)
            return False

    def send_reset_password_otp(self, to: str, *, otp: str, purpose: str = "password reset") -> bool:
        from datetime import datetime

        return self.send(
            tpl.RESET_PASSWORD_OTP,
            to,
            {"otp": otp, "purpose": purpose, "year": datetime.utcnow().year},
        )

    def send_password_reset_success(self, to: str) -> bool:
        from datetime import datetime

        return self.send(tpl.PASSWORD_RESET_SUCCESS, to, {"year": datetime.utcnow().year})

    def send_onboarding_admin(
        self,
        to: str | Sequence[str],
        *,
        user_id: int,
        full_name: str,
        email: str,
        phone: str,
        role: str,
        registered_at: str,
    ) -> bool:
        from datetime import datetime

        return self.send(
            tpl.ONBOARDING_ADMIN,
            to,
            {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "phone": phone or "N/A",
                "role": role,
                "registered_at": registered_at,
                "year": datetime.utcnow().year,
            },
        )

    def send_onboarding_user(
        self,
        to: str,
        *,
        full_name: str,
        email: str,
        role: str,
        temporary_password: str | None,
        login_url: str,
        password_line: str,
        security_note: str,
    ) -> bool:
        from datetime import datetime

        return self.send(
            tpl.ONBOARDING_USER,
            to,
            {
                "full_name": full_name,
                "email": email,
                "role": role,
                "temporary_password": temporary_password or "",
                "login_url": login_url,
                "password_line": password_line,
                "security_note": security_note,
                "year": datetime.utcnow().year,
            },
        )


def get_mailer() -> EmailMailer:
    return EmailMailer()
