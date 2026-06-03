from __future__ import annotations

import json

from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.reviewer_initial_analysis.router import router as reviewer_initial_analysis_router

from tests.submission_gating_helpers import MINIMAL_PDF_BYTES
from tests.test_reviewer_initial_analysis_models import make_artifact_payload, make_request_payload


class _FakeRunner:
    async def resolve(self, *, request, file_bytes=None, filename=None):
        if request.action == "lookup":
            return {
                "status": "idle",
                "run_id": None,
                "cache": {
                    "hit": False,
                    "submission_state_fingerprint": request.submission_state_fingerprint,
                },
                "artifact": None,
                "error": None,
            }
        return {
            "status": "ready",
            "run_id": "550e8400-e29b-41d4-a716-446655440000",
            "cache": {
                "hit": False,
                "submission_state_fingerprint": request.submission_state_fingerprint,
            },
            "artifact": make_artifact_payload(),
            "error": None,
        }


def _make_app(*, include_runner: bool = True) -> FastAPI:
    app = FastAPI()
    app.include_router(reviewer_initial_analysis_router)
    attrs = {"reviewer_initial_analysis_runner": _FakeRunner()} if include_runner else {}
    app.state.container = type("_Container", (), attrs)()
    return app


def test_resolve_route_accepts_lookup_json(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="reviewer@example.com")

    monkeypatch.setattr("app.workflows.reviewer_initial_analysis.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/reviewer-initial-analysis/resolve",
        json=make_request_payload(action="lookup"),
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "idle"


def test_resolve_route_rejects_generate_without_file(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="reviewer@example.com")

    monkeypatch.setattr("app.workflows.reviewer_initial_analysis.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/reviewer-initial-analysis/resolve",
        json=make_request_payload(action="generate"),
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 422


def test_resolve_route_accepts_generate_multipart(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="reviewer@example.com")

    monkeypatch.setattr("app.workflows.reviewer_initial_analysis.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/reviewer-initial-analysis/resolve",
        files={
            "request_payload": (None, json.dumps(make_request_payload(action="generate")), "application/json"),
            "file": ("submission.pdf", MINIMAL_PDF_BYTES, "application/pdf"),
        },
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["artifact"]["briefing"]["submission_snapshot"]["title"] == "A Test Paper"
    assert body["artifact"]["annotations"]["sections"]


def test_resolve_route_requires_identity(monkeypatch) -> None:
    async def _fake_identity(_request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")

    monkeypatch.setattr("app.workflows.reviewer_initial_analysis.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post("/api/v1/workflows/reviewer-initial-analysis/resolve", json=make_request_payload())

    assert response.status_code == 401


def test_resolve_route_returns_503_without_runner(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="reviewer@example.com")

    monkeypatch.setattr("app.workflows.reviewer_initial_analysis.router._require_identity", _fake_identity)

    client = TestClient(_make_app(include_runner=False))
    response = client.post(
        "/api/v1/workflows/reviewer-initial-analysis/resolve",
        json=make_request_payload(action="lookup"),
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 503
