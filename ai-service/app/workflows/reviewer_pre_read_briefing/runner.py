from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.reviewer_pre_read_briefing.prompts import REVIEWER_BRIEFING_SYSTEM_PROMPT
from app.workflows.reviewer_pre_read_briefing.schemas import (
    ReviewerBriefingArtifact,
    ReviewerBriefingCacheMetadata,
    ReviewerBriefingError,
    ReviewerBriefingResolveRequest,
    ReviewerBriefingResolveResponse,
)
from app.workflows.submission_gating.extractors import DocxExtractor, LatexExtractor, PDFExtractor
from app.workflows.submission_gating.models.facts import ExtractedDocument

MAX_TITLE_CHARS = 300
MAX_ABSTRACT_CHARS = 3000
MAX_TRACK_CHARS = 120
MAX_KEYWORD_CHARS = 120
MAX_MANUSCRIPT_CHARS = 24000
MAX_MANUSCRIPT_ABSTRACT_CHARS = 3000
MAX_SECTION_COUNT = 24
MIN_TEXT_COVERAGE_RATIO = 0.01

EXTRACTORS = {
    "pdf": PDFExtractor(),
    "docx": DocxExtractor(),
    "latex": LatexExtractor(),
}


class ReviewerPreReadBriefingRunner:
    def __init__(self, *, repo, llm_client) -> None:
        self._repo = repo
        self._llm_client = llm_client

    async def resolve(
        self,
        *,
        request: ReviewerBriefingResolveRequest,
        file_bytes: bytes | None = None,
        filename: str | None = None,
    ) -> ReviewerBriefingResolveResponse:
        cached = await self._repo.get_matching_artifact(
            conference_id=request.conference_id,
            assignment_id=request.assignment_id,
            submission_id=request.submission_id,
            actor_id=str(request.actor.user_id),
            submission_state_fingerprint=request.submission_state_fingerprint,
        )
        if cached is not None:
            return ReviewerBriefingResolveResponse.model_validate(cached)

        latest = await self._repo.get_latest_artifact_for_scope(
            conference_id=request.conference_id,
            assignment_id=request.assignment_id,
            submission_id=request.submission_id,
            actor_id=str(request.actor.user_id),
        )
        if request.action == "lookup":
            if latest is None:
                return ReviewerBriefingResolveResponse(
                    status="idle",
                    cache=ReviewerBriefingCacheMetadata(
                        hit=False,
                        submission_state_fingerprint=request.submission_state_fingerprint,
                    ),
                )
            return ReviewerBriefingResolveResponse.model_validate(
                {
                    "status": "stale",
                    "run_id": latest.get("run_id"),
                    "cache": {
                        "hit": False,
                        "submission_state_fingerprint": request.submission_state_fingerprint,
                    },
                    "artifact": latest.get("artifact"),
                    "error": None,
                }
            )

        if not file_bytes:
            return await self._save_failed(
                request=request,
                code="missing_manuscript",
                message="generate action requires manuscript file bytes",
            )

        try:
            extracted_document = extract_document(
                file_bytes=file_bytes,
                filename=filename or request.file_metadata.original_filename,
                content_type=request.file_metadata.content_type,
            )
        except Exception as exc:  # noqa: BLE001
            return await self._save_failed(
                request=request,
                code="document_extraction_failed",
                message=str(exc),
            )

        if extracted_document.text_coverage_ratio <= MIN_TEXT_COVERAGE_RATIO or not extracted_document.raw_text.strip():
            return await self._save_failed(
                request=request,
                code="low_text_coverage",
                message="uploaded manuscript does not contain enough extractable text for reviewer pre-read analysis",
            )

        try:
            artifact = await self._generate_artifact(request=request, extracted_document=extracted_document)
        except Exception as exc:  # noqa: BLE001
            return await self._save_failed(
                request=request,
                code="generation_failed",
                message=str(exc),
            )

        run_id = str(uuid4())
        response_payload = {
            "status": "ready",
            "run_id": run_id,
            "cache": {
                "hit": False,
                "submission_state_fingerprint": request.submission_state_fingerprint,
            },
            "artifact": artifact.model_dump(),
            "error": None,
        }
        await self._repo.save_completed_run(
            request_payload=request.model_dump(mode="json"),
            artifact_payload=response_payload,
            stage_records=[
                {"stage_name": "cache_lookup", "status": "ok", "detail": {"hit": False}},
                {
                    "stage_name": "document_extraction",
                    "status": "ok",
                    "detail": {
                        "format": extracted_document.format,
                        "page_count": extracted_document.page_count,
                        "text_coverage_ratio": extracted_document.text_coverage_ratio,
                    },
                },
                {"stage_name": "generation", "status": "ok", "detail": {"provider": "llm"}},
                {
                    "stage_name": "persistence",
                    "status": "ok",
                    "detail": {"stored_at": datetime.now(tz=timezone.utc).isoformat()},
                },
            ],
        )
        return ReviewerBriefingResolveResponse.model_validate(response_payload)

    async def _generate_artifact(
        self,
        *,
        request: ReviewerBriefingResolveRequest,
        extracted_document: ExtractedDocument,
    ) -> ReviewerBriefingArtifact:
        payload = await self._llm_client.complete_structured(
            messages=[
                {"role": "system", "content": REVIEWER_BRIEFING_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(
                        build_inference_payload(request=request, extracted_document=extracted_document),
                        ensure_ascii=True,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                },
            ],
            response_model=ReviewerBriefingArtifact,
        )
        if isinstance(payload, BaseModel):
            return ReviewerBriefingArtifact.model_validate(payload.model_dump(mode="json"))
        return ReviewerBriefingArtifact.model_validate(payload)

    async def _save_failed(
        self,
        *,
        request: ReviewerBriefingResolveRequest,
        code: str,
        message: str,
    ) -> ReviewerBriefingResolveResponse:
        run_id = str(uuid4())
        response = ReviewerBriefingResolveResponse(
            status="failed",
            run_id=run_id,
            cache=ReviewerBriefingCacheMetadata(
                hit=False,
                submission_state_fingerprint=request.submission_state_fingerprint,
            ),
            error=ReviewerBriefingError(code=code, message=message),
        )
        await self._repo.save_failed_run(
            run_id=run_id,
            request_payload=request.model_dump(mode="json"),
            error_detail=response.error.model_dump() if response.error else {},
            stage_records=[{"stage_name": "generation", "status": "failed", "detail": {"error": message}}],
        )
        return response


def build_inference_payload(
    *,
    request: ReviewerBriefingResolveRequest,
    extracted_document: ExtractedDocument,
) -> dict:
    return {
        "submission": {
            "title": _normalize_text(request.submission.title, MAX_TITLE_CHARS),
            "abstract": _normalize_text(request.submission.abstract, MAX_ABSTRACT_CHARS),
            "keywords": _dedupe_strings(request.submission.keywords),
            "track": _normalize_text(request.submission.track or "", MAX_TRACK_CHARS) or None,
        },
        "manuscript": {
            "document_title": _normalize_text(extracted_document.title or request.submission.title, MAX_TITLE_CHARS) or None,
            "document_abstract": _normalize_text(extracted_document.abstract or "", MAX_MANUSCRIPT_ABSTRACT_CHARS) or None,
            "section_headings": _normalize_sections(extracted_document.sections),
            "page_count": extracted_document.page_count,
            "table_count": extracted_document.table_count,
            "figure_count": extracted_document.figure_count,
            "reference_count": extracted_document.reference_count,
            "text_coverage_ratio": extracted_document.text_coverage_ratio,
            "raw_text": _normalize_text(extracted_document.raw_text, MAX_MANUSCRIPT_CHARS),
        },
        "guardrails": {
            "no_recommendation": True,
            "no_score": True,
            "bias_notice": "This briefing is assistive only and must not replace independent review judgment.",
        },
    }


def extract_document(*, file_bytes: bytes, filename: str, content_type: str | None) -> ExtractedDocument:
    extractor = EXTRACTORS.get(_resolve_format(filename=filename, content_type=content_type))
    if extractor is None:
        raise ValueError("no extractor registered for uploaded manuscript format")
    return extractor.extract(file_bytes, filename=filename)


def _resolve_format(*, filename: str, content_type: str | None) -> str:
    lowered_name = (filename or "").strip().lower()
    lowered_type = (content_type or "").strip().lower()
    if lowered_name.endswith(".pdf") or "pdf" in lowered_type:
        return "pdf"
    if lowered_name.endswith(".docx") or "wordprocessingml" in lowered_type:
        return "docx"
    if lowered_name.endswith(".tex") or lowered_name.endswith(".zip") or "latex" in lowered_type:
        return "latex"
    raise ValueError(f"unsupported manuscript format for file '{filename}'")


def _normalize_sections(sections: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for section in sections[:MAX_SECTION_COUNT]:
        value = _normalize_text(section, MAX_KEYWORD_CHARS)
        if not value:
            continue
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(value)
    return normalized


def _normalize_text(value: str, max_chars: int) -> str:
    normalized = " ".join(str(value or "").split()).strip()
    return normalized[:max_chars]


def _dedupe_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        normalized = _normalize_text(value, MAX_KEYWORD_CHARS)
        if not normalized:
            continue
        key = normalized.casefold()
        if key in seen:
            continue
        seen.add(key)
        output.append(normalized.lower())
    return output
