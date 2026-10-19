"""Application settings loaded from environment variables (via .env files)."""

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.environment import load_dotenv_file, resolve_env_name


class Settings(BaseSettings):
    """All configuration for the backend; values come from .env after load_dotenv_file()."""

    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    # Runtime
    env: str = Field(default="develop", validation_alias="ENV")

    # Database
    db_server: str = Field(validation_alias="DB_SERVER")
    db_name: str = Field(validation_alias="DB_NAME")
    db_user: str = Field(validation_alias="DB_USER")
    db_password: str = Field(validation_alias="DB_PASSWORD")
    db_driver: str = Field(
        default="{ODBC Driver 18 for SQL Server}",
        validation_alias="DB_DRIVER",
    )

    # Auth
    secret_key: str = Field(validation_alias="SECRET_KEY")
    algorithm: str = Field(default="HS256", validation_alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, validation_alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # Azure Storage
    azure_storage_connection_string: str | None = Field(
        default=None, validation_alias="AZURE_STORAGE_CONNECTION_STRING"
    )
    azure_storage_base_url: str | None = Field(
        default=None, validation_alias="AZURE_STORAGE_BASE_URL"
    )

    # Zepto Mail (SMTP)
    zepto_base_url: str | None = Field(
        default="smtp.zeptomail.in",
        validation_alias="ZEPTO_BASE_URL",
    )
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_username: str | None = Field(default=None, validation_alias="SMTP_USERNAME")
    zepto_api_token: str | None = Field(default=None, validation_alias="ZEPTO_API_TOKEN")
    zepto_from_email: str | None = Field(default=None, validation_alias="ZEPTO_FROM_EMAIL")
    zepto_from_name: str | None = Field(default=None, validation_alias="ZEPTO_FROM_NAME")
    admin_notify_email: str | None = Field(default=None, validation_alias="ADMIN_NOTIFY_EMAIL")
    app_login_url: str | None = Field(default=None, validation_alias="APP_LOGIN_URL")

    # AISensy
    aisensy_api_key: str | None = Field(default=None, validation_alias="AISENSY_API_KEY")
    aisensy_base_url: str | None = Field(default=None, validation_alias="AISENSY_BASE_URL")

    @property
    def odbc_driver(self) -> str:
        return self.db_driver.strip("{}")

    @property
    def database_url(self) -> str:
        """SQLAlchemy URL for Azure SQL Server via pyodbc."""
        odbc_connect = (
            f"DRIVER={{{self.odbc_driver}}};"
            f"SERVER={self.db_server};"
            f"DATABASE={self.db_name};"
            f"UID={self.db_user};"
            f"PWD={self.db_password};"
            "Encrypt=no;"
            "TrustServerCertificate=no;"
        )
        return f"mssql+pyodbc:///?odbc_connect={quote_plus(odbc_connect)}"


@lru_cache
def get_settings(env_name: str | None = None) -> Settings:
    """Load backend/.env then return cached settings."""
    load_dotenv_file(env_name)
    return Settings(env=resolve_env_name(env_name))
