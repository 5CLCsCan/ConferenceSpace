from __future__ import annotations

from app.workflows.reviewer_initial_analysis.prompts import REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT


def test_prompt_defines_both_briefing_and_annotations():
    prompt = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT

    assert "briefing" in prompt
    assert "annotations" in prompt
    assert "review_readiness_signals" in prompt
    assert "quoted_passage" in prompt


def test_prompt_preserves_quality_guardrails():
    prompt = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT

    assert "Do not provide acceptance, rejection, or score predictions" in prompt
    assert "Do not recommend a final decision" in prompt
    assert "verbatim" in prompt
    assert "Do NOT paraphrase or fabricate quotes" in prompt
    assert "Do not repeat the same finding" in prompt


def test_prompt_prevents_briefing_annotation_duplication():
    prompt = REVIEWER_INITIAL_ANALYSIS_SYSTEM_PROMPT

    assert "The briefing should summarize reviewer-relevant themes" in prompt
    assert "The annotations should cite specific passages" in prompt
    assert "Do not copy annotation commentary into briefing fields" in prompt
