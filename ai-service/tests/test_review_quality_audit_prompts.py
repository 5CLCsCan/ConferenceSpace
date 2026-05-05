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
    assert "## Task" in prompt
    assert "## Framework" in prompt
    assert "## Constraints" in prompt
    assert "## Output" in prompt
    assert "## Validation" in prompt
    assert "<decision_order>" in prompt
    assert "<domain_truths>" in prompt
    assert "<issue_codes>" in prompt
    assert "<hard_limits>" in prompt
    assert "<output_rules>" in prompt
    assert "<validation_checklist>" in prompt
    assert "<tone>" in prompt
    assert "academic review quality and consistency auditor" in lowered
    assert "you are not grading the paper" in lowered
    assert "never steer toward a particular recommendation or score" in lowered
    assert "briefing context is optional additional material only" in lowered
    assert "structured audit with `evaluation` and `findings`" in lowered
    assert "each finding's `rationale`" in lowered
    assert "draft_save" not in lowered
    assert "submit_preflight" not in lowered
    assert "submit_enforcement" not in lowered
    assert "these codes should be treated as blocking" not in lowered


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
