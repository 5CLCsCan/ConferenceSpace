from __future__ import annotations

import re


def normalize_heading(text: str) -> str:
    normalized = text.strip()
    normalized = re.sub(
        r"^(?:\(?\d+[\)\.\-:]?|\(?[ivxlcdm]+[\)\.\-:]?|\(?[a-zA-Z][\)\.\-:])\s+",
        "",
        normalized,
        flags=re.IGNORECASE,
    )
    normalized = normalized.strip().strip(":").strip()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.lower()


def heading_matches(observed: str, expected: str) -> bool:
    return normalize_heading(observed) == normalize_heading(expected)


def extract_heading_candidates(lines: list[str]) -> list[str]:
    sections: list[str] = []
    seen: set[str] = set()

    for line in lines:
        stripped = line.strip()
        if not _is_heading_candidate(stripped):
            continue

        normalized = normalize_heading(stripped)
        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        sections.append(stripped)

    return sections


def _is_heading_candidate(text: str) -> bool:
    if not text:
        return False
    if len(text) > 120:
        return False
    if len(text.split()) > 12:
        return False
    if text.endswith((".", "?", "!")):
        return False
    if any(separator in text for separator in [",", ";"]):
        return False
    return True
