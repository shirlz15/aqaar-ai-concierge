from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    admin_dashboard_token: str = ""
    allowed_origins: str = "http://localhost:3000"
    max_request_bytes: int = 16_384
    chat_rate_limit_per_minute: int = 20

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
