from __future__ import annotations

from pydantic import BaseModel, Field, field_validator, model_validator


class TrackRecommendationConferenceContext(BaseModel):
    title: str
    acronym: str | None = None
    description: str | None = None
    call_for_papers: str | None = None
    domains: list[str] = Field(default_factory=list)
    tracks: list[str] = Field(default_factory=list)

    @field_validator("tracks")
    @classmethod
    def validate_tracks(cls, tracks: list[str]) -> list[str]:
        normalized = [" ".join(track.split()).strip() for track in tracks if track and track.strip()]
        if not normalized:
            raise ValueError("conference must provide at least one track")
        return normalized


class TrackRecommendationPaperContext(BaseModel):
    title: str
    abstract: str
    keywords: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_content(self):
        if len(self.title.strip()) < 8 or len(self.abstract.split()) < 20:
            raise ValueError("need more paper detail before recommending tracks")
        return self


class TrackRecommendationRequest(BaseModel):
    conference: TrackRecommendationConferenceContext
    paper: TrackRecommendationPaperContext


class TrackRecommendationItem(BaseModel):
    track_name: str
    confidence: float = Field(ge=0, le=1)
    reasoning: str
    rank: int = Field(ge=1)


class TrackRecommendationResponse(BaseModel):
    recommendations: list[TrackRecommendationItem] = Field(default_factory=list)
