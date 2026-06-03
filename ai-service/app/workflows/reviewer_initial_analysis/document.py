from __future__ import annotations

from app.workflows.submission_gating.extractors import DocxExtractor, LatexExtractor, PDFExtractor
from app.workflows.submission_gating.models.facts import ExtractedDocument

MAX_MANUSCRIPT_CHARS = 24000
MAX_MANUSCRIPT_ABSTRACT_CHARS = 3000
MAX_SECTION_COUNT = 24
MIN_TEXT_COVERAGE_RATIO = 0.01

EXTRACTORS = {
    "pdf": PDFExtractor(),
    "docx": DocxExtractor(),
    "latex": LatexExtractor(),
}


def extract_document(*, file_bytes: bytes, filename: str, content_type: str | None) -> ExtractedDocument:
    extractor = EXTRACTORS.get(_resolve_format(filename=filename, content_type=content_type))
    if extractor is None:
        raise ValueError("no extractor registered for uploaded manuscript format")
    return extractor.extract(file_bytes, filename=filename)


def _resolve_format(*, filename: str, content_type: str | None) -> str:
    lowered_name = (filename or "").strip().lower()
    lowered_type = (content_type or "").strip().lower()
    if lowered_name.endswith(".pdf") or "pdf" in lowered_type:
        return "pdf"
    if lowered_name.endswith(".docx") or "wordprocessingml" in lowered_type:
        return "docx"
    if lowered_name.endswith(".tex") or lowered_name.endswith(".zip") or "latex" in lowered_type:
        return "latex"
    raise ValueError(f"unsupported manuscript format for file '{filename}'")
