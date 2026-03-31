from __future__ import annotations

import asyncpg
import pytest
from sqlalchemy import text

from app.core.config import get_settings
from app.db.models import Base
from app.db.session import create_engine, create_session_factory
from app.repositories.decision_copilot_repo import DecisionCopilotRepository

from tests.test_decision_copilot_models import make_artifact_payload, make_request_payload


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
async def test_save_completed_run_persists_current_artifact_and_run_history() -> None:
    if not await _can_connect():
        pytest.skip("local Postgres is not available")

    settings = get_settings()
    engine = create_engine(settings)
    session_factory = create_session_factory(engine)

    async with engine.begin() as connection:
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS ai"))
        await connection.run_sync(Base.metadata.create_all)

    repo = DecisionCopilotRepository(session_factory)
    request_payload = make_request_payload(action="generate", fingerprint="sha256:repo-integration")
    run_id = "550e8400-e29b-41d4-a716-446655440000"
    response_payload = {
        "status": "ready",
        "run_id": run_id,
        "cache": {
            "hit": False,
            "evidence_fingerprint": request_payload["evidence_fingerprint"],
            "is_stale": False,
            "stale_reasons": [],
        },
        "artifact": make_artifact_payload(),
        "error": None,
    }

    await repo.save_completed_run(
        request_payload=request_payload,
        response_payload=response_payload,
    )

    current = await repo.get_current_artifact(
        conference_id=request_payload["conference_id"],
        submission_id=request_payload["submission_id"],
    )

    assert current is not None
    assert current["run_id"] == run_id
    assert current["evidence_fingerprint"] == request_payload["evidence_fingerprint"]

    async with session_factory() as db:
        run_count = int(
            (
                await db.execute(
                    text("SELECT COUNT(*) FROM ai.decision_copilot_runs WHERE id = :run_id"),
                    {"run_id": run_id},
                )
            ).scalar_one()
        )
        current_count = int(
            (
                await db.execute(
                    text(
                        """
                        SELECT COUNT(*)
                        FROM ai.decision_copilot_current_artifacts
                        WHERE conference_id = :conference_id AND submission_id = :submission_id
                        """
                    ),
                    {
                        "conference_id": request_payload["conference_id"],
                        "submission_id": request_payload["submission_id"],
                    },
                )
            ).scalar_one()
        )

    assert run_count == 1
    assert current_count == 1

    await engine.dispose()

