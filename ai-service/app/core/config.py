from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    ai_service_host: str = Field(default="0.0.0.0", alias="AI_SERVICE_HOST")
    ai_service_port: int = Field(default=8090, alias="AI_SERVICE_PORT")
    ai_service_env: str = Field(default="development", alias="AI_SERVICE_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    agent_model: str = Field(
        default="google/gemini-2.5-flash-lite-preview-09-2025",
        alias="AGENT_MODEL",
    )

    backend_api_base_url: str = Field(
        default="http://localhost:8080",
        alias="BACKEND_API_BASE_URL",
    )
    identity_request_timeout_seconds: float = Field(
        default=3.0,
        alias="IDENTITY_REQUEST_TIMEOUT_SECONDS",
    )
    allow_dev_auth_bypass: bool = Field(default=False, alias="ALLOW_DEV_AUTH_BYPASS")
    dev_auth_user_id: int = Field(default=1, alias="DEV_AUTH_USER_ID")
    dev_auth_user_email: str = Field(default="dev@local", alias="DEV_AUTH_USER_EMAIL")

    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    postgres_dsn: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/conferencespace",
        alias="POSTGRES_DSN",
    )

    auth_cache_ttl_seconds: int = Field(default=60, alias="AUTH_CACHE_TTL_SECONDS")
    session_ttl_minutes: int = Field(default=30, alias="SESSION_TTL_MINUTES")
    tool_result_timeout_seconds: int = Field(default=90, alias="TOOL_RESULT_TIMEOUT_SECONDS")
    context_compaction_threshold: float = Field(
        default=0.70,
        alias="CONTEXT_COMPACTION_THRESHOLD",
    )
    keep_recent_exchanges: int = Field(default=12, alias="KEEP_RECENT_EXCHANGES")
    debug_durable_checkpoint: bool = Field(default=False, alias="DEBUG_DURABLE_CHECKPOINT")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
