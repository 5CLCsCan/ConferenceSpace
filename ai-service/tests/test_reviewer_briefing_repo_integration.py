from __future__ import annotations

import asyncpg
import pytest
from sqlalchemy import text

from app.core.config import get_settings
from app.db.models import Base
from app.db.session import create_engine, create_session_factory
from app.repositories.reviewer_briefing_repo import ReviewerBriefingRepository

from tests.test_reviewer_briefing_models import make_artifact_payload, make_request_payload


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


@pytest.mark.asyncio
async def test_save_completed_run_persists_parent_before_artifact_children() -> None:
    if not await _can_connect():
        pytest.skip("local Postgres is not available")

    settings = get_settings()
    engine = create_engine(settings)
    session_factory = create_session_factory(engine)

    async with engine.begin() as connection:
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS ai"))
        await connection.run_sync(Base.metadata.create_all)

    repo = ReviewerBriefingRepository(session_factory)
    request_payload = make_request_payload(action="generate", fingerprint="sha256:repo-integration")
    run_id = "550e8400-e29b-41d4-a716-446655440000"
    response_payload = {
        "status": "ready",
        "run_id": run_id,
        "cache": {
            "hit": False,
            "submission_state_fingerprint": request_payload["submission_state_fingerprint"],
        },
        "artifact": make_artifact_payload(),
        "error": None,
    }

    await repo.save_completed_run(
        request_payload=request_payload,
        artifact_payload=response_payload,
        stage_records=[
            {"stage_name": "cache_lookup", "status": "ok", "detail": {"hit": False}},
            {"stage_name": "generation", "status": "ok", "detail": {"provider": "llm"}},
        ],
    )

    async with session_factory() as db:
        run_count = int(
            (
                await db.execute(
                    text("SELECT COUNT(*) FROM ai.reviewer_briefing_runs WHERE id = :run_id"),
                    {"run_id": run_id},
                )
            ).scalar_one()
        )
        artifact_count = int(
            (
                await db.execute(
                    text("SELECT COUNT(*) FROM ai.reviewer_briefing_artifacts WHERE run_id = :run_id"),
                    {"run_id": run_id},
                )
            ).scalar_one()
        )
        stage_count = int(
            (
                await db.execute(
                    text("SELECT COUNT(*) FROM ai.reviewer_briefing_stage_records WHERE run_id = :run_id"),
                    {"run_id": run_id},
                )
            ).scalar_one()
        )

    assert run_count == 1
    assert artifact_count == 1
    assert stage_count == 2

    await engine.dispose()
