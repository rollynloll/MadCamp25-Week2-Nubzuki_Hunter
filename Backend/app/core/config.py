from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database(Supabase)
    database_url: str
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_jwks_url: str | None = None
    project_version: str = "0.1.0"

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str

    # JWT Backend Token
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    # NAVER MAP API
    naver_map_client_id: str


@lru_cache
def get_settings() -> Settings:
    return Settings()
