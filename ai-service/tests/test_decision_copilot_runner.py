from __future__ import annotations

from copy import deepcopy

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
