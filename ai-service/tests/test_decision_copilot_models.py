from __future__ import annotations

import pytest

from app.workflows.chair_decision_copilot.schemas import (
    DecisionCopilotArtifact,
    DecisionCopilotResolveRequest,
    DecisionCopilotResolveResponse,
)


def make_request_payload(*, action: str = "lookup", fingerprint: str = "sha256:test") -> dict:
    return {
        "action": action,
        "conference_id": 42,
        "submission_id": 7,
        "actor": {
            "user_id": 123,
            "email": "chair@example.com",
            "role": "chair",
        },
        "evidence_fingerprint": fingerprint,
        "component_fingerprints": {
            "submission": "sha256:submission",
            "reviews": "sha256:reviews",
            "discussion": "sha256:discussion",
            "rebuttal": "sha256:rebuttal",
        },
        "evidence": {
            "schema_version": "ai-006-v1",
            "submission": {
                "title": "Evidence Aware Systems",
                "track": "main",
                "status": "reviewing",
                "keywords": ["systems", "evidence"],
                "last_updated_at": "2026-03-31T10:00:00Z",
            },
            "reviews": [
                {
                    "reviewer_id": "reviewer-1",
                    "reviewer_email": "reviewer1@example.com",
                    "recommendation": "accept",
                    "confidence": "high",
                    "score": 8.0,
                    "submitted_at": "2026-03-30T10:00:00Z",
                    "summary": "Promising paper.",
                    "strengths": "Novel direction.",
                    "weaknesses": "Evaluation breadth.",
                    "questions": "How robust is the benchmark set?",
                    "criteria": {
                        "originality": 8,
                        "technical_quality": 6,
                        "clarity": 7,
                        "significance": 8,
                        "methodology": 6,
                    },
                }
            ],
            "review_analytics": {
                "review_distribution": [{"label": "accept", "count": 1}],
                "confidence_mix": [{"label": "high", "count": 1}],
                "strongest_criteria": ["Originality"],
                "weakest_criteria": ["Technical quality"],
                "review_coverage_completeness": "1 of 1 assigned reviews submitted.",
                "score_changes_after_rebuttal": None,
                "last_evidence_update": "2026-03-31T10:00:00Z",
            },
            "discussion": {
                "thread_count": 1,
                "message_count": 2,
                "last_activity_at": "2026-03-31T11:00:00Z",
                "threads": [
                    {
                        "title": "Evaluation concerns",
                        "visibility": "chair_author_reviewer",
                        "message_count": 2,
                        "last_message_at": "2026-03-31T11:00:00Z",
                        "messages": [
                            {
                                "author_email": "reviewer1@example.com",
                                "content": "The evaluation needs stronger baselines.",
                                "created_at": "2026-03-31T10:30:00Z",
                            }
                        ],
                    }
                ],
            },
            "rebuttal": {
                "status": "not_applicable",
                "general_response": None,
                "points": [],
                "assignments": [],
                "summary_hint": "Rebuttal was not enabled for this conference.",
            },
        },
    }


def make_artifact_payload() -> dict:
    return {
        "evidence_summary": {
            "overview": "Available evidence centers on novelty, evaluation depth, and discussion follow-up.",
            "evidence_basis": ["1 submitted review", "1 discussion thread"],
        },
        "review_feedback_synthesis": {
            "summary": "Reviewer feedback is positive on novelty but raises concerns about empirical breadth.",
            "strengths": ["Novel direction"],
            "weaknesses": ["Evaluation breadth"],
            "questions": ["How robust is the benchmark set?"],
        },
        "review_analytics": {
            "review_distribution": [{"label": "accept", "count": 1}],
            "confidence_mix": [{"label": "high", "count": 1}],
            "strongest_criteria": ["Originality"],
            "weakest_criteria": ["Technical quality"],
            "review_coverage_completeness": "1 of 1 assigned reviews submitted.",
            "score_changes_after_rebuttal": None,
            "last_evidence_update": "2026-03-31T10:00:00Z",
        },
        "discussion_signals": {
            "summary": "Discussion focused on the need for stronger baseline comparisons.",
            "thread_count": 1,
            "message_count": 2,
            "last_activity_at": "2026-03-31T11:00:00Z",
        },
        "rebuttal_signals": {
            "status": "not_applicable",
            "summary": "Rebuttal was not enabled for this conference.",
        },
        "disagreement_map": {
            "areas_of_agreement": ["Novel problem framing"],
            "areas_of_disagreement": ["Strength of empirical support"],
            "unresolved_concerns": ["Baseline coverage"],
            "confidence_limits": ["Only one submitted review is available."],
        },
        "suggested_chair_note": "This draft summarizes the evidence without making the decision.",
        "guardrails": {
            "advisory_only": True,
            "no_decision": True,
            "no_automatic_status_change": True,
            "human_judgment_required": "Final decision remains with the chair.",
        },
        "evidence_fingerprint": "sha256:test",
        "generated_at": "2026-03-31T11:05:00Z",
    }


def test_resolve_request_accepts_lookup_generate_and_regenerate() -> None:
    lookup = DecisionCopilotResolveRequest.model_validate(make_request_payload(action="lookup"))
    generate = DecisionCopilotResolveRequest.model_validate(make_request_payload(action="generate"))
    regenerate = DecisionCopilotResolveRequest.model_validate(make_request_payload(action="regenerate"))

    assert lookup.action == "lookup"
    assert generate.action == "generate"
    assert regenerate.action == "regenerate"


def test_artifact_and_response_models_use_isolated_defaults() -> None:
    left = DecisionCopilotArtifact.model_validate(make_artifact_payload())
    right_payload = make_artifact_payload()
    right_payload["evidence_summary"]["overview"] = "Different overview"
    right = DecisionCopilotArtifact.model_validate(right_payload)

    left.disagreement_map.unresolved_concerns.append("Extra concern")

    response = DecisionCopilotResolveResponse.model_validate(
        {
            "status": "ready",
            "run_id": "550e8400-e29b-41d4-a716-446655440000",
            "cache": {
                "hit": False,
                "evidence_fingerprint": "sha256:test",
                "is_stale": False,
                "stale_reasons": [],
            },
            "artifact": right.model_dump(),
            "error": None,
        }
    )

    assert len(right.disagreement_map.unresolved_concerns) == 1
    assert response.artifact is not None


def test_artifact_schema_rejects_verdict_like_language() -> None:
    payload = make_artifact_payload()
    payload["evidence_summary"]["overview"] = "The chair should accept this submission now."

    with pytest.raises(Exception):
        DecisionCopilotArtifact.model_validate(payload)
