from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.api.routes import _get_container, _require_identity
from app.workflows.track_recommendation.schemas import (
    TrackRecommendationRequest,
    TrackRecommendationResponse,
)

router = APIRouter(prefix="/api/v1/workflows/track-recommendation", tags=["track-recommendation"])


@router.post("/recommend", response_model=TrackRecommendationResponse)
async def recommend_tracks(request: Request, body: TrackRecommendationRequest) -> TrackRecommendationResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_runner(container)
    return await runner.recommend(request=body)


def _get_runner(container: Any):
    runner = getattr(container, "track_recommendation_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="track recommendation runner not initialized",
        )
    return runner
