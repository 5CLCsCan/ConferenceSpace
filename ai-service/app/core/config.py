from __future__ import annotations

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
        default="openrouter/google/gemini-2.5-flash-lite",
        alias="AGENT_MODEL",
    )

    backend_api_base_url: str = Field(default="http://localhost:8080", alias="BACKEND_API_BASE_URL")
    identity_request_timeout_seconds: float = Field(default=3.0, alias="IDENTITY_REQUEST_TIMEOUT_SECONDS")
    auth_cache_ttl_seconds: int = Field(default=60, alias="AUTH_CACHE_TTL_SECONDS")
    backend_query_timeout_seconds: float = Field(default=10.0, alias="BACKEND_QUERY_TIMEOUT_SECONDS")
    agent_service_token: str = Field(default="", alias="AGENT_SERVICE_TOKEN")

    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    postgres_dsn: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/conferencespace",
        alias="POSTGRES_DSN",
    )
    postgres_schema: str = Field(default="ai", alias="POSTGRES_SCHEMA")

    session_ttl_minutes: int = Field(default=30, alias="SESSION_TTL_MINUTES")
    tool_result_timeout_seconds: int = Field(default=90, alias="TOOL_RESULT_TIMEOUT_SECONDS")
    max_iterations: int = Field(default=6, alias="MAX_ITERATIONS")
    max_turn_duration_seconds: int = Field(default=120, alias="MAX_TURN_DURATION_SECONDS")
    context_compaction_threshold: float = Field(default=0.70, alias="CONTEXT_COMPACTION_THRESHOLD")
    keep_recent_exchanges: int = Field(default=12, alias="KEEP_RECENT_EXCHANGES")

    max_messages_per_request: int = Field(default=200, alias="MAX_MESSAGES_PER_REQUEST")
    max_message_text_chars: int = Field(default=20000, alias="MAX_MESSAGE_TEXT_CHARS")
    max_chat_requests_per_minute: int = Field(default=60, alias="MAX_CHAT_REQUESTS_PER_MINUTE")
    max_tool_result_requests_per_minute: int = Field(default=120, alias="MAX_TOOL_RESULT_REQUESTS_PER_MINUTE")

    enable_reasoning_stream: bool = Field(default=True, alias="ENABLE_REASONING_STREAM")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
