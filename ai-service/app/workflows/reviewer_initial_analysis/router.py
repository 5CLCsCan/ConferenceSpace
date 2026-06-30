from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException, Request, UploadFile, status
from fastapi.datastructures import FormData

from app.api.routes import _get_container, _require_identity
from app.workflows.reviewer_initial_analysis.schemas import (
    ReviewerInitialAnalysisResolveRequest,
    ReviewerInitialAnalysisResolveResponse,
)


router = APIRouter(
    prefix="/api/v1/workflows/reviewer-initial-analysis",
    tags=["reviewer-initial-analysis"],
)


@router.post("/resolve", response_model=ReviewerInitialAnalysisResolveResponse)
async def resolve(request: Request) -> ReviewerInitialAnalysisResolveResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_runner(container)

    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type:
        form = await request.form()
        parsed_request, file = _parse_generate_form(form)
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="uploaded file is empty")
        return await runner.resolve(
            request=parsed_request,
            file_bytes=file_bytes,
            filename=file.filename or parsed_request.file_metadata.original_filename,
        )

    try:
        body = ReviewerInitialAnalysisResolveRequest.model_validate(await request.json())
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    if body.action == "generate":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="generate action requires multipart request with manuscript file",
        )
    return await runner.resolve(request=body)


def _parse_generate_form(form: FormData) -> tuple[ReviewerInitialAnalysisResolveRequest, UploadFile]:
    request_payload = form.get("request_payload")
    file = form.get("file")
    if not isinstance(request_payload, str):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="request_payload is required")
    if not hasattr(file, "read") or not hasattr(file, "filename"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="file is required")

    try:
        parsed_request = ReviewerInitialAnalysisResolveRequest.model_validate(json.loads(request_payload))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    if parsed_request.action != "generate":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="multipart requests must use action=generate")
    return parsed_request, file  # type: ignore[return-value]


def _get_runner(container: Any):
    runner = getattr(container, "reviewer_initial_analysis_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="reviewer initial analysis runner not initialized",
        )
    return runner
