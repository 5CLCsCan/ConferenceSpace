from __future__ import annotations

import json

from app.workflows.reviewer_pre_read_briefing.prompts import REVIEWER_BRIEFING_SYSTEM_PROMPT
from app.workflows.reviewer_pre_read_briefing.runner import build_inference_payload
from app.workflows.reviewer_pre_read_briefing.schemas import ReviewerBriefingArtifact, ReviewerBriefingResolveRequest
from app.workflows.submission_gating.models.facts import ExtractedDocument
from tests.test_reviewer_briefing_models import make_request_payload


def test_system_prompt_is_single_runtime_contract() -> None:
    prompt = REVIEWER_BRIEFING_SYSTEM_PROMPT

    assert "reviewer pre-read briefing" in prompt.lower()
    assert "submission, extracted manuscript content, and derived manuscript hints" in prompt.lower()
    assert "do not provide acceptance, rejection, or score predictions" in prompt.lower()
    assert "review readiness" in prompt.lower()
    assert "reproducibility path" in prompt.lower()
    assert "structured-output schema supplied with the request" in prompt.lower()
    assert "role" in prompt.lower()
    assert "task" in prompt.lower()
    assert "framework" in prompt.lower()
    assert "## role" in prompt.lower()
    assert "## task" in prompt.lower()
    assert "## framework" in prompt.lower()
    assert "## constraints" in prompt.lower()
    assert "## output" in prompt.lower()
    assert "## validation" in prompt.lower()
    assert "<role>" in prompt.lower()
    assert "</role>" in prompt.lower()
    assert "<task>" in prompt.lower()
    assert "</task>" in prompt.lower()
    assert "<framework>" in prompt.lower()
    assert "</framework>" in prompt.lower()
    assert "<routing_table>" in prompt.lower()
    assert "</routing_table>" in prompt.lower()
    assert "<hard_limits>" in prompt.lower()
    assert "</hard_limits>" in prompt.lower()
    assert "<output>" in prompt.lower()
    assert "</output>" in prompt.lower()
    assert "<validation_checklist>" in prompt.lower()
    assert "</validation_checklist>" in prompt.lower()
    assert "claimed_contributions" in prompt
    assert "notable_elements" in prompt
    assert "reviewer_attention_points" in prompt
    assert "stated_scope_and_limitations" in prompt
    assert "prefer not_found over speculation" in prompt.lower()
    assert "use not_applicable only when the category genuinely does not fit the paper" in prompt.lower()
    assert "do not repeat the same fact across multiple fields unless the fields serve different reviewer needs" in prompt.lower()
    assert "discussion_context" not in prompt.lower()
    assert "rebuttal_context" not in prompt.lower()


def test_response_schema_carries_field_guidance() -> None:
    parsed = ReviewerBriefingArtifact.model_json_schema()

    assert parsed["type"] == "object"
    assert "submission_snapshot" in parsed["properties"]
    assert "review_readiness_signals" in parsed["properties"]
    assert "guardrails" in parsed["properties"]
    snapshot = parsed["$defs"]["ReviewerBriefingSubmissionSnapshot"]["properties"]
    assert "abstract" in snapshot["abstract_summary"]["description"].lower()
    attention_point = parsed["$defs"]["ReviewerBriefingAttentionPoint"]["properties"]
    assert "reviewer should verify" in attention_point["focus"]["description"].lower()
    signal = parsed["$defs"]["ReviewerBriefingReadinessSignal"]["properties"]
    assert "evidence status" in signal["status"]["description"].lower()


def test_user_payload_serialization_is_deterministic_and_minimal() -> None:
    request = ReviewerBriefingResolveRequest.model_validate(make_request_payload(action="generate"))
    document = ExtractedDocument(
        format="pdf",
        raw_text="  Intro   text.  Method text.  Result text. ",
        sections=["Introduction", "Method", "Results"],
        title="Reliable Systems for Conferences",
        abstract="We propose a structured reviewer pre-read workflow.",
        page_count=8,
        table_count=1,
        figure_count=2,
        text_coverage_ratio=0.8,
        reference_count=12,
    )

    payload = build_inference_payload(request=request, extracted_document=document)
    first = json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":"))
    second = json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":"))

    assert first == second
    assert "\n" not in first
    assert "prompt_version" not in first
    assert "discussion_context" not in first
    assert "rebuttal_context" not in first

    parsed = json.loads(first)
    assert set(parsed.keys()) == {"guardrails", "manuscript", "submission"}
    assert parsed["guardrails"]["no_recommendation"] is True
    assert parsed["manuscript"]["section_headings"] == ["Introduction", "Method", "Results"]
    assert parsed["manuscript"]["review_readiness_hints"]["section_presence"]["methodology"] is True
    assert "signal_presence" in parsed["manuscript"]["review_readiness_hints"]
