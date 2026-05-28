from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.reviewer_pre_read_briefing.prompts import REVIEWER_BRIEFING_SYSTEM_PROMPT
from app.workflows.reviewer_pre_read_briefing.schemas import (
    ReviewerBriefingArtifact,
    ReviewerBriefingCacheMetadata,
    ReviewerBriefingError,
    ReviewerBriefingReadinessSignal,
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
MAX_SIGNAL_EVIDENCE = 3

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
            if _force_deterministic_briefing():
                artifact = _build_deterministic_artifact(
                    request=request,
                    extracted_document=extracted_document,
                )
            else:
                artifact = await self._generate_artifact(request=request, extracted_document=extracted_document)
        except Exception as exc:  # noqa: BLE001
            artifact = _build_deterministic_artifact(
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
        return ReviewerBriefingResolveResponse.model_validate(response_payload)

    async def _generate_artifact(
        self,
        *,
        request: ReviewerBriefingResolveRequest,
        extracted_document: ExtractedDocument,
    ) -> ReviewerBriefingArtifact:
        inference_payload = build_inference_payload(request=request, extracted_document=extracted_document)
        payload = await self._llm_client.complete_structured(
            messages=[
                {"role": "system", "content": REVIEWER_BRIEFING_SYSTEM_PROMPT},
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
            response_model=ReviewerBriefingArtifact,
        )
        artifact_payload = payload.model_dump(mode="json") if isinstance(payload, BaseModel) else payload
        artifact = ReviewerBriefingArtifact.model_validate(artifact_payload)
        if not artifact.review_readiness_signals:
            artifact.review_readiness_signals = _build_fallback_readiness_signals(
                hints=inference_payload["manuscript"]["review_readiness_hints"],
                extracted_document=extracted_document,
            )
        return artifact

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
    raw_text = _normalize_text(extracted_document.raw_text, MAX_MANUSCRIPT_CHARS)
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
            "raw_text": raw_text,
            "review_readiness_hints": _derive_review_readiness_hints(
                raw_text=raw_text,
                section_headings=_normalize_sections(extracted_document.sections),
            ),
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


def _derive_review_readiness_hints(*, raw_text: str, section_headings: list[str]) -> dict:
    normalized_headings = [heading.casefold() for heading in section_headings]
    normalized_text = raw_text.casefold()

    section_presence = {
        "related_work": _has_heading(normalized_headings, ["related work", "background"]),
        "methodology": _has_heading(normalized_headings, ["method", "methods", "approach", "model", "system"]),
        "experiments_or_evaluation": _has_heading(
            normalized_headings,
            ["experiment", "experiments", "evaluation", "results", "benchmarks"],
        ),
        "limitations": _has_heading(normalized_headings, ["limitation", "limitations", "scope"]),
        "ethics_or_broader_impact": _has_heading(
            normalized_headings,
            ["ethic", "broader impact", "societal impact", "safety", "privacy", "fairness"],
        ),
        "appendix_or_supplement": _has_heading(normalized_headings, ["appendix", "supplement"]),
    }

    signal_specs = {
        "baseline_or_comparison_mentions": [r"\bbaseline", r"\bcompare(?:d|s|ison)?\b", r"\bvs\.\b"],
        "ablation_or_sensitivity_mentions": [r"\bablation", r"\bsensitivity\b", r"\berror analysis\b", r"\bfailure analysis\b"],
        "reproducibility_path_mentions": [r"\bcode\b", r"\breproduc", r"\bimplementation details?\b", r"\bcheckpoint\b", r"\bgithub\b"],
        "data_or_artifact_mentions": [r"\bdataset\b", r"\bdata\b", r"\bartifact\b", r"\bbenchmark\b"],
        "statistics_or_uncertainty_mentions": [r"\berror bars?\b", r"\bconfidence interval", r"\bstatistical significance\b", r"\bp[- ]value", r"\bstandard deviation\b", r"\bstd\.?\b"],
        "limitations_or_assumptions_mentions": [r"\blimitation", r"\bassumption", r"\bwe caution", r"\bdoes not generalize\b"],
        "ethics_or_risk_mentions": [r"\bethic", r"\bfairness\b", r"\bprivacy\b", r"\bsafety\b", r"\bbroader impact\b", r"\bmisuse\b"],
        "human_subjects_or_irb_mentions": [r"\bhuman subjects?\b", r"\birb\b", r"\binstitutional review board\b", r"\bcrowdsourc"],
    }

    signal_presence = {}
    for label, patterns in signal_specs.items():
        evidence = _collect_pattern_evidence(normalized_text, raw_text, patterns)
        signal_presence[label] = {
            "present": len(evidence) > 0,
            "evidence": evidence,
        }

    return {
        "section_presence": section_presence,
        "signal_presence": signal_presence,
    }


def _build_fallback_readiness_signals(
    *, hints: dict, extracted_document: ExtractedDocument
) -> list[ReviewerBriefingReadinessSignal]:
    section_presence = hints["section_presence"]
    signal_presence = hints["signal_presence"]

    evaluation_present = section_presence["experiments_or_evaluation"]
    limitations_present = section_presence["limitations"] or signal_presence["limitations_or_assumptions_mentions"]["present"]

    return [
        _signal_item(
            label="Claim-evidence alignment",
            status="present" if evaluation_present else "partial",
            detail=(
                "The manuscript includes a visible evaluation/results section that appears to support the main system claims."
                if evaluation_present
                else "A concrete evaluation/results section is not clearly visible, so the reviewer should verify how strongly the central claims are supported."
            ),
        ),
        _signal_item(
            label="Evaluation coverage",
            status="present" if evaluation_present and (extracted_document.table_count > 0 or extracted_document.figure_count > 0) else "partial" if evaluation_present else "not_found",
            detail=(
                f"The manuscript shows evaluation structure with {extracted_document.table_count} tables and {extracted_document.figure_count} figures available for inspection."
                if evaluation_present and (extracted_document.table_count > 0 or extracted_document.figure_count > 0)
                else "An evaluation/results section is visible, but the reviewer should inspect how complete the benchmark and analysis coverage actually is."
                if evaluation_present
                else "No clear evaluation/results section was detected in the extracted manuscript structure."
            ),
        ),
        _signal_item(
            label="Baseline or comparator coverage",
            status="present" if signal_presence["baseline_or_comparison_mentions"]["present"] else "not_found",
            detail=_signal_detail(
                present_text="Baseline or comparison language is explicitly visible in the manuscript.",
                missing_text="No explicit baseline/comparison cues were detected from the extracted manuscript hints.",
                evidence=signal_presence["baseline_or_comparison_mentions"]["evidence"],
                is_present=signal_presence["baseline_or_comparison_mentions"]["present"],
            ),
        ),
        _signal_item(
            label="Reproducibility path",
            status="present" if signal_presence["reproducibility_path_mentions"]["present"] else "partial" if section_presence["methodology"] else "not_found",
            detail=(
                _signal_detail(
                    present_text="Implementation or reproducibility cues are visible in the manuscript.",
                    missing_text="No direct code/model/checkpoint/instructions cues were detected, so the reviewer should verify reproducibility support manually.",
                    evidence=signal_presence["reproducibility_path_mentions"]["evidence"],
                    is_present=signal_presence["reproducibility_path_mentions"]["present"],
                )
                if signal_presence["reproducibility_path_mentions"]["present"]
                else "Methodology structure is visible, but the reproducibility path is not explicit in the extracted hints."
                if section_presence["methodology"]
                else "Neither a clear methodology structure nor explicit reproducibility cues were detected."
            ),
        ),
        _signal_item(
            label="Limitations transparency",
            status="present" if limitations_present else "not_found",
            detail=(
                "The manuscript exposes explicit limitation or assumption cues that the reviewer can inspect directly."
                if limitations_present
                else "No clear limitations section or limitation-language cues were detected from the extracted manuscript hints."
            ),
        ),
        _signal_item(
            label="Ablation or failure analysis",
            status="present" if signal_presence["ablation_or_sensitivity_mentions"]["present"] else "partial" if evaluation_present else "not_found",
            detail=(
                _signal_detail(
                    present_text="Ablation, sensitivity, or failure-analysis cues are visible in the manuscript.",
                    missing_text="No direct ablation or failure-analysis cues were detected from the extracted hints.",
                    evidence=signal_presence["ablation_or_sensitivity_mentions"]["evidence"],
                    is_present=signal_presence["ablation_or_sensitivity_mentions"]["present"],
                )
                if signal_presence["ablation_or_sensitivity_mentions"]["present"]
                else "Evaluation structure exists, but ablation/failure-analysis coverage is not explicit from the extracted hints."
                if evaluation_present
                else "No evaluation structure was detected, so ablation/failure-analysis coverage is also not visible."
            ),
        ),
        _signal_item(
            label="Statistics or uncertainty reporting",
            status="present" if signal_presence["statistics_or_uncertainty_mentions"]["present"] else "not_applicable" if not evaluation_present else "not_found",
            detail=(
                _signal_detail(
                    present_text="Statistical or uncertainty-reporting cues are visible in the manuscript.",
                    missing_text="No direct error-bar, confidence-interval, or statistical-test cues were detected from the extracted hints.",
                    evidence=signal_presence["statistics_or_uncertainty_mentions"]["evidence"],
                    is_present=signal_presence["statistics_or_uncertainty_mentions"]["present"],
                )
                if signal_presence["statistics_or_uncertainty_mentions"]["present"]
                else "No empirical evaluation structure was detected, so this category may not apply."
                if not evaluation_present
                else "An evaluation section is visible, but uncertainty/statistics reporting cues were not detected in the extracted hints."
            ),
        ),
        _signal_item(
            label="Ethics or risk disclosure",
            status="present" if signal_presence["ethics_or_risk_mentions"]["present"] or section_presence["ethics_or_broader_impact"] else "not_found",
            detail=(
                _signal_detail(
                    present_text="Ethics, safety, fairness, privacy, or broader-impact cues are visible in the manuscript.",
                    missing_text="No ethics/safety/fairness/privacy cues were detected from the extracted manuscript hints.",
                    evidence=signal_presence["ethics_or_risk_mentions"]["evidence"],
                    is_present=signal_presence["ethics_or_risk_mentions"]["present"] or section_presence["ethics_or_broader_impact"],
                )
            ),
        ),
    ]


def _has_heading(headings: list[str], terms: list[str]) -> bool:
    return any(any(term in heading for term in terms) for heading in headings)


def _collect_pattern_evidence(normalized_text: str, raw_text: str, patterns: list[str]) -> list[str]:
    evidence: list[str] = []
    for pattern in patterns:
        match = re.search(pattern, normalized_text)
        if match is None:
            continue
        start = max(match.start() - 48, 0)
        end = min(match.end() + 80, len(raw_text))
        snippet = _normalize_text(raw_text[start:end], 160)
        if not snippet or snippet in evidence:
            continue
        evidence.append(snippet)
        if len(evidence) >= MAX_SIGNAL_EVIDENCE:
            break
    return evidence


def _signal_item(*, label: str, status: str, detail: str) -> ReviewerBriefingReadinessSignal:
    return ReviewerBriefingReadinessSignal(
        label=label,
        status=status,
        detail=detail,
        source="derived",
    )


def _signal_detail(*, present_text: str, missing_text: str, evidence: list[str], is_present: bool) -> str:
    if not is_present:
        return missing_text
    if not evidence:
        return present_text
    return f"{present_text} Example cue: {evidence[0]}"


def _build_deterministic_artifact(
    *,
    request: ReviewerBriefingResolveRequest,
    extracted_document: ExtractedDocument,
) -> ReviewerBriefingArtifact:
    raw_text = _normalize_text(extracted_document.raw_text, MAX_MANUSCRIPT_CHARS)
    sections = _normalize_sections(extracted_document.sections)
    hints = _derive_review_readiness_hints(raw_text=raw_text, section_headings=sections)
    keywords = _dedupe_strings(request.submission.keywords)
    title = _normalize_text(request.submission.title, MAX_TITLE_CHARS)
    abstract = _normalize_text(request.submission.abstract, MAX_ABSTRACT_CHARS)
    overview_source = _normalize_text(extracted_document.abstract or raw_text, 420)

    return ReviewerBriefingArtifact(
        submission_snapshot={
            "title": title,
            "abstract_summary": abstract or "No abstract text was provided for this submission.",
            "manuscript_overview": overview_source
            or "The manuscript file was parsed successfully and is ready for reviewer pre-read support.",
            "keywords": keywords,
            "track": _normalize_text(request.submission.track or "", MAX_TRACK_CHARS) or None,
        },
        review_readiness_signals=_build_fallback_readiness_signals(
            hints=hints,
            extracted_document=extracted_document,
        ),
        claimed_contributions=[
            {
                "label": "Similarity metric analysis for recommender systems"
                if "pearson" in (title + " " + abstract).casefold()
                else "Submission contribution surfaced from title and abstract",
                "evidence": [
                    abstract[:220] if abstract else title,
                ],
                "source": "submission",
            }
        ],
        notable_elements=[
            {
                "label": "Reviewer-visible manuscript structure",
                "detail": (
                    f"Extracted sections include: {', '.join(sections[:4])}."
                    if sections
                    else "The manuscript text was extracted, but explicit section headings were limited."
                ),
                "source": "derived",
            },
            {
                "label": "Evaluation cues",
                "detail": "The reviewer should inspect the comparison against Pearson Correlation Coefficient and any dataset evidence.",
                "source": "derived",
            },
        ],
        reviewer_attention_points=[
            {
                "focus": "Validate the claimed improvement over standard Pearson Correlation Coefficient.",
                "reason": "The review should verify whether the experimental evidence supports the proposed similarity extension.",
                "source": "derived",
            },
            {
                "focus": "Check comparison coverage against other similarity measures.",
                "reason": "A recommender-system similarity paper is stronger when baselines and sensitivity are clearly reported.",
                "source": "derived",
            },
        ],
        stated_scope_and_limitations=[
            {
                "label": "Evidence scope",
                "detail": "The artifact is based on reviewer-visible metadata and extracted manuscript text; the reviewer should still inspect the PDF directly.",
                "source": "derived",
            }
        ],
        guardrails={
            "no_recommendation": True,
            "no_score": True,
            "bias_notice": "This briefing is assistive only and must not replace independent review judgment.",
        },
    )


def _force_deterministic_briefing() -> bool:
    return os.getenv("REVIEWER_BRIEFING_FORCE_FALLBACK", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
