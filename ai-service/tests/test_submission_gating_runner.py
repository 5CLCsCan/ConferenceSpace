from __future__ import annotations

import logging

import pytest

from app.workflows.submission_gating.runner import SubmissionGatingRunner
from app.workflows.submission_gating.schemas import GatingRunRequest

from tests.submission_gating_helpers import MINIMAL_PDF_BYTES, make_request_payload


class _FakeRepo:
    def __init__(self) -> None:
        self.saved_states = []
        self.runs_by_id = {}

    async def save_run(self, state):
        self.saved_states.append(state)
        self.runs_by_id[state.run_id] = state
        return state

    async def get_run(self, run_id: str):
        return self.runs_by_id.get(run_id)


class _NoopLLM:
    async def complete_json(self, *_args, **_kwargs):
        return []


@pytest.mark.asyncio
async def test_runner_skips_content_and_policy_when_gating_disabled() -> None:
    request = GatingRunRequest.model_validate(
        make_request_payload(
            enabled=False,
            prompt_fragments=["This should be ignored because gating is disabled."],
        )
    )
    repo = _FakeRepo()
    runner = SubmissionGatingRunner(repo=repo, llm_client=_NoopLLM())

    response = await runner.run(
        request=request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )

    assert response.verdict == "pass"
    assert response.findings
    assert any("disabled" in finding.message.lower() for finding in response.findings)
    assert repo.saved_states[-1].content_findings == []
    assert repo.saved_states[-1].rule_findings == []


@pytest.mark.asyncio
async def test_runner_persists_blocked_run_with_stage_timings() -> None:
    request = GatingRunRequest.model_validate(
        make_request_payload(
            original_filename="slides.pptx",
            content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
    )
    repo = _FakeRepo()
    runner = SubmissionGatingRunner(repo=repo, llm_client=_NoopLLM())

    response = await runner.run(
        request=request,
        file_bytes=b"not a paper",
        filename="slides.pptx",
    )

    assert response.verdict == "block"
    assert response.stage_timings
    assert repo.saved_states[-1].verdict_bundle is not None
    assert repo.saved_states[-1].verdict_bundle.verdict == "block"


@pytest.mark.asyncio
async def test_runner_get_run_returns_persisted_state() -> None:
    request = GatingRunRequest.model_validate(make_request_payload(enabled=False))
    repo = _FakeRepo()
    runner = SubmissionGatingRunner(repo=repo, llm_client=_NoopLLM())

    created = await runner.run(
        request=request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )
    fetched = await runner.get_run(created.run_id)

    assert fetched is not None
    assert fetched.run_id == created.run_id
    assert fetched.verdict == created.verdict


@pytest.mark.asyncio
async def test_runner_logs_stage_lifecycle(caplog: pytest.LogCaptureFixture) -> None:
    request = GatingRunRequest.model_validate(
        make_request_payload(
            enabled=False,
            prompt_fragments=["This should be ignored because gating is disabled."],
        )
    )
    repo = _FakeRepo()
    runner = SubmissionGatingRunner(repo=repo, llm_client=_NoopLLM())

    caplog.set_level(logging.INFO, logger="app.workflows.submission_gating.runner")

    await runner.run(
        request=request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )

    events = [getattr(record, "event", None) for record in caplog.records]
    assert "submission_gating.run_started" in events
    assert "submission_gating.run_finished" in events

    started_stages = [
        record.stage_name
        for record in caplog.records
        if getattr(record, "event", None) == "submission_gating.stage_started"
    ]
    finished_stages = [
        record.stage_name
        for record in caplog.records
        if getattr(record, "event", None) == "submission_gating.stage_finished"
    ]
    skipped_stages = [
        record.stage_name
        for record in caplog.records
        if getattr(record, "event", None) == "submission_gating.stage_skipped"
    ]

    assert started_stages == [
        "intake_normalization",
        "binary_integrity",
        "format_compliance",
        "document_extraction",
        "fact_derivation",
        "verdict_mapping",
        "guidance_rendering",
        "persistence_audit",
    ]
    assert finished_stages == started_stages
    assert skipped_stages == ["content_evaluation", "policy_evaluation"]
