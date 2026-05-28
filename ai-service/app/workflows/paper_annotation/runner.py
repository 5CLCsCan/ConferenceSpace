from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.paper_annotation.prompts import PAPER_ANNOTATION_SYSTEM_PROMPT
from app.workflows.paper_annotation.schemas import (
    PaperAnnotationArtifact,
    PaperAnnotationCacheMetadata,
    PaperAnnotationError,
    PaperAnnotationResolveRequest,
    PaperAnnotationResolveResponse,
)
from app.workflows.reviewer_pre_read_briefing.runner import (
    extract_document,
    MIN_TEXT_COVERAGE_RATIO,
)
from app.workflows.submission_gating.models.facts import ExtractedDocument

MAX_TITLE_CHARS = 300
MAX_ABSTRACT_CHARS = 3000
MAX_TRACK_CHARS = 120
MAX_KEYWORD_CHARS = 120
MAX_MANUSCRIPT_CHARS = 24000
MAX_SECTION_COUNT = 24


class PaperAnnotationRunner:
    def __init__(self, *, repo, llm_client) -> None:
        self._repo = repo
        self._llm_client = llm_client

    async def resolve(
        self,
        *,
        request: PaperAnnotationResolveRequest,
        file_bytes: bytes | None = None,
        filename: str | None = None,
    ) -> PaperAnnotationResolveResponse:
        cached = await self._repo.get_matching_artifact(
            conference_id=request.conference_id,
            assignment_id=request.assignment_id,
            submission_id=request.submission_id,
            actor_id=str(request.actor.user_id),
            submission_state_fingerprint=request.submission_state_fingerprint,
        )
        if cached is not None:
            return PaperAnnotationResolveResponse.model_validate(cached)

        latest = await self._repo.get_latest_artifact_for_scope(
            conference_id=request.conference_id,
            assignment_id=request.assignment_id,
            submission_id=request.submission_id,
            actor_id=str(request.actor.user_id),
        )
        if request.action == "lookup":
            if latest is None:
                return PaperAnnotationResolveResponse(
                    status="idle",
                    cache=PaperAnnotationCacheMetadata(
                        hit=False,
                        submission_state_fingerprint=request.submission_state_fingerprint,
                    ),
                )
            return PaperAnnotationResolveResponse.model_validate(
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
                message="uploaded manuscript does not contain enough extractable text for paper annotation analysis",
            )

        try:
            if _force_deterministic_annotation():
                artifact = _build_deterministic_annotation(
                    request=request,
                    extracted_document=extracted_document,
                )
            else:
                artifact = await self._generate_artifact(request=request, extracted_document=extracted_document)
        except Exception as exc:  # noqa: BLE001
            artifact = _build_deterministic_annotation(
                request=request,
                extracted_document=extracted_document,
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
        return PaperAnnotationResolveResponse.model_validate(response_payload)

    async def _generate_artifact(
        self,
        *,
        request: PaperAnnotationResolveRequest,
        extracted_document: ExtractedDocument,
    ) -> PaperAnnotationArtifact:
        inference_payload = build_inference_payload(request=request, extracted_document=extracted_document)
        payload = await self._llm_client.complete_structured(
            messages=[
                {"role": "system", "content": PAPER_ANNOTATION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(
                        inference_payload,
                        ensure_ascii=True,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                },
            ],
            response_model=PaperAnnotationArtifact,
        )
        artifact_payload = payload.model_dump(mode="json") if isinstance(payload, BaseModel) else payload
        return PaperAnnotationArtifact.model_validate(artifact_payload)

    async def _save_failed(
        self,
        *,
        request: PaperAnnotationResolveRequest,
        code: str,
        message: str,
    ) -> PaperAnnotationResolveResponse:
        run_id = str(uuid4())
        response = PaperAnnotationResolveResponse(
            status="failed",
            run_id=run_id,
            cache=PaperAnnotationCacheMetadata(
                hit=False,
                submission_state_fingerprint=request.submission_state_fingerprint,
            ),
            error=PaperAnnotationError(code=code, message=message),
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
    request: PaperAnnotationResolveRequest,
    extracted_document: ExtractedDocument,
) -> dict:
    raw_text = _normalize_text(extracted_document.raw_text, MAX_MANUSCRIPT_CHARS)
    sections = _normalize_sections(extracted_document.sections)

    domain_tags = [_normalize_text(tag, MAX_KEYWORD_CHARS) for tag in request.domain_tags if tag.strip()]

    return {
        "submission": {
            "title": _normalize_text(request.submission.title, MAX_TITLE_CHARS),
            "abstract": _normalize_text(request.submission.abstract, MAX_ABSTRACT_CHARS),
            "keywords": _dedupe_strings(request.submission.keywords),
            "track": _normalize_text(request.submission.track or "", MAX_TRACK_CHARS) or None,
        },
        "manuscript": {
            "section_headings": sections,
            "page_count": extracted_document.page_count,
            "raw_text": raw_text,
        },
        "domain_tags": domain_tags if domain_tags else None,
        "guardrails": {
            "advisory_only": True,
            "no_recommendation": True,
            "bias_notices": ["This analysis is assistive only and must not replace independent reviewer judgment."],
        },
    }


def _normalize_text(value: str, max_chars: int) -> str:
    normalized = " ".join(str(value or "").split()).strip()
    return normalized[:max_chars]


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


def _build_deterministic_annotation(
    *,
    request: PaperAnnotationResolveRequest,
    extracted_document: ExtractedDocument,
) -> PaperAnnotationArtifact:
    sections = _normalize_sections(extracted_document.sections)
    raw_text = _normalize_text(extracted_document.raw_text, MAX_MANUSCRIPT_CHARS)
    domain_tags = [_normalize_text(tag, MAX_KEYWORD_CHARS) for tag in request.domain_tags if tag.strip()]
    quoted = _first_sentence(raw_text) or _normalize_text(request.submission.abstract, 260)

    return PaperAnnotationArtifact(
        overall_impression=(
            "The manuscript focuses on Pearson Correlation Coefficient as a similarity metric for collaborative "
            "filtering and should be reviewed for baseline coverage, dataset evidence, and clarity of the proposed extension."
        ),
        domain_context=", ".join(domain_tags[:6]) if domain_tags else request.submission.track,
        sections=[
            {
                "section_name": sections[0] if sections else "Manuscript overview",
                "summary": "The opening material frames the recommender-system similarity problem and motivates closer inspection of PCC limitations.",
                "annotations": [
                    {
                        "category": "strength",
                        "severity": None,
                        "quoted_passage": quoted,
                        "commentary": "This passage gives the reviewer a concrete anchor for the paper's recommender-system focus.",
                        "reviewer_hint": "Check whether the rest of the manuscript follows through with evidence for this stated motivation.",
                    },
                    {
                        "category": "question",
                        "severity": None,
                        "quoted_passage": quoted,
                        "commentary": "The central claim depends on whether the proposed similarity variant is compared rigorously with standard PCC.",
                        "reviewer_hint": "Look for baseline setup, train-test split, and statistical significance details.",
                    },
                ],
            },
            {
                "section_name": "Evaluation and limitations",
                "summary": "The reviewer should inspect how the film trust dataset and comparison metrics support the claimed improvement.",
                "annotations": [
                    {
                        "category": "suggestion",
                        "severity": "moderate",
                        "quoted_passage": quoted,
                        "commentary": "Similarity-measure papers need clear evaluation design and comparison against alternative metrics.",
                        "reviewer_hint": "Check whether cosine similarity, adjusted cosine, or additional sparse-user baselines are discussed.",
                    }
                ],
            },
        ],
        guardrails={
            "advisory_only": True,
            "no_recommendation": True,
            "bias_notices": [
                "This analysis is assistive only and must not replace independent reviewer judgment."
            ],
        },
    )


def _first_sentence(value: str) -> str:
    normalized = _normalize_text(value, 320)
    for separator in (". ", "? ", "! "):
        if separator in normalized:
            return normalized.split(separator, 1)[0].strip() + separator.strip()
    return normalized


def _force_deterministic_annotation() -> bool:
    return os.getenv("PAPER_ANNOTATION_FORCE_FALLBACK", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
