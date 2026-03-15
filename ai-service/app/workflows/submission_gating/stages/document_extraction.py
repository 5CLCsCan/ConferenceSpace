from __future__ import annotations

from app.workflows.submission_gating.extractors import DocxExtractor, LatexExtractor, PDFExtractor
from app.workflows.submission_gating.models.findings import RuleFinding, VerdictBundle
from app.workflows.submission_gating.models.state import GatingState


EXTRACTORS = {
    "pdf": PDFExtractor(),
    "docx": DocxExtractor(),
    "latex": LatexExtractor(),
}


def run(state: GatingState, *, file_bytes: bytes) -> GatingState:
    if state.file_facts is None:
        raise ValueError("file_facts are required before document extraction")

    extractor = EXTRACTORS.get(state.file_facts.format)
    if extractor is None:
        raise ValueError(f"no extractor registered for format '{state.file_facts.format}'")

    try:
        document = extractor.extract(file_bytes, filename=state.normalized_request.file_metadata.original_filename)
    except Exception as exc:
        state.rule_findings.append(
            RuleFinding(
                rule_id="document_extraction.unreadable",
                source="deterministic",
                severity="block",
                message=f"Document extraction failed: {exc}",
                evidence={"format": state.file_facts.format},
                remediation_key="upload_readable_file",
            )
        )
        state.verdict_bundle = VerdictBundle(
            verdict="block",
            decision="desk_reject",
            score=0.0,
            summary={
                "total_findings": len(state.rule_findings),
                "blocking_count": sum(1 for finding in state.rule_findings if finding.severity == "block"),
                "warning_count": sum(1 for finding in state.rule_findings if finding.severity == "warn"),
                "pass_count": sum(1 for finding in state.rule_findings if finding.severity == "pass"),
            },
        )
        return state

    if document.text_coverage_ratio <= 0.01 or not document.raw_text.strip():
        state.rule_findings.append(
            RuleFinding(
                rule_id="document_extraction.low_text_coverage",
                source="deterministic",
                severity="block",
                message="The uploaded document does not contain enough extractable text for deterministic validation.",
                evidence={"text_coverage_ratio": document.text_coverage_ratio},
                remediation_key="upload_readable_file",
            )
        )
        state.verdict_bundle = VerdictBundle(
            verdict="block",
            decision="desk_reject",
            score=0.0,
            summary={
                "total_findings": len(state.rule_findings),
                "blocking_count": sum(1 for finding in state.rule_findings if finding.severity == "block"),
                "warning_count": sum(1 for finding in state.rule_findings if finding.severity == "warn"),
                "pass_count": sum(1 for finding in state.rule_findings if finding.severity == "pass"),
            },
        )
        return state

    state.extracted_document = document
    return state
