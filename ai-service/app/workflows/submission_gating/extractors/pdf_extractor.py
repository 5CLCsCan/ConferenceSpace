from __future__ import annotations

import statistics
from io import BytesIO

from app.workflows.submission_gating.extractors.section_utils import extract_heading_candidates
from app.workflows.submission_gating.models.facts import ExtractedDocument, FormatFacts


_PT_PER_INCH = 72.0


class PDFExtractor:
    def extract(self, file_bytes: bytes, filename: str | None = None) -> ExtractedDocument:
        try:
            import pymupdf  # noqa: PLC0415
        except ModuleNotFoundError as exc:  # pragma: no cover
            raise RuntimeError("pymupdf is required for PDF extraction") from exc

        with pymupdf.open(stream=file_bytes, filetype="pdf") as doc:
            if doc.is_encrypted:
                raise ValueError("encrypted pdf cannot be extracted")

            page_count = doc.page_count
            metadata = {k: v for k, v in (doc.metadata or {}).items() if v}

            # --- single get_text("dict") pass across all pages ---
            all_spans: list[dict] = []
            all_blocks: list[dict] = []
            page_rects: list[tuple[float, float, float, float]] = []  # (x0, y0, x1, y1) per page
            raw_pages: list[str] = []

            for page in doc:
                page_rects.append((page.rect.x0, page.rect.y0, page.rect.x1, page.rect.y1))
                raw_pages.append(page.get_text(sort=True))
                page_dict = page.get_text("dict", flags=pymupdf.TEXT_PRESERVE_WHITESPACE)
                for block in page_dict.get("blocks", []):
                    all_blocks.append(block)
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            all_spans.append(span)

            raw_text = "\n".join(raw_pages).strip()
            text_ratio = min(1.0, len(raw_text) / max(page_count * 500, 1))

            # --- sections from raw text (regex-based heading candidates) ---
            sections = extract_heading_candidates(raw_text.splitlines())

            # --- title and authors from metadata (skip header layout analysis) ---
            title: str | None = metadata.get("title") or _first_nonempty_line(raw_text)
            authors: list[str] = [metadata["author"]] if metadata.get("author") else []

            # --- abstract from raw text (simple heuristic) ---
            abstract = _extract_abstract(raw_text)

            # --- reference count: blocks near "References" section ---
            reference_count = _count_references_structured(all_blocks, raw_text)

            # --- table / figure counts from block types ---
            image_blocks = [b for b in all_blocks if b.get("type") == 1]
            figure_count = len(image_blocks)
            table_count = _count_table_captions(all_spans)

            # --- format facts in same pass ---
            format_facts = _compute_format_facts(all_spans, page_rects, page_count)

        return ExtractedDocument(
            format="pdf",
            raw_text=raw_text,
            sections=sections,
            title=title,
            abstract=abstract,
            authors=authors,
            metadata=metadata,
            table_count=table_count,
            figure_count=figure_count,
            page_count=page_count,
            text_coverage_ratio=text_ratio,
            core_properties={"author": metadata.get("author", ""), "title": metadata.get("title", "")},
            reference_count=reference_count,
            format_facts=format_facts,
        )


def _first_nonempty_line(text: str) -> str | None:
    for line in text.splitlines():
        s = line.strip()
        if s:
            return s
    return None


def _extract_abstract(text: str) -> str | None:
    lines = [line.strip() for line in text.splitlines()]
    for index, line in enumerate(lines):
        if line.lower() == "abstract":
            return " ".join(item for item in lines[index + 1 : index + 5] if item) or None
    return None


def _count_references_structured(blocks: list[dict], raw_text: str) -> int:
    """
    Find blocks belonging to the References section and count citation entries.
    Falls back to regex-on-raw-text if no References heading is found.
    """
    import re

    # Find the first text block whose stripped content matches "references" (case-insensitive)
    ref_start_idx: int | None = None
    for idx, block in enumerate(blocks):
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                if re.match(r"^references?\s*$", span.get("text", "").strip(), re.IGNORECASE):
                    ref_start_idx = idx
    
    if ref_start_idx is not None:
        ref_text = " ".join(
            span.get("text", "")
            for block in blocks[ref_start_idx + 1 :]
            for line in block.get("lines", [])
            for span in line.get("spans", [])
        )
        bracketed = len(re.findall(r"\[\d+\]", ref_text))
        numbered = len(re.findall(r"^\s*\d+\.", ref_text, re.MULTILINE))
        count = max(bracketed, numbered)
        if count > 0:
            return count

    # Fallback: regex on full raw text
    bracketed = len(re.findall(r"\[\d+\]", raw_text))
    numbered = len(re.findall(r"^\s*\d+\.\s+\S", raw_text, re.MULTILINE))
    bib = raw_text.count(r"\bibitem{")
    return max(bracketed, numbered, bib)


def _count_table_captions(spans: list[dict]) -> int:
    import re
    count = 0
    for span in spans:
        if re.match(r"^table\s+\d+", span.get("text", "").strip(), re.IGNORECASE):
            count += 1
    return count


def _compute_format_facts(
    spans: list[dict],
    page_rects: list[tuple[float, float, float, float]],
    page_count: int,
) -> FormatFacts | None:
    if not spans or not page_rects:
        return None

    page_w = statistics.median(r[2] - r[0] for r in page_rects)
    page_h = statistics.median(r[3] - r[1] for r in page_rects)

    # Modal body font size from spans with size > 4pt
    body_font_pt: float | None = None
    buckets: dict[float, int] = {}
    for s in spans:
        size = s.get("size", 0)
        if size > 4:
            key = round(size * 2) / 2
            buckets[key] = buckets.get(key, 0) + 1
    if buckets:
        body_font_pt = max(buckets, key=buckets.__getitem__)

    x0_vals = [s["bbox"][0] for s in spans if "bbox" in s]
    x1_vals = [s["bbox"][2] for s in spans if "bbox" in s]
    y0_vals = [s["bbox"][1] for s in spans if "bbox" in s]
    y1_vals = [s["bbox"][3] for s in spans if "bbox" in s]

    left_margin_in = min(x0_vals) / _PT_PER_INCH if x0_vals else None
    right_margin_in = (page_w - max(x1_vals)) / _PT_PER_INCH if x1_vals else None
    top_margin_in = min(y0_vals) / _PT_PER_INCH if y0_vals else None
    bottom_margin_in = (page_h - max(y1_vals)) / _PT_PER_INCH if y1_vals else None

    column_count = _estimate_columns(x0_vals, page_w) if x0_vals else None

    paper_size: str | None = None
    if abs(page_w - 612) < 5 and abs(page_h - 792) < 5:
        paper_size = "letter"
    elif abs(page_w - 595) < 5 and abs(page_h - 842) < 5:
        paper_size = "a4"
    else:
        paper_size = "unknown"

    return FormatFacts(
        body_font_pt=body_font_pt,
        left_margin_in=left_margin_in,
        right_margin_in=right_margin_in,
        top_margin_in=top_margin_in,
        bottom_margin_in=bottom_margin_in,
        column_count=column_count,
        paper_size=paper_size,
        pages_analyzed=page_count,
    )


def _estimate_columns(x0_values: list[float], page_width: float) -> int:
    sorted_x0 = sorted(set(round(x) for x in x0_values))
    left_half = [x for x in sorted_x0 if x < page_width * 0.6]
    if not left_half:
        return 1
    clusters = 1
    for i in range(1, len(left_half)):
        if left_half[i] - left_half[i - 1] >= 36:  # 0.5 inch gap = new column
            clusters += 1
    return min(clusters, 3)

