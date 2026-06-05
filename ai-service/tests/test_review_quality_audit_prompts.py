from __future__ import annotations

from app.workflows.review_quality_auditor.prompts import (
    REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT,
)
from app.workflows.review_quality_auditor.schemas import (
    ReviewQualityAuditModelFinding,
    ReviewQualityAuditModelResponse,
)


def test_system_prompt_keeps_semantic_audit_scope_and_drops_runtime_enforcement() -> (
    None
):
    prompt = REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT
    lowered = prompt.lower()

    assert "## Role" in prompt
    assert "## Goal" in prompt
    assert "## Review health checks" in prompt
    assert "## Constraints" in prompt
    assert "## Output contract" in prompt
    assert "## Output rules" in prompt
    assert "## Validation" in prompt
    assert "Overall Review Health" in prompt
    assert "Issues That May Block Submission" in prompt
    assert "Warnings Worth Fixing" in prompt
    assert "Evidence Engagement" in prompt
    assert "Consistency Checks" in prompt
    assert "Suggested Revision Focus" in prompt
    assert "academic review quality auditor" in lowered
    assert "do not decide whether the paper deserves accept, reject, or revision" in lowered
    assert "do not recommend a different decision" in lowered
    assert "when `analysis` is present, treat it as optional context, not authority" in lowered
    assert "do not recommend a different score" in lowered
    assert "do not turn review improvement advice into policy enforcement language" in lowered
    assert '"evaluation": {' in prompt
    assert '"findings": [' in prompt
    assert '"code": "one allowed issue code"' in prompt
    assert '"severity": "warning or blocking"' in prompt
    assert '"field": "one allowed review field"' in prompt
    assert "`rationale` explains why the issue was raised" in lowered
    assert "draft_save" not in lowered
    assert "submit_preflight" not in lowered
    assert "submit_enforcement" not in lowered
    assert "these codes should be treated as blocking" not in lowered


def test_system_prompt_is_reviewer_centered_and_maps_to_structured_contract() -> None:
    prompt = REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT
    lowered = prompt.lower()

    assert "overall review health" in lowered
    assert "issues that may block submission" in lowered
    assert "warnings worth fixing" in lowered
    assert "evidence engagement" in lowered
    assert "consistency checks" in lowered
    assert "suggested revision focus" in lowered
    assert "help the reviewer improve their own draft" in lowered
    assert "do not change the reviewer's opinion" in lowered
    assert "do not recommend a different score" in lowered
    assert "do not recommend a different decision" in lowered
    assert "specific enough that the reviewer knows exactly what to revise" in lowered
    assert "message" in lowered
    assert "rationale" in lowered
    assert "suggestion" in lowered
    assert "condition_summary" in lowered
    assert "return exactly this structure" in lowered
    assert "allowed `severity` values" in lowered


def test_system_prompt_requires_semantic_alignment_without_fixed_thresholds() -> None:
    lowered = REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT.lower()

    assert "review story" in lowered
    assert "materially different signals" in lowered
    assert "unexplained tension" in lowered
    assert "not a score threshold check" in lowered
    assert "positive written feedback with cautious or negative scores" in lowered
    assert "strong recommendation with thin or opposite reasoning" in lowered
    assert "low confidence with overly certain language" in lowered
    assert "do not flag tension when the reviewer explains the tradeoff" in lowered
    assert "each criterion score is its own judgment" in lowered
    assert "criterion-specific explanation" in lowered
    assert "one broad weakness does not automatically support every low criterion score" in lowered
    assert "name both sides of the tension" in lowered


def test_system_prompt_rejects_generic_findings_and_technical_leakage() -> None:
    lowered = REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT.lower()

    assert "generic finding" in lowered
    assert "name the exact missing paper-specific engagement" in lowered
    assert "do not write vague advice" in lowered
    assert "api" not in lowered
    assert "token" not in lowered
    assert "pipeline" not in lowered
    assert "schema path" not in lowered
    assert "llm" not in lowered


def test_system_prompt_lists_only_supported_codes_and_fields() -> None:
    prompt = REVIEW_QUALITY_AUDIT_SYSTEM_PROMPT

    for code in ReviewQualityAuditModelFinding.model_json_schema()["properties"]["code"]["enum"]:
        assert code in prompt
    for field in ReviewQualityAuditModelFinding.model_json_schema()["properties"]["field"]["enum"]:
        assert field in prompt


def test_model_schema_descriptions_keep_severity_semantic_and_runtime_owned() -> None:
    parsed = ReviewQualityAuditModelFinding.model_json_schema()
    props = parsed["properties"]

    assert "semantic issue" in props["code"]["description"].lower()
    assert "semantic seriousness" in props["severity"]["description"].lower()
    assert "runtime decides submit blocking" in props["severity"]["description"].lower()
    assert "narrowest field" in props["field"]["description"].lower()
    assert "stable phrase" in props["condition_summary"]["description"].lower()


def test_model_response_schema_is_strict_for_openai_responses() -> None:
    schema = ReviewQualityAuditModelResponse.model_json_schema()

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
