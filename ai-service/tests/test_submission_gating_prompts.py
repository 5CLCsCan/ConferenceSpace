from __future__ import annotations

from app.workflows.submission_gating.prompts import build_content_evaluation_messages


def test_build_content_evaluation_messages_separates_policy_from_submission_payload() -> None:
    messages = build_content_evaluation_messages(
        steering_prompt="Reject submissions that exceed the page limit.",
        extracted_text="This manuscript has 20 pages.",
        submission_facts={"page_count": 20},
    )

    assert len(messages) == 2
    assert messages[0]["role"] == "system"
    assert "conference policy evaluator" in messages[0]["content"].lower()
    assert "<conference_policy>" in messages[0]["content"]
    assert "Reject submissions that exceed the page limit." in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert "Submission facts" in messages[1]["content"]
    assert "Extracted text" in messages[1]["content"]
