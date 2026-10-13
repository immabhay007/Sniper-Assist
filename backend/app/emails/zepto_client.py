import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Sequence

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _strip(value: str | None) -> str:
    return (value or "").strip().strip('"')


class ZeptoMailClient:
    """Send HTML email via Zepto Mail SMTP (smtp.zeptomail.in)."""

    def __init__(self) -> None:
        cfg = get_settings()
        self.host = _strip(cfg.zepto_base_url)
        self.port = cfg.smtp_port
        self.username = _strip(cfg.smtp_username)
        self.password = _strip(cfg.zepto_api_token)
        self.from_email = _strip(cfg.zepto_from_email)
        self.from_name = _strip(cfg.zepto_from_name) or "Sniper Team"

    @property
    def is_configured(self) -> bool:
        return bool(self.host and self.username and self.password and self.from_email)

    def send_html(
        self,
        to: str | Sequence[str],
        subject: str,
        html_body: str,
        *,
        cc: Sequence[str] | None = None,
        bcc: Sequence[str] | None = None,
    ) -> None:
        if not self.is_configured:
            raise RuntimeError("Zepto Mail is not configured. Check ZEPTO_* variables in .env.")

        recipients = [to] if isinstance(to, str) else list(to)
        if not recipients:
            raise ValueError("At least one recipient is required.")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.from_email}>"
        msg["To"] = ", ".join(recipients)
        if cc:
            msg["Cc"] = ", ".join(cc)
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        all_rcpt = list(recipients) + list(cc or []) + list(bcc or [])

        with smtplib.SMTP(self.host, self.port, timeout=30) as server:
            server.starttls()
            server.login(self.username, self.password)
            server.sendmail(self.from_email, all_rcpt, msg.as_string())

        logger.info("Email sent to %s subject=%s", recipients, subject)
