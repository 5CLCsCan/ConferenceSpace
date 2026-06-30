from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF_PATH = REPO_ROOT.parent / "2015-pearson-correlation-sim-IEEE (1).pdf"

sys.path.insert(0, str(REPO_ROOT))

from app.workflows.submission_autofill.metadata import extract_submission_metadata  # noqa: E402
from app.workflows.submission_gating.extractors.pdf_extractor import extract_page_text_with_columns  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract a PDF with the shared PyMuPDF column-aware extractor, run submission autofill metadata extraction, and print both results."
    )
    parser.add_argument(
        "pdf_path",
        nargs="?",
        default=str(DEFAULT_PDF_PATH),
        help="Path to the PDF to inspect. Defaults to the sample Pearson-correlation paper in the repo root.",
    )
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path).expanduser().resolve()
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 2

    try:
        import pymupdf
    except ImportError:
        print("PyMuPDF is not installed. Install it with: pip install pymupdf", file=sys.stderr)
        return 3

    content = extract_pdf_text_with_columns(pdf_path, pymupdf)
    metadata = extract_submission_metadata(content)

    print("=== EXTRACTED METADATA ===")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))
    print("\n=== PYMUPDF COLUMN CONTENT ===")
    print(content)
    return 0


def extract_pdf_text_with_columns(pdf_path: Path, pymupdf) -> str:
    pages: list[str] = []
    with pymupdf.open(pdf_path) as doc:
        for page_index, page in enumerate(doc):
            page_text = extract_page_text_with_columns(page, page_index, pymupdf)
            if page_text:
                pages.append(page_text)
    return "\n\n".join(pages).strip()


if __name__ == "__main__":
    raise SystemExit(main())
