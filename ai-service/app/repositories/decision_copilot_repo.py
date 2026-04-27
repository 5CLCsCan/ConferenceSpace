from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.models import DecisionCopilotCurrentArtifact, DecisionCopilotRun


class DecisionCopilotRepository:
    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory

    async def get_current_artifact(
        self,
        *,
        conference_id: int,
        submission_id: int,
    ) -> dict | None:
        async with self._session_factory() as db:
            row = (
                await db.execute(
                    select(DecisionCopilotCurrentArtifact).where(
                        DecisionCopilotCurrentArtifact.conference_id == conference_id,
                        DecisionCopilotCurrentArtifact.submission_id == submission_id,
                    )
                )
            ).scalar_one_or_none()
            if row is None:
                return None
            return {
                "run_id": row.run_id,
                "evidence_fingerprint": row.evidence_fingerprint,
                "component_fingerprints": row.component_fingerprints,
                "artifact": row.artifact_json,
            }

    async def save_completed_run(self, *, request_payload: dict, response_payload: dict) -> None:
        async with self._session_factory() as db:
            run = DecisionCopilotRun(
                id=response_payload["run_id"],
                conference_id=request_payload["conference_id"],
                submission_id=request_payload["submission_id"],
                actor_id=str(request_payload["actor"]["user_id"]),
                action=request_payload["action"],
                evidence_fingerprint=response_payload["cache"]["evidence_fingerprint"],
                component_fingerprints=request_payload["component_fingerprints"],
                status="completed",
                request_json=request_payload,
                artifact_json=response_payload["artifact"],
                completed_at=datetime.now(tz=timezone.utc),
            )
            db.add(run)
            await db.flush()

            current = (
                await db.execute(
                    select(DecisionCopilotCurrentArtifact).where(
                        DecisionCopilotCurrentArtifact.conference_id == request_payload["conference_id"],
                        DecisionCopilotCurrentArtifact.submission_id == request_payload["submission_id"],
                    )
                )
            ).scalar_one_or_none()

            if current is None:
                current = DecisionCopilotCurrentArtifact(
                    conference_id=request_payload["conference_id"],
                    submission_id=request_payload["submission_id"],
                    run_id=response_payload["run_id"],
                    evidence_fingerprint=response_payload["cache"]["evidence_fingerprint"],
                    component_fingerprints=request_payload["component_fingerprints"],
                    artifact_json=response_payload["artifact"],
                )
                db.add(current)
            else:
                current.run_id = response_payload["run_id"]
                current.evidence_fingerprint = response_payload["cache"]["evidence_fingerprint"]
                current.component_fingerprints = request_payload["component_fingerprints"]
                current.artifact_json = response_payload["artifact"]

            await db.commit()

    async def save_failed_run(
        self,
        *,
        run_id: str,
        request_payload: dict,
        error_detail: dict,
    ) -> None:
        async with self._session_factory() as db:
            db.add(
                DecisionCopilotRun(
                    id=run_id,
                    conference_id=request_payload["conference_id"],
                    submission_id=request_payload["submission_id"],
                    actor_id=str(request_payload["actor"]["user_id"]),
                    action=request_payload["action"],
                    evidence_fingerprint=request_payload["evidence_fingerprint"],
                    component_fingerprints=request_payload["component_fingerprints"],
                    status="failed",
                    request_json=request_payload,
                    error_detail=error_detail,
                    completed_at=datetime.now(tz=timezone.utc),
                )
            )
            await db.commit()
