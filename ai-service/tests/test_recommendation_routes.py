from __future__ import annotations

from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.research_keywords.router import router as research_keyword_router
from app.workflows.track_recommendation.router import router as track_recommendation_router


class _FakeResearchKeywordRunner:
    async def extract(self, *, request):
        return {"keywords": ["Machine Learning", "Distributed Systems"]}


class _FakeTrackRecommendationRunner:
    async def recommend(self, *, request):
        return {
            "recommendations": [
                {
                    "track_name": request.conference.tracks[0],
                    "confidence": 0.91,
                    "reasoning": "Best topical match for the paper focus.",
                    "rank": 1,
                }
            ]
        }


def _make_app() -> FastAPI:
    app = FastAPI()
    app.include_router(research_keyword_router)
    app.include_router(track_recommendation_router)
    app.state.container = type(
        "_Container",
        (),
        {
            "research_keyword_runner": _FakeResearchKeywordRunner(),
            "track_recommendation_runner": _FakeTrackRecommendationRunner(),
        },
    )()
    return app


def test_research_keyword_route_requires_auth(monkeypatch) -> None:
    async def _fake_identity(_request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")

    monkeypatch.setattr("app.workflows.research_keywords.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/research-keywords/extract",
        json={"papers": [{"title": "Paper", "abstract": "A" * 120}]},
    )

    assert response.status_code == 401


def test_research_keyword_route_returns_keywords(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr("app.workflows.research_keywords.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/research-keywords/extract",
        json={"papers": [{"title": "Paper", "abstract": "A" * 120}]},
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["keywords"] == ["Machine Learning", "Distributed Systems"]


def test_track_recommendation_route_returns_ranked_tracks(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr("app.workflows.track_recommendation.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/track-recommendation/recommend",
        json={
            "conference": {
                "title": "ConferenceSpace",
                "tracks": ["AI Systems", "Theory"],
            },
            "paper": {
                "title": "Serving LLMs Efficiently",
                "abstract": "This paper studies scalable inference systems for large language models in production deployments with detailed evaluation across latency and throughput trade-offs.",
                "keywords": ["LLM Serving"],
            },
        },
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["recommendations"][0]["track_name"] == "AI Systems"


def test_track_recommendation_route_rejects_weak_context(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr("app.workflows.track_recommendation.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/track-recommendation/recommend",
        json={
            "conference": {
                "title": "ConferenceSpace",
                "tracks": ["AI Systems"],
            },
            "paper": {
                "title": "Short",
                "abstract": "Too short",
                "keywords": [],
            },
        },
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 422
