"""
Format compliance stage -- reads FormatFacts pre-computed by PDFExtractor.

PDFExtractor.extract() performs the layout analysis via PyMuPDF in the same
pass as text extraction, and stores the result in ExtractedDocument.format_facts.
This stage simply applies policy rules against those facts.

Non-PDF formats (DOCX, LaTeX) will not have format_facts populated; the stage
skips silently in that case.
"""
from __future__ import annotations

from app.workflows.submission_gating.models.findings import RuleFinding
from app.workflows.submission_gating.models.state import GatingState


def run(state: GatingState, file_bytes: bytes) -> GatingState:  # noqa: ARG001
    doc = state.extracted_document
    if doc is None or doc.format_facts is None:
        return state

    fmt_config = state.policy_snapshot.format_config
    if fmt_config is None:
        return state  # no policy configured -- observation-only

    findings = _evaluate(doc.format_facts, fmt_config)
    state.rule_findings = list(state.rule_findings) + findings
    return state


def _evaluate(facts, config) -> list[RuleFinding]:
    findings: list[RuleFinding] = []

    if config.min_body_font_pt is not None and facts.body_font_pt is not None:
        if facts.body_font_pt < config.min_body_font_pt:
            findings.append(RuleFinding(
                rule_id="font_size_violation",
                source="deterministic",
                severity="block",
                message=(
                    f"Body font size is {facts.body_font_pt:.1f}pt; "
                    f"minimum required is {config.min_body_font_pt}pt."
                ),
                evidence={"observed_value": facts.body_font_pt, "expected_value": config.min_body_font_pt},
                remediation_key="fix_font_size",
            ))
        else:
            findings.append(RuleFinding(
                rule_id="font_size_violation",
                source="deterministic",
                severity="pass",
                message=f"Body font size {facts.body_font_pt:.1f}pt meets the minimum.",
                evidence={"observed_value": facts.body_font_pt, "expected_value": config.min_body_font_pt},
                remediation_key="none",
            ))

    if config.min_margin_in is not None:
        margins = {
            "left": facts.left_margin_in,
            "right": facts.right_margin_in,
            "top": facts.top_margin_in,
            "bottom": facts.bottom_margin_in,
        }
        violations = {k: v for k, v in margins.items() if v is not None and v < config.min_margin_in}
        if violations:
            findings.append(RuleFinding(
                rule_id="margin_violation",
                source="deterministic",
                severity="block",
                message=(
                    f"Margin violations on: {', '.join(violations)}. "
                    f"Minimum required: {config.min_margin_in:.2f} inches."
                ),
                evidence={"violations": violations, "expected_value": config.min_margin_in},
                remediation_key="fix_margins",
            ))
        else:
            findings.append(RuleFinding(
                rule_id="margin_violation",
                source="deterministic",
                severity="pass",
                message="All margins meet the minimum requirement.",
                evidence={"margins": {k: v for k, v in margins.items() if v is not None}},
                remediation_key="none",
            ))

    if config.required_paper_size is not None and facts.paper_size is not None:
        if facts.paper_size != config.required_paper_size:
            findings.append(RuleFinding(
                rule_id="paper_size_mismatch",
                source="deterministic",
                severity="warn",
                message=(
                    f"Paper size detected as '{facts.paper_size}'; "
                    f"expected '{config.required_paper_size}'."
                ),
                evidence={"observed_value": facts.paper_size, "expected_value": config.required_paper_size},
                remediation_key="fix_paper_size",
            ))

    if config.max_columns is not None and facts.column_count is not None:
        if facts.column_count > config.max_columns:
            findings.append(RuleFinding(
                rule_id="column_count_mismatch",
                source="deterministic",
                severity="warn",
                message=(
                    f"Detected {facts.column_count} columns; maximum allowed is {config.max_columns}."
                ),
                evidence={"observed_value": facts.column_count, "expected_value": config.max_columns},
                remediation_key="fix_column_count",
            ))

    return findings
