from __future__ import annotations

import asyncpg
import pytest
from sqlalchemy import text

from app.core.config import get_settings
from app.db.models import Base
from app.db.session import create_engine, create_session_factory
from app.repositories.reviewer_initial_analysis_repo import ReviewerInitialAnalysisRepository

from tests.test_reviewer_initial_analysis_models import make_artifact_payload, make_request_payload


async def _can_connect() -> bool:
    settings = get_settings()
    dsn = settings.postgres_dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    try:
        conn = await asyncpg.connect(dsn)
    except Exception:
        return False
    try:
        await conn.fetchval("SELECT 1")
        return True
    finally:
        await conn.close()


@pytest.fixture
async def repo_context():
    if not await _can_connect():
        pytest.skip("local Postgres is not available")

    settings = get_settings()
    engine = create_engine(settings)
    session_factory = create_session_factory(engine)

    async with engine.begin() as connection:
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS ai"))
        await connection.run_sync(Base.metadata.create_all)

    try:
        yield ReviewerInitialAnalysisRepository(session_factory), session_factory
    finally:
        await engine.dispose()


def make_response_payload(run_id: str, request_payload: dict) -> dict:
    return {
        "status": "ready",
        "run_id": run_id,
        "cache": {
            "hit": False,
            "submission_state_fingerprint": request_payload["submission_state_fingerprint"],
        },
        "artifact": make_artifact_payload(),
        "error": None,
    }


@pytest.mark.asyncio
async def test_repo_returns_none_when_no_matching_initial_analysis_artifact(repo_context) -> None:
    repo, _ = repo_context

    artifact = await repo.get_matching_artifact(
        conference_id=1,
        assignment_id=2,
        submission_id=3,
        actor_id="9",
        submission_state_fingerprint="sha256:not-found",
    )

    assert artifact is None


@pytest.mark.asyncio
async def test_repo_saves_and_loads_matching_initial_analysis_artifact(repo_context) -> None:
    repo, _ = repo_context
    request_payload = make_request_payload(action="generate")
    request_payload["submission_state_fingerprint"] = "sha256:repo-match"
    response_payload = make_response_payload("550e8400-e29b-41d4-a716-446655440101", request_payload)

    await repo.save_completed_run(
        request_payload=request_payload,
        artifact_payload=response_payload,
        stage_records=[{"stage_name": "generation", "status": "ok", "detail": {"provider": "llm"}}],
    )

    artifact = await repo.get_matching_artifact(
        conference_id=1,
        assignment_id=2,
        submission_id=3,
        actor_id="9",
        submission_state_fingerprint="sha256:repo-match",
    )

    assert artifact == response_payload


@pytest.mark.asyncio
async def test_repo_returns_latest_initial_analysis_artifact_for_scope(repo_context) -> None:
    repo, _ = repo_context
    older_request = make_request_payload(action="generate")
    older_request["submission_state_fingerprint"] = "sha256:older"
    newer_request = make_request_payload(action="generate")
    newer_request["submission_state_fingerprint"] = "sha256:newer"

    await repo.save_completed_run(
        request_payload=older_request,
        artifact_payload=make_response_payload("550e8400-e29b-41d4-a716-446655440201", older_request),
        stage_records=[],
    )
    await repo.save_completed_run(
        request_payload=newer_request,
        artifact_payload=make_response_payload("550e8400-e29b-41d4-a716-446655440202", newer_request),
        stage_records=[],
    )

    latest = await repo.get_latest_artifact_for_scope(
        conference_id=1,
        assignment_id=2,
        submission_id=3,
        actor_id="9",
    )

    assert latest is not None
    assert latest["run_id"] == "550e8400-e29b-41d4-a716-446655440202"
    assert latest["submission_state_fingerprint"] == "sha256:newer"
    assert latest["artifact"]["briefing"]
    assert latest["artifact"]["annotations"]


@pytest.mark.asyncio
async def test_repo_saves_failed_initial_analysis_run(repo_context) -> None:
    repo, session_factory = repo_context
    request_payload = make_request_payload(action="generate")
    request_payload["submission_state_fingerprint"] = "sha256:failed"
    run_id = "550e8400-e29b-41d4-a716-446655440301"

    await repo.save_failed_run(
        run_id=run_id,
        request_payload=request_payload,
        error_detail={"code": "missing_manuscript", "message": "A manuscript file is required."},
        stage_records=[{"stage_name": "validation", "status": "failed", "detail": {"reason": "missing_manuscript"}}],
    )

    async with session_factory() as db:
        status = (
            await db.execute(
                text("SELECT status FROM ai.reviewer_initial_analysis_runs WHERE id = :run_id"),
                {"run_id": run_id},
            )
        ).scalar_one()
        stage_count = int(
            (
                await db.execute(
                    text("SELECT COUNT(*) FROM ai.reviewer_initial_analysis_stage_records WHERE run_id = :run_id"),
                    {"run_id": run_id},
                )
            ).scalar_one()
        )

    assert status == "failed"
    assert stage_count == 1
