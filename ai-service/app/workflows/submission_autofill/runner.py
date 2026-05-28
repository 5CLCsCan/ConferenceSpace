from __future__ import annotations

import json
import re
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.reviewer_pre_read_briefing.runner import extract_document
from app.workflows.submission_autofill.prompts import SUBMISSION_AUTOFILL_SYSTEM_PROMPT
from app.workflows.submission_autofill.schemas import (
    AutofillField,
    AutofillAuthor,
    AutofillEvidence,
    AutofillMaterial,
    AutofillStringListField,
    AutofillTrackRanking,
    SubmissionAutofillArtifact,
    SubmissionAutofillFields,
    SubmissionAutofillRunRequest,
    SubmissionAutofillRunResponse,
)
from app.workflows.submission_gating.models.facts import ExtractedDocument

MAX_TEXT_CHARS = 18000
MAX_ABSTRACT_CHARS = 3000
MAX_TITLE_CHARS = 300
MAX_TRACK_CHARS = 120
MAX_KEYWORD_CHARS = 80
MAX_SECTION_COUNT = 24


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
                possible_conflicts=[],
                materials=_build_materials(request, documents, failed_materials),
                warnings=["No uploaded materials contained enough extractable text."],
                error={
                    "code": "no_extractable_materials",
                    "message": "No uploaded materials contained enough extractable text.",
                },
            )

        payload = build_inference_payload(request=request, documents=documents, failed_materials=failed_materials)
        try:
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
        except Exception:  # noqa: BLE001
            fallback = _build_fallback_artifact(request=request, documents=documents)
            return SubmissionAutofillRunResponse(
                run_id=str(uuid4()),
                status="ready",
                fields=fallback.fields,
                track_rankings=fallback.track_rankings,
                authors=fallback.authors,
                possible_conflicts=[],
                materials=_build_materials(request, documents, failed_materials),
                warnings=[
                    "AI generation returned an invalid response, so autofill used extracted document metadata instead."
                ],
                error=None,
            )
        return SubmissionAutofillRunResponse(
            run_id=str(uuid4()),
            status="ready",
            fields=artifact.fields,
            track_rankings=artifact.track_rankings,
            authors=artifact.authors,
            possible_conflicts=artifact.possible_conflicts,
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
    primary_material_id = _select_primary_material_id(request, documents)
    materials: list[dict] = []
    for metadata in request.files:
        document = documents.get(metadata.file_id)
        if document is None:
            continue
        materials.append(
            {
                "file_id": metadata.file_id,
                "filename": metadata.original_filename,
                "role": "primary" if metadata.file_id == primary_material_id else "supplementary",
                "document_title": _normalize_text(document.title or "", MAX_TITLE_CHARS) or None,
                "document_abstract": _normalize_text(document.abstract or "", MAX_ABSTRACT_CHARS) or None,
                "document_authors": [_normalize_text(author, MAX_TITLE_CHARS) for author in document.authors if author],
                "section_headings": _normalize_sections(document.sections),
                "page_count": document.page_count,
                "text_coverage_ratio": document.text_coverage_ratio,
                "raw_text_excerpt": _normalize_text(document.raw_text, MAX_TEXT_CHARS),
            }
        )

    return {
        "extra_details": _normalize_text(request.extra_details or "", MAX_ABSTRACT_CHARS),
        "available_tracks": _normalize_tracks(request),
        "conference_context": _build_conference_context_payload(request),
        "primary_material_id": primary_material_id,
        "materials": materials,
        "failed_materials": failed_materials,
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
    empty = {"confidence": "not_found", "evidence": [], "warnings": []}
    return SubmissionAutofillFields(
        title=AutofillField(value="", **empty),
        abstract=AutofillField(value="", **empty),
        keywords=AutofillStringListField(value=[], **empty),
        paper_type=AutofillField(value="", **empty),
        additional_notes=AutofillField(value="", **empty),
    )


def _build_fallback_artifact(
    *,
    request: SubmissionAutofillRunRequest,
    documents: dict[str, ExtractedDocument],
) -> SubmissionAutofillArtifact:
    primary_id = _select_primary_material_id(request, documents)
    document = documents[primary_id]
    evidence = [
        AutofillEvidence(
            file_id=primary_id,
            source_type="document_metadata",
            quote_or_signal="Extracted directly from the uploaded manuscript.",
            location_hint=None,
        )
    ]
    title = _normalize_text(document.title or _first_nonempty_line(document.raw_text), MAX_TITLE_CHARS)
    abstract = _normalize_text(document.abstract or _fallback_abstract(document.raw_text), MAX_ABSTRACT_CHARS)
    keywords = _fallback_keywords(
        text=" ".join([title, abstract, document.raw_text[:5000]]),
        request=request,
    )

    return SubmissionAutofillArtifact(
        fields=SubmissionAutofillFields(
            title=AutofillField(
                value=title,
                confidence="medium" if title else "not_found",
                evidence=evidence if title else [],
                warnings=[] if title else ["Title could not be confidently extracted."],
            ),
            abstract=AutofillField(
                value=abstract,
                confidence="medium" if abstract else "not_found",
                evidence=evidence if abstract else [],
                warnings=[] if abstract else ["Abstract could not be confidently extracted."],
            ),
            keywords=AutofillStringListField(
                value=keywords,
                confidence="medium" if keywords else "not_found",
                evidence=evidence if keywords else [],
                warnings=[] if keywords else ["Keywords were not found in the manuscript."],
            ),
            paper_type=AutofillField(value="research", confidence="low", evidence=[], warnings=[]),
            additional_notes=AutofillField(value="", confidence="not_found", evidence=[], warnings=[]),
        ),
        track_rankings=_fallback_track_rankings(request=request, text=" ".join([title, abstract, document.raw_text])),
        authors=_fallback_authors(document=document, file_id=primary_id),
        possible_conflicts=[],
        warnings=[
            "These suggestions were generated from local document extraction because AI structured output was unavailable."
        ],
    )


def _first_nonempty_line(text: str) -> str:
    for line in (text or "").splitlines():
        value = _normalize_text(line, MAX_TITLE_CHARS)
        if value:
            return value
    return ""


def _fallback_abstract(text: str) -> str:
    lines = [line.strip() for line in (text or "").splitlines()]
    for index, line in enumerate(lines):
        if line.lower() == "abstract":
            return _normalize_text(" ".join(item for item in lines[index + 1 : index + 8] if item), MAX_ABSTRACT_CHARS)
    paragraphs = [item.strip() for item in re.split(r"\n\s*\n", text or "") if item.strip()]
    for paragraph in paragraphs[:5]:
        normalized = _normalize_text(paragraph, MAX_ABSTRACT_CHARS)
        if 120 <= len(normalized) <= MAX_ABSTRACT_CHARS:
            return normalized
    return ""


def _fallback_keywords(*, text: str, request: SubmissionAutofillRunRequest) -> list[str]:
    normalized_text = f" {text.lower()} "
    candidates: list[str] = []
    for source in [request.conference_context.domain if request.conference_context else [], _normalize_tracks(request)]:
        for item in source:
            value = _normalize_text(item, MAX_TRACK_CHARS)
            if value and value.lower() in normalized_text:
                candidates.append(value)

    words = re.findall(r"[A-Za-z][A-Za-z\-]{3,}", text or "")
    stopwords = {
        "abstract",
        "analysis",
        "approach",
        "based",
        "conference",
        "data",
        "evaluation",
        "method",
        "paper",
        "results",
        "study",
        "system",
        "this",
        "using",
        "with",
    }
    counts: dict[str, int] = {}
    display: dict[str, str] = {}
    for word in words:
        key = word.lower().strip("-")
        if len(key) < 4 or key in stopwords:
            continue
        counts[key] = counts.get(key, 0) + 1
        display.setdefault(key, word.strip("-"))
    for key, _ in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
        candidates.append(display[key])

    output: list[str] = []
    seen: set[str] = set()
    for item in candidates:
        value = _normalize_text(item, MAX_KEYWORD_CHARS)
        key = value.casefold()
        if not value or key in seen:
            continue
        seen.add(key)
        output.append(value)
        if len(output) >= 5:
            break
    return output


def _fallback_track_rankings(*, request: SubmissionAutofillRunRequest, text: str) -> list[AutofillTrackRanking]:
    tracks = _normalize_tracks(request)
    if not tracks:
        return []
    text_tokens = set(re.findall(r"[a-z0-9]+", (text or "").lower()))
    rankings: list[AutofillTrackRanking] = []
    for track in tracks:
        track_tokens = set(re.findall(r"[a-z0-9]+", track.lower()))
        overlap = len(track_tokens & text_tokens)
        confidence = 7.0 if overlap else 4.0
        rankings.append(
            AutofillTrackRanking(
                track_name=track,
                confidence=confidence,
                rationale=(
                    "Track terms appear in the extracted manuscript text."
                    if overlap
                    else "Fallback ranking based on available conference tracks."
                ),
                evidence=[],
                warnings=[],
            )
        )
    return sorted(rankings, key=lambda item: item.confidence, reverse=True)


def _fallback_authors(*, document: ExtractedDocument, file_id: str) -> list[AutofillAuthor]:
    authors: list[AutofillAuthor] = []
    seen: set[str] = set()
    for index, raw_name in enumerate(document.authors):
        for part in re.split(r";|, and | and ", raw_name):
            name = _normalize_text(part, MAX_TITLE_CHARS)
            key = name.casefold()
            if not name or key in seen:
                continue
            seen.add(key)
            authors.append(
                AutofillAuthor(
                    name=name,
                    email=None,
                    affiliation=None,
                    country=None,
                    ordinal=index + 1,
                    confidence="low",
                    evidence=[
                        AutofillEvidence(
                            file_id=file_id,
                            source_type="document_metadata",
                            quote_or_signal=name,
                            location_hint=None,
                        )
                    ],
                    warnings=[],
                )
            )
    return authors


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


def _normalize_sections(sections: list[str]) -> list[str]:
    output: list[str] = []
    seen: set[str] = set()
    for section in sections[:MAX_SECTION_COUNT]:
        value = _normalize_text(section, 120)
        if not value:
            continue
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        output.append(value)
    return output


def _sanitize_extraction_error(exc: Exception) -> str:
    message = str(exc).strip()
    if not message:
        return "Material could not be extracted."
    lowered = message.lower()
    if "\\" in message or "/" in message or "traceback" in lowered:
        return "Material could not be extracted."
    return message[:200]


def _sanitize_generation_error(exc: Exception) -> str:
    message = str(exc).strip()
    if not message:
        return "AI generation failed. Please try again or enter the submission details manually."
    lowered = message.lower()
    if "validationerror" in lowered or "invalid json" in lowered or "json_invalid" in lowered:
        return "The AI model returned invalid JSON. Please try again or enter the submission details manually."
    if "\\" in message or "/" in message or "traceback" in lowered:
        return "AI generation failed. Please try again or enter the submission details manually."
    return message[:200]
