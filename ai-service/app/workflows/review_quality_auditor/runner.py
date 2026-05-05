from __future__ import annotations

import hashlib
import json
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

        try:
            audit = await self._generate_audit(request=request)
            findings = [
                _normalize_finding(request=request, finding=finding)
                for finding in audit.findings
            ]
            status = "pass"
            if any(finding.severity == "blocking" for finding in findings):
                status = "block"
            elif findings:
                status = "warn"

            response = ReviewQualityAuditResolveResponse(
                status=status,
                run_id=run_id,
                evaluation=_normalize_evaluation(audit.evaluation),
                findings=findings,
            )
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
            raise

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
