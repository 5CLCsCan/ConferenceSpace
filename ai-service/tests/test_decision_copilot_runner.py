from __future__ import annotations

from copy import deepcopy
import json

import pytest

from app.workflows.chair_decision_copilot.runner import DecisionCopilotRunner
from app.workflows.chair_decision_copilot.schemas import DecisionCopilotResolveRequest

from tests.test_decision_copilot_models import make_artifact_payload, make_request_payload


class _FakeRepo:
    def __init__(self) -> None:
        self.current_artifact = None
        self.completed_runs = []
        self.failed_runs = []

    async def get_current_artifact(self, **_kwargs):
        return deepcopy(self.current_artifact)

    async def save_completed_run(self, **kwargs):
        self.completed_runs.append(kwargs)
        self.current_artifact = {
            "run_id": kwargs["response_payload"]["run_id"],
            "evidence_fingerprint": kwargs["response_payload"]["cache"]["evidence_fingerprint"],
            "component_fingerprints": kwargs["request_payload"]["component_fingerprints"],
            "artifact": kwargs["response_payload"]["artifact"],
        }

    async def save_failed_run(self, **kwargs):
        self.failed_runs.append(kwargs)


class _StructuredLLM:
    def __init__(self, payload):
        self.payload = payload
        self.calls = []

    async def complete_structured(self, **kwargs):
        self.calls.append(kwargs)
        return self.payload


def _make_request(*, action: str = "lookup", fingerprint: str = "sha256:test", payload: dict | None = None):
    raw = deepcopy(payload) if payload is not None else make_request_payload(action=action, fingerprint=fingerprint)
    return DecisionCopilotResolveRequest.model_validate(raw)


@pytest.mark.asyncio
async def test_runner_lookup_returns_idle_without_current_artifact() -> None:
    runner = DecisionCopilotRunner(repo=_FakeRepo(), llm_client=_StructuredLLM(payload=None))

    response = await runner.resolve(request=_make_request(action="lookup"))

    assert response.status == "idle"
    assert response.artifact is None


@pytest.mark.asyncio
async def test_runner_generate_returns_cached_ready_when_fingerprint_matches() -> None:
    repo = _FakeRepo()
    repo.current_artifact = {
        "run_id": "run-1",
        "evidence_fingerprint": "sha256:test",
        "component_fingerprints": make_request_payload()["component_fingerprints"],
        "artifact": make_artifact_payload(),
    }
    llm = _StructuredLLM(payload=None)
    runner = DecisionCopilotRunner(repo=repo, llm_client=llm)

    response = await runner.resolve(request=_make_request(action="generate"))

    assert response.status == "ready"
    assert response.cache.hit is True
    assert llm.calls == []


@pytest.mark.asyncio
async def test_runner_lookup_returns_stale_when_review_fingerprint_changes() -> None:
    repo = _FakeRepo()
    current = make_request_payload()
    repo.current_artifact = {
        "run_id": "run-1",
        "evidence_fingerprint": "sha256:old",
        "component_fingerprints": current["component_fingerprints"],
        "artifact": make_artifact_payload(),
    }
    payload = make_request_payload()
    payload["evidence_fingerprint"] = "sha256:new"
    payload["component_fingerprints"]["reviews"] = "sha256:reviews-updated"
    runner = DecisionCopilotRunner(repo=repo, llm_client=_StructuredLLM(payload=None))

    response = await runner.resolve(request=_make_request(action="lookup", payload=payload))

    assert response.status == "stale"
    assert "reviews" in response.cache.stale_reasons
    assert response.artifact is not None


@pytest.mark.asyncio
async def test_runner_regenerate_creates_new_run_even_when_fingerprint_matches() -> None:
    repo = _FakeRepo()
    repo.current_artifact = {
        "run_id": "run-1",
        "evidence_fingerprint": "sha256:test",
        "component_fingerprints": make_request_payload()["component_fingerprints"],
        "artifact": make_artifact_payload(),
    }
    llm = _StructuredLLM(payload=make_artifact_payload())
    runner = DecisionCopilotRunner(repo=repo, llm_client=llm)

    response = await runner.resolve(request=_make_request(action="regenerate"))

    assert response.status == "ready"
    assert response.cache.hit is False
    assert len(repo.completed_runs) == 1
    assert llm.calls != []


@pytest.mark.asyncio
async def test_runner_failed_regenerate_preserves_prior_current_artifact() -> None:
    repo = _FakeRepo()
    repo.current_artifact = {
        "run_id": "run-1",
        "evidence_fingerprint": "sha256:test",
        "component_fingerprints": make_request_payload()["component_fingerprints"],
        "artifact": make_artifact_payload(),
    }

    class _FailingLLM:
        async def complete_structured(self, **_kwargs):
            raise RuntimeError("model unavailable")

    runner = DecisionCopilotRunner(repo=repo, llm_client=_FailingLLM())
    response = await runner.resolve(request=_make_request(action="regenerate"))

    assert response.status == "failed"
    assert response.artifact is not None
    assert response.artifact.evidence_summary.overview.startswith("Available evidence")


@pytest.mark.asyncio
async def test_runner_rebuttal_disabled_resolves_not_applicable() -> None:
    llm = _StructuredLLM(payload=make_artifact_payload())
    runner = DecisionCopilotRunner(repo=_FakeRepo(), llm_client=llm)

    response = await runner.resolve(request=_make_request(action="generate"))

    assert response.status == "ready"
    assert response.artifact is not None
    assert response.artifact.rebuttal_signals.status == "not_applicable"


@pytest.mark.asyncio
async def test_runner_sends_lean_generation_context_to_llm() -> None:
    llm = _StructuredLLM(payload=make_artifact_payload())
    runner = DecisionCopilotRunner(repo=_FakeRepo(), llm_client=llm)

    await runner.resolve(request=_make_request(action="generate"))

    sent_payload = json.loads(llm.calls[0]["messages"][1]["content"])
    assert set(sent_payload) == {"conference_cfp", "submission", "reviews", "discussion", "rebuttal"}
    assert sent_payload["conference_cfp"] == "We invite papers on evidence-aware systems."
    assert sent_payload["submission"] == {
        "title": "Evidence Aware Systems",
        "track": "main",
        "keywords": ["systems", "evidence"],
    }
    assert sent_payload["reviews"][0] == {
        "recommendation": "accept",
        "confidence": "high",
        "score": 8.0,
        "summary": "Promising paper.",
        "strengths": "Novel direction.",
        "weaknesses": "Evaluation breadth.",
        "questions": "How robust is the benchmark set?",
        "criteria": {
            "originality": 8,
            "technical_quality": 6,
            "clarity": 7,
            "significance": 8,
            "methodology": 6,
        },
        "post_rebuttal_score": None,
        "post_rebuttal_recommendation": None,
        "post_rebuttal_comment": None,
    }
    assert sent_payload["discussion"] == {
        "threads": [
            {
                "messages": [
                    {
                        "role": "reviewer",
                        "content": "The evaluation needs stronger baselines.",
                    }
                ]
            }
        ]
    }
    assert sent_payload["rebuttal"] == {
        "general_response": None,
        "points": [],
    }
    assert "schema_version" not in sent_payload
    assert "review_analytics" not in sent_payload
    assert "status" not in sent_payload["submission"]
    assert "last_updated_at" not in sent_payload["submission"]
    assert "reviewer_id" not in sent_payload["reviews"][0]
    assert "submitted_at" not in sent_payload["reviews"][0]
    assert "post_rebuttal_updated_at" not in sent_payload["reviews"][0]
    assert "thread_count" not in sent_payload["discussion"]
    assert "message_count" not in sent_payload["discussion"]
    assert "last_activity_at" not in sent_payload["discussion"]
    assert "title" not in sent_payload["discussion"]["threads"][0]
    assert "visibility" not in sent_payload["discussion"]["threads"][0]
    assert "author_email" not in sent_payload["discussion"]["threads"][0]["messages"][0]
    assert "status" not in sent_payload["rebuttal"]
    assert "assignments" not in sent_payload["rebuttal"]
    assert "summary_hint" not in sent_payload["rebuttal"]


@pytest.mark.asyncio
async def test_runner_overwrites_runtime_owned_artifact_fields() -> None:
    payload = make_artifact_payload()
    payload["review_analytics"] = {
        "review_distribution": [{"label": "model invented", "count": 99}],
        "confidence_mix": [{"label": "model invented", "count": 99}],
        "strongest_criteria": ["Model invented"],
        "weakest_criteria": ["Model invented"],
        "review_coverage_completeness": "Model invented coverage.",
        "score_changes_after_rebuttal": "Model invented score changes.",
        "last_evidence_update": "2099-01-01T00:00:00Z",
    }
    payload["rebuttal_signals"]["status"] = "available"
    payload["evidence_fingerprint"] = "sha256:model-invented"
    payload["generated_at"] = "2099-01-01T00:00:00Z"
    llm = _StructuredLLM(payload=payload)
    runner = DecisionCopilotRunner(repo=_FakeRepo(), llm_client=llm)

    response = await runner.resolve(request=_make_request(action="generate", fingerprint="sha256:authoritative"))

    assert response.artifact is not None
    assert response.artifact.review_analytics.model_dump(mode="json")["review_distribution"] == [
        {"label": "accept", "count": 1}
    ]
    assert response.artifact.review_analytics.review_coverage_completeness == "1 of 1 assigned reviews submitted."
    assert response.artifact.rebuttal_signals.status == "not_applicable"
    assert response.artifact.evidence_fingerprint == "sha256:authoritative"
    assert response.artifact.generated_at != "2099-01-01T00:00:00Z"


@pytest.mark.asyncio
async def test_runner_fills_rebuttal_summary_hint_when_not_applicable_summary_is_blank() -> None:
    payload = make_artifact_payload()
    payload["rebuttal_signals"]["summary"] = ""
    llm = _StructuredLLM(payload=payload)
    runner = DecisionCopilotRunner(repo=_FakeRepo(), llm_client=llm)

    response = await runner.resolve(request=_make_request(action="generate"))

    assert response.artifact is not None
    assert response.artifact.rebuttal_signals.status == "not_applicable"
    assert response.artifact.rebuttal_signals.summary == "Rebuttal was not enabled for this conference."
