from __future__ import annotations

from copy import deepcopy
from pathlib import Path


def _load_pdf_fixture() -> bytes:
    fixture_path = Path(__file__).resolve().parents[2] / "backend" / "tests" / "api" / "test_paper.pdf"
    if fixture_path.exists():
        return fixture_path.read_bytes()
    return b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"


MINIMAL_PDF_BYTES = _load_pdf_fixture()


def make_request_payload(
    *,
    enabled: bool = True,
    prompt_fragments: list[str] | None = None,
    original_filename: str = "submission.pdf",
    content_type: str = "application/pdf",
) -> dict:
    return {
        "mode": "advisory",
        "source": "author_precheck",
        "conference_id": 42,
        "submission_id": 7,
        "actor": {
            "user_id": 123,
            "email": "author@example.com",
            "role": "author",
        },
        "submission": {
            "title": "Deep Learning for Reliable Systems",
            "abstract": "We propose a deterministic validation workflow for submissions.",
            "track": "main-track",
            "status": "published",
            "information": {
                "keywords": ["deep learning", "transformer"],
                "co_authors": ["coauthor@example.com"],
                "declared_conflicts": [],
                "paper_type": "research",
                "track_name": "main-track",
                "additional_notes": "",
                "metadata": {"language": "en", "page_count": 0},
            },
        },
        "policy": {
            "maximum_pages": 8,
            "submission_format": ["PDF", "DOCX", "LaTeX"],
            "review_type": "double-blind",
            "desk_rejection_settings": {
                "enabled": enabled,
                "min_references": 10,
                "required_sections": [
                    "Abstract",
                    "Introduction",
                    "Conclusion",
                    "References",
                ],
                "title_max_words": 20,
                "custom_rules": {
                    "author_anonymization_required": True,
                    "banned_phrases": ["as shown in our previous work"],
                },
                "scope_keywords": ["deep learning", "transformer"],
                "prompt_fragments": prompt_fragments or [],
            },
            "workflow_settings": {
                "strict_deadlines": False,
            },
        },
        "file_metadata": {
            "original_filename": original_filename,
            "size_bytes": len(MINIMAL_PDF_BYTES),
            "content_type": content_type,
        },
    }


def clone_payload(payload: dict) -> dict:
    return deepcopy(payload)
