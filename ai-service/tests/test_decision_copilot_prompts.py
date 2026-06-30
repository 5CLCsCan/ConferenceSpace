from __future__ import annotations

import importlib.util
from pathlib import Path


FORBIDDEN_PROMPT_TERMS = (
    "api",
    "model",
    "token",
    "pipeline",
    "infrastructure",
)


def _load_prompt() -> str:
    module_path = (
        Path(__file__).resolve().parents[1]
        / "app"
        / "workflows"
        / "chair_decision_copilot"
        / "prompts.py"
    )
    spec = importlib.util.spec_from_file_location("decision_copilot_prompts", module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.DECISION_COPILOT_SYSTEM_PROMPT


def test_system_prompt_uses_canonical_prompt_engineering_sections_in_order() -> None:
    prompt = _load_prompt()

    role_index = prompt.index("## ROLE")
    task_index = prompt.index("## TASK")
    framework_index = prompt.index("## FRAMEWORK")
    constraints_index = prompt.index("## CONSTRAINTS")
    output_index = prompt.index("## OUTPUT")
    validation_index = prompt.index("## VALIDATION")

    assert role_index < task_index < framework_index < constraints_index < output_index < validation_index


def test_system_prompt_centers_chair_decision_support_without_verdicts() -> None:
    prompt = _load_prompt().lower()

    assert "program chair" in prompt or "area chair" in prompt
    assert "decision-support brief" in prompt
    assert "without making the final decision" in prompt
    assert "conference call for papers text" in prompt
    assert "submission title/track/keywords" in prompt
    assert "submitted review content" in prompt
    assert "discussion messages" in prompt
    assert "rebuttal content when visible" in prompt
    assert "do not recommend accept, reject, approve, or deny" in prompt
    assert "do not predict acceptance likelihood" in prompt
    assert "numerical scores" in prompt
    assert "not as an automatic decision rule" in prompt
    assert "reviewer recommendations are evidence" in prompt


def test_system_prompt_maps_chair_sections_to_runtime_schema_fields() -> None:
    prompt = _load_prompt()

    expected_mappings = {
        "Decision Evidence Snapshot": ["evidence_summary.overview", "evidence_summary.evidence_basis"],
        "Reviewer Agreement": ["disagreement_map.areas_of_agreement"],
        "Reviewer Disagreement": ["disagreement_map.areas_of_disagreement"],
        "Rebuttal and Discussion Impact": ["rebuttal_signals.summary", "discussion_signals.summary"],
        "Unresolved Risks": ["disagreement_map.unresolved_concerns", "review_feedback_synthesis.weaknesses"],
        "Chair Inspection Priorities": ["disagreement_map.confidence_limits", "review_feedback_synthesis.questions"],
        "Neutral Draft Chair Note": ["suggested_chair_note"],
        "Guardrails": ["all written sections"],
    }

    for chair_section, schema_fields in expected_mappings.items():
        assert chair_section in prompt
        for schema_field in schema_fields:
            assert schema_field in prompt


def test_system_prompt_protects_evidence_grounding_and_disagreement_preservation() -> None:
    prompt = _load_prompt().lower()

    assert "ground every claim" in prompt
    assert "separate observed evidence from reviewer interpretation" in prompt
    assert "reviewer assertion" in prompt
    assert "preserve disagreement" in prompt
    assert "minority concerns" in prompt
    assert "do not choose a side in reviewer disagreement" in prompt
    assert "do not present reviewer assertion as established fact" in prompt
    assert "do not calculate authoritative distributions" in prompt
    assert "update times" in prompt
    assert "review-completeness claims" in prompt


def test_system_prompt_handles_rebuttal_and_discussion_conditionally() -> None:
    prompt = _load_prompt().lower()

    assert "if rebuttal content is visible" in prompt
    assert "if no rebuttal content is visible" in prompt
    assert "do not infer whether the conference enabled rebuttals" in prompt
    assert "if discussion messages are present" in prompt
    assert "if discussion is absent or low-signal" in prompt
    assert "do not invent missing reviews" in prompt
    assert "missing discussion" in prompt
    assert "missing rebuttal content" in prompt


def test_system_prompt_keeps_prompt_body_free_of_internal_infrastructure_language() -> None:
    prompt = _load_prompt().lower()

    for term in FORBIDDEN_PROMPT_TERMS:
        assert term not in prompt
    assert "structured-output schema" not in prompt
    assert "advisory_only" not in prompt
    assert "no_decision" not in prompt
    assert "no_automatic_status_change" not in prompt


def test_system_prompt_uses_markdown_headers_with_xml_subblocks() -> None:
    prompt = _load_prompt()

    assert "## ROLE" in prompt
    assert "## TASK" in prompt
    assert "## FRAMEWORK" in prompt
    assert "## CONSTRAINTS" in prompt
    assert "## OUTPUT" in prompt
    assert "## VALIDATION" in prompt
    assert "<identity>" in prompt
    assert "<objective>" in prompt
    assert "<priority_order>" in prompt
    assert "<checklist>" in prompt
