from __future__ import annotations

import json
from copy import deepcopy

import pytest

from app.services.llm_client import LLMClient
from app.workflows.reviewer_pre_read_briefing.runner import ReviewerPreReadBriefingRunner
from app.workflows.reviewer_pre_read_briefing.schemas import ReviewerBriefingResolveRequest
from app.workflows.submission_gating.models.facts import ExtractedDocument

from tests.test_reviewer_briefing_models import make_artifact_payload, make_request_payload


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
    raw = deepcopy(payload) if payload is not None else make_request_payload(action=action, fingerprint=fingerprint)
    return ReviewerBriefingResolveRequest.model_validate(raw)


def _make_extracted_document(raw_text: str = "Intro text. Method text. Result text.") -> ExtractedDocument:
    return ExtractedDocument(
        format="pdf",
        raw_text=raw_text,
        sections=["Introduction", "Method", "Results"],
        title="Reliable Systems for Conferences",
        abstract="We propose a structured reviewer pre-read workflow.",
        page_count=8,
        table_count=1,
        figure_count=2,
        text_coverage_ratio=0.8,
        reference_count=12,
    )


@pytest.mark.asyncio
async def test_runner_lookup_returns_idle_without_cache() -> None:
    request = _make_valid_request(action="lookup")
    repo = _FakeRepo()
    runner = ReviewerPreReadBriefingRunner(repo=repo, llm_client=_StructuredLLM(payload=None))

    response = await runner.resolve(request=request)

    assert response.status == "idle"
    assert response.artifact is None


@pytest.mark.asyncio
async def test_runner_generate_returns_cached_ready_when_fingerprint_matches() -> None:
    request = _make_valid_request(action="generate")
    repo = _FakeRepo()
    repo.matching_artifact = {
        "run_id": "run-1",
        "status": "ready",
        "cache": {
            "hit": True,
            "submission_state_fingerprint": request.submission_state_fingerprint,
        },
        "artifact": make_artifact_payload(),
    }
    llm = _StructuredLLM(payload=None)
    runner = ReviewerPreReadBriefingRunner(repo=repo, llm_client=llm)

    response = await runner.resolve(
        request=request,
        file_bytes=b"%PDF-1.4",
        filename="submission.pdf",
    )

    assert response.status == "ready"
    assert response.cache.hit is True
    assert llm.calls == []


@pytest.mark.asyncio
async def test_runner_lookup_returns_stale_when_scope_has_older_artifact() -> None:
    request = _make_valid_request(action="lookup")
    repo = _FakeRepo()
    repo.latest_artifact = {
        "run_id": "run-old",
        "submission_state_fingerprint": "sha256:older",
        "artifact": make_artifact_payload(),
    }
    runner = ReviewerPreReadBriefingRunner(repo=repo, llm_client=_StructuredLLM(payload=None))

    response = await runner.resolve(request=request)

    assert response.status == "stale"
    assert response.cache.hit is False
    assert response.artifact is not None


@pytest.mark.asyncio
async def test_runner_generate_preprocesses_submission_and_manuscript_before_llm_call(monkeypatch) -> None:
    payload = make_request_payload(action="generate", fingerprint="sha256:preprocessed")
    payload["submission"]["keywords"] = ["Review", "review", " workflow ", "workflow"]
    payload["submission"]["abstract"] = "  " + ("abstract text " * 500)
    request = _make_valid_request(action="generate", payload=payload)

    monkeypatch.setattr(
        "app.workflows.reviewer_pre_read_briefing.runner.extract_document",
        lambda *args, **kwargs: _make_extracted_document(
            raw_text=" repeated   text " + ("content " * 4000) + " repeated text "
        ),
    )

    llm = _StructuredLLM(payload=make_artifact_payload())
    runner = ReviewerPreReadBriefingRunner(repo=_FakeRepo(), llm_client=llm)

    response = await runner.resolve(
        request=request,
        file_bytes=b"%PDF-1.4",
        filename="submission.pdf",
    )

    assert response.status == "ready"
    messages = llm.calls[0]["messages"]
    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    normalized = messages[-1]["content"]
    assert "prompt_version" not in normalized
    assert "discussion_context" not in normalized
    assert "rebuttal_context" not in normalized
    assert '"keywords":["review","workflow"]' in normalized
    assert "repeated   text" not in normalized
    assert "review_readiness_hints" in normalized
    assert "baseline_or_comparison_mentions" in normalized


@pytest.mark.asyncio
async def test_runner_populates_fallback_readiness_signals_when_model_returns_none(monkeypatch) -> None:
    request = _make_valid_request(action="generate")

    monkeypatch.setattr(
        "app.workflows.reviewer_pre_read_briefing.runner.extract_document",
        lambda *args, **kwargs: _make_extracted_document(),
    )

    payload = make_artifact_payload()
    payload["review_readiness_signals"] = []

    runner = ReviewerPreReadBriefingRunner(repo=_FakeRepo(), llm_client=_StructuredLLM(payload=payload))
    response = await runner.resolve(
        request=request,
        file_bytes=b"%PDF-1.4",
        filename="submission.pdf",
    )

    assert response.status == "ready"
    assert response.artifact is not None
    assert len(response.artifact.review_readiness_signals) >= 6
    assert any(item.label == "Reproducibility path" for item in response.artifact.review_readiness_signals)


@pytest.mark.asyncio
async def test_runner_generate_fails_when_text_coverage_is_too_low(monkeypatch) -> None:
    request = _make_valid_request(action="generate")
    repo = _FakeRepo()

    monkeypatch.setattr(
        "app.workflows.reviewer_pre_read_briefing.runner.extract_document",
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

    runner = ReviewerPreReadBriefingRunner(repo=repo, llm_client=_StructuredLLM(payload=make_artifact_payload()))
    response = await runner.resolve(
        request=request,
        file_bytes=b"%PDF-1.4",
        filename="submission.pdf",
    )

    assert response.status == "failed"
    assert response.error is not None
    assert response.error.code == "low_text_coverage"


@pytest.mark.asyncio
async def test_structured_completion_uses_native_response_format_when_supported(monkeypatch) -> None:
    calls = []

    async def _fake_acompletion(**kwargs):
        calls.append(kwargs)
        return {"choices": [{"message": {"content": json.dumps(make_artifact_payload())}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: _fake_acompletion)
    client = LLMClient(api_key="test", model="openrouter/google/gemini-2.5-flash-lite")

    from app.workflows.reviewer_pre_read_briefing.schemas import ReviewerBriefingArtifact

    artifact = await client.complete_structured(
        messages=[{"role": "system", "content": "Return the schema."}],
        response_model=ReviewerBriefingArtifact,
    )

    assert artifact.submission_snapshot.title == "Reliable Systems for Conferences"
    assert "response_format" in calls[0]
    assert calls[0]["response_format"]["type"] == "json_schema"


@pytest.mark.asyncio
async def test_structured_completion_retries_once_then_fails_validation(monkeypatch) -> None:
    calls = []

    async def _fake_acompletion(**kwargs):
        calls.append(kwargs)
        return {"choices": [{"message": {"content": "{\"bad\": true}"}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: _fake_acompletion)
    client = LLMClient(api_key="test", model="openrouter/google/gemini-2.5-flash-lite")

    from app.workflows.reviewer_pre_read_briefing.schemas import ReviewerBriefingArtifact

    with pytest.raises(Exception):
        await client.complete_structured(
            messages=[{"role": "system", "content": "Return the schema."}],
            response_model=ReviewerBriefingArtifact,
        )

    assert len(calls) == 2
    assert "corrective" in json.dumps(calls[1]["messages"]).lower()


@pytest.mark.asyncio
async def test_structured_completion_falls_back_without_native_response_format(monkeypatch) -> None:
    calls = []

    async def _fake_acompletion(**kwargs):
        calls.append(kwargs)
        return {"choices": [{"message": {"content": json.dumps(make_artifact_payload())}}]}

    monkeypatch.setattr("app.services.llm_client._get_acompletion", lambda: _fake_acompletion)
    client = LLMClient(api_key="test", model="local/model-without-native-schema")

    from app.workflows.reviewer_pre_read_briefing.schemas import ReviewerBriefingArtifact

    artifact = await client.complete_structured(
        messages=[{"role": "system", "content": "Return the schema."}],
        response_model=ReviewerBriefingArtifact,
    )

    assert artifact.submission_snapshot.title == "Reliable Systems for Conferences"
    assert "response_format" not in calls[0]
