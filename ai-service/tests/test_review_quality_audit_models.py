from __future__ import annotations

import pytest

from app.workflows.review_quality_auditor.schemas import (
    ReviewQualityAuditResolveRequest,
    ReviewQualityAuditResolveResponse,
)


def make_request_payload(*, mode: str = "submit_preflight", include_briefing: bool = True) -> dict:
    payload = {
        "mode": mode,
        "conference_id": 42,
        "assignment_id": 99,
        "submission_id": 7,
        "actor": {
            "user_id": 123,
            "email": "reviewer@example.com",
            "role": "reviewer",
        },
        "submission": {
            "title": "Evidence-Aware Systems",
            "abstract": "Structured reviewer workflows for academic review quality.",
            "keywords": ["review", "workflow"],
            "track": "main",
        },
        "review_score": 8.4,
        "review": {
            "criteria": {
                "originality": 9,
                "technical_quality": 8,
                "clarity": 8,
                "significance": 9,
                "methodology": 8,
            },
            "feedback": {
                "summary": "The paper presents a useful reviewer workflow, explains the motivation clearly, and makes the scope of the problem concrete for conference operations.",
                "strengths": "Strong framing, practical relevance, coherent workflow design, and a clear explanation of why the workflow could improve reviewer consistency.",
                "weaknesses": "Evaluation breadth is still somewhat limited and the external validity discussion could be stronger in future iterations.",
                "questions": "How does the workflow generalize across tracks and what would change for venues with materially different rubric structures?",
            },
            "recommendation": "accept",
            "confidence": "high",
        },
    }
    if include_briefing:
        payload["analysis_artifact"] = {
            "briefing": {
                "submission_snapshot": {
                    "title": "Evidence-Aware Systems",
                    "abstract_summary": "Workflow-focused submission.",
                    "manuscript_overview": "The manuscript covers reviewer quality support.",
                    "keywords": ["review", "workflow"],
                    "track": "main",
                },
                "review_readiness_signals": [],
                "claimed_contributions": [
                    {"label": "Structured reviewer workflow", "evidence": [], "source": "submission"}
                ],
                "notable_elements": [],
                "reviewer_attention_points": [
                    {"focus": "workflow generalization", "reason": "Core practical claim", "source": "derived"}
                ],
                "stated_scope_and_limitations": [
                    {"label": "single-platform evaluation", "detail": "Evaluation scope is bounded", "source": "submission"}
                ],
            },
            "annotations": {
                "overall_impression": "The paper is relevant but the evaluation scope needs attention.",
                "domain_context": "Conference review workflow support",
                "sections": [
                    {
                        "section_name": "Evaluation",
                        "summary": "The evaluation is practical but narrow.",
                        "annotations": [
                            {
                                "category": "weakness",
                                "severity": "moderate",
                                "quoted_passage": "single-platform evaluation",
                                "commentary": "The reviewer should consider whether this affects generalization.",
                                "reviewer_hint": "Check whether the review addresses external validity.",
                            }
                        ],
                    }
                ],
            },
        }
    return payload


def test_request_accepts_optional_analysis_artifact() -> None:
    with_analysis = ReviewQualityAuditResolveRequest.model_validate(make_request_payload(include_briefing=True))
    without_analysis = ReviewQualityAuditResolveRequest.model_validate(make_request_payload(include_briefing=False))

    assert with_analysis.analysis_artifact is not None
    assert with_analysis.analysis_artifact.annotations.sections[0].annotations[0].quoted_passage == "single-platform evaluation"
    assert without_analysis.analysis_artifact is None


def test_response_defaults_isolate_findings() -> None:
    left = ReviewQualityAuditResolveResponse.model_validate(
        {
            "status": "pass",
            "evaluation": {
                "summary": "The review is clear and grounded.",
                "evidence_engagement": "It engages the submission evidence.",
                "consistency_assessment": "The recommendation and narrative align.",
                "improvement_focus": "Keep the reasoning concrete.",
            },
        }
    )
    right = ReviewQualityAuditResolveResponse.model_validate(
        {
            "status": "pass",
            "evaluation": {
                "summary": "The review is clear and grounded.",
                "evidence_engagement": "It engages the submission evidence.",
                "consistency_assessment": "The recommendation and narrative align.",
                "improvement_focus": "Keep the reasoning concrete.",
            },
        }
    )

    left.findings.append(
        {
            "code": "x",
            "severity": "warning",
            "field": "review",
            "message": "x",
            "rationale": "The finding is present because the review omits concrete grounding.",
            "suggestion": "y",
            "condition_fingerprint": "sha256:test",
        }
    )

    assert right.findings == []


def test_request_rejects_invalid_mode() -> None:
    payload = make_request_payload()
    payload["mode"] = "lookup"

    with pytest.raises(Exception):
        ReviewQualityAuditResolveRequest.model_validate(payload)


def test_final_response_rejects_unknown_finding_code() -> None:
    payload = {
        "status": "warn",
        "evaluation": {
            "summary": "The review is generally understandable.",
            "evidence_engagement": "It partly engages the submission evidence.",
            "consistency_assessment": "The recommendation and narrative mostly align.",
            "improvement_focus": "Make the reasoning more concrete.",
        },
        "findings": [
            {
                "code": "made.up.code",
                "severity": "warning",
                "field": "review",
                "message": "The review has an unsupported issue code.",
                "rationale": "The finding should be rejected because the code is not part of the audit taxonomy.",
                "suggestion": "Use a supported issue code from the schema.",
                "condition_fingerprint": "sha256:test",
            }
        ],
    }

    with pytest.raises(Exception):
        ReviewQualityAuditResolveResponse.model_validate(payload)


def test_final_response_rejects_unknown_finding_severity() -> None:
    payload = {
        "status": "warn",
        "evaluation": {
            "summary": "The review is generally understandable.",
            "evidence_engagement": "It partly engages the submission evidence.",
            "consistency_assessment": "The recommendation and narrative mostly align.",
            "improvement_focus": "Make the reasoning more concrete.",
        },
        "findings": [
            {
                "code": "quality.review_too_generic_to_submit",
                "severity": "critical",
                "field": "review",
                "message": "The review has an unsupported severity.",
                "rationale": "The finding should be rejected because severity is not part of the audit contract.",
                "suggestion": "Use warning or blocking severity.",
                "condition_fingerprint": "sha256:test",
            }
        ],
    }

    with pytest.raises(Exception):
        ReviewQualityAuditResolveResponse.model_validate(payload)
