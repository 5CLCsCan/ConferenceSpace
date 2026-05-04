from __future__ import annotations

import json

from app.workflows.track_recommendation.schemas import (
    TrackRecommendationItem,
    TrackRecommendationRequest,
    TrackRecommendationResponse,
)


class _StructuredTrackRecommendationItem(TrackRecommendationItem):
    pass


class _StructuredTrackRecommendationResponse(TrackRecommendationResponse):
    pass


class TrackRecommendationRunner:
    def __init__(self, *, llm_client) -> None:
        self._llm_client = llm_client

    async def recommend(
        self, *, request: TrackRecommendationRequest
    ) -> TrackRecommendationResponse:
        payload = await self._llm_client.complete_structured(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You recommend conference tracks for a paper submission. "
                        "Use only the supplied conference context and paper metadata. "
                        "Rank every provided track exactly once, from best fit to worst fit. "
                        "Confidence must be a number between 0 and 1. "
                        "Reasoning must stay short, specific, and non-binding."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(request.model_dump(mode="json"), ensure_ascii=True),
                },
            ],
            response_model=_StructuredTrackRecommendationResponse,
        )

        track_names = request.conference.tracks
        ranked: list[TrackRecommendationItem] = []
        used_keys: set[str] = set()
        available_track_keys = {track.lower() for track in track_names}
        payload_items = sorted(payload.recommendations, key=lambda item: item.rank)
        for item in payload_items:
            key = item.track_name.strip().lower()
            if key not in available_track_keys or key in used_keys:
                continue
            used_keys.add(key)
            ranked.append(
                TrackRecommendationItem(
                    track_name=_resolve_track_name(track_names, item.track_name),
                    confidence=max(0.0, min(1.0, item.confidence)),
                    reasoning=" ".join(item.reasoning.split()).strip() or "General conference fit.",
                    rank=len(ranked) + 1,
                )
            )

        for track in track_names:
            key = track.lower()
            if key in used_keys:
                continue
            ranked.append(
                TrackRecommendationItem(
                    track_name=track,
                    confidence=0.05,
                    reasoning="Lower apparent fit based on the current paper summary.",
                    rank=len(ranked) + 1,
                )
            )

        return TrackRecommendationResponse(recommendations=ranked)


def _resolve_track_name(track_names: list[str], candidate: str) -> str:
    candidate_key = candidate.strip().lower()
    for track in track_names:
        if track.lower() == candidate_key:
            return track
    return candidate.strip()
