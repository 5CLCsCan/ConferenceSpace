from __future__ import annotations

from dataclasses import asdict
import hashlib
import logging
import inspect
import json
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

from app.workflows.submission_gating.models.state import GatingState, StageError, StageRecord
from app.workflows.submission_gating.schemas import GatingRunRequest, GatingRunResponse
from app.workflows.submission_gating.stages import (
    binary_integrity,
    content_evaluation,
    document_extraction,
    fact_derivation,
    format_compliance,
    guidance_rendering,
    intake_normalization,
    persistence_audit,
    policy_evaluation,
    verdict_mapping,
)

logger = logging.getLogger(__name__)


class SubmissionGatingRunner:
    def __init__(self, *, repo, llm_client) -> None:
        self._repo = repo
        self._llm_client = llm_client

    async def run(self, *, request: GatingRunRequest, file_bytes: bytes, filename: str) -> GatingRunResponse:
        run_started_at = perf_counter()
        state = await self._execute(
            None,
            "intake_normalization",
            intake_normalization.run,
            request,
            file_bytes=file_bytes,
            filename=filename,
        )
        self._log_run_started(state)
        state = await self._execute(state, "binary_integrity", binary_integrity.run, file_bytes=file_bytes)
        if state.verdict_bundle and state.verdict_bundle.verdict == "block":
            return await self._finalize_blocked_or_failed(state, run_started_at=run_started_at)

        state = await self._execute(state, "document_extraction", document_extraction.run, file_bytes=file_bytes)
        if state.verdict_bundle and state.verdict_bundle.verdict == "block":
            return await self._finalize_blocked_or_failed(state, run_started_at=run_started_at)

        state = await self._execute(state, "format_compliance", format_compliance.run, file_bytes=file_bytes)

        state = await self._execute(state, "fact_derivation", fact_derivation.run)

        if not state.policy_snapshot.desk_rejection_settings.enabled:
            state.determinism_metadata["gating_disabled_note"] = "Submission gating is disabled for this conference."
            self._record_skip(state, "content_evaluation", reason="gating disabled")
            self._record_skip(state, "policy_evaluation", reason="gating disabled")
        else:
            prompt = state.policy_snapshot.desk_rejection_settings.steering_prompt
            if prompt:
                state = await self._execute(
                    state,
                    "content_evaluation",
                    content_evaluation.run,
                    llm_client=self._llm_client,
                )
            else:
                self._record_skip(state, "content_evaluation", reason="no steering prompt")
            state = await self._execute(state, "policy_evaluation", policy_evaluation.run)

        state = await self._execute(state, "verdict_mapping", verdict_mapping.run)
        state = await self._execute(state, "guidance_rendering", guidance_rendering.run)
        state = await self._execute(state, "persistence_audit", persistence_audit.run, repo=self._repo)
        if hasattr(self._repo, "sync_persisted_state"):
            await self._repo.sync_persisted_state(state)
        response = self._build_response(state)
        self._log_run_finished(state, response, run_started_at=run_started_at)
        return response

    async def get_run(self, run_id: str) -> GatingRunResponse | None:
        stored = await self._repo.get_run(run_id)
        if stored is None:
            return None
        if isinstance(stored, GatingRunResponse):
            return stored
        if isinstance(stored, GatingState):
            return self._build_response(stored)
        return GatingRunResponse.model_validate(stored)

    async def _finalize_blocked_or_failed(self, state: GatingState, *, run_started_at: float) -> GatingRunResponse:
        state = await self._execute(state, "guidance_rendering", guidance_rendering.run)
        state = await self._execute(state, "persistence_audit", persistence_audit.run, repo=self._repo)
        if hasattr(self._repo, "sync_persisted_state"):
            await self._repo.sync_persisted_state(state)
        response = self._build_response(state)
        self._log_run_finished(state, response, run_started_at=run_started_at)
        return response

    async def _execute(self, state: GatingState | None, stage_name: str, handler, *args, **kwargs) -> GatingState:
        start = perf_counter()
        input_hash = _hash_payload(_serialize_stage_input(state, args, kwargs))
        self._log_stage_started(stage_name, state, args, kwargs)
        try:
            result = handler(*args, **kwargs) if state is None else handler(state, *args, **kwargs)
            if inspect.isawaitable(result):
                result = await result
        except Exception as exc:  # noqa: BLE001
            if state is None:
                raise
            duration_ms = max(0, int((perf_counter() - start) * 1000))
            state.error = StageError(stage_name=stage_name, message=str(exc))
            state.stage_timings[f"{stage_name}_ms"] = duration_ms
            state.stage_records.append(
                StageRecord(
                    stage_name=stage_name,
                    status="failed",
                    input_hash=input_hash,
                    output_hash=None,
                    duration_ms=duration_ms,
                    detail={"error": str(exc)},
                )
            )
            self._log_stage_failed(state, stage_name, duration_ms=duration_ms, error_message=str(exc))
            return state

        duration_ms = max(0, int((perf_counter() - start) * 1000))
        result.stage_timings[f"{stage_name}_ms"] = duration_ms
        status = "ok"
        if result.error is not None:
            status = "failed"
        elif result.verdict_bundle and result.verdict_bundle.verdict == "block" and stage_name in {
            "binary_integrity",
            "document_extraction",
        }:
            status = "blocked"
        result.stage_records.append(
            StageRecord(
                stage_name=stage_name,
                status=status,
                input_hash=input_hash,
                output_hash=_hash_payload(_serialize_state_snapshot(result)),
                duration_ms=duration_ms,
                detail={"verdict": result.verdict_bundle.verdict if result.verdict_bundle else None},
            )
        )
        self._log_stage_finished(result, stage_name, duration_ms=duration_ms, status=status)
        return result

    def _record_skip(self, state: GatingState, stage_name: str, *, reason: str) -> None:
        state.stage_timings[f"{stage_name}_ms"] = 0
        state.stage_records.append(
            StageRecord(
                stage_name=stage_name,
                status="skipped",
                duration_ms=0,
                detail={"reason": reason},
            )
        )
        self._log_stage_skipped(state, stage_name, reason=reason)

    def _build_response(self, state: GatingState) -> GatingRunResponse:
        verdict = "error"
        decision = None
        score = None
        summary = {"total_findings": 0, "blocking_count": 0, "warning_count": 0, "pass_count": 0}
        if state.verdict_bundle is not None:
            verdict = state.verdict_bundle.verdict
            decision = state.verdict_bundle.decision
            score = state.verdict_bundle.score
            summary = state.verdict_bundle.summary

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

        return GatingRunResponse.model_validate(
            {
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
        )

    def _log_run_started(self, state: GatingState) -> None:
        fields = _log_fields(state)
        logger.info(
            "submission_gating.run_started run_id=%s conference_id=%s submission_id=%s mode=%s source=%s filename=%s",
            fields["run_id"],
            fields["conference_id"],
            fields["submission_id"],
            fields["mode"],
            fields["source"],
            fields["upload_filename"],
            extra={"event": "submission_gating.run_started", **fields},
        )

    def _log_run_finished(self, state: GatingState, response: GatingRunResponse, *, run_started_at: float) -> None:
        fields = _log_fields(state)
        duration_ms = max(0, int((perf_counter() - run_started_at) * 1000))
        logger.info(
            "submission_gating.run_finished run_id=%s conference_id=%s submission_id=%s mode=%s source=%s filename=%s verdict=%s duration_ms=%s",
            fields["run_id"],
            fields["conference_id"],
            fields["submission_id"],
            fields["mode"],
            fields["source"],
            fields["upload_filename"],
            response.verdict,
            duration_ms,
            extra={"event": "submission_gating.run_finished", "duration_ms": duration_ms, "verdict": response.verdict, **fields},
        )

    def _log_stage_started(self, stage_name: str, state: GatingState | None, args: tuple[Any, ...], kwargs: dict[str, Any]) -> None:
        fields = _log_fields(state, args=args, kwargs=kwargs)
        logger.info(
            "submission_gating.stage_started run_id=%s stage_name=%s conference_id=%s submission_id=%s mode=%s source=%s filename=%s",
            fields["run_id"],
            stage_name,
            fields["conference_id"],
            fields["submission_id"],
            fields["mode"],
            fields["source"],
            fields["upload_filename"],
            extra={"event": "submission_gating.stage_started", "stage_name": stage_name, **fields},
        )

    def _log_stage_finished(self, state: GatingState, stage_name: str, *, duration_ms: int, status: str) -> None:
        fields = _log_fields(state)
        verdict = state.verdict_bundle.verdict if state.verdict_bundle else None
        logger.info(
            "submission_gating.stage_finished run_id=%s stage_name=%s conference_id=%s submission_id=%s mode=%s source=%s filename=%s status=%s verdict=%s duration_ms=%s",
            fields["run_id"],
            stage_name,
            fields["conference_id"],
            fields["submission_id"],
            fields["mode"],
            fields["source"],
            fields["upload_filename"],
            status,
            verdict,
            duration_ms,
            extra={
                "event": "submission_gating.stage_finished",
                "stage_name": stage_name,
                "duration_ms": duration_ms,
                "status": status,
                "verdict": verdict,
                **fields,
            },
        )

    def _log_stage_failed(self, state: GatingState, stage_name: str, *, duration_ms: int, error_message: str) -> None:
        fields = _log_fields(state)
        logger.error(
            "submission_gating.stage_failed run_id=%s stage_name=%s conference_id=%s submission_id=%s mode=%s source=%s filename=%s duration_ms=%s error=%s",
            fields["run_id"],
            stage_name,
            fields["conference_id"],
            fields["submission_id"],
            fields["mode"],
            fields["source"],
            fields["upload_filename"],
            duration_ms,
            error_message,
            extra={
                "event": "submission_gating.stage_failed",
                "stage_name": stage_name,
                "duration_ms": duration_ms,
                "error_message": error_message,
                **fields,
            },
        )

    def _log_stage_skipped(self, state: GatingState, stage_name: str, *, reason: str) -> None:
        fields = _log_fields(state)
        logger.info(
            "submission_gating.stage_skipped run_id=%s stage_name=%s conference_id=%s submission_id=%s mode=%s source=%s filename=%s reason=%s",
            fields["run_id"],
            stage_name,
            fields["conference_id"],
            fields["submission_id"],
            fields["mode"],
            fields["source"],
            fields["upload_filename"],
            reason,
            extra={"event": "submission_gating.stage_skipped", "stage_name": stage_name, "reason": reason, **fields},
        )


def _serialize_stage_input(state: GatingState | None, args: tuple[Any, ...], kwargs: dict[str, Any]) -> dict[str, Any]:
    payload = {"args_count": len(args), "kwargs": sorted(kwargs)}
    if state is not None:
        payload["run_id"] = state.run_id
        payload["stage_count"] = len(state.stage_records)
    return payload


def _serialize_state_snapshot(state: GatingState) -> dict[str, Any]:
    return {
        "run_id": state.run_id,
        "file_facts": asdict(state.file_facts) if state.file_facts else None,
        "submission_facts": asdict(state.submission_facts) if state.submission_facts else None,
        "rule_findings": [asdict(finding) for finding in state.rule_findings],
        "content_findings": [asdict(finding) for finding in state.content_findings],
        "verdict": asdict(state.verdict_bundle) if state.verdict_bundle else None,
    }


def _hash_payload(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


def _log_fields(
    state: GatingState | None,
    *,
    args: tuple[Any, ...] = (),
    kwargs: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if state is not None:
        return {
            "run_id": state.run_id,
            "conference_id": state.conference_id,
            "submission_id": state.submission_id,
            "mode": state.mode,
            "source": state.source,
            "upload_filename": state.normalized_request.file_metadata.original_filename,
        }

    kwargs = kwargs or {}
    request = args[0] if args and isinstance(args[0], GatingRunRequest) else None
    filename = kwargs.get("filename")
    if request is not None:
        return {
            "run_id": "pending",
            "conference_id": request.conference_id,
            "submission_id": request.submission_id,
            "mode": request.mode,
            "source": request.source,
            "upload_filename": filename or request.file_metadata.original_filename,
        }

    return {
        "run_id": "pending",
        "conference_id": None,
        "submission_id": None,
        "mode": None,
        "source": None,
        "upload_filename": filename,
    }
