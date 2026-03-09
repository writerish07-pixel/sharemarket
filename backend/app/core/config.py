from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "Tata Motors CRM – Jaipur Dealership"
    app_version: str = "1.0.0"
    environment: str = "development"
    api_prefix: str = "/api/v1"

    # Security
    jwt_secret_key: str = "change-this-to-a-secure-32-char-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480   # 8 hours
    refresh_token_expire_days: int = 30

    # Database
    postgres_url: str = "postgresql+psycopg://crm:crm@db:5432/tata_crm"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # File uploads
    upload_dir: str = "/app/uploads"
    max_upload_mb: int = 20

    # AWS S3 (optional)
    use_s3: bool = False
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = ""
    aws_region: str = "ap-south-1"

    # WhatsApp Business API
    whatsapp_token: str = ""
    whatsapp_phone_id: str = ""

    # SMS (Twilio/MSG91)
    sms_api_key: str = ""
    sms_sender_id: str = "TMCRM"

    # Email (SendGrid)
    sendgrid_api_key: str = ""
    from_email: str = "crm@tatamotors-jaipur.in"

    # Dealership
    dealership_name: str = "Tata Motors Authorized Dealership"
    dealership_city: str = "Jaipur"
    dealership_state: str = "Rajasthan"
    dealership_gst: str = "08XXXXX1234X1ZX"
    dealership_phone: str = "+91-141-XXXXXXX"
    dealership_address: str = "Plot No. XYZ, Tonk Road, Jaipur – 302015"

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000", "http://frontend:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
