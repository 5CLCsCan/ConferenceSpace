from __future__ import annotations

from app.workflows.reviewer_pre_read_briefing.schemas import (
    ReviewerBriefingArtifact,
    ReviewerBriefingResolveRequest,
    ReviewerBriefingResolveResponse,
)


def make_request_payload(*, action: str = "lookup", fingerprint: str = "sha256:test") -> dict:
    return {
        "action": action,
        "conference_id": 42,
        "assignment_id": 11,
        "submission_id": 7,
        "actor": {
            "user_id": 123,
            "email": "reviewer@example.com",
            "role": "reviewer",
        },
        "submission_state_fingerprint": fingerprint,
        "submission": {
            "title": "Reliable Systems for Conferences",
            "abstract": "We propose a structured reviewer pre-read workflow for conference reviewers.",
            "keywords": ["review", "workflow"],
            "track": "main",
        },
        "file_metadata": {
            "original_filename": "submission.pdf",
            "content_type": "application/pdf",
            "size_bytes": 4096,
        },
    }


def make_artifact_payload() -> dict:
    return {
        "submission_snapshot": {
            "title": "Reliable Systems for Conferences",
            "abstract_summary": "The submission proposes a structured reviewer pre-read workflow.",
            "manuscript_overview": "The manuscript presents the workflow, design rationale, and evaluation framing.",
            "keywords": ["review", "workflow"],
            "track": "main",
        },
        "review_readiness_signals": [
            {
                "label": "Claim support visibility",
                "status": "present",
                "detail": "The manuscript links the workflow claim to concrete design rationale and reviewer workflow framing.",
                "source": "derived",
            }
        ],
        "claimed_contributions": [
            {
                "label": "Structured reviewer pre-read workflow",
                "evidence": ["The manuscript claims to reduce reviewer rereading effort."],
                "source": "submission",
            }
        ],
        "notable_elements": [
            {
                "label": "Workflow framing",
                "detail": "The paper emphasizes reviewer orientation before manual evaluation.",
                "source": "submission",
            }
        ],
        "reviewer_attention_points": [
            {
                "focus": "Check whether the workflow is supported by concrete manuscript evidence.",
                "reason": "The central value proposition depends on clear linkage between manuscript content and claimed efficiency gains.",
                "source": "derived",
            }
        ],
        "stated_scope_and_limitations": [
            {
                "label": "Neutral assistive analysis",
                "detail": "The workflow is framed as analysis support rather than automated decision-making.",
                "source": "submission",
            }
        ],
        "guardrails": {
            "no_recommendation": True,
            "no_score": True,
            "bias_notice": "This briefing is assistive only and must not replace independent review judgment.",
        },
    }


def test_resolve_request_accepts_lookup_and_generate() -> None:
    lookup = ReviewerBriefingResolveRequest.model_validate(make_request_payload(action="lookup"))
    generate = ReviewerBriefingResolveRequest.model_validate(make_request_payload(action="generate"))

    assert lookup.action == "lookup"
    assert generate.action == "generate"
    assert generate.submission.title == "Reliable Systems for Conferences"
    assert generate.file_metadata.original_filename == "submission.pdf"


def test_artifact_and_response_models_use_isolated_defaults() -> None:
    left = ReviewerBriefingArtifact.model_validate(make_artifact_payload())
    right_payload = make_artifact_payload()
    right_payload["submission_snapshot"]["title"] = "Paper B"
    right = ReviewerBriefingArtifact.model_validate(right_payload)

    left.claimed_contributions.append(
        {
            "label": "Secondary claim",
            "evidence": ["Extra evidence"],
            "source": "submission",
        }
    )

    response = ReviewerBriefingResolveResponse.model_validate(
        {
            "status": "ready",
            "run_id": "550e8400-e29b-41d4-a716-446655440000",
            "cache": {"hit": False, "submission_state_fingerprint": "sha256:test"},
            "artifact": right.model_dump(),
        }
    )

    assert len(right.claimed_contributions) == 1
    assert response.status == "ready"
    assert response.artifact is not None


def test_artifact_schema_is_strict_for_openai_responses() -> None:
    schema = ReviewerBriefingArtifact.model_json_schema()

    assert _schema_object_property_mismatches(schema) == []


def _schema_object_property_mismatches(schema: dict) -> list[tuple[str | None, list[str], list[str]]]:
    mismatches: list[tuple[str | None, list[str], list[str]]] = []
    stack: list[object] = [schema, *schema.get("$defs", {}).values()]
    while stack:
        current = stack.pop()
        if isinstance(current, dict):
            if current.get("type") == "object":
                properties = set(current.get("properties", {}))
                required = set(current.get("required", []))
                if current.get("additionalProperties") is not False or properties != required:
                    mismatches.append((current.get("title"), sorted(properties - required), sorted(required - properties)))
            stack.extend(value for value in current.values() if isinstance(value, (dict, list)))
        elif isinstance(current, list):
            stack.extend(value for value in current if isinstance(value, (dict, list)))
    return mismatches
