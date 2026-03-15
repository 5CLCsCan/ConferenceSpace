from __future__ import annotations

import json

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.submission_gating.router import router as submission_gating_router

from tests.submission_gating_helpers import MINIMAL_PDF_BYTES, make_request_payload


class _FakeRunner:
    def __init__(self) -> None:
        self.created = {}

    async def run(self, *, request, file_bytes: bytes, filename: str):
        response = {
            "run_id": "550e8400-e29b-41d4-a716-446655440000",
            "input_fingerprint": "sha256:test",
            "policy_hash": "sha256:policy",
            "verdict": "warn",
            "decision": "manual_review",
            "score": 0.74,
            "summary": {
                "total_findings": 1,
                "blocking_count": 0,
                "warning_count": 1,
                "pass_count": 0,
            },
            "findings": [
                {
                    "rule_id": "llm_content_evaluation",
                    "source": "llm_content_evaluation",
                    "severity": "warn",
                    "message": "No ethics statement detected.",
                    "remediation": "Add an ethics statement section.",
                }
            ],
            "guidance": [
                {
                    "rule_id": "llm_content_evaluation",
                    "source": "llm_content_evaluation",
                    "severity": "warn",
                    "message": "No ethics statement detected.",
                    "remediation": "Add an ethics statement section.",
                }
            ],
            "stage_timings": {"intake_normalization_ms": 4},
            "determinism": {"llm_used_for_verdict": False},
        }
        self.created[response["run_id"]] = response
        return response

    async def get_run(self, run_id: str):
        return self.created.get(run_id)


def _make_app() -> FastAPI:
    app = FastAPI()
    app.include_router(submission_gating_router)
    app.state.container = type(
        "_Container",
        (),
        {"submission_gating_runner": _FakeRunner()},
    )()
    return app


def test_create_run_route_accepts_multipart(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr(
        "app.workflows.submission_gating.router._require_identity",
        _fake_identity,
    )

    client = TestClient(_make_app())
    payload = make_request_payload()

    response = client.post(
        "/api/v1/workflows/submission-material-gating/runs",
        files={
            "request": (None, json.dumps(payload), "application/json"),
            "file": ("submission.pdf", MINIMAL_PDF_BYTES, "application/pdf"),
        },
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["verdict"] == "warn"
    assert body["findings"][0]["source"] == "llm_content_evaluation"


def test_get_run_route_returns_stored_run(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr(
        "app.workflows.submission_gating.router._require_identity",
        _fake_identity,
    )

    app = _make_app()
    runner = app.state.container.submission_gating_runner
    runner.created["run-1"] = {
        "run_id": "run-1",
        "input_fingerprint": "sha256:test",
        "policy_hash": "sha256:policy",
        "verdict": "pass",
        "decision": "accept_for_review",
        "score": 1.0,
        "summary": {
            "total_findings": 0,
            "blocking_count": 0,
            "warning_count": 0,
            "pass_count": 0,
        },
        "findings": [],
        "guidance": [],
        "stage_timings": {"intake_normalization_ms": 2},
        "determinism": {"llm_used_for_verdict": False},
    }

    client = TestClient(app)
    response = client.get(
        "/api/v1/workflows/submission-material-gating/runs/run-1",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["run_id"] == "run-1"
