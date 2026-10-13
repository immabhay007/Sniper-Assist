"""Registered email template keys (files live under app/emails/templates/)."""

RESET_PASSWORD_OTP = "reset_password_otp"
PASSWORD_RESET_SUCCESS = "password_reset_success"
ONBOARDING_ADMIN = "onboarding_admin"
ONBOARDING_USER = "onboarding_user"

TEMPLATE_SUBJECTS: dict[str, str] = {
    RESET_PASSWORD_OTP: "Your Sniper OTP for {purpose}",
    PASSWORD_RESET_SUCCESS: "Your Sniper password was reset",
    ONBOARDING_ADMIN: "New user registered on Sniper care",
    ONBOARDING_USER: "Welcome to Sniper care — your account details",
}
