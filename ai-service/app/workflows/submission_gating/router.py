from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from app.api.routes import _get_container, _require_identity
from app.workflows.submission_gating.schemas import GatingRunRequest, GatingRunResponse


router = APIRouter(prefix="/api/v1/workflows/submission-material-gating", tags=["submission-material-gating"])


@router.post("/runs", response_model=GatingRunResponse)
async def create_run(
    request: Request,
    request_payload: str = Form(alias="request"),
    file: UploadFile = File(...),
) -> GatingRunResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_submission_gating_runner(container)

    try:
        parsed_request = GatingRunRequest.model_validate(json.loads(request_payload))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="uploaded file is empty")

    return await runner.run(
        request=parsed_request,
        file_bytes=file_bytes,
        filename=file.filename or parsed_request.file_metadata.original_filename,
    )


@router.get("/runs/{run_id}", response_model=GatingRunResponse)
async def get_run(run_id: str, request: Request) -> GatingRunResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_submission_gating_runner(container)
    response = await runner.get_run(run_id)
    if response is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="run not found")
    return response


def _get_submission_gating_runner(container: Any):
    runner = getattr(container, "submission_gating_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="submission gating runner not initialized",
        )
    return runner
