from __future__ import annotations

import pytest

from app.workflows.submission_gating.extractors.pdf_extractor import extract_page_text_with_columns
from app.workflows.submission_gating.models.facts import ExtractedDocument, FileFacts, SubmissionFacts
from app.workflows.submission_gating.models.findings import ContentFinding, RuleFinding, VerdictBundle
from app.workflows.submission_gating.schemas import GatingRunRequest
from app.workflows.submission_gating.stages import (
    binary_integrity,
    content_evaluation,
    document_extraction,
    fact_derivation,
    guidance_rendering,
    intake_normalization,
    persistence_audit,
    policy_evaluation,
    verdict_mapping,
)

from tests.submission_gating_helpers import MINIMAL_PDF_BYTES, make_request_payload


def _normalized_state():
    request = GatingRunRequest.model_validate(make_request_payload())
    return intake_normalization.run(
        request,
        file_bytes=MINIMAL_PDF_BYTES,
        filename="submission.pdf",
    )


def test_binary_integrity_blocks_unsupported_format() -> None:
    payload = make_request_payload(
        original_filename="slides.pptx",
        content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )
    request = GatingRunRequest.model_validate(payload)
    state = intake_normalization.run(
        request,
        file_bytes=b"not a paper",
        filename="slides.pptx",
    )

    result = binary_integrity.run(state, file_bytes=b"not a paper")

    assert result.file_facts is not None
    assert result.file_facts.format == "unknown"
    assert result.verdict_bundle is not None
    assert result.verdict_bundle.verdict == "block"
    assert any(finding.rule_id == "binary_integrity.unsupported_format" for finding in result.rule_findings)


def test_binary_integrity_blocks_encrypted_pdf(monkeypatch: pytest.MonkeyPatch) -> None:
    state = _normalized_state()

    monkeypatch.setattr(binary_integrity, "detect_mime_type", lambda *_args, **_kwargs: "application/pdf")
    monkeypatch.setattr(
        binary_integrity,
        "probe_pdf_integrity",
        lambda _file_bytes: {
            "is_encrypted": True,
            "is_parseable": False,
            "page_count": 0,
            "message": "PDF is encrypted.",
        },
    )

    result = binary_integrity.run(state, file_bytes=MINIMAL_PDF_BYTES)

    assert result.file_facts is not None
    assert result.file_facts.is_encrypted is True
    assert result.verdict_bundle is not None
    assert result.verdict_bundle.verdict == "block"
    assert any("encrypted" in finding.message.lower() for finding in result.rule_findings)


class _FakeRect:
    def __init__(self, x0: float, y0: float, x1: float, y1: float) -> None:
        self.x0 = x0
        self.y0 = y0
        self.x1 = x1
        self.y1 = y1


class _FakePyMuPDF:
    Rect = _FakeRect


class _FakePage:
    def __init__(self, blocks: list[tuple[float, float, float, float, str]]) -> None:
        self.rect = type("_Rect", (), {"width": 600.0, "height": 800.0})()
        self._blocks = blocks

    def get_text(self, mode="text", *, clip=None, sort=False, flags=None):
        del sort, flags
        if mode == "blocks":
            return [(*block[:4], block[4], 0, 0) for block in self._blocks]
        if clip is None:
            selected = self._blocks
        else:
            selected = [
                block
                for block in self._blocks
                if block[0] >= clip.x0 and block[2] <= clip.x1 and block[1] >= clip.y0 and block[3] <= clip.y1
            ]
        return "\n".join(block[4] for block in sorted(selected, key=lambda item: (item[1], item[0])))


def test_pdf_column_extraction_keeps_first_page_front_matter_before_columns() -> None:
    page = _FakePage(
        [
            (50, 20, 550, 60, "Paper Title"),
            (50, 70, 550, 120, "Abstract— This is the abstract."),
            (50, 160, 260, 220, "Left column first."),
            (340, 160, 550, 220, "Right column second."),
        ]
    )

    text = extract_page_text_with_columns(page, 0, _FakePyMuPDF)

    assert text == "Paper Title\nAbstract— This is the abstract.\n\nLeft column first.\n\nRight column second."


def test_pdf_column_extraction_handles_single_column_pages() -> None:
    page = _FakePage(
        [
            (60, 40, 540, 80, "Single column title"),
            (60, 100, 540, 140, "Single column body."),
        ]
    )

    text = extract_page_text_with_columns(page, 1, _FakePyMuPDF)

    assert text == "Single column title\nSingle column body."


def test_document_extraction_delegates_to_pdf_extractor(monkeypatch: pytest.MonkeyPatch) -> None:
    state = _normalized_state()
    state.file_facts = FileFacts(
        format="pdf",
        mime_type="application/pdf",
        size_bytes=len(MINIMAL_PDF_BYTES),
        is_encrypted=False,
        is_parseable=True,
        page_count=1,
        text_coverage_ratio=1.0,
        findings=[],
    )

    class _FakePDFExtractor:
        def extract(self, *_args, **_kwargs):
            return ExtractedDocument(
                format="pdf",
                raw_text="Abstract\nIntroduction\nConclusion\nReferences\n[1] Ref",
                sections=["Abstract", "Introduction", "Conclusion", "References"],
                title="Deterministic AI Pipelines",
                abstract="Abstract",
                authors=[],
                metadata={"producer": "test"},
                table_count=0,
                figure_count=0,
                page_count=1,
                text_coverage_ratio=1.0,
                core_properties={},
            )

    monkeypatch.setitem(document_extraction.EXTRACTORS, "pdf", _FakePDFExtractor())

    result = document_extraction.run(state, file_bytes=MINIMAL_PDF_BYTES)

    assert result.extracted_document is not None
    assert result.extracted_document.format == "pdf"
    assert "Introduction" in result.extracted_document.sections


def test_fact_derivation_computes_sections_references_and_anonymization() -> None:
    state = _normalized_state()
    state.extracted_document = ExtractedDocument(
        format="docx",
        raw_text=(
            "Abstract\nWe propose...\nIntroduction\nDetails...\nConclusion\nWrap up.\n"
            "References\n[1] Alpha\n[2] Beta"
        ),
        sections=["Abstract", "Introduction", "Conclusion", "References"],
        title="A Blind Submission Pipeline",
        abstract="We propose...",
        authors=["Alice Smith"],
        metadata={},
        table_count=1,
        figure_count=2,
        page_count=6,
        text_coverage_ratio=0.95,
        core_properties={"author": "Alice Smith"},
    )

    result = fact_derivation.run(state)

    assert result.submission_facts is not None
    assert result.submission_facts.reference_count_estimate == 2
    assert result.submission_facts.section_presence["Abstract"] is True
    assert result.submission_facts.anonymization_signals["core_properties_author_present"] is True


def test_fact_derivation_does_not_infer_sections_from_body_mentions() -> None:
    state = _normalized_state()
    state.extracted_document = ExtractedDocument(
        format="pdf",
        raw_text=(
            "This introduction explains the approach in prose, but there is no heading.\n"
            "The conclusion is discussed inline and references are described narratively."
        ),
        sections=[],
        title="A Structured Pipeline",
        abstract=None,
        authors=[],
        metadata={},
        table_count=0,
        figure_count=0,
        page_count=2,
        text_coverage_ratio=1.0,
        core_properties={},
    )

    result = fact_derivation.run(state)

    assert result.submission_facts is not None
    assert result.submission_facts.section_presence["Introduction"] is False
    assert result.submission_facts.section_presence["Conclusion"] is False
    assert result.submission_facts.section_presence["References"] is False


@pytest.mark.asyncio
async def test_content_evaluation_timeout_returns_empty_findings() -> None:
    state = _normalized_state()
    state.extracted_document = ExtractedDocument(
        format="pdf",
        raw_text="Abstract\nIntroduction\nConclusion",
        sections=["Abstract", "Introduction", "Conclusion"],
        title="Title",
        abstract="Abstract",
        authors=[],
        metadata={},
        table_count=0,
        figure_count=0,
        page_count=2,
        text_coverage_ratio=1.0,
        core_properties={},
    )
    state.submission_facts = SubmissionFacts(
        page_count=2,
        section_presence={"Abstract": True, "Introduction": True, "Conclusion": True},
        abstract_present=True,
        reference_count_estimate=0,
        anonymization_signals={},
        table_count=0,
        figure_count=0,
        text_coverage_ratio=1.0,
    )
    state.policy_snapshot.desk_rejection_settings.prompt_fragments = [
        "Warn if no ethics statement is present."
    ]

    class _TimeoutLLM:
        async def complete_json(self, *_args, **_kwargs):
            raise TimeoutError("timed out")

    result = await content_evaluation.run(state, llm_client=_TimeoutLLM())

    assert result.content_findings == []
    assert result.error is None
    assert result.determinism_metadata["content_evaluation"] == "timeout"


@pytest.mark.asyncio
async def test_content_evaluation_uses_complete_json_and_maps_findings() -> None:
    state = _normalized_state()
    state.extracted_document = ExtractedDocument(
        format="pdf",
        raw_text="Abstract\nIntroduction\nConclusion",
        sections=["Abstract", "Introduction", "Conclusion"],
        title="Title",
        abstract="Abstract",
        authors=[],
        metadata={},
        table_count=0,
        figure_count=0,
        page_count=2,
        text_coverage_ratio=1.0,
        core_properties={},
    )
    state.submission_facts = SubmissionFacts(
        page_count=2,
        section_presence={"Abstract": True, "Introduction": True, "Conclusion": True},
        abstract_present=True,
        reference_count_estimate=0,
        anonymization_signals={},
        table_count=0,
        figure_count=0,
        text_coverage_ratio=1.0,
    )
    state.policy_snapshot.desk_rejection_settings.prompt_fragments = [
        "Warn if no ethics statement is present."
    ]

    captured: dict[str, object] = {}

    class _FakeLLM:
        async def complete_json(self, **kwargs):
            captured.update(kwargs)
            return [
                {
                    "rule_id": "ethics_statement",
                    "severity": "warn",
                    "reason": "No ethics statement was found.",
                    "excerpt": "",
                    "remediation": "Add an ethics statement.",
                }
            ]

    result = await content_evaluation.run(state, llm_client=_FakeLLM())

    assert result.content_findings == [
        ContentFinding(
            rule_id="ethics_statement",
            source="llm_content_evaluation",
            severity="warn",
            message="No ethics statement was found.",
            excerpt=None,
            remediation="Add an ethics statement.",
        )
    ]
    assert result.determinism_metadata["content_evaluation"] == "used"
    assert "messages" in captured


def test_policy_evaluation_blocks_min_references() -> None:
    state = _normalized_state()
    state.submission_facts = SubmissionFacts(
        page_count=5,
        section_presence={"Abstract": True, "Introduction": True, "Conclusion": True, "References": True},
        title_word_count=4,
        abstract_present=True,
        reference_count_estimate=5,
        anonymization_signals={"core_properties_author_present": False},
        keyword_coverage={"deep learning": True},
        table_count=0,
        figure_count=0,
        text_coverage_ratio=1.0,
    )

    result = policy_evaluation.run(state)

    assert any(finding.rule_id == "min_references" and finding.severity == "block" for finding in result.rule_findings)


def test_policy_evaluation_warns_when_required_sections_cannot_be_verified_deterministically() -> None:
    state = _normalized_state()
    state.extracted_document = ExtractedDocument(
        format="pdf",
        raw_text="This paper discusses an introduction and conclusion inline, without headings.",
        sections=[],
        title="A Structured Pipeline",
        abstract=None,
        authors=[],
        metadata={},
        table_count=0,
        figure_count=0,
        page_count=2,
        text_coverage_ratio=1.0,
        core_properties={},
    )
    state.submission_facts = SubmissionFacts(
        page_count=5,
        section_presence={"Abstract": False, "Introduction": False, "Conclusion": False, "References": False},
        title_word_count=4,
        abstract_present=False,
        reference_count_estimate=12,
        anonymization_signals={"core_properties_author_present": False},
        keyword_coverage={"deep learning": True, "transformer": False},
        table_count=0,
        figure_count=0,
        text_coverage_ratio=1.0,
    )

    result = policy_evaluation.run(state)

    finding = next(finding for finding in result.rule_findings if finding.rule_id == "required_sections")
    assert finding.severity == "warn"
    assert "could not be verified" in finding.message.lower()


def test_policy_evaluation_does_not_warn_on_scope_without_exact_overlap() -> None:
    state = _normalized_state()
    state.submission_facts = SubmissionFacts(
        page_count=5,
        section_presence={"Abstract": True, "Introduction": True, "Conclusion": True, "References": True},
        title_word_count=4,
        abstract_present=True,
        reference_count_estimate=12,
        anonymization_signals={"core_properties_author_present": False},
        keyword_coverage={"deep learning": False, "transformer": False},
        table_count=0,
        figure_count=0,
        text_coverage_ratio=1.0,
    )

    result = policy_evaluation.run(state)

    assert not any(finding.rule_id == "scope_keywords" for finding in result.rule_findings)


def test_verdict_mapping_never_blocks_from_content_findings_alone() -> None:
    state = _normalized_state()
    state.rule_findings = [
        RuleFinding(
            rule_id="title_max_words",
            source="deterministic",
            severity="pass",
            message="Title is within the limit.",
            evidence={"observed_value": 4, "expected_value": 20},
            remediation_key="none",
        )
    ]
    state.content_findings = [
        ContentFinding(
            rule_id="llm_content_evaluation",
            source="llm_content_evaluation",
            severity="block",
            message="The paper lacks an ethics statement.",
            excerpt="No ethics statement was found.",
            remediation="Add an ethics statement.",
        )
    ]

    result = verdict_mapping.run(state)

    assert result.verdict_bundle == VerdictBundle(
        verdict="warn",
        decision="manual_review",
        score=pytest.approx(0.5),
        summary={
            "total_findings": 2,
            "blocking_count": 0,
            "warning_count": 1,
            "pass_count": 1,
        },
    )


def test_guidance_rendering_uses_rule_templates() -> None:
    state = _normalized_state()
    state.rule_findings = [
        RuleFinding(
            rule_id="min_references",
            source="deterministic",
            severity="block",
            message="Only 5 references detected; minimum is 10.",
            evidence={"observed_value": 5, "expected_value": 10},
            remediation_key="increase_references",
        )
    ]
    state.content_findings = [
        ContentFinding(
            rule_id="llm_content_evaluation",
            source="llm_content_evaluation",
            severity="warn",
            message="No reproducibility statement detected.",
            excerpt="Methods section omits reproducibility details.",
            remediation="Add a reproducibility section.",
        )
    ]

    result = guidance_rendering.run(state)

    assert len(result.guidance) == 2
    assert any("reference" in item.remediation.lower() for item in result.guidance)
    assert any(item.source == "llm_content_evaluation" for item in result.guidance)


@pytest.mark.asyncio
async def test_persistence_audit_records_run_and_stages() -> None:
    state = _normalized_state()
    state.rule_findings = []
    state.content_findings = []
    state.verdict_bundle = VerdictBundle(
        verdict="pass",
        decision="accept_for_review",
        score=1.0,
        summary={
            "total_findings": 0,
            "blocking_count": 0,
            "warning_count": 0,
            "pass_count": 0,
        },
    )
    state.stage_timings = {
        "intake_normalization_ms": 3,
        "binary_integrity_ms": 4,
    }

    class _FakeRepo:
        def __init__(self) -> None:
            self.saved_state = None

        async def save_run(self, gating_state):
            self.saved_state = gating_state

    repo = _FakeRepo()

    result = await persistence_audit.run(state, repo=repo)

    assert repo.saved_state is result
    assert repo.saved_state.verdict_bundle is not None
    assert repo.saved_state.verdict_bundle.verdict == "pass"
