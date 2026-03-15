from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.models import GatingRun, GatingStageRecord
from app.workflows.submission_gating.models.state import GatingState


class GatingRunRepository:
    def __init__(self, session_factory: async_sessionmaker) -> None:
        self._session_factory = session_factory

    async def save_run(self, state: GatingState) -> None:
        async with self._session_factory() as db:
            run = await db.get(GatingRun, state.run_id)
            payload = _response_payload_from_state(state)
            if run is None:
                run = GatingRun(
                    id=state.run_id,
                    conference_id=state.conference_id,
                    submission_id=state.submission_id,
                    actor_id=state.actor.user_id,
                    mode=state.mode,
                    source=state.source,
                    verdict=payload["verdict"],
                    decision=payload["decision"],
                    score=payload["score"],
                    policy_hash=state.policy_hash,
                    input_fingerprint=state.input_fingerprint,
                    error_detail=asdict(state.error) if state.error else None,
                    completed_at=datetime.now(tz=timezone.utc),
                )
                db.add(run)
            else:
                run.verdict = payload["verdict"]
                run.decision = payload["decision"]
                run.score = payload["score"]
                run.error_detail = asdict(state.error) if state.error else None
                run.completed_at = datetime.now(tz=timezone.utc)

            existing_stage_names = {
                row.stage_name
                for row in (
                    await db.execute(select(GatingStageRecord).where(GatingStageRecord.run_id == state.run_id))
                ).scalars()
            }
            for stage_record in state.stage_records:
                if stage_record.stage_name in existing_stage_names:
                    continue
                db.add(
                    GatingStageRecord(
                        run_id=state.run_id,
                        stage_name=stage_record.stage_name,
                        status=stage_record.status,
                        input_hash=stage_record.input_hash,
                        output_hash=stage_record.output_hash,
                        duration_ms=stage_record.duration_ms,
                        detail=stage_record.detail or {},
                    )
                )

            await db.commit()

    async def sync_persisted_state(self, state: GatingState) -> None:
        async with self._session_factory() as db:
            run = await db.get(GatingRun, state.run_id)
            if run is None:
                return

            payload = _response_payload_from_state(state)
            run.verdict = payload["verdict"]
            run.decision = payload["decision"]
            run.score = payload["score"]
            run.error_detail = asdict(state.error) if state.error else None
            run.completed_at = datetime.now(tz=timezone.utc)

            existing_records = {
                row.stage_name: row
                for row in (
                    await db.execute(select(GatingStageRecord).where(GatingStageRecord.run_id == state.run_id))
                ).scalars()
            }
            for stage_record in state.stage_records:
                row = existing_records.get(stage_record.stage_name)
                detail = dict(stage_record.detail or {})
                if stage_record.stage_name == "persistence_audit":
                    detail["response"] = payload
                if row is None:
                    db.add(
                        GatingStageRecord(
                            run_id=state.run_id,
                            stage_name=stage_record.stage_name,
                            status=stage_record.status,
                            input_hash=stage_record.input_hash,
                            output_hash=stage_record.output_hash,
                            duration_ms=stage_record.duration_ms,
                            detail=detail,
                        )
                    )
                    continue

                row.status = stage_record.status
                row.input_hash = stage_record.input_hash
                row.output_hash = stage_record.output_hash
                row.duration_ms = stage_record.duration_ms
                row.detail = detail

            await db.commit()

    async def get_run(self, run_id: str) -> dict | None:
        async with self._session_factory() as db:
            stage = (
                await db.execute(
                    select(GatingStageRecord)
                    .where(
                        GatingStageRecord.run_id == run_id,
                        GatingStageRecord.stage_name == "persistence_audit",
                    )
                    .order_by(GatingStageRecord.created_at.desc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if stage and stage.detail and stage.detail.get("response"):
                return stage.detail["response"]

            run = await db.get(GatingRun, run_id)
            if run is None:
                return None
            return {
                "run_id": run.id,
                "input_fingerprint": run.input_fingerprint,
                "policy_hash": run.policy_hash,
                "verdict": run.verdict,
                "decision": run.decision,
                "score": run.score,
                "summary": {"total_findings": 0, "blocking_count": 0, "warning_count": 0, "pass_count": 0},
                "findings": [],
                "guidance": [],
                "stage_timings": {},
                "determinism": {},
                "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            }


def _response_payload_from_state(state: GatingState) -> dict:
    guidance_lookup = {(item.rule_id, item.source, item.message): item for item in state.guidance}
    findings = []
    for finding in state.rule_findings:
        guidance = guidance_lookup.get((finding.rule_id, finding.source, finding.message))
        findings.append(
            {
                "rule_id": finding.rule_id,
                "source": finding.source,
                "severity": finding.severity,
                "message": finding.message,
                "evidence": finding.evidence,
                "remediation": guidance.remediation if guidance else None,
            }
        )
    for finding in state.content_findings:
        guidance = guidance_lookup.get((finding.rule_id, finding.source, finding.message))
        findings.append(
            {
                "rule_id": finding.rule_id,
                "source": finding.source,
                "severity": "warn" if finding.severity == "block" else finding.severity,
                "message": finding.message,
                "excerpt": finding.excerpt,
                "remediation": guidance.remediation if guidance else finding.remediation,
            }
        )

    gating_note = state.determinism_metadata.get("gating_disabled_note")
    if gating_note:
        findings.append(
            {
                "rule_id": "gating.disabled",
                "source": "deterministic",
                "severity": "pass",
                "message": gating_note,
                "remediation": "No gating action is required because submission gating is disabled for this conference.",
            }
        )

    verdict = state.verdict_bundle.verdict if state.verdict_bundle else "error"
    decision = state.verdict_bundle.decision if state.verdict_bundle else None
    score = state.verdict_bundle.score if state.verdict_bundle else None
    summary = (
        state.verdict_bundle.summary
        if state.verdict_bundle
        else {"total_findings": 0, "blocking_count": 0, "warning_count": 0, "pass_count": 0}
    )
    if state.error is not None:
        verdict = "error"
        findings.append(
            {
                "rule_id": f"{state.error.stage_name}.error",
                "source": "deterministic",
                "severity": "warn",
                "message": state.error.message,
                "remediation": "Retry the workflow after the service issue is resolved.",
            }
        )

    return {
        "run_id": state.run_id,
        "input_fingerprint": state.input_fingerprint,
        "policy_hash": state.policy_hash,
        "verdict": verdict,
        "decision": decision,
        "score": score,
        "summary": summary,
        "findings": findings,
        "guidance": [asdict(item) for item in state.guidance],
        "stage_timings": {key: int(value) for key, value in state.stage_timings.items()},
        "determinism": dict(state.determinism_metadata),
        "completed_at": datetime.now(tz=timezone.utc).isoformat(),
    }
