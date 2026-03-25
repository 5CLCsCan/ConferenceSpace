from __future__ import annotations

import re

from app.workflows.submission_gating.models.facts import ExtractedDocument


class LatexExtractor:
    def extract(self, file_bytes: bytes, filename: str | None = None) -> ExtractedDocument:
        try:
            from TexSoup import TexSoup
        except ModuleNotFoundError as exc:  # pragma: no cover
            raise RuntimeError("TexSoup is required for LaTeX extraction") from exc

        text = file_bytes.decode("utf-8", errors="ignore")
        soup = TexSoup(text)
        sections = []
        for node in soup.find_all("section"):
            value = str(node.string).strip() if node.string else ""
            if value:
                sections.append(value)

        title = _extract_command_argument(text, "title")
        abstract = _extract_environment(text, "abstract")
        author = _extract_command_argument(text, "author")
        authors = [author] if author else []
        if abstract:
            sections.append("Abstract")
        has_bibliography = "\\bibliography" in text or "\\begin{thebibliography}" in text
        if has_bibliography:
            sections.append("References")
        raw_text = _strip_latex_commands(text)

        return ExtractedDocument(
            format="latex",
            raw_text=raw_text,
            sections=sections,
            title=title,
            abstract=abstract,
            authors=authors,
            metadata={"has_bibliography": has_bibliography},
            table_count=text.count("\\begin{table"),
            figure_count=text.count("\\begin{figure"),
            page_count=None,
            text_coverage_ratio=1.0 if raw_text else 0.0,
            core_properties={},
        )


def _extract_command_argument(text: str, command: str) -> str | None:
    match = re.search(rf"\\{command}\{{([^}}]+)\}}", text)
    return match.group(1).strip() if match else None


def _extract_environment(text: str, environment: str) -> str | None:
    match = re.search(rf"\\begin\{{{environment}\}}(.*?)\\end\{{{environment}\}}", text, re.DOTALL)
    if not match:
        return None
    return re.sub(r"\s+", " ", match.group(1)).strip() or None


def _strip_latex_commands(text: str) -> str:
    """Iteratively remove LaTeX commands until no more are matched."""
    pattern = re.compile(r"\\[a-zA-Z*]+(\[[^\]]*\])?(\{[^}]*\})*")
    prev = None
    while prev != text:
        prev = text
        text = pattern.sub(" ", text)
    # Remove stray braces and normalise whitespace
    text = re.sub(r"[{}]", " ", text)
    return re.sub(r"\s+", " ", text).strip()
