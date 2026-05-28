from __future__ import annotations

import json

import pytest

from app.workflows.review_quality_auditor.runner import ReviewQualityAuditRunner
from app.workflows.review_quality_auditor.schemas import (
    ReviewQualityAuditModelResponse,
    ReviewQualityAuditResolveRequest,
)

from tests.test_review_quality_audit_models import make_request_payload


class _FakeRepo:
    def __init__(self) -> None:
        self.completed_runs = []
        self.failed_runs = []

    async def save_completed_run(self, **kwargs):
        self.completed_runs.append(kwargs)

    async def save_failed_run(self, **kwargs):
        self.failed_runs.append(kwargs)


class _FakeLLMClient:
    def __init__(
        self,
        response: ReviewQualityAuditModelResponse | None = None,
        error: Exception | None = None,
    ) -> None:
        self._response = response or _make_model_response()
        self._error = error
        self.calls = []

    async def complete_structured(
        self, *, messages, response_model, max_validation_retries=1
    ):
        self.calls.append(
            {
                "messages": messages,
                "response_model": response_model,
                "max_validation_retries": max_validation_retries,
            }
        )
        if self._error is not None:
            raise self._error
        return self._response


def _make_model_response(findings: list[dict] | None = None) -> ReviewQualityAuditModelResponse:
    return ReviewQualityAuditModelResponse(
        evaluation={
            "summary": "The review gives a coherent quality signal.",
            "evidence_engagement": "It engages the submission at a concrete enough level.",
            "consistency_assessment": "The recommendation, confidence, and narrative are aligned.",
            "improvement_focus": "Keep the review anchored to paper-specific evidence.",
        },
        findings=findings or [],
    )


def _make_request(**kwargs) -> ReviewQualityAuditResolveRequest:
    payload = make_request_payload(**kwargs)
    return ReviewQualityAuditResolveRequest.model_validate(payload)


@pytest.mark.asyncio
async def test_runner_passes_when_llm_returns_no_findings() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient()
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    response = await runner.resolve(request=_make_request(include_briefing=False))

    assert response.status == "pass"
    assert response.findings == []
    assert len(repo.completed_runs) == 1
    assert llm_client.calls[0]["response_model"] is ReviewQualityAuditModelResponse


@pytest.mark.asyncio
async def test_runner_downgrades_blocking_findings_for_draft_mode() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient(
        _make_model_response(
            [
                {
                    "code": "justification.recommendation_unsupported",
                    "severity": "blocking",
                    "field": "recommendation",
                    "condition_summary": "reject recommendation not supported by written weaknesses",
                    "message": "The written review does not explain why the paper should be rejected.",
                    "rationale": "The finding is raised because the recommendation is stronger than the weaknesses described in the review.",
                    "suggestion": "State the concrete weaknesses that lead to the rejection recommendation.",
                }
            ]
        )
    )
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    response = await runner.resolve(
        request=_make_request(mode="draft_save", include_briefing=False)
    )

    assert response.status == "warn"
    assert response.findings[0].severity == "warning"
    assert response.findings[0].condition_fingerprint.startswith("sha256:")


@pytest.mark.asyncio
async def test_runner_preserves_blocking_for_submit_ready_severe_findings() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient(
        _make_model_response(
            [
                {
                    "code": "quality.review_too_generic_to_submit",
                    "severity": "blocking",
                    "field": "review",
                    "condition_summary": "review stays generic and does not discuss the paper concretely",
                    "message": "The review remains too generic to function as a usable academic review.",
                    "rationale": "The finding is raised because the review uses broad quality claims without tying them to the submission's actual method or evidence.",
                    "suggestion": "Add paper-specific reasoning tied to the submission's actual claims, strengths, and weaknesses.",
                }
            ]
        )
    )
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    response = await runner.resolve(
        request=_make_request(mode="submit_enforcement", include_briefing=False)
    )

    assert response.status == "block"
    assert response.findings[0].severity == "blocking"


@pytest.mark.asyncio
async def test_runner_promotes_submit_fatal_consistency_codes_even_if_model_marks_warning() -> (
    None
):
    repo = _FakeRepo()
    llm_client = _FakeLLMClient(
        _make_model_response(
            [
                {
                    "code": "consistency.recommendation_narrative_tension",
                    "severity": "warning",
                    "field": "recommendation",
                    "condition_summary": "reject recommendation conflicts with otherwise positive review reasoning",
                    "message": "The reject recommendation conflicts with the positive narrative and high-scoring review content.",
                    "rationale": "The finding is raised because the review's positive narrative does not explain the stated reject recommendation.",
                    "suggestion": "Either justify the rejection with clearly stated fatal concerns or align the recommendation with the rest of the review.",
                }
            ]
        )
    )
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    response = await runner.resolve(
        request=_make_request(mode="submit_enforcement", include_briefing=False)
    )

    assert response.status == "block"
    assert response.findings[0].severity == "blocking"


@pytest.mark.asyncio
async def test_runner_keeps_nonfatal_submit_findings_as_warnings() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient(
        _make_model_response(
            [
                {
                    "code": "consistency.confidence_support_tension",
                    "severity": "blocking",
                    "field": "confidence",
                    "condition_summary": "high confidence exceeds the specificity of the written review",
                    "message": "The confidence level is higher than the depth of the written technical critique.",
                    "rationale": "The finding is raised because the high confidence is not matched by concrete technical engagement in the narrative.",
                    "suggestion": "Either lower confidence or add more detailed technical reasoning.",
                }
            ]
        )
    )
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    response = await runner.resolve(
        request=_make_request(mode="submit_enforcement", include_briefing=False)
    )

    assert response.status == "warn"
    assert response.findings[0].severity == "warning"


@pytest.mark.asyncio
async def test_runner_includes_optional_briefing_context_only_when_available() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient()
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    await runner.resolve(request=_make_request(include_briefing=True))
    with_briefing_payload = json.loads(llm_client.calls[0]["messages"][1]["content"])
    assert with_briefing_payload["briefing_context"] is not None

    llm_client.calls.clear()
    await runner.resolve(request=_make_request(include_briefing=False))
    without_briefing_payload = json.loads(llm_client.calls[0]["messages"][1]["content"])
    assert without_briefing_payload["briefing_context"] is None


@pytest.mark.asyncio
async def test_runner_returns_fallback_when_llm_raises() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient(error=RuntimeError("llm down"))
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    response = await runner.resolve(request=_make_request(include_briefing=False))

    assert response.status == "pass"
    assert len(repo.failed_runs) == 1
    assert len(repo.completed_runs) == 1


@pytest.mark.asyncio
async def test_runner_fallback_blocks_inconsistent_positive_review() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient(error=RuntimeError("llm down"))
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    request = _make_request(include_briefing=False)
    request.review.recommendation = "strong_accept"
    request.review.confidence = "high"
    request.review.feedback.summary = (
        "The paper should be strongly accepted, although the proposed similarity "
        "metric is not clearly validated and the experiments do not fully support "
        "the main claim."
    )
    request.review.feedback.strengths = "The topic is interesting."
    request.review.feedback.weaknesses = (
        "The evaluation is limited and the claimed improvement is not well supported."
    )

    response = await runner.resolve(request=request)

    assert response.status == "block"
    assert any(
        finding.code == "consistency.recommendation_narrative_tension"
        for finding in response.findings
    )


@pytest.mark.asyncio
async def test_runner_returns_obvious_block_without_llm_call() -> None:
    repo = _FakeRepo()
    llm_client = _FakeLLMClient()
    runner = ReviewQualityAuditRunner(repo=repo, llm_client=llm_client)

    request = _make_request(include_briefing=False)
    request.review.recommendation = "strong_accept"
    request.review.feedback.summary = (
        "The paper should be strongly accepted, although the proposed metric is not validated."
    )
    request.review.feedback.strengths = "The topic is interesting."
    request.review.feedback.weaknesses = "The evaluation is missing and the claim is unsupported."

    response = await runner.resolve(request=request)

    assert response.status == "block"
    assert llm_client.calls == []
