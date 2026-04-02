from __future__ import annotations

import importlib.util
from pathlib import Path


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


def test_system_prompt_is_full_ledger_runtime_contract() -> None:
    prompt = _load_prompt().lower()

    assert "full-ledger synthesis" in prompt
    assert "busy chair" in prompt
    assert "do not guess which reviewer is correct" in prompt
    assert "where deeper reading is worth the chair's time" in prompt
    assert "respect rebuttal status exactly" in prompt
    assert "structured-output schema supplied with the request" in prompt


def test_system_prompt_uses_authoritative_constraint_and_routing_blocks() -> None:
    prompt = _load_prompt()

    assert "## ROLE" in prompt
    assert "## TASK" in prompt
    assert "## FRAMEWORK" in prompt
    assert "<hard_limits>" in prompt
    assert "<routing_table>" in prompt
    assert "| Artifact section |" in prompt
    assert "<tone>" in prompt


def test_system_prompt_pins_guardrails_and_neutral_draft_note() -> None:
    prompt = _load_prompt().lower()

    assert "suggested_chair_note" in prompt
    assert "neutral draft rationale" in prompt
    assert "advisory_only" in prompt
    assert "no_decision" in prompt
    assert "no_automatic_status_change" in prompt
    assert "final human judgment remains with the chair" in prompt


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
