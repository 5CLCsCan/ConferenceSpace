from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from app.api.routes import _get_container, _require_identity
from app.workflows.review_quality_auditor.schemas import (
    ReviewQualityAuditResolveRequest,
    ReviewQualityAuditResolveResponse,
)


router = APIRouter(prefix="/api/v1/workflows/review-quality-auditor", tags=["review-quality-auditor"])


@router.post("/resolve", response_model=ReviewQualityAuditResolveResponse)
async def resolve(request: Request) -> ReviewQualityAuditResolveResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_runner(container)

    try:
        body = ReviewQualityAuditResolveRequest.model_validate(await request.json())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    return await runner.resolve(request=body)


def _get_runner(container: Any):
    runner = getattr(container, "review_quality_audit_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="review quality audit runner not initialized",
        )
    return runner
