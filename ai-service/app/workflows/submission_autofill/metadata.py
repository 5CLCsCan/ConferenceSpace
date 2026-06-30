from __future__ import annotations

import re

EXCERPT_CHARS = 5000
_EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
_ABSTRACT_START_RE = re.compile(r"(?im)^\s*(?:abstract|summary)\s*[:—-]?\s*")
_ABSTRACT_STOP_RE = re.compile(
    r"(?im)^\s*(?:\|.*)?\s*(?:keywords?|index\s+terms?|introduction|1\.?\s+introduction|i\.?\s+introduction|background)\b"
)
_KEYWORDS_START_RE = re.compile(r"(?im)^\s*(?:\|.*)?\s*(?:keywords?|index\s+terms?)\s*[:—-]?\s*")
_KEYWORDS_STOP_RE = re.compile(r"(?im)^\s*(?:\|.*)?\s*(?:introduction|1\.?\s+introduction|i\.?\s+introduction|background)\b")
_AUTHOR_SPLIT_RE = re.compile(r"\s*(?:,|;|\band\b|\&|\n)\s*", re.IGNORECASE)
_AFFILIATION_MARKERS = ("university", "institute", "department", "school", "college", "laboratory", "centre", "center", "faculty")
_COUNTRIES = ("Iran", "USA", "United States", "Canada", "China", "Japan", "Korea", "France", "Germany", "Australia")
_TECHNICAL_NAME_FALSE_POSITIVES = {
    "analysis",
    "based",
    "bev",
    "deep",
    "detection",
    "framework",
    "graph",
    "interpretable",
    "learning",
    "method",
    "model",
    "network",
    "networks",
    "neural",
    "optimization",
    "robotics",
    "system",
    "systems",
    "vio",
    "visual",
}


def extract_submission_metadata(text: str) -> dict:
    excerpt = _excerpt(text)
    lines = _meaningful_lines(excerpt)
    abstract, abstract_start = _extract_abstract(excerpt)
    title = _extract_title(lines, abstract_start)
    authors = _extract_authors(lines, title, abstract_start)
    keywords = _extract_keywords(excerpt)
    return {"title": title, "abstract": abstract, "authors": authors, "keywords": keywords}


def _excerpt(text: str) -> str:
    return str(text or "")[:EXCERPT_CHARS]


def _meaningful_lines(text: str) -> list[str]:
    return [_clean_line(line) for line in text.splitlines() if _clean_line(line)]


def _clean_line(value: str) -> str:
    return " ".join(str(value or "").split()).strip()


def _extract_abstract(text: str) -> tuple[str, int | None]:
    match = _ABSTRACT_START_RE.search(text)
    if match is None:
        return "", None
    stop = _ABSTRACT_STOP_RE.search(text, match.end())
    end = stop.start() if stop is not None else len(text)
    abstract = _clean_line(_strip_markdown_tables(text[match.end() : end]))
    return abstract, match.start()


def _extract_keywords(text: str) -> list[str]:
    match = _KEYWORDS_START_RE.search(text)
    if match is None:
        return []
    stop = _KEYWORDS_STOP_RE.search(text, match.end())
    end = stop.start() if stop is not None else len(text)
    keyword_text = _clean_line(_strip_markdown_tables(text[match.end() : end]))
    keyword_text = re.sub(r"\b(?:keywords?|index\s+terms?)\b\s*[:—-]?", "", keyword_text, flags=re.IGNORECASE)
    parts = re.split(r"\s*(?:,|;|•|\||\n)\s*", keyword_text)
    output: list[str] = []
    for part in parts:
        keyword = _clean_keyword(part)
        if keyword and keyword.casefold() not in {item.casefold() for item in output}:
            output.append(keyword)
    return output[:12]


def _clean_keyword(value: str) -> str:
    cleaned = _clean_line(value)
    cleaned = re.sub(r"^[–—\-:]+\s*", "", cleaned)
    cleaned = re.sub(r"\s+[.。]$", "", cleaned)
    return cleaned


def _extract_title(lines: list[str], abstract_start: int | None) -> str:
    del abstract_start
    title_parts: list[str] = []
    for line in lines[:8]:
        if _is_metadata_noise(line) or _looks_like_affiliation(line) or _looks_like_author_line(line):
            if title_parts:
                break
            continue
        if 4 <= len(line) <= 240:
            title_parts.append(line)
            if len(" ".join(title_parts)) >= 180:
                break
            continue
        if title_parts:
            break
    return _clean_line(" ".join(title_parts))


def _extract_authors(lines: list[str], title: str, abstract_start: int | None) -> list[dict[str, str]]:
    if not title:
        return []
    front_lines = _front_matter_lines(lines, title, abstract_start)
    names = _extract_author_names(front_lines)
    if not names:
        return []

    emails = _EMAIL_RE.findall(" ".join(front_lines))
    affiliations = _extract_affiliations(front_lines)
    country = _extract_country(front_lines)
    return [
        {
            "name": name,
            "email": emails[index] if index < len(emails) else "",
            "affiliation": affiliations[index] if index < len(affiliations) else (affiliations[0] if affiliations else ""),
            "country": country,
        }
        for index, name in enumerate(names)
    ]


def _front_matter_lines(lines: list[str], title: str, abstract_start: int | None) -> list[str]:
    del abstract_start
    title_words = title.split()
    consumed_title_words = 0
    output: list[str] = []
    for line in lines:
        if line.casefold().startswith(("abstract", "summary")):
            break
        if consumed_title_words < len(title_words):
            consumed_title_words += len(line.split())
            continue
        output.append(line)
    return output[:12]


def _extract_author_names(front_lines: list[str]) -> list[str]:
    output: list[str] = []
    for line in front_lines:
        if _looks_like_affiliation(line) or _EMAIL_RE.search(line):
            continue
        candidates = _table_cells(line) if _is_markdown_table_line(line) else _AUTHOR_SPLIT_RE.split(line)
        names = [_clean_author_name(candidate) for candidate in candidates]
        names = [name for name in names if _looks_like_person_name(name)]
        for name in names:
            if name not in output:
                output.append(name)
    return output


def _extract_affiliations(front_lines: list[str]) -> list[str]:
    values: list[str] = []
    for index, line in enumerate(front_lines):
        if not _looks_like_affiliation(line):
            continue
        if not _is_markdown_table_line(line) and index > 0 and _looks_like_affiliation(front_lines[index - 1]):
            continue
        base_values = [cell for cell in _table_cells(line) if _looks_like_affiliation(cell)] or [line]
        suffix = ""
        if (
            index + 1 < len(front_lines)
            and not _is_markdown_table_line(front_lines[index + 1])
            and _EMAIL_RE.search(front_lines[index + 1]) is None
        ):
            suffix = _dedupe_repeated_phrase(front_lines[index + 1])
        for value in base_values:
            affiliation = _clean_line(f"{value} {suffix}")
            if affiliation not in values:
                values.append(affiliation)
    return values


def _extract_country(front_lines: list[str]) -> str:
    joined = " ".join(front_lines)
    for country in _COUNTRIES:
        if re.search(rf"\b{re.escape(country)}\b", joined, re.IGNORECASE):
            return country
    return ""


def _is_metadata_noise(line: str) -> bool:
    lowered = line.casefold()
    return lowered in {"abstract", "summary"} or _EMAIL_RE.search(line) is not None or _is_markdown_separator(line)


def _looks_like_author_line(line: str) -> bool:
    if _EMAIL_RE.search(line):
        return False
    lowered = line.casefold()
    if any(marker in lowered for marker in _AFFILIATION_MARKERS):
        return False
    parts = _table_cells(line) if _is_markdown_table_line(line) else _AUTHOR_SPLIT_RE.split(line)
    names = [_clean_author_name(part) for part in parts if _clean_author_name(part)]
    matched_names = [part for part in names if _looks_like_person_name(part)]
    return bool(matched_names) and len(matched_names) == len(names)


def _looks_like_person_name(value: str) -> bool:
    words = [word for word in value.split() if word]
    if not 2 <= len(words) <= 5:
        return False
    normalized_words = {re.sub(r"[^a-z]", "", word.casefold()) for word in words}
    if normalized_words & _TECHNICAL_NAME_FALSE_POSITIVES:
        return False
    return all(re.match(r"^[A-Z][A-Za-z'.-]*\d*$", word) is not None for word in words)


def _clean_author_name(value: str) -> str:
    cleaned = re.sub(r"[\*∗†‡§¶#]+", "", value)
    cleaned = re.sub(r"\b\d+\b", "", cleaned)
    return _clean_line(cleaned)


def _looks_like_affiliation(line: str) -> bool:
    lowered = line.casefold()
    return any(marker in lowered for marker in _AFFILIATION_MARKERS)


def _is_markdown_table_line(line: str) -> bool:
    return line.count("|") >= 2


def _is_markdown_separator(line: str) -> bool:
    return bool(re.fullmatch(r"[|\-: ]+", line))


def _table_cells(line: str) -> list[str]:
    return [_clean_line(cell) for cell in line.strip().strip("|").split("|") if _clean_line(cell) and not _is_markdown_separator(_clean_line(cell))]


def _strip_markdown_tables(text: str) -> str:
    output: list[str] = []
    for line in text.splitlines():
        if _is_markdown_separator(_clean_line(line)):
            continue
        output.append(" ".join(_table_cells(line)) if _is_markdown_table_line(line) else line)
    return "\n".join(output)


def _dedupe_repeated_phrase(value: str) -> str:
    words = _clean_line(value).split()
    if len(words) % 2 != 0:
        return " ".join(words)
    midpoint = len(words) // 2
    if words[:midpoint] == words[midpoint:]:
        return " ".join(words[:midpoint])
    return " ".join(words)
