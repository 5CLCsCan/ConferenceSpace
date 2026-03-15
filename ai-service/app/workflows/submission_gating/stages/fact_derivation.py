from __future__ import annotations

import re

from app.workflows.submission_gating.extractors.section_utils import heading_matches, normalize_heading
from app.workflows.submission_gating.models.facts import SubmissionFacts
from app.workflows.submission_gating.models.state import GatingState


def run(state: GatingState) -> GatingState:
    if state.extracted_document is None:
        raise ValueError("extracted_document is required before fact derivation")

    document = state.extracted_document
    required_sections = state.policy_snapshot.desk_rejection_settings.required_sections
    explicit_sections = [s for s in document.sections if s]
    section_presence = {
        section: _section_is_explicitly_present(section, explicit_sections, document)
        for section in required_sections
    }

    state.submission_facts = SubmissionFacts(
        page_count=document.page_count,
        section_presence=section_presence,
        abstract_present=bool(document.abstract or _section_is_explicitly_present("Abstract", explicit_sections, document)),
        reference_count_estimate=document.reference_count if document.reference_count is not None else _count_references(document.raw_text),
        anonymization_signals=_compute_anonymization_signals(document, state.actor.email),
        table_count=document.table_count,
        figure_count=document.figure_count,
        text_coverage_ratio=document.text_coverage_ratio,
    )
    return state


def _count_references(text: str) -> int:
    bracketed = len(re.findall(r"\[\d+\]", text))
    numbered = len(re.findall(r"^\s*\d+\.\s+", text, flags=re.MULTILINE))
    bib_items = len(re.findall(r"\\bibitem\{", text))
    return max(bracketed, numbered, bib_items)


def _compute_anonymization_signals(document, actor_email: str) -> dict[str, bool]:
    raw = document.raw_text.lower()
    metadata = document.metadata
    return {
        "core_properties_author_present": bool(document.core_properties.get("author")),
        "author_section_present": bool(document.authors),
        "actor_email_present": bool(
            actor_email
            and re.search(rf"(?<!\w){re.escape(actor_email.lower())}(?!\w)", raw)
        ),
        # PDF creator/producer metadata can leak authoring tool + user identity
        "creator_metadata_present": bool(
            metadata.get("creator") and metadata["creator"].strip() not in ("", "false")
        ),
        "producer_metadata_present": bool(
            metadata.get("producer") and metadata["producer"].strip() not in ("", "false")
        ),
        # Self-citation pattern: "our previous/earlier/prior work/paper/system"
        "self_citation_pattern_detected": bool(
            re.search(
                r"our\s+(previous|earlier|prior)\s+(work|paper|approach|system|method|model|framework|results)",
                raw,
            )
        ),
        # GitHub/GitLab personal repository URLs in text
        "url_with_potential_author_id": bool(
            re.search(r"(github|gitlab)\.com/[a-z0-9][a-z0-9\-]+/", raw)
        ),
    }


def _section_is_explicitly_present(
    required_section: str,
    extracted_sections: list[str],
    document,
) -> bool:
    if any(heading_matches(observed, required_section) for observed in extracted_sections):
        return True

    normalized_required = normalize_heading(required_section)
    if normalized_required == "abstract":
        return bool(document.abstract)
    if normalized_required == "references":
        return bool(document.metadata.get("has_bibliography"))

    return False
