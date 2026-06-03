from __future__ import annotations

import json
from copy import deepcopy

import pytest

from app.services.llm_client import LLMClient
from app.workflows.reviewer_initial_analysis.runner import ReviewerInitialAnalysisRunner
from app.workflows.reviewer_initial_analysis.schemas import (
    ReviewerInitialAnalysisArtifact,
    ReviewerInitialAnalysisResolveRequest,
)
from app.workflows.submission_gating.models.facts import ExtractedDocument

from tests.test_reviewer_initial_analysis_models import make_artifact_payload, make_request_payload


class _FakeRepo:
    def __init__(self) -> None:
        self.matching_artifact = None
        self.latest_artifact = None
        self.completed_runs = []
        self.failed_runs = []

    async def get_matching_artifact(self, **_kwargs):
        return deepcopy(self.matching_artifact)

    async def get_latest_artifact_for_scope(self, **_kwargs):
        return deepcopy(self.latest_artifact)

    async def save_completed_run(self, **kwargs):
        self.completed_runs.append(kwargs)

    async def save_failed_run(self, **kwargs):
        self.failed_runs.append(kwargs)


class _StructuredLLM:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    async def complete_structured(self, **kwargs):
        self.calls.append(kwargs)
        return self.payload


def _make_valid_request(*, action: str = "lookup", fingerprint: str = "sha256:test", payload: dict | None = None):
    raw = deepcopy(payload) if payload is not None else make_request_payload(action=action)
    raw["submission_state_fingerprint"] = fingerprint
    return ReviewerInitialAnalysisResolveRequest.model_validate(raw)


def _make_extracted_document(raw_text: str = "Intro text. Method text. Result text.") -> ExtractedDocument:
    return ExtractedDocument(
        format="pdf",
        raw_text=raw_text,
        sections=["Introduction", "Method", "Results"],
        title="Reliable Systems for Conferences",
        abstract="We propose a structured reviewer initial analysis workflow.",
        page_count=8,
        table_count=1,
        figure_count=2,
        text_coverage_ratio=0.8,
        reference_count=12,
    )


@pytest.mark.asyncio
async def test_runner_lookup_returns_idle_without_cache() -> None:
    request = _make_valid_request(action="lookup")
    runner = ReviewerInitialAnalysisRunner(repo=_FakeRepo(), llm_client=_StructuredLLM(payload=None))

    response = await runner.resolve(request=request)

    assert response.status == "idle"
    assert response.artifact is None


@pytest.mark.asyncio
async def test_runner_lookup_returns_stale_latest_artifact() -> None:
    request = _make_valid_request(action="lookup")
    repo = _FakeRepo()
    repo.latest_artifact = {
        "run_id": "run-old",
        "submission_state_fingerprint": "sha256:older",
        "artifact": make_artifact_payload(),
    }
    runner = ReviewerInitialAnalysisRunner(repo=repo, llm_client=_StructuredLLM(payload=None))

    response = await runner.resolve(request=request)

    assert response.status == "stale"
    assert response.cache.hit is False
    assert response.artifact is not None
    assert response.artifact.briefing.submission_snapshot.title == "A Test Paper"
    assert response.artifact.annotations.sections


@pytest.mark.asyncio
async def test_runner_generate_extracts_document_once_and_calls_llm_once(monkeypatch) -> None:
    request = _make_valid_request(action="generate")
    extract_calls = []

    def _extract_once(*args, **kwargs):
        extract_calls.append((args, kwargs))
        return _make_extracted_document(raw_text=" repeated   text " + ("content " * 4000) + " repeated text ")

    monkeypatch.setattr("app.workflows.reviewer_initial_analysis.runner.extract_document", _extract_once)

    llm = _StructuredLLM(payload=make_artifact_payload())
    runner = ReviewerInitialAnalysisRunner(repo=_FakeRepo(), llm_client=llm)

    response = await runner.resolve(request=request, file_bytes=b"%PDF-1.4", filename="submission.pdf")

    assert response.status == "ready"
    assert len(extract_calls) == 1
    assert len(llm.calls) == 1
    assert llm.calls[0]["response_model"] is ReviewerInitialAnalysisArtifact
    messages = llm.calls[0]["messages"]
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    normalized = messages[-1]["content"]
    assert "prompt_version" not in normalized
    assert "discussion_context" not in normalized
    assert "rebuttal_context" not in normalized
    assert '"domain_tags":["testing"]' in normalized
    assert "repeated   text" not in normalized
    assert "review_readiness_hints" in normalized
    assert "baseline_or_comparison_mentions" in normalized


@pytest.mark.asyncio
async def test_runner_generate_saves_completed_unified_artifact(monkeypatch) -> None:
    request = _make_valid_request(action="generate", fingerprint="sha256:completed")
    repo = _FakeRepo()
    monkeypatch.setattr(
        "app.workflows.reviewer_initial_analysis.runner.extract_document",
        lambda *args, **kwargs: _make_extracted_document(),
    )

    runner = ReviewerInitialAnalysisRunner(repo=repo, llm_client=_StructuredLLM(payload=make_artifact_payload()))
    response = await runner.resolve(request=request, file_bytes=b"%PDF-1.4", filename="submission.pdf")

    assert response.status == "ready"
    assert len(repo.completed_runs) == 1
    saved = repo.completed_runs[0]
    assert saved["request_payload"]["domain_tags"] == ["testing"]
    assert saved["artifact_payload"]["artifact"]["briefing"]
    assert saved["artifact_payload"]["artifact"]["annotations"]
    assert saved["stage_records"][-1]["stage_name"] == "persistence"


@pytest.mark.asyncio
async def test_runner_generate_rejects_missing_manuscript() -> None:
    request = _make_valid_request(action="generate")
    repo = _FakeRepo()
    runner = ReviewerInitialAnalysisRunner(repo=repo, llm_client=_StructuredLLM(payload=make_artifact_payload()))

    response = await runner.resolve(request=request)

    assert response.status == "failed"
    assert response.error is not None
    assert response.error.code == "missing_manuscript"
    assert len(repo.failed_runs) == 1


@pytest.mark.asyncio
async def test_runner_generate_rejects_low_text_coverage(monkeypatch) -> None:
    request = _make_valid_request(action="generate")
    repo = _FakeRepo()

    monkeypatch.setattr(
        "app.workflows.reviewer_initial_analysis.runner.extract_document",
        lambda *args, **kwargs: ExtractedDocument(
            format="pdf",
            raw_text="",
            sections=[],
            title=None,
            abstract=None,
            page_count=3,
            table_count=0,
            figure_count=0,
            text_coverage_ratio=0.0,
            reference_count=0,
        ),
    )

    runner = ReviewerInitialAnalysisRunner(repo=repo, llm_client=_StructuredLLM(payload=make_artifact_payload()))
    response = await runner.resolve(request=request, file_bytes=b"%PDF-1.4", filename="submission.pdf")

    assert response.status == "failed"
    assert response.error is not None
    assert response.error.code == "low_text_coverage"
    assert len(repo.failed_runs) == 1


@pytest.mark.asyncio
async def test_runner_populates_fallback_readiness_signals_when_model_returns_empty_list(monkeypatch) -> None:
    request = _make_valid_request(action="generate")
    monkeypatch.setattr(
        "app.workflows.reviewer_initial_analysis.runner.extract_document",
        lambda *args, **kwargs: _make_extracted_document(),
    )

    payload = make_artifact_payload()
    payload["briefing"]["review_readiness_signals"] = []

    runner = ReviewerInitialAnalysisRunner(repo=_FakeRepo(), llm_client=_StructuredLLM(payload=payload))
    response = await runner.resolve(request=request, file_bytes=b"%PDF-1.4", filename="submission.pdf")

    assert response.status == "ready"
    assert response.artifact is not None
    assert len(response.artifact.briefing.review_readiness_signals) >= 6
    assert any(item.label == "Reproducibility path" for item in response.artifact.briefing.review_readiness_signals)


@pytest.mark.asyncio
async def test_structured_completion_uses_unified_response_model_when_supported(monkeypatch) -> None:
    calls = []

    async def _fake_acompletion(**kwargs):
        calls.append(kwargs)
        return {"choices": [{"message": {"content": json.dumps(make_artifact_payload())}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: _fake_acompletion)
    client = LLMClient(api_key="test", model="openrouter/google/gemini-2.5-flash-lite")

    artifact = await client.complete_structured(
        messages=[{"role": "system", "content": "Return the schema."}],
        response_model=ReviewerInitialAnalysisArtifact,
    )

    assert artifact.briefing.submission_snapshot.title == "A Test Paper"
    assert artifact.annotations.sections
    assert "response_format" in calls[0]
    assert calls[0]["response_format"]["type"] == "json_schema"
