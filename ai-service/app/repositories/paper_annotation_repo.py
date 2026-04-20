from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.models import PaperAnnotationArtifactModel, PaperAnnotationRun, PaperAnnotationStageRecord


class PaperAnnotationRepository:
    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory

    async def get_matching_artifact(
        self,
        *,
        conference_id: int,
        assignment_id: int,
        submission_id: int,
        actor_id: str,
        submission_state_fingerprint: str,
    ) -> dict | None:
        async with self._session_factory() as db:
            row = (
                await db.execute(
                    select(PaperAnnotationArtifactModel).where(
                        PaperAnnotationArtifactModel.conference_id == conference_id,
                        PaperAnnotationArtifactModel.assignment_id == assignment_id,
                        PaperAnnotationArtifactModel.submission_id == submission_id,
                        PaperAnnotationArtifactModel.actor_id == actor_id,
                        PaperAnnotationArtifactModel.submission_state_fingerprint == submission_state_fingerprint,
                    )
                )
            ).scalar_one_or_none()
            if row is None:
                return None
            return row.artifact_json

    async def get_latest_artifact_for_scope(
        self,
        *,
        conference_id: int,
        assignment_id: int,
        submission_id: int,
        actor_id: str,
    ) -> dict | None:
        async with self._session_factory() as db:
            row = (
                await db.execute(
                    select(PaperAnnotationArtifactModel)
                    .where(
                        PaperAnnotationArtifactModel.conference_id == conference_id,
                        PaperAnnotationArtifactModel.assignment_id == assignment_id,
                        PaperAnnotationArtifactModel.submission_id == submission_id,
                        PaperAnnotationArtifactModel.actor_id == actor_id,
                    )
                    .order_by(desc(PaperAnnotationArtifactModel.generated_at))
                    .limit(1)
                )
            ).scalar_one_or_none()
            if row is None:
                return None
            return {
                "run_id": row.run_id,
                "submission_state_fingerprint": row.submission_state_fingerprint,
                "artifact": row.artifact_json.get("artifact"),
            }

    async def save_completed_run(self, *, request_payload: dict, artifact_payload: dict, stage_records: list[dict]) -> None:
        async with self._session_factory() as db:
            run_id = artifact_payload["run_id"]
            db.add(
                PaperAnnotationRun(
                    id=run_id,
                    conference_id=request_payload["conference_id"],
                    assignment_id=request_payload["assignment_id"],
                    submission_id=request_payload["submission_id"],
                    actor_id=str(request_payload["actor"]["user_id"]),
                    submission_state_fingerprint=artifact_payload["cache"]["submission_state_fingerprint"],
                    status="completed",
                    request_json=request_payload,
                    completed_at=datetime.now(tz=timezone.utc),
                )
            )
            await db.flush()
            db.add(
                PaperAnnotationArtifactModel(
                    run_id=run_id,
                    conference_id=request_payload["conference_id"],
                    assignment_id=request_payload["assignment_id"],
                    submission_id=request_payload["submission_id"],
                    actor_id=str(request_payload["actor"]["user_id"]),
                    submission_state_fingerprint=artifact_payload["cache"]["submission_state_fingerprint"],
                    artifact_json=artifact_payload,
                )
            )
            for record in stage_records:
                db.add(
                    PaperAnnotationStageRecord(
                        run_id=run_id,
                        stage_name=record["stage_name"],
                        status=record["status"],
                        detail=record.get("detail", {}),
                    )
                )
            await db.commit()

    async def save_failed_run(
        self,
        *,
        run_id: str,
        request_payload: dict,
        error_detail: dict,
        stage_records: list[dict],
    ) -> None:
        async with self._session_factory() as db:
            db.add(
                PaperAnnotationRun(
                    id=run_id,
                    conference_id=request_payload["conference_id"],
                    assignment_id=request_payload["assignment_id"],
                    submission_id=request_payload["submission_id"],
                    actor_id=str(request_payload["actor"]["user_id"]),
                    submission_state_fingerprint=request_payload["submission_state_fingerprint"],
                    status="failed",
                    request_json=request_payload,
                    error_detail=error_detail,
                    completed_at=datetime.now(tz=timezone.utc),
                )
            )
            await db.flush()
            for record in stage_records:
                db.add(
                    PaperAnnotationStageRecord(
                        run_id=run_id,
                        stage_name=record["stage_name"],
                        status=record["status"],
                        detail=record.get("detail", {}),
                    )
                )
            await db.commit()
