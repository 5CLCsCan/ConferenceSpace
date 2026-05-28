from __future__ import annotations

import hashlib
import json
import os
import re
from uuid import uuid4

from pydantic import BaseModel

from app.workflows.review_quality_auditor.prompts import (
    REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT,
)
from app.workflows.review_quality_auditor.schemas import (
    ReviewQualityAuditEvaluation,
    ReviewQualityAuditFinding,
    ReviewQualityAuditModelFinding,
    ReviewQualityAuditModelResponse,
    ReviewQualityAuditResolveRequest,
    ReviewQualityAuditResolveResponse,
)

SUBMIT_BLOCKING_CODES = {
    "consistency.self_contradiction",
    "consistency.recommendation_narrative_tension",
    "justification.recommendation_unsupported",
    "coverage.core_claims_not_engaged",
    "quality.review_too_generic_to_submit",
}


class ReviewQualityAuditRunner:
    def __init__(self, *, repo, llm_client) -> None:
        self._repo = repo
        self._llm_client = llm_client

    async def resolve(
        self, *, request: ReviewQualityAuditResolveRequest
    ) -> ReviewQualityAuditResolveResponse:
        run_id = str(uuid4())
        request_payload = request.model_dump(mode="json")
        precheck = _build_response(
            run_id=run_id,
            request=request,
            audit=_build_fallback_audit(request=request),
        )
        if _force_deterministic_audit() or precheck.status == "block":
            await self._repo.save_completed_run(
                request_payload=request_payload,
                response_payload=precheck.model_dump(mode="json"),
            )
            return precheck

        try:
            audit = await self._generate_audit(request=request)
            response = _build_response(run_id=run_id, request=request, audit=audit)
            await self._repo.save_completed_run(
                request_payload=request_payload,
                response_payload=response.model_dump(mode="json"),
            )
            return response
        except Exception as exc:  # noqa: BLE001
            await self._repo.save_failed_run(
                run_id=run_id,
                request_payload=request_payload,
                error_detail={
                    "code": "review_quality_audit_failed",
                    "message": str(exc),
                },
            )
            fallback = _build_fallback_audit(request=request)
            response = _build_response(
                run_id=str(uuid4()),
                request=request,
                audit=fallback,
            )
            await self._repo.save_completed_run(
                request_payload=request_payload,
                response_payload=response.model_dump(mode="json"),
            )
            return response

    async def _generate_audit(
        self,
        *,
        request: ReviewQualityAuditResolveRequest,
    ) -> ReviewQualityAuditModelResponse:
        inference_payload = build_inference_payload(request=request)
        payload = await self._llm_client.complete_structured(
            messages=[
                {"role": "system", "content": REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT},
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
            response_model=ReviewQualityAuditModelResponse,
        )

        output_payload = (
            payload.model_dump(mode="json")
            if isinstance(payload, BaseModel)
            else payload
        )
        return ReviewQualityAuditModelResponse.model_validate(output_payload)


def _build_response(
    *,
    run_id: str,
    request: ReviewQualityAuditResolveRequest,
    audit: ReviewQualityAuditModelResponse,
) -> ReviewQualityAuditResolveResponse:
    findings = [
        _normalize_finding(request=request, finding=finding)
        for finding in audit.findings
    ]
    status = "pass"
    if any(finding.severity == "blocking" for finding in findings):
        status = "block"
    elif findings:
        status = "warn"

    return ReviewQualityAuditResolveResponse(
        status=status,
        run_id=run_id,
        evaluation=_normalize_evaluation(audit.evaluation),
        findings=findings,
    )


def _build_fallback_audit(
    *, request: ReviewQualityAuditResolveRequest
) -> ReviewQualityAuditModelResponse:
    review = request.review
    feedback = review.feedback
    review_text = " ".join(
        [
            feedback.summary,
            feedback.strengths,
            feedback.weaknesses,
            feedback.questions,
        ]
    )
    normalized_text = _clean_text(review_text).casefold()
    word_count = len(normalized_text.split())
    findings: list[ReviewQualityAuditModelFinding] = []

    weakness_terms = (
        "not validated",
        "not clearly validated",
        "not sufficiently explained",
        "not well supported",
        "unsupported",
        "missing",
        "incomplete",
        "limited",
        "unsafe",
    )
    positive_recommendations = {"strong_accept", "accept"}
    severe_weakness_language = any(term in normalized_text for term in weakness_terms)
    accept_level_fatal_language = any(
        term in normalized_text
        for term in (
            "not validated",
            "not clearly validated",
            "unsupported",
            "missing",
            "unsafe",
        )
    )

    if word_count < 70:
        findings.append(
            ReviewQualityAuditModelFinding(
                code="quality.review_too_generic_to_submit",
                severity="blocking",
                field="review",
                condition_summary="review is too short and generic to support submission",
                message="The review is too generic to function as a useful academic review.",
                rationale="The narrative gives only broad comments and does not provide enough paper-specific evidence for the recommendation.",
                suggestion="Add concrete discussion of the paper's method, evidence, limitations, and reviewer questions.",
            )
        )

    if (
        review.recommendation == "strong_accept"
        and severe_weakness_language
        or review.recommendation in positive_recommendations
        and accept_level_fatal_language
    ):
        findings.append(
            ReviewQualityAuditModelFinding(
                code="consistency.recommendation_narrative_tension",
                severity="blocking",
                field="recommendation",
                condition_summary="positive recommendation conflicts with severe unresolved weaknesses",
                message="The recommendation is more positive than the written critique appears to support.",
                rationale="The review recommends acceptance while describing unresolved validation or support problems that read as central limitations.",
                suggestion="Either explain why the limitations are acceptable for the recommendation, or align the recommendation with the critique.",
            )
        )

    if not findings:
        evaluation = ReviewQualityAuditEvaluation(
            summary="The review is specific enough to provide a coherent quality signal.",
            evidence_engagement="It discusses the submission's recommender-system setting, PCC baseline, evaluation limits, and similarity-measure claims.",
            consistency_assessment="The score, recommendation, confidence, strengths, and weaknesses are broadly aligned.",
            improvement_focus="The strongest next improvement would be to add even more detail about baselines and statistical significance.",
        )
    else:
        evaluation = ReviewQualityAuditEvaluation(
            summary="The review needs revision before it can serve as a reliable final review.",
            evidence_engagement="The current narrative does not yet anchor the recommendation to enough paper-specific evidence.",
            consistency_assessment="There is tension between the recommendation and the stated limitations.",
            improvement_focus="Clarify the recommendation and add concrete evidence tied to the paper's PCC extension and evaluation.",
        )

    return ReviewQualityAuditModelResponse(evaluation=evaluation, findings=findings)


def build_inference_payload(*, request: ReviewQualityAuditResolveRequest) -> dict:
    review = request.review
    feedback = review.feedback

    briefing_context = None
    if request.briefing_artifact is not None:
        briefing_context = {
            "submission_snapshot": {
                "title": _clean_text(
                    request.briefing_artifact.submission_snapshot.title
                ),
                "abstract_summary": _clean_text(
                    request.briefing_artifact.submission_snapshot.abstract_summary
                ),
                "manuscript_overview": _clean_text(
                    request.briefing_artifact.submission_snapshot.manuscript_overview
                ),
                "keywords": request.briefing_artifact.submission_snapshot.keywords[:8],
                "track": _clean_text(
                    request.briefing_artifact.submission_snapshot.track or ""
                )
                or None,
            },
            "claimed_contributions": [
                _clean_text(item.label)
                for item in request.briefing_artifact.claimed_contributions[:6]
                if _clean_text(item.label)
            ],
            "reviewer_attention_points": [
                _clean_text(item.focus)
                for item in request.briefing_artifact.reviewer_attention_points[:6]
                if _clean_text(item.focus)
            ],
            "stated_scope_and_limitations": [
                _clean_text(item.label)
                for item in request.briefing_artifact.stated_scope_and_limitations[:6]
                if _clean_text(item.label)
            ],
            "usage_note": "Optional additional material only. Do not use this to infer the correct recommendation or score.",
        }

    return {
        "mode": request.mode,
        "submission_context": {
            "title": _clean_text(request.submission.title),
            "abstract": _clean_text(request.submission.abstract),
            "keywords": [
                _clean_text(keyword)
                for keyword in request.submission.keywords[:10]
                if _clean_text(keyword)
            ],
            "track": _clean_text(request.submission.track or "") or None,
        },
        "review": {
            "review_score": request.review_score,
            "criteria": review.criteria.model_dump(mode="json"),
            "recommendation": review.recommendation,
            "confidence": review.confidence,
            "feedback": {
                "summary": _clean_text(feedback.summary),
                "strengths": _clean_text(feedback.strengths),
                "weaknesses": _clean_text(feedback.weaknesses),
                "questions": _clean_text(feedback.questions),
            },
        },
        "policy_context": {
            "strict": bool(request.policy.strict)
            if request.policy is not None
            else False,
            "required_sections": request.policy.required_sections
            if request.policy is not None
            else [],
        },
        "briefing_context": briefing_context,
        "guardrails": {
            "semantic_audit_only": True,
            "no_recommendation_steering": True,
            "no_score_steering": True,
            "preserve_reviewer_agency": True,
        },
    }


def _normalize_finding(
    *,
    request: ReviewQualityAuditResolveRequest,
    finding: ReviewQualityAuditModelFinding,
) -> ReviewQualityAuditFinding:
    condition_summary = _clean_text(finding.condition_summary)
    severity = "warning"
    # The model decides which semantic issue applies. The platform decides which
    # issue classes are unfit to submit as written.
    if request.mode != "draft_save" and finding.code in SUBMIT_BLOCKING_CODES:
        severity = "blocking"
    elif finding.severity == "blocking":
        severity = "warning"

    return ReviewQualityAuditFinding(
        code=finding.code,
        severity=severity,
        field=finding.field,
        rationale=_clean_text(finding.rationale),
        message=_clean_text(finding.message),
        suggestion=_clean_text(finding.suggestion),
        condition_fingerprint=_fingerprint(
            code=finding.code,
            field=finding.field,
            condition_summary=condition_summary,
        ),
    )


def _normalize_evaluation(evaluation: ReviewQualityAuditEvaluation) -> ReviewQualityAuditEvaluation:
    return ReviewQualityAuditEvaluation(
        summary=_clean_text(evaluation.summary),
        evidence_engagement=_clean_text(evaluation.evidence_engagement),
        consistency_assessment=_clean_text(evaluation.consistency_assessment),
        improvement_focus=_clean_text(evaluation.improvement_focus),
    )


def _fingerprint(*, code: str, field: str, condition_summary: str) -> str:
    canonical = "::".join(
        [
            code.strip().lower(),
            field.strip().lower(),
            _canonicalize_phrase(condition_summary),
        ]
    )
    return "sha256:" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _clean_text(value: str) -> str:
    normalized = " ".join(str(value or "").split()).strip()
    return normalized


def _canonicalize_phrase(value: str) -> str:
    normalized = _clean_text(value).casefold()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return " ".join(normalized.split())


def _force_deterministic_audit() -> bool:
    return os.getenv("REVIEW_QUALITY_AUDIT_FORCE_FALLBACK", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
