from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI

from app.api.routes import router as agent_router
from app.core.auth import Identity, IdentityProvider
from app.core.config import get_settings
from app.db.checkpoint import CheckpointResources, create_checkpoint_resources
from app.db.session import create_engine, create_session_factory
from app.graph.builder import build_agent_graph
from app.graph.nodes import AgentNodes
from app.repositories.runtime_store import RuntimeStore
from app.services.context_budget import ContextBudgetService
from app.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


def _configure_logging(level_name: str) -> None:
    level = getattr(logging, level_name.upper(), logging.INFO)
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(
            level=level,
            format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        )
    root.setLevel(level)
    logging.getLogger("app").setLevel(level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    _configure_logging(settings.log_level)
    logger.info(
        "startup: env=%s host=%s port=%s model=%s backend=%s redis=%s",
        settings.ai_service_env,
        settings.ai_service_host,
        settings.ai_service_port,
        settings.agent_model,
        settings.backend_api_base_url,
        settings.redis_url,
    )
    engine = create_engine(settings)
    session_factory = create_session_factory(engine)

    redis_client = redis.from_url(settings.redis_url, decode_responses=False)
    runtime_store = RuntimeStore(
        redis=redis_client,
        session_ttl_minutes=settings.session_ttl_minutes,
        tool_result_timeout_seconds=settings.tool_result_timeout_seconds,
    )

    checkpoints: CheckpointResources = await create_checkpoint_resources(
        redis_url=settings.redis_url,
        postgres_dsn=settings.postgres_dsn,
        session_ttl_minutes=settings.session_ttl_minutes,
    )

    llm_client = LLMClient(api_key=settings.openrouter_api_key, model=settings.agent_model)
    context_budget = ContextBudgetService(
        threshold_ratio=settings.context_compaction_threshold,
        keep_recent_exchanges=settings.keep_recent_exchanges,
    )

    nodes = AgentNodes(
        settings=settings,
        session_factory=session_factory,
        runtime_store=runtime_store,
        llm_client=llm_client,
        context_budget=context_budget,
    )
    graph_runtime = build_agent_graph(
        nodes=nodes,
        checkpointer=checkpoints.redis_checkpointer,
    )

    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = session_factory
    app.state.redis_client = redis_client
    app.state.runtime_store = runtime_store
    app.state.checkpoints = checkpoints
    app.state.identity_provider = IdentityProvider(
        backend_base_url=settings.backend_api_base_url,
        ttl_seconds=settings.auth_cache_ttl_seconds,
        request_timeout_seconds=settings.identity_request_timeout_seconds,
        allow_unavailable_backend=settings.allow_dev_auth_bypass,
        fallback_identity=(
            Identity(
                user_id=settings.dev_auth_user_id,
                user_email=settings.dev_auth_user_email,
            )
            if settings.allow_dev_auth_bypass
            else None
        ),
    )
    if settings.allow_dev_auth_bypass:
        logger.warning(
            "startup: ALLOW_DEV_AUTH_BYPASS=true user_id=%s email=%s",
            settings.dev_auth_user_id,
            settings.dev_auth_user_email,
        )
    app.state.agent_graph_runtime = graph_runtime

    try:
        yield
    finally:
        logger.info("shutdown: closing checkpoint, redis and db resources")
        await checkpoints.close()
        await redis_client.aclose()
        await engine.dispose()


app = FastAPI(title="Conference AI Service", version="0.1.0", lifespan=lifespan)
app.include_router(agent_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
