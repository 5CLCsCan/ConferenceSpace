from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException, Request, UploadFile, status
from fastapi.datastructures import FormData
from starlette.datastructures import UploadFile as StarletteUploadFile

from app.api.routes import _get_container, _require_identity
from app.workflows.submission_autofill.schemas import (
    SubmissionAutofillRunRequest,
    SubmissionAutofillRunResponse,
)


router = APIRouter(prefix="/api/v1/workflows/submission-autofill", tags=["submission-autofill"])


@router.post("/runs", response_model=SubmissionAutofillRunResponse)
async def create_run(request: Request) -> SubmissionAutofillRunResponse:
    await _require_identity(request)
    container = _get_container(request)
    runner = _get_runner(container)

    form = await request.form()
    parsed_request, uploads = _parse_form(form)
    files: list[tuple[str, str, bytes, str | None]] = []
    for file_id, upload in uploads:
        file_bytes = await upload.read()
        if not file_bytes:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="uploaded file is empty")
        files.append((file_id, upload.filename or "", file_bytes, upload.content_type))

    return await runner.run(request=parsed_request, files=files)


def _parse_form(form: FormData) -> tuple[SubmissionAutofillRunRequest, list[tuple[str, UploadFile]]]:
    request_payload = form.get("request")
    if not isinstance(request_payload, str):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="request is required")

    try:
        parsed_request = SubmissionAutofillRunRequest.model_validate(json.loads(request_payload))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    uploads: list[tuple[str, UploadFile]] = []
    for metadata in parsed_request.files:
        item = form.get(f"files.{metadata.file_id}")
        if item is None:
            item = _single_upload_from_legacy_files(form, metadata.original_filename)
        if not isinstance(item, (UploadFile, StarletteUploadFile)):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"file upload is required for {metadata.file_id}",
            )
        uploads.append((metadata.file_id, item))  # type: ignore[arg-type]
    if not uploads:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="files are required")
    return parsed_request, uploads


def _single_upload_from_legacy_files(form: FormData, filename: str) -> UploadFile | None:
    matches = [
        item
        for item in form.getlist("files")
        if isinstance(item, (UploadFile, StarletteUploadFile)) and item.filename == filename
    ]
    if len(matches) == 1:
        return matches[0]  # type: ignore[return-value]
    return None


def _get_runner(container: Any):
    runner = getattr(container, "submission_autofill_runner", None)
    if runner is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="submission autofill runner not initialized",
        )
    return runner
