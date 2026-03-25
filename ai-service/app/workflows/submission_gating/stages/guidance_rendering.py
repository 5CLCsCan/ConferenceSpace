from __future__ import annotations

from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.workflows.submission_gating.models.findings import GuidanceItem
from app.workflows.submission_gating.models.state import GatingState


_ENV = Environment(
    loader=FileSystemLoader(str(Path(__file__).resolve().parent.parent / "rules" / "templates")),
    autoescape=False,
    trim_blocks=True,
    lstrip_blocks=True,
)
_GUIDANCE_TEMPLATE = _ENV.get_template("guidance.j2")


def run(state: GatingState) -> GatingState:
    guidance: list[GuidanceItem] = []
    for finding in state.rule_findings:
        guidance.append(
            GuidanceItem(
                rule_id=finding.rule_id,
                source=finding.source,
                severity=finding.severity,
                message=finding.message,
                remediation=_GUIDANCE_TEMPLATE.render(finding=finding).strip()
                or "Review the finding and update the submission before resubmitting.",
            )
        )

    for finding in state.content_findings:
        guidance.append(
            GuidanceItem(
                rule_id=finding.rule_id,
                source=finding.source,
                severity="warn" if finding.severity == "block" else finding.severity,
                message=finding.message,
                remediation=finding.remediation or finding.message,
            )
        )

    gating_note = state.determinism_metadata.get("gating_disabled_note")
    if gating_note:
        guidance.append(
            GuidanceItem(
                rule_id="gating.disabled",
                source="deterministic",
                severity="pass",
                message=gating_note,
                remediation="No gating action is required because submission gating is disabled for this conference.",
            )
        )

    state.guidance = guidance
    return state
