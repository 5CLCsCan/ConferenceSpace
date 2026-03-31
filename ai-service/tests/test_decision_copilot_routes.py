from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.chair_decision_copilot.router import router as decision_copilot_router

from tests.test_decision_copilot_models import make_artifact_payload, make_request_payload


class _FakeRunner:
    async def resolve(self, *, request):
        if request.action == "lookup":
            return {
                "status": "idle",
                "run_id": None,
                "cache": {
                    "hit": False,
                    "evidence_fingerprint": request.evidence_fingerprint,
                    "is_stale": False,
                    "stale_reasons": [],
                },
                "artifact": None,
                "error": None,
            }
        return {
            "status": "ready",
            "run_id": "550e8400-e29b-41d4-a716-446655440000",
            "cache": {
                "hit": False,
                "evidence_fingerprint": request.evidence_fingerprint,
                "is_stale": False,
                "stale_reasons": [],
            },
            "artifact": make_artifact_payload(),
            "error": None,
        }


def _make_app() -> FastAPI:
    app = FastAPI()
    app.include_router(decision_copilot_router)
    app.state.container = type(
        "_Container",
        (),
        {"decision_copilot_runner": _FakeRunner()},
    )()
    return app


def test_resolve_route_requires_auth(monkeypatch) -> None:
    async def _fake_identity(_request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")

    monkeypatch.setattr(
        "app.workflows.chair_decision_copilot.router._require_identity",
        _fake_identity,
    )

    client = TestClient(_make_app())
    response = client.post("/api/v1/workflows/chair-decision-copilot/resolve", json=make_request_payload())

    assert response.status_code == 401


def test_resolve_route_accepts_lookup_json(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="chair@example.com")

    monkeypatch.setattr(
        "app.workflows.chair_decision_copilot.router._require_identity",
        _fake_identity,
    )

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/chair-decision-copilot/resolve",
        json=make_request_payload(action="lookup"),
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "idle"


def test_resolve_route_accepts_generate_and_regenerate(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="chair@example.com")

    monkeypatch.setattr(
        "app.workflows.chair_decision_copilot.router._require_identity",
        _fake_identity,
    )

    client = TestClient(_make_app())

    for action in ("generate", "regenerate"):
        response = client.post(
            "/api/v1/workflows/chair-decision-copilot/resolve",
            json=make_request_payload(action=action),
            headers={"Authorization": "Bearer fake-token"},
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ready"
