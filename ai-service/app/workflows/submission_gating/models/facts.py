from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class FileFacts:
    format: str
    mime_type: str
    size_bytes: int
    is_encrypted: bool = False
    is_parseable: bool = True
    page_count: int | None = None
    text_coverage_ratio: float | None = None
    findings: list[dict[str, Any]] = field(default_factory=list)


@dataclass(slots=True)
class FormatFacts:
    """Layout measurements extracted by PyMuPDF bounding-box analysis."""
    body_font_pt: float | None
    left_margin_in: float | None
    right_margin_in: float | None
    top_margin_in: float | None
    bottom_margin_in: float | None
    column_count: int | None
    paper_size: str | None  # "letter", "a4", "unknown"
    pages_analyzed: int


@dataclass(slots=True)
class ExtractedDocument:
    format: str
    raw_text: str
    sections: list[str] = field(default_factory=list)
    title: str | None = None
    abstract: str | None = None
    authors: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    table_count: int = 0
    figure_count: int = 0
    page_count: int | None = None
    text_coverage_ratio: float = 0.0
    core_properties: dict[str, Any] = field(default_factory=dict)
    # reference count from PyMuPDF block analysis; None means not available (regex fallback used)
    reference_count: int | None = None
    # format layout facts; None for non-PDF formats
    format_facts: FormatFacts | None = None


@dataclass(slots=True)
class SubmissionFacts:
    page_count: int | None
    section_presence: dict[str, bool]
    abstract_present: bool
    reference_count_estimate: int
    anonymization_signals: dict[str, bool]
    table_count: int
    figure_count: int
    text_coverage_ratio: float
