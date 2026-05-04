from __future__ import annotations

import json

from app.workflows.research_keywords.schemas import (
    ResearchKeywordExtractionRequest,
    ResearchKeywordExtractionResponse,
)

MAX_KEYWORDS = 8
MAX_PAPERS = 12
MAX_ABSTRACT_CHARS = 1200


class ResearchKeywordRunner:
    def __init__(self, *, llm_client) -> None:
        self._llm_client = llm_client

    async def extract(
        self, *, request: ResearchKeywordExtractionRequest
    ) -> ResearchKeywordExtractionResponse:
        usable_papers = []
        for paper in request.papers:
            abstract = paper.abstract.strip()
            if not abstract:
                continue
            usable_papers.append(
                {
                    "title": paper.title.strip() or "Untitled Paper",
                    "abstract": abstract[:MAX_ABSTRACT_CHARS],
                    "venue": paper.venue.strip(),
                    "year": paper.year,
                }
            )
            if len(usable_papers) >= MAX_PAPERS:
                break

        if not usable_papers:
            return ResearchKeywordExtractionResponse(keywords=[])

        payload = await self._llm_client.complete_structured(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You extract concise academic research keywords from publication samples. "
                        "Return 5 to 8 broad, recognizable research-domain keywords in English. "
                        "Do not return institutions, author names, paper titles, or sentences."
                    ),
                },
                {"role": "user", "content": json.dumps({"papers": usable_papers}, ensure_ascii=True)},
            ],
            response_model=ResearchKeywordExtractionResponse,
        )

        keywords = []
        seen: set[str] = set()
        for keyword in payload.keywords:
            normalized = " ".join(keyword.split()).strip(" \t\r\n,.;")
            if not normalized:
                continue
            dedupe_key = normalized.lower()
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            keywords.append(normalized)
            if len(keywords) >= MAX_KEYWORDS:
                break

        return ResearchKeywordExtractionResponse(keywords=keywords)
