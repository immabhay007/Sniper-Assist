from pathlib import Path

from app.emails.branding import get_cleo_logo_url

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def render_template(template_name: str, context: dict[str, str | int | float | None]) -> str:
    """
    Load an HTML template and replace {placeholders}.
    Unknown keys are left unchanged. Injects logo_url for all templates.
    """
    path = TEMPLATES_DIR / f"{template_name}.html"
    if not path.is_file():
        raise FileNotFoundError(f"Email template not found: {template_name}")

    merged: dict[str, str | int | float | None] = {
        "logo_url": get_cleo_logo_url(),
        **context,
    }
    html = path.read_text(encoding="utf-8")
    for key, value in merged.items():
        if value is None:
            value = ""
        html = html.replace("{" + key + "}", str(value))
    return html
