# AI-002 Tooling Research

## Selection Criteria

The AI-002 pipeline needs permissive licenses, active maintenance, deterministic local execution, and production-friendly packaging. Priority is given to battle-tested open-source libraries that fit an embedded Python workflow in `ai-service`.

## Recommended Stack

| Capability | Library | Why It Fits | License / Maintenance Evidence | Official References |
| ---------- | ------- | ----------- | ------------------------------ | ------------------- |
| Primary PDF parsing | `pypdf` | Pure-Python PDF parsing with text and metadata extraction, appropriate for page count, encryption flags, metadata, and baseline content extraction. | BSD-3-Clause, PyPI status `Production/Stable`, version `6.8.0` published on 2026-03-09. | [Docs](https://pypdf.readthedocs.io/en/3.9.0/), [PyPI](https://pypi.org/project/pypdf/), [Releases](https://github.com/py-pdf/pypdf/releases) |
| Layout-aware PDF facts | `pdfplumber` | Good fit for machine-generated academic PDFs when AI-002 needs word coordinates, tables, line objects, and layout-derived signals beyond raw text. | MIT license, latest release `v0.11.9`, repo shows continued maintenance and recent pushes. | [Repository](https://github.com/jsvine/pdfplumber), [Releases](https://github.com/jsvine/pdfplumber/releases) |
| DOCX parsing | `python-docx` | De facto standard for reading Word DOCX files in Python. Provides structured access to paragraphs, runs, tables, heading styles, and core document properties (author, title, subject). Page count is not natively available in DOCX format but can be estimated from extended properties or content volume. | MIT license, actively maintained, widely adopted (~7k stars). | [Docs](https://python-docx.readthedocs.io/), [Repository](https://github.com/python-openxml/python-docx), [PyPI](https://pypi.org/project/python-docx/) |
| LaTeX parsing | `TexSoup` | Fault-tolerant BeautifulSoup-like parser for LaTeX documents. Enables tree-based navigation and search for `\section{}`, `\title{}`, `\begin{abstract}`, `\author{}`, `\bibliographystyle{}`, and other structural commands. Suitable for deterministic section presence and anonymization checks on `.tex` source files. | BSD-2-Clause, 304 stars, pure Python, no external dependencies. | [Docs](https://texsoup.alvinwan.com/), [Repository](https://github.com/alvinwan/TexSoup), [PyPI](https://pypi.org/project/TexSoup/) |
| File type detection | `python-magic` | Wraps `libmagic` for reliable MIME type detection from file content bytes. Now required because AI-002 accepts PDF, DOCX, and LaTeX and must distinguish formats beyond extension or header checks alone. | MIT license, actively maintained. | [Repository](https://github.com/ahupp/python-magic), [PyPI](https://pypi.org/project/python-magic/) |
| Deterministic policy execution | `rule-engine` | Explicit expression language with optional typing, regex support, datetime support, and deterministic evaluation against normalized Python objects. | BSD-3-Clause, latest release `v4.5.3`, repo shows ongoing maintenance. | [Docs](https://zerosteiner.github.io/rule-engine/index.html), [Repository](https://github.com/zeroSteiner/rule-engine), [Releases](https://github.com/zeroSteiner/rule-engine/releases) |
| Deterministic remediation rendering | `Jinja2` | Mature template engine for rendering fixed guidance text from rule outcomes without LLM generation. | Current 3.1.x docs, latest release `3.1.6` published 2025-03-05 as a security release. | [Docs](https://jinja.palletsprojects.com/en/stable/), [Releases](https://github.com/pallets/jinja/releases) |
| Fuzzy comparison heuristics | `RapidFuzz` | Useful for deterministic title/section/header similarity checks with fast implementations and pure-Python fallback. | MIT license, latest release `3.14.3`, project docs and releases show active maintenance. | [Docs](https://rapidfuzz.github.io/RapidFuzz/), [Releases](https://github.com/rapidfuzz/RapidFuzz/releases) |

## Deferred Option

| Library | Why Deferred | Official References |
| ------- | ------------ | ------------------- |
| `GROBID` | Strong scholarly PDF parsing, production-ready, and Apache-2.0 licensed, but it introduces a JVM sidecar and larger operational footprint than the embedded Python v1 design. Keep it as a later upgrade path if `pypdf` plus `pdfplumber` prove insufficient for article-structure extraction. | [Docs](https://grobid.readthedocs.io/en/latest/Introduction/), [Repository](https://github.com/kermitt2/grobid) |

## Explicit Non-Selection

| Library | Reason Not Selected For V1 | Official References |
| ------- | -------------------------- | ------------------- |
| `pylatexenc` | Alternative LaTeX parser with unicode conversion capabilities. Passed over in favor of `TexSoup` because AI-002 needs tree-based structural navigation (sections, environments) rather than LaTeX-to-unicode conversion. Could complement `TexSoup` later if unicode normalization of LaTeX content is needed. | [Repository](https://github.com/phfaist/pylatexenc), [Docs](https://pylatexenc.readthedocs.io/) |

## V1 Tooling Decision

- Use `pypdf` first for PDF document-open, metadata, page count, text extraction, and encryption/readability facts.
- Use `pdfplumber` as a second pass when the PDF is machine-generated and the workflow needs layout-aware evidence.
- Use `python-docx` for DOCX paragraph, heading style, table, and core property extraction. Page count must be estimated from extended properties or content volume since DOCX does not encode pagination natively.
- Use `TexSoup` for LaTeX structural parsing: navigate `\section{}`, `\title{}`, `\begin{abstract}`, `\author{}`, and other commands as a tree without compiling the document.
- Use `python-magic` for reliable MIME type detection across the three supported formats.
- Use `rule-engine` for configurable policy evaluation over normalized facts.
- Use `Jinja2` for deterministic author/chair remediation text.
- Use `RapidFuzz` only for bounded deterministic heuristics, not for broad semantic similarity.
- Keep `GROBID` and OCR out of the first implementation.
