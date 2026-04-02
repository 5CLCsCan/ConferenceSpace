from __future__ import annotations

import asyncio
import json

import asyncpg
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.auth import Identity
from app.core.config import get_settings
from app.db.models import Base
from app.db.session import create_engine, create_session_factory
from app.repositories.gating_run_repo import GatingRunRepository
from app.workflows.submission_gating.router import router as submission_gating_router
from app.workflows.submission_gating.runner import SubmissionGatingRunner

from tests.submission_gating_helpers import MINIMAL_PDF_BYTES, make_request_payload


class _NoopLLM:
    async def complete_json(self, *_args, **_kwargs):
        return []


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
async def test_workflow_routes_persist_and_fetch_runs_with_real_db(monkeypatch: pytest.MonkeyPatch) -> None:
    if not await _can_connect():
        pytest.skip("local Postgres is not available")

    settings = get_settings()
    engine = create_engine(settings)
    session_factory = create_session_factory(engine)
    async with engine.begin() as connection:
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS ai"))
        await connection.run_sync(Base.metadata.create_all)

    repo = GatingRunRepository(session_factory)
    runner = SubmissionGatingRunner(repo=repo, llm_client=_NoopLLM())

    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr(
        "app.workflows.submission_gating.router._require_identity",
        _fake_identity,
    )

    app = FastAPI()
    app.include_router(submission_gating_router)
    app.state.container = type("_Container", (), {"submission_gating_runner": runner})()

    payload = make_request_payload(enabled=False)

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/api/v1/workflows/submission-material-gating/runs",
            files={
                "request": (None, json.dumps(payload), "application/json"),
                "file": ("submission.pdf", MINIMAL_PDF_BYTES, "application/pdf"),
            },
            headers={"Authorization": "Bearer integration-token"},
        )
        assert response.status_code == 200
        run_id = response.json()["run_id"]

        fetched = await client.get(
            f"/api/v1/workflows/submission-material-gating/runs/{run_id}",
            headers={"Authorization": "Bearer integration-token"},
        )
        assert fetched.status_code == 200
        assert fetched.json()["run_id"] == run_id

    async with session_factory() as db:
        result = await db.execute(text("SELECT COUNT(*) FROM ai.gating_stage_records WHERE run_id = :run_id"), {"run_id": run_id})
        stage_count = int(result.scalar_one())
        assert stage_count >= 1

    await engine.dispose()
