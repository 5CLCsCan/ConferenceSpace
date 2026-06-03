from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.workflows.reviewer_initial_analysis.schemas import (
    ReviewerInitialAnalysisArtifact,
    ReviewerInitialAnalysisResolveRequest,
    ReviewerInitialAnalysisResolveResponse,
)


def make_request_payload(action: str = "lookup") -> dict:
    return {
        "action": action,
        "conference_id": 1,
        "assignment_id": 2,
        "submission_id": 3,
        "actor": {"user_id": 9, "email": "reviewer@example.com", "role": "reviewer"},
        "submission_state_fingerprint": "sha256:abc",
        "submission": {
            "title": "A Test Paper",
            "abstract": "This paper studies a test problem.",
            "keywords": ["testing", "review"],
            "track": "AI",
        },
        "file_metadata": {
            "original_filename": "paper.pdf",
            "content_type": "application/pdf",
            "size_bytes": 1234,
        },
        "domain_tags": ["testing"],
    }


def make_artifact_payload() -> dict:
    return {
        "briefing": {
            "submission_snapshot": {
                "title": "A Test Paper",
                "abstract_summary": "The paper studies a test problem.",
                "manuscript_overview": "The manuscript describes a method and evaluation.",
                "keywords": ["testing", "review"],
                "track": "AI",
            },
            "review_readiness_signals": [
                {
                    "label": "Claim-evidence alignment",
                    "status": "partial",
                    "detail": "Some support is visible, but evaluation details need checking.",
                    "source": "derived",
                }
            ],
            "claimed_contributions": [
                {
                    "label": "Test method",
                    "evidence": ["The manuscript claims a method for testing."],
                    "source": "submission",
                }
            ],
            "notable_elements": [
                {
                    "label": "Evaluation section present",
                    "detail": "The manuscript includes an evaluation section.",
                    "source": "derived",
                }
            ],
            "reviewer_attention_points": [
                {
                    "focus": "Verify baseline comparison",
                    "reason": "The extracted content only partially describes baselines.",
                    "source": "derived",
                }
            ],
            "stated_scope_and_limitations": [
                {
                    "label": "Limited setting",
                    "detail": "The paper appears scoped to one benchmark.",
                    "source": "derived",
                }
            ],
        },
        "annotations": {
            "overall_impression": "The manuscript has a clear structure but needs careful evidence checks.",
            "domain_context": "AI/testing — focused on reproducibility and evaluation support.",
            "sections": [
                {
                    "section_name": "Introduction",
                    "summary": "Introduces the problem and motivation.",
                    "annotations": [
                        {
                            "category": "question",
                            "severity": None,
                            "quoted_passage": "We study a test problem.",
                            "commentary": "The problem statement is visible, but the scope should be checked.",
                            "reviewer_hint": "Look for a precise problem definition later in the manuscript.",
                        }
                    ],
                }
            ],
        },
        "guardrails": {
            "advisory_only": True,
            "no_recommendation": True,
            "no_score": True,
            "bias_notice": "This analysis is assistive only and must not replace independent reviewer judgment.",
        },
    }


def test_resolve_request_accepts_lookup_and_generate_actions():
    lookup = ReviewerInitialAnalysisResolveRequest.model_validate(make_request_payload("lookup"))
    generate = ReviewerInitialAnalysisResolveRequest.model_validate(make_request_payload("generate"))

    assert lookup.action == "lookup"
    assert generate.action == "generate"


def test_artifact_requires_briefing_and_annotations():
    artifact = ReviewerInitialAnalysisArtifact.model_validate(make_artifact_payload())

    assert artifact.briefing.submission_snapshot.title == "A Test Paper"
    assert artifact.annotations.sections[0].annotations[0].quoted_passage == "We study a test problem."
    assert artifact.guardrails.no_recommendation is True


def test_annotation_requires_verbatim_quote_field():
    payload = make_artifact_payload()
    del payload["annotations"]["sections"][0]["annotations"][0]["quoted_passage"]

    with pytest.raises(ValidationError):
        ReviewerInitialAnalysisArtifact.model_validate(payload)


def test_response_wraps_unified_artifact():
    response = ReviewerInitialAnalysisResolveResponse.model_validate(
        {
            "status": "ready",
            "run_id": "run-1",
            "cache": {"hit": False, "submission_state_fingerprint": "sha256:abc"},
            "artifact": make_artifact_payload(),
            "error": None,
        }
    )

    assert response.artifact is not None
    assert response.artifact.briefing.review_readiness_signals
    assert response.artifact.annotations.sections
