from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.api.routes import _get_container, _require_identity
from app.workflows.research_keywords.schemas import (
    ResearchKeywordExtractionRequest,
    ResearchKeywordExtractionResponse,
)

router = APIRouter(prefix="/api/v1/workflows/research-keywords", tags=["research-keywords"])


@router.post("/extract", response_model=ResearchKeywordExtractionResponse)
async def extract_keywords(request: Request, body: ResearchKeywordExtractionRequest) -> ResearchKeywordExtractionResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_runner(container)
    return await runner.extract(request=body)


def _get_runner(container: Any):
    runner = getattr(container, "research_keyword_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="research keyword runner not initialized",
        )
    return runner
