from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Intraday AI Trading Backend"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    postgres_url: str = "postgresql+psycopg://trader:trader@db:5432/trader"
    redis_url: str = "redis://redis:6379/0"

    angel_api_key: str = ""
    angel_client_code: str = ""
    angel_pin: str = ""
    angel_totp_secret: str = ""

    alpaca_api_key: str = ""
    alpaca_api_secret: str = ""
    polygon_api_key: str = ""

    market_symbols: str = "NSE:NIFTY50,NSE:BANKNIFTY"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
