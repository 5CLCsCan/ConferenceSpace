from __future__ import annotations

import os
from io import BytesIO
from zipfile import ZipFile, is_zipfile

from app.workflows.submission_gating.models.facts import FileFacts
from app.workflows.submission_gating.models.findings import RuleFinding, VerdictBundle
from app.workflows.submission_gating.models.state import GatingState


def run(state: GatingState, *, file_bytes: bytes) -> GatingState:
    filename = state.normalized_request.file_metadata.original_filename
    mime_type = detect_mime_type(file_bytes, filename)
    detected_format = detect_format(file_bytes, filename, mime_type)

    if detected_format == "unknown":
        state.file_facts = FileFacts(
            format="unknown",
            mime_type=mime_type,
            size_bytes=len(file_bytes),
            is_parseable=False,
            findings=[],
        )
        return _mark_block(
            state,
            rule_id="binary_integrity.unsupported_format",
            message="Unsupported submission file format. Accepted formats are PDF, DOCX, and LaTeX.",
            evidence={"filename": filename, "mime_type": mime_type},
        )

    probe = _probe_integrity(detected_format, file_bytes)
    state.file_facts = FileFacts(
        format=detected_format,
        mime_type=mime_type,
        size_bytes=len(file_bytes),
        is_encrypted=bool(probe.get("is_encrypted", False)),
        is_parseable=bool(probe.get("is_parseable", True)),
        page_count=probe.get("page_count"),
        text_coverage_ratio=probe.get("text_coverage_ratio"),
        findings=[],
    )

    if state.file_facts.is_encrypted:
        return _mark_block(
            state,
            rule_id=f"binary_integrity.{detected_format}.encrypted",
            message=probe.get("message", "Encrypted files are not accepted."),
            evidence={"format": detected_format},
        )
    if not state.file_facts.is_parseable:
        return _mark_block(
            state,
            rule_id=f"binary_integrity.{detected_format}.invalid",
            message=probe.get("message", "The file could not be parsed."),
            evidence={"format": detected_format},
        )

    return state


def detect_mime_type(file_bytes: bytes, filename: str | None = None) -> str:
    try:
        import magic  # type: ignore

        detected = magic.from_buffer(file_bytes, mime=True)
        if detected:
            return str(detected)
    except Exception:
        pass

    extension = os.path.splitext(filename or "")[1].lower()
    if file_bytes.startswith(b"%PDF-") or extension == ".pdf":
        return "application/pdf"
    if extension == ".docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if extension == ".tex":
        return "text/x-tex"
    return "application/octet-stream"


def detect_format(file_bytes: bytes, filename: str, mime_type: str) -> str:
    extension = os.path.splitext(filename)[1].lower()
    if file_bytes.startswith(b"%PDF-") or mime_type == "application/pdf" or extension == ".pdf":
        return "pdf"
    if extension == ".docx" or mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "docx"
    if extension == ".tex" or b"\\documentclass" in file_bytes or b"\\begin{document}" in file_bytes:
        return "latex"
    return "unknown"


def probe_pdf_integrity(file_bytes: bytes) -> dict:
    try:
        from pypdf import PdfReader
    except ModuleNotFoundError:
        if file_bytes.startswith(b"%PDF-"):
            return {"is_encrypted": False, "is_parseable": True, "page_count": 1}
        return {"is_encrypted": False, "is_parseable": False, "message": "Invalid PDF header."}

    try:
        reader = PdfReader(BytesIO(file_bytes))
        if getattr(reader, "is_encrypted", False):
            return {"is_encrypted": True, "is_parseable": False, "message": "PDF is encrypted."}
        return {"is_encrypted": False, "is_parseable": True, "page_count": len(reader.pages)}
    except Exception as exc:
        return {"is_encrypted": False, "is_parseable": False, "message": str(exc)}


def probe_docx_integrity(file_bytes: bytes) -> dict:
    if not is_zipfile(BytesIO(file_bytes)):
        return {"is_encrypted": False, "is_parseable": False, "message": "DOCX file is not a valid zip archive."}
    try:
        with ZipFile(BytesIO(file_bytes)) as archive:
            if "[Content_Types].xml" not in archive.namelist():
                return {"is_encrypted": False, "is_parseable": False, "message": "DOCX content types manifest is missing."}
        return {"is_encrypted": False, "is_parseable": True}
    except Exception as exc:
        return {"is_encrypted": False, "is_parseable": False, "message": str(exc)}


def probe_latex_integrity(file_bytes: bytes) -> dict:
    text = file_bytes.decode("utf-8", errors="ignore")
    if not text.strip():
        return {"is_encrypted": False, "is_parseable": False, "message": "LaTeX source is empty."}
    if "\\documentclass" not in text and "\\begin{document}" not in text:
        return {"is_encrypted": False, "is_parseable": False, "message": "LaTeX source is missing core document commands."}
    try:
        from TexSoup import TexSoup

        TexSoup(text[:8192])
    except ModuleNotFoundError:
        pass
    except Exception as exc:
        return {"is_encrypted": False, "is_parseable": False, "message": str(exc)}
    return {"is_encrypted": False, "is_parseable": True}


def _probe_integrity(detected_format: str, file_bytes: bytes) -> dict:
    if detected_format == "pdf":
        return probe_pdf_integrity(file_bytes)
    if detected_format == "docx":
        return probe_docx_integrity(file_bytes)
    if detected_format == "latex":
        return probe_latex_integrity(file_bytes)
    return {"is_encrypted": False, "is_parseable": False, "message": "Unsupported format."}


def _mark_block(state: GatingState, *, rule_id: str, message: str, evidence: dict) -> GatingState:
    state.rule_findings.append(
        RuleFinding(
            rule_id=rule_id,
            source="deterministic",
            severity="block",
            message=message,
            evidence=evidence,
            remediation_key="upload_supported_file",
        )
    )
    state.verdict_bundle = VerdictBundle(
        verdict="block",
        decision="desk_reject",
        score=0.0,
        summary={
            "total_findings": len(state.rule_findings),
            "blocking_count": sum(1 for finding in state.rule_findings if finding.severity == "block"),
            "warning_count": sum(1 for finding in state.rule_findings if finding.severity == "warn"),
            "pass_count": sum(1 for finding in state.rule_findings if finding.severity == "pass"),
        },
    )
    return state
