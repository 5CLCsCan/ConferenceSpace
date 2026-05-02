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
from app.repositories import (
    DecisionCopilotRepository,
    GatingRunRepository,
    PaperAnnotationRepository,
    ReviewQualityAuditRepository,
    ReviewerBriefingRepository,
)
from app.repositories.runtime_store import RuntimeStore
from app.services import AgentRuntime, QueryEngineClient, LLMClient, MetricsStore
from app.workflows.reviewer_pre_read_briefing.runner import (
    ReviewerPreReadBriefingRunner,
)
from app.workflows.reviewer_pre_read_briefing.router import (
    router as reviewer_briefing_router,
)
from app.workflows.review_quality_auditor.runner import ReviewQualityAuditRunner
from app.workflows.review_quality_auditor.router import (
    router as review_quality_audit_router,
)
from app.workflows.chair_decision_copilot.runner import DecisionCopilotRunner
from app.workflows.chair_decision_copilot.router import (
    router as decision_copilot_router,
)
from app.workflows.paper_annotation.runner import PaperAnnotationRunner
from app.workflows.paper_annotation.router import router as paper_annotation_router
from app.workflows.research_keywords.runner import ResearchKeywordRunner
from app.workflows.research_keywords.router import router as research_keyword_router
from app.workflows.submission_gating.runner import SubmissionGatingRunner
from app.workflows.submission_gating.router import router as submission_gating_router
from app.workflows.submission_autofill.runner import SubmissionAutofillRunner
from app.workflows.submission_autofill.router import router as submission_autofill_router
from app.workflows.track_recommendation.runner import TrackRecommendationRunner
from app.workflows.track_recommendation.router import router as track_recommendation_router

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
    query_engine_client: QueryEngineClient
    runtime: AgentRuntime
    submission_gating_repo: GatingRunRepository
    submission_gating_runner: SubmissionGatingRunner
    reviewer_briefing_repo: ReviewerBriefingRepository
    reviewer_briefing_runner: ReviewerPreReadBriefingRunner
    review_quality_audit_repo: ReviewQualityAuditRepository
    review_quality_audit_runner: ReviewQualityAuditRunner
    decision_copilot_repo: DecisionCopilotRepository
    decision_copilot_runner: DecisionCopilotRunner
    paper_annotation_repo: PaperAnnotationRepository
    paper_annotation_runner: PaperAnnotationRunner
    submission_autofill_runner: SubmissionAutofillRunner
    research_keyword_runner: ResearchKeywordRunner
    track_recommendation_runner: TrackRecommendationRunner


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    has_openai_primary = bool(
        settings.openai_api_key.strip()
        and settings.openai_base_url.strip()
        and settings.openai_model.strip()
    )
    has_openrouter_fallback = bool(settings.openrouter_api_key.strip() and settings.agent_model.strip())
    if not has_openai_primary and not has_openrouter_fallback:
        raise RuntimeError(
            "Configure OPENAI_API_KEY + OPENAI_BASE_URL + OPENAI_MODEL or OPENROUTER_API_KEY + AGENT_MODEL"
        )
    if has_openai_primary and not has_openrouter_fallback:
        raise RuntimeError("OPENROUTER_API_KEY and AGENT_MODEL are required for fallback when OpenAI is primary")

    engine = create_engine(settings)
    session_factory = create_session_factory(engine)
    redis = Redis.from_url(settings.redis_url, decode_responses=False)
    identity_provider = IdentityProvider(
        settings.backend_api_base_url,
        ttl_seconds=settings.auth_cache_ttl_seconds,
        request_timeout_seconds=settings.identity_request_timeout_seconds,
    )
    runtime_store = RuntimeStore(
        redis, tool_result_timeout_seconds=settings.tool_result_timeout_seconds
    )
    llm_client = LLMClient(
        api_key=settings.openrouter_api_key,
        model=settings.agent_model,
        openai_api_key=settings.openai_api_key,
        openai_base_url=settings.openai_base_url,
        openai_model=settings.openai_model,
        request_timeout_seconds=settings.llm_request_timeout_seconds,
    )
    metrics = MetricsStore()
    query_engine_client = QueryEngineClient(
        base_url=settings.backend_api_base_url,
        service_token=settings.agent_service_token,
        timeout_seconds=settings.backend_query_timeout_seconds,
    )
    submission_gating_repo = GatingRunRepository(session_factory)
    reviewer_briefing_repo = ReviewerBriefingRepository(session_factory)
    review_quality_audit_repo = ReviewQualityAuditRepository(session_factory)
    decision_copilot_repo = DecisionCopilotRepository(session_factory)
    submission_gating_runner = SubmissionGatingRunner(
        repo=submission_gating_repo,
        llm_client=llm_client,
    )
    reviewer_briefing_runner = ReviewerPreReadBriefingRunner(
        repo=reviewer_briefing_repo,
        llm_client=llm_client,
    )
    review_quality_audit_runner = ReviewQualityAuditRunner(
        repo=review_quality_audit_repo,
        llm_client=llm_client,
    )
    decision_copilot_runner = DecisionCopilotRunner(
        repo=decision_copilot_repo,
        llm_client=llm_client,
    )
    paper_annotation_repo = PaperAnnotationRepository(session_factory)
    paper_annotation_runner = PaperAnnotationRunner(
        repo=paper_annotation_repo,
        llm_client=llm_client,
    )
    submission_autofill_runner = SubmissionAutofillRunner(llm_client=llm_client)
    research_keyword_runner = ResearchKeywordRunner(llm_client=llm_client)
    track_recommendation_runner = TrackRecommendationRunner(llm_client=llm_client)
    runtime = AgentRuntime(
        settings=settings,
        session_factory=session_factory,
        runtime_store=runtime_store,
        llm_client=llm_client,
        metrics=metrics,
        query_engine_client=query_engine_client,
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
        query_engine_client=query_engine_client,
        runtime=runtime,
        submission_gating_repo=submission_gating_repo,
        submission_gating_runner=submission_gating_runner,
        reviewer_briefing_repo=reviewer_briefing_repo,
        reviewer_briefing_runner=reviewer_briefing_runner,
        review_quality_audit_repo=review_quality_audit_repo,
        review_quality_audit_runner=review_quality_audit_runner,
        decision_copilot_repo=decision_copilot_repo,
        decision_copilot_runner=decision_copilot_runner,
        paper_annotation_repo=paper_annotation_repo,
        paper_annotation_runner=paper_annotation_runner,
        submission_autofill_runner=submission_autofill_runner,
        research_keyword_runner=research_keyword_runner,
        track_recommendation_runner=track_recommendation_runner,
        submission_autofill_runner=submission_autofill_runner,
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
    app.include_router(submission_gating_router)
    app.include_router(reviewer_briefing_router)
    app.include_router(review_quality_audit_router)
    app.include_router(decision_copilot_router)
    app.include_router(paper_annotation_router)
    app.include_router(research_keyword_router)
    app.include_router(track_recommendation_router)
    app.include_router(submission_autofill_router)
    return app


async def _validate_required_dependencies(container: AppContainer) -> None:
    async with container.session_factory() as db:
        await db.execute(text("SELECT 1"))
    pong = await container.redis.ping()
    if not pong:
        raise RuntimeError("redis ping failed")


app = create_app()
