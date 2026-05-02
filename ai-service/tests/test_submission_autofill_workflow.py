from __future__ import annotations

import json

import pytest
from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.submission_autofill.router import router as submission_autofill_router
from app.workflows.submission_autofill.runner import build_inference_payload
from app.workflows.submission_autofill.schemas import (
    ActorPayload,
    AutofillFileMetadata,
    SubmissionAutofillArtifact,
    SubmissionAutofillRunRequest,
)
from app.workflows.submission_gating.models.facts import ExtractedDocument


class _FakeRunner:
    async def run(self, *, request, files):
        return {
            "run_id": "run-autofill",
            "status": "ready",
            "fields": {
                "title": {"value": "Extracted Title", "confidence": "high", "evidence": [], "warnings": []},
                "abstract": {"value": "Extracted abstract.", "confidence": "high", "evidence": [], "warnings": []},
                "keywords": {"value": ["ai"], "confidence": "medium", "evidence": [], "warnings": []},
                "track_name": {"value": "AI", "confidence": "medium", "evidence": [], "warnings": []},
                "paper_type": {"value": "research", "confidence": "medium", "evidence": [], "warnings": []},
                "additional_notes": {"value": "", "confidence": "not_found", "evidence": [], "warnings": []},
            },
            "authors": [],
            "possible_conflicts": [],
            "materials": [
                {
                    "file_id": request.files[0].file_id,
                    "filename": request.files[0].original_filename,
                    "size_bytes": request.files[0].size_bytes,
                    "role": "primary",
                    "extraction_status": "ok",
                    "warnings": [],
                }
            ],
            "warnings": [],
        }


def _make_app() -> FastAPI:
    app = FastAPI()
    app.include_router(submission_autofill_router)
    app.state.container = type("_Container", (), {"submission_autofill_runner": _FakeRunner()})()
    return app


def test_submission_autofill_route_accepts_repeated_files(monkeypatch) -> None:
    async def _fake_identity(_request):
        return Identity(user_id=123, user_email="author@example.com")

    monkeypatch.setattr("app.workflows.submission_autofill.router._require_identity", _fake_identity)

    request_payload = {
        "conference_id": 210,
        "actor": {"user_id": 123, "email": "author@example.com", "role": "author"},
        "extra_details": "Use the final title.",
        "available_tracks": ["AI"],
        "files": [
            {
                "file_id": "file-1",
                "original_filename": "paper.pdf",
                "size_bytes": 5,
                "content_type": "application/pdf",
            },
            {
                "file_id": "file-2",
                "original_filename": "appendix.tex",
                "size_bytes": 8,
                "content_type": "text/x-tex",
            },
        ],
    }

    client = TestClient(_make_app())
    response = client.post(
        "/api/v1/workflows/submission-autofill/runs",
        files=[
            ("request", (None, json.dumps(request_payload), "application/json")),
            ("files.file-1", ("paper.pdf", b"paper", "application/pdf")),
            ("files.file-2", ("appendix.tex", b"appendix", "text/x-tex")),
        ],
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    assert response.json()["run_id"] == "run-autofill"
    assert response.json()["materials"][0]["file_id"] == "file-1"


def test_submission_autofill_route_requires_auth(monkeypatch) -> None:
    async def _fake_identity(_request):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")

    monkeypatch.setattr("app.workflows.submission_autofill.router._require_identity", _fake_identity)

    client = TestClient(_make_app())
    response = client.post("/api/v1/workflows/submission-autofill/runs")

    assert response.status_code == 401


def test_build_inference_payload_keeps_materials_separate_and_marks_primary() -> None:
    request = SubmissionAutofillRunRequest(
        conference_id=210,
        actor=ActorPayload(user_id=123, email="author@example.com", role="author"),
        extra_details="This is a student paper.",
        available_tracks=["AI"],
        files=[
            AutofillFileMetadata(
                file_id="file-1",
                original_filename="paper.pdf",
                size_bytes=100,
                content_type="application/pdf",
            ),
            AutofillFileMetadata(
                file_id="file-2",
                original_filename="appendix.tex",
                size_bytes=200,
                content_type="text/x-tex",
            ),
        ],
    )
    documents = {
        "file-1": ExtractedDocument(
            format="pdf",
            raw_text="Title\nAbstract\nThis paper studies reviewer assignment.",
            title="Reviewer Assignment",
            abstract="This paper studies reviewer assignment.",
            authors=["Author One"],
            page_count=8,
            text_coverage_ratio=0.8,
        ),
        "file-2": ExtractedDocument(
            format="latex",
            raw_text="Supplementary appendix text",
            title="Appendix",
            page_count=2,
            text_coverage_ratio=0.7,
        ),
    }

    payload = build_inference_payload(request=request, documents=documents, failed_materials=[])

    assert payload["primary_material_id"] == "file-1"
    assert [material["file_id"] for material in payload["materials"]] == ["file-1", "file-2"]
    assert payload["materials"][0]["role"] == "primary"
    assert payload["materials"][1]["role"] == "supplementary"
    assert payload["extra_details"] == "This is a student paper."


def test_submission_autofill_artifact_schema_is_strict_for_openai_responses() -> None:
    schema = SubmissionAutofillArtifact.model_json_schema()
    defs = schema["$defs"]

    assert schema["additionalProperties"] is False
    assert defs["SubmissionAutofillFields"]["additionalProperties"] is False
    assert defs["AutofillField"]["additionalProperties"] is False
    assert defs["AutofillStringListField"]["additionalProperties"] is False
    assert defs["AutofillEvidence"]["additionalProperties"] is False
    assert defs["AutofillAuthor"]["additionalProperties"] is False
    assert defs["AutofillConflict"]["additionalProperties"] is False

    missing_required: list[tuple[str | None, list[str], list[str]]] = []
    stack: list[object] = [schema, *defs.values()]
    while stack:
        current = stack.pop()
        if isinstance(current, dict):
            if current.get("type") == "object":
                properties = set(current.get("properties", {}))
                required = set(current.get("required", []))
                if properties != required:
                    missing_required.append(
                        (
                            current.get("title"),
                            sorted(properties - required),
                            sorted(required - properties),
                        )
                    )
            stack.extend(value for value in current.values() if isinstance(value, (dict, list)))
        elif isinstance(current, list):
            stack.extend(value for value in current if isinstance(value, (dict, list)))

    assert missing_required == []
