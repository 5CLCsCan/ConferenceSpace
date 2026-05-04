from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class ResearchKeywordPaperSample(BaseModel):
    title: str = ""
    abstract: str = ""
    venue: str = ""
    year: int | None = None


class ResearchKeywordExtractionRequest(BaseModel):
    papers: list[ResearchKeywordPaperSample] = Field(default_factory=list)

    @field_validator("papers")
    @classmethod
    def validate_papers(cls, papers: list[ResearchKeywordPaperSample]) -> list[ResearchKeywordPaperSample]:
        usable = [paper for paper in papers if paper.abstract.strip()]
        if not usable:
            raise ValueError("at least one paper abstract is required")
        return papers


class ResearchKeywordExtractionResponse(BaseModel):
    keywords: list[str] = Field(default_factory=list)
