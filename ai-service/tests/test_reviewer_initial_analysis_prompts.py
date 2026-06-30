from __future__ import annotations

from app.workflows.reviewer_initial_analysis.prompts import REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT


def test_prompt_defines_plain_language_briefing_and_annotations_contract():
    prompt = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT

    assert "Create two reviewer-facing parts: Briefing and Annotations" in prompt
    assert "Submission Snapshot" in prompt
    assert "Readiness Signals" in prompt
    assert "Claimed Contributions" in prompt
    assert "Reviewer Attention Points" in prompt
    assert "Section Notes" in prompt
    assert "guardrails" not in prompt.lower()


def test_prompt_centers_reviewer_pre_read_needs():
    prompt = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT

    assert "What problem is the submission trying to solve?" in prompt
    assert "What does it appear to claim as its main contribution?" in prompt
    assert "Where should the reviewer inspect methods" in prompt
    assert "Which exact manuscript passages deserve attention" in prompt
    assert "What is this paper about, what does it claim" in prompt


def test_prompt_preserves_quality_boundaries():
    prompt = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT

    assert "Do not provide acceptance, rejection, ranking, or score predictions" in prompt
    assert "Do not recommend a final decision" in prompt
    assert "Do not paraphrase, invent, or clean up quoted text" in prompt
    assert "Avoid repeating the same finding" in prompt
    assert "severity is set only for weakness and suggestion" in prompt


def test_prompt_avoids_schema_path_jargon_in_output_guidance():
    output_section = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT.split("## Output", maxsplit=1)[1]

    assert "For briefing." not in output_section
    assert "For annotations." not in output_section
    assert "briefing.submission_snapshot" not in output_section
    assert "annotations.sections" not in output_section
