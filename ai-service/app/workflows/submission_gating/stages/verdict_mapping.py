from __future__ import annotations

from app.workflows.submission_gating.models.findings import VerdictBundle
from app.workflows.submission_gating.models.state import GatingState


def run(state: GatingState) -> GatingState:
    normalized_content_severities = [
        "warn" if finding.severity == "block" else finding.severity
        for finding in state.content_findings
    ]
    block_count = sum(1 for finding in state.rule_findings if finding.severity == "block")
    warning_count = sum(1 for finding in state.rule_findings if finding.severity == "warn")
    warning_count += sum(1 for severity in normalized_content_severities if severity == "warn")
    pass_count = sum(1 for finding in state.rule_findings if finding.severity == "pass")
    pass_count += sum(1 for severity in normalized_content_severities if severity == "pass")
    total_findings = len(state.rule_findings) + len(state.content_findings)

    verdict = "pass"
    decision = "accept_for_review"
    if block_count > 0:
        verdict = "block"
        decision = "desk_reject"
    elif warning_count > 0:
        verdict = "warn"
        decision = "manual_review"

    score = 1.0 if total_findings == 0 else pass_count / total_findings
    state.verdict_bundle = VerdictBundle(
        verdict=verdict,
        decision=decision,
        score=score,
        summary={
            "total_findings": total_findings,
            "blocking_count": block_count,
            "warning_count": warning_count,
            "pass_count": pass_count,
        },
    )
    return state
