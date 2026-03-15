from __future__ import annotations

from app.workflows.submission_gating.extractors.section_utils import heading_matches
from app.workflows.submission_gating.models.facts import ExtractedDocument, SubmissionFacts
from app.workflows.submission_gating.models.findings import RuleFinding
from app.workflows.submission_gating.models.policy import PolicySnapshot


def evaluate_policy(
    policy_snapshot: PolicySnapshot,
    submission_facts: SubmissionFacts,
    extracted_document: ExtractedDocument | None = None,
) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    config = policy_snapshot.desk_rejection_settings

    if policy_snapshot.maximum_pages is not None and submission_facts.page_count is not None:
        if submission_facts.page_count > policy_snapshot.maximum_pages:
            findings.append(
                RuleFinding(
                    rule_id="maximum_pages",
                    source="deterministic",
                    severity="warn",
                    message=f"Document exceeds the preferred page limit of {policy_snapshot.maximum_pages}.",
                    evidence={"observed_value": submission_facts.page_count, "expected_value": policy_snapshot.maximum_pages},
                    remediation_key="reduce_pages",
                )
            )
        else:
            findings.append(
                RuleFinding(
                    rule_id="maximum_pages",
                    source="deterministic",
                    severity="pass",
                    message="Page count is within the configured limit.",
                    evidence={"observed_value": submission_facts.page_count, "expected_value": policy_snapshot.maximum_pages},
                    remediation_key="none",
                )
            )

    if config.min_references is not None:
        if submission_facts.reference_count_estimate < config.min_references:
            findings.append(
                RuleFinding(
                    rule_id="min_references",
                    source="deterministic",
                    severity="block",
                    message=(
                        f"Only {submission_facts.reference_count_estimate} references detected; "
                        f"minimum is {config.min_references}."
                    ),
                    evidence={"observed_value": submission_facts.reference_count_estimate, "expected_value": config.min_references},
                    remediation_key="increase_references",
                )
            )
        else:
            findings.append(
                RuleFinding(
                    rule_id="min_references",
                    source="deterministic",
                    severity="pass",
                    message="Reference count satisfies the configured minimum.",
                    evidence={"observed_value": submission_facts.reference_count_estimate, "expected_value": config.min_references},
                    remediation_key="none",
                )
            )

    if config.required_sections:
        can_verify_sections = bool(
            extracted_document
            and (
                extracted_document.sections
                or extracted_document.abstract
                or extracted_document.metadata.get("has_bibliography")
            )
        )
        missing = [
            section
            for section in config.required_sections
            if not _section_present(section, submission_facts.section_presence)
        ]
        if missing and not can_verify_sections:
            findings.append(
                RuleFinding(
                    rule_id="required_sections",
                    source="deterministic",
                    severity="warn",
                    message=(
                        "Required sections could not be verified deterministically because no explicit "
                        "section structure was extracted."
                    ),
                    evidence={"required_sections": config.required_sections, "missing_sections": missing},
                    remediation_key="review_section_structure",
                )
            )
        elif missing:
            findings.append(
                RuleFinding(
                    rule_id="required_sections",
                    source="deterministic",
                    severity="block",
                    message=f"Required sections are missing: {', '.join(missing)}.",
                    evidence={"missing_sections": missing},
                    remediation_key="add_required_sections",
                )
            )
        else:
            findings.append(
                RuleFinding(
                    rule_id="required_sections",
                    source="deterministic",
                    severity="pass",
                    message="All required sections are present.",
                    evidence={"required_sections": config.required_sections},
                    remediation_key="none",
                )
            )

    if config.custom_rules.author_anonymization_required:
        if any(submission_facts.anonymization_signals.values()):
            findings.append(
                RuleFinding(
                    rule_id="author_anonymization_required",
                    source="deterministic",
                    severity="block",
                    message="Author-identifying metadata was detected in the submission materials.",
                    evidence=submission_facts.anonymization_signals,
                    remediation_key="remove_author_identity",
                )
            )
        else:
            findings.append(
                RuleFinding(
                    rule_id="author_anonymization_required",
                    source="deterministic",
                    severity="pass",
                    message="No author-identifying metadata was detected.",
                    evidence=submission_facts.anonymization_signals,
                    remediation_key="none",
                )
            )

    if config.custom_rules.banned_phrases and extracted_document is not None:
        lowered_text = extracted_document.raw_text.lower()
        matched = [phrase for phrase in config.custom_rules.banned_phrases if phrase.lower() in lowered_text]
        if matched:
            findings.append(
                RuleFinding(
                    rule_id="banned_phrases",
                    source="deterministic",
                    severity="block",
                    message=f"Banned phrases were detected: {', '.join(matched)}.",
                    evidence={"matched_phrases": matched},
                    remediation_key="remove_banned_phrases",
                )
            )
        else:
            findings.append(
                RuleFinding(
                    rule_id="banned_phrases",
                    source="deterministic",
                    severity="pass",
                    message="No banned phrases were detected.",
                    evidence={"checked_phrases": config.custom_rules.banned_phrases},
                    remediation_key="none",
                )
            )

    return findings


def _section_present(section: str, section_presence: dict[str, bool]) -> bool:
    for observed, present in section_presence.items():
        if not present:
            continue
        if heading_matches(observed, section):
            return True
    return False
