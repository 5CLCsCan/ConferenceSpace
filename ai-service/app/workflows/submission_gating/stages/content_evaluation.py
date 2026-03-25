from __future__ import annotations

from app.workflows.submission_gating.models.findings import ContentFinding
from app.workflows.submission_gating.models.state import GatingState


async def run(state: GatingState, *, llm_client) -> GatingState:
    prompt = state.policy_snapshot.desk_rejection_settings.steering_prompt
    if not state.policy_snapshot.desk_rejection_settings.enabled or not prompt:
        state.content_findings = []
        state.determinism_metadata["content_evaluation"] = "skipped"
        return state

    if state.extracted_document is None or state.submission_facts is None:
        raise ValueError("content evaluation requires extracted document and submission facts")

    try:
        findings_payload = await llm_client.extract_structured_findings(
            steering_prompt=prompt,
            extracted_text=state.extracted_document.raw_text,
            submission_facts={
                "page_count": state.submission_facts.page_count,
                "section_presence": state.submission_facts.section_presence,
                "reference_count_estimate": state.submission_facts.reference_count_estimate,
                "keyword_coverage": state.submission_facts.keyword_coverage,
            },
        )
    except TimeoutError:
        state.content_findings = []
        state.determinism_metadata["content_evaluation"] = "timeout"
        return state
    except Exception as exc:  # noqa: BLE001
        state.content_findings = []
        state.determinism_metadata["content_evaluation"] = f"error:{exc.__class__.__name__}"
        return state

    parsed_findings = []
    for item in findings_payload or []:
        severity = str(item.get("severity", "warn")).lower()
        if severity not in {"pass", "warn"}:
            severity = "warn"
        parsed_findings.append(
            ContentFinding(
                rule_id=str(item.get("rule_id") or "llm_content_evaluation"),
                source="llm_content_evaluation",
                severity=severity,
                message=str(item.get("reason") or item.get("message") or ""),
                excerpt=str(item.get("excerpt") or "") or None,
                remediation=str(item.get("remediation") or "").strip() or None,
            )
        )

    state.content_findings = parsed_findings
    state.determinism_metadata["content_evaluation"] = "used"
    return state
