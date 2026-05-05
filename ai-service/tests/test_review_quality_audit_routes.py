from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.review_quality_auditor.router import router as review_quality_audit_router

from tests.test_review_quality_audit_models import make_request_payload


class _FakeRunner:
    async def resolve(self, *, request):
        return {
            "status": "warn",
            "run_id": "550e8400-e29b-41d4-a716-446655440001",
            "evaluation": {
                "summary": "The review identifies a concern but does not explain it deeply enough.",
                "evidence_engagement": "It does not engage the submission evidence in detail.",
                "consistency_assessment": "The stated recommendation needs clearer support from the narrative.",
                "improvement_focus": "Add concrete evidence tied to the submission.",
            },
            "findings": [
                {
                    "code": "completeness.review_too_brief",
                    "severity": "warning",
                    "field": "review",
                    "rationale": "The finding is raised because the review's narrative is too short to connect its concern to the submitted work.",
                    "message": "The review narrative is too brief to justify the submission outcome.",
                    "suggestion": "Expand it.",
                    "condition_fingerprint": "sha256:test",
                }
            ],
        }


def _make_app() -> FastAPI:
    app = FastAPI()
    app.include_router(review_quality_audit_router)
    app.state.container = type(
        "_Container",
        (),
        {"review_quality_audit_runner": _FakeRunner()},
    )()
    return app


def test_resolve_route_requires_auth(monkeypatch) -> None:
    async def _fake_identity(_request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")

    monkeypatch.setattr(
        "app.workflows.review_quality_auditor.router._require_identity",
        _fake_identity,
    )

    client = TestClient(_make_app())
    response = client.post("/api/v1/workflows/review-quality-auditor/resolve", json=make_request_payload())

    assert response.status_code == 401


def test_resolve_route_accepts_json(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="reviewer@example.com")

    monkeypatch.setattr(
        "app.workflows.review_quality_auditor.router._require_identity",
        _fake_identity,
    )

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/review-quality-auditor/resolve",
        json=make_request_payload(),
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "warn"
