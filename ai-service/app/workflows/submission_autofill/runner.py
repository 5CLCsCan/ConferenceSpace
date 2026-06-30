from __future__ import annotations

import json
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.reviewer_initial_analysis.document import extract_document
from app.workflows.submission_autofill.metadata import EXCERPT_CHARS, extract_submission_metadata
from app.workflows.submission_autofill.prompts import SUBMISSION_AUTOFILL_SYSTEM_PROMPT
from app.workflows.submission_autofill.schemas import (
    AutofillMaterial,
    SubmissionAutofillArtifact,
    SubmissionAutofillFields,
    SubmissionAutofillRunRequest,
    SubmissionAutofillRunResponse,
)
from app.workflows.submission_gating.models.facts import ExtractedDocument

MAX_ABSTRACT_CHARS = 3000

class SubmissionAutofillRunner:
    def __init__(self, *, llm_client) -> None:
        self._llm_client = llm_client

    async def run(
        self,
        *,
        request: SubmissionAutofillRunRequest,
        files: list[tuple[str, str, bytes, str | None]],
    ) -> SubmissionAutofillRunResponse:
        documents: dict[str, ExtractedDocument] = {}
        failed_materials: list[dict] = []

        metadata_by_id = {item.file_id: item for item in request.files}
        for file_id, filename, content, content_type in files:
            metadata = metadata_by_id.get(file_id)
            effective_filename = metadata.original_filename if metadata is not None else filename
            try:
                document = extract_document(file_bytes=content, filename=effective_filename, content_type=content_type)
            except Exception as exc:  # noqa: BLE001
                failed_materials.append(
                    {
                        "file_id": file_id,
                        "filename": effective_filename,
                        "extraction_status": "failed",
                        "warnings": [_sanitize_extraction_error(exc)],
                    }
                )
                continue
            if document.text_coverage_ratio <= 0.01 or not document.raw_text.strip():
                failed_materials.append(
                    {
                        "file_id": file_id,
                        "filename": effective_filename,
                        "extraction_status": "low_text_coverage",
                        "warnings": ["Material does not contain enough extractable text."],
                    }
                )
                continue
            documents[file_id] = document

        if not documents:
            return SubmissionAutofillRunResponse(
                run_id=str(uuid4()),
                status="failed",
                fields=_empty_fields(),
                track_rankings=[],
                authors=[],
                materials=_build_materials(request, documents, failed_materials),
                warnings=["No uploaded materials contained enough extractable text."],
                error={
                    "code": "no_extractable_materials",
                    "message": "No uploaded materials contained enough extractable text.",
                },
            )

        payload = build_inference_payload(request=request, documents=documents, failed_materials=failed_materials)
        completion = await self._llm_client.complete_structured(
            messages=[
                {"role": "system", "content": SUBMISSION_AUTOFILL_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(
                        payload,
                        ensure_ascii=True,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                },
            ],
            response_model=SubmissionAutofillArtifact,
        )
        response_payload = completion.model_dump(mode="json") if isinstance(completion, BaseModel) else completion
        artifact = SubmissionAutofillArtifact.model_validate(response_payload)
        return SubmissionAutofillRunResponse(
            run_id=str(uuid4()),
            status="ready",
            fields=artifact.fields,
            track_rankings=artifact.track_rankings,
            authors=artifact.authors,
            materials=_build_materials(request, documents, failed_materials),
            warnings=artifact.warnings,
            error=None,
        )


def build_inference_payload(
    *,
    request: SubmissionAutofillRunRequest,
    documents: dict[str, ExtractedDocument],
    failed_materials: list[dict],
) -> dict:
    _ = failed_materials
    primary_id = _select_primary_material_id(request, documents)
    primary_document = documents[primary_id]
    primary_metadata = next(metadata for metadata in request.files if metadata.file_id == primary_id)
    excerpt = _normalize_text(primary_document.raw_text[:EXCERPT_CHARS], EXCERPT_CHARS)

    return {
        "extra_details": _normalize_text(request.extra_details or "", MAX_ABSTRACT_CHARS),
        "available_tracks": _normalize_tracks(request),
        "conference_context": _build_conference_context_payload(request),
        "primary_material": {
            "filename": primary_metadata.original_filename,
            "excerpt": excerpt,
        },
        "extracted_metadata": extract_submission_metadata(primary_document.raw_text),
    }


def _select_primary_material_id(
    request: SubmissionAutofillRunRequest,
    documents: dict[str, ExtractedDocument],
) -> str:
    for metadata in request.files:
        if metadata.file_id in documents:
            return metadata.file_id
    return next(iter(documents))


def _build_materials(
    request: SubmissionAutofillRunRequest,
    documents: dict[str, ExtractedDocument],
    failed_materials: list[dict],
) -> list[AutofillMaterial]:
    primary_id = _select_primary_material_id(request, documents) if documents else None
    failed_by_id = {item.get("file_id"): item for item in failed_materials}
    materials: list[AutofillMaterial] = []
    for metadata in request.files:
        document = documents.get(metadata.file_id)
        if document is not None:
            materials.append(
                AutofillMaterial(
                    file_id=metadata.file_id,
                    filename=metadata.original_filename,
                    content_type=metadata.content_type,
                    size_bytes=metadata.size_bytes,
                    role="primary" if metadata.file_id == primary_id else "supplementary",
                    extraction_status="ok",
                    text_coverage_ratio=document.text_coverage_ratio,
                    page_count=document.page_count,
                    warnings=[],
                )
            )
            continue
        failed = failed_by_id.get(metadata.file_id, {})
        materials.append(
            AutofillMaterial(
                file_id=metadata.file_id,
                filename=metadata.original_filename,
                content_type=metadata.content_type,
                size_bytes=metadata.size_bytes,
                role="supplementary",
                extraction_status=failed.get("extraction_status", "failed"),
                text_coverage_ratio=None,
                page_count=None,
                warnings=failed.get("warnings", []),
            )
        )
    return materials


def _empty_fields() -> SubmissionAutofillFields:
    return SubmissionAutofillFields(
        title="",
        abstract="",
        keywords=[],
        paper_type="",
        additional_notes="",
    )


def _normalize_tracks(request: SubmissionAutofillRunRequest) -> list[str]:
    if request.conference_context is not None and request.conference_context.tracks:
        source = request.conference_context.tracks
    else:
        source = request.available_tracks
    output: list[str] = []
    seen: set[str] = set()
    for track in source:
        value = _normalize_text(track, 120)
        if not value:
            continue
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        output.append(value)
    return output


def _build_conference_context_payload(request: SubmissionAutofillRunRequest) -> dict:
    context = request.conference_context
    if context is None:
        return {
            "name": "",
            "acronym": "",
            "description": "",
            "domain": [],
            "cfp_text": "",
            "tracks": _normalize_tracks(request),
        }
    return {
        "name": _normalize_text(context.name, 200),
        "acronym": _normalize_text(context.acronym, 40),
        "description": _normalize_text(context.description, 2000),
        "domain": [_normalize_text(item, 120) for item in context.domain if _normalize_text(item, 120)],
        "cfp_text": _normalize_text(context.cfp_text, 6000),
        "tracks": _normalize_tracks(request),
    }


def _normalize_text(value: str, max_chars: int) -> str:
    normalized = " ".join(str(value or "").split()).strip()
    return normalized[:max_chars]

def _sanitize_extraction_error(exc: Exception) -> str:
    message = str(exc).strip()
    if not message:
        return "Material could not be extracted."
    lowered = message.lower()
    if "\\" in message or "/" in message or "traceback" in lowered:
        return "Material could not be extracted."
    return message[:200]
