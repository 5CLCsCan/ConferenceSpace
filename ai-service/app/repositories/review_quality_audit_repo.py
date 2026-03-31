from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.models import ReviewQualityAuditRun


class ReviewQualityAuditRepository:
    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory

    async def save_completed_run(self, *, request_payload: dict, response_payload: dict) -> None:
        async with self._session_factory() as db:
            db.add(
                ReviewQualityAuditRun(
                    id=response_payload["run_id"],
                    conference_id=request_payload["conference_id"],
                    assignment_id=request_payload["assignment_id"],
                    submission_id=request_payload["submission_id"],
                    actor_id=str(request_payload["actor"]["user_id"]),
                    mode=request_payload["mode"],
                    status="completed",
                    result_status=response_payload["status"],
                    request_json=request_payload,
                    response_json=response_payload,
                    completed_at=datetime.now(tz=timezone.utc),
                )
            )
            await db.commit()

    async def save_failed_run(self, *, run_id: str, request_payload: dict, error_detail: dict) -> None:
        async with self._session_factory() as db:
            db.add(
                ReviewQualityAuditRun(
                    id=run_id,
                    conference_id=request_payload["conference_id"],
                    assignment_id=request_payload["assignment_id"],
                    submission_id=request_payload["submission_id"],
                    actor_id=str(request_payload["actor"]["user_id"]),
                    mode=request_payload["mode"],
                    status="failed",
                    request_json=request_payload,
                    error_detail=error_detail,
                    completed_at=datetime.now(tz=timezone.utc),
                )
            )
            await db.commit()
