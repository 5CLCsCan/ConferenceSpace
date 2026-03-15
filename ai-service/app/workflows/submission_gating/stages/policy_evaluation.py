from __future__ import annotations

from app.workflows.submission_gating.models.state import GatingState
from app.workflows.submission_gating.rules.engine import evaluate_policy


def run(state: GatingState) -> GatingState:
    if state.submission_facts is None:
        raise ValueError("submission_facts are required before policy evaluation")

    state.rule_findings = evaluate_policy(
        state.policy_snapshot,
        state.submission_facts,
        extracted_document=state.extracted_document,
    )
    return state
