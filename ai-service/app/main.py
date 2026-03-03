from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass

from fastapi import FastAPI
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker

from app.api import agent_router, status_router
from app.core.auth import IdentityProvider
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.db import create_engine, create_session_factory
from app.repositories.runtime_store import RuntimeStore
from app.services import AgentRuntime, LLMClient, MetricsStore

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class AppContainer:
    settings: Settings
    engine: AsyncEngine
    session_factory: async_sessionmaker
    redis: Redis
    identity_provider: IdentityProvider
    runtime_store: RuntimeStore
    llm_client: LLMClient
    metrics: MetricsStore
    runtime: AgentRuntime


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    if not settings.openrouter_api_key.strip():
        raise RuntimeError("OPENROUTER_API_KEY is required")

    engine = create_engine(settings)
    session_factory = create_session_factory(engine)
    redis = Redis.from_url(settings.redis_url, decode_responses=False)
    identity_provider = IdentityProvider(
        settings.backend_api_base_url,
        ttl_seconds=settings.auth_cache_ttl_seconds,
        request_timeout_seconds=settings.identity_request_timeout_seconds,
    )
    runtime_store = RuntimeStore(redis, tool_result_timeout_seconds=settings.tool_result_timeout_seconds)
    llm_client = LLMClient(api_key=settings.openrouter_api_key, model=settings.agent_model)
    metrics = MetricsStore()
    runtime = AgentRuntime(
        settings=settings,
        session_factory=session_factory,
        runtime_store=runtime_store,
        llm_client=llm_client,
        metrics=metrics,
    )

    app.state.container = AppContainer(
        settings=settings,
        engine=engine,
        session_factory=session_factory,
        redis=redis,
        identity_provider=identity_provider,
        runtime_store=runtime_store,
        llm_client=llm_client,
        metrics=metrics,
        runtime=runtime,
    )

    try:
        await _validate_required_dependencies(app.state.container)
    except Exception:  # noqa: BLE001
        logger.exception("startup.dependency_validation_failed")
        await redis.aclose()
        await engine.dispose()
        raise

    try:
        yield
    finally:
        await redis.aclose()
        await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="ConferenceSpace AI Service",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.include_router(status_router)
    app.include_router(agent_router)
    return app


async def _validate_required_dependencies(container: AppContainer) -> None:
    async with container.session_factory() as db:
        await db.execute(text("SELECT 1"))
    pong = await container.redis.ping()
    if not pong:
        raise RuntimeError("redis ping failed")


app = create_app()
