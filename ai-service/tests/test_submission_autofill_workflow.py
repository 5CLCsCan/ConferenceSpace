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
                "title": "Extracted Title",
                "abstract": "Extracted abstract.",
                "keywords": ["ai"],
                "paper_type": "research",
                "additional_notes": "",
            },
            "track_rankings": [
                {
                    "track_name": "AI",
                    "confidence": 8.5,
                    "rationale": "The manuscript focuses on AI-driven reviewer assignment.",
                }
            ],
            "authors": [],
            "materials": [
                {
                    "file_id": request.files[0].file_id,
                    "filename": request.files[0].original_filename,
                    "content_type": request.files[0].content_type,
                    "size_bytes": request.files[0].size_bytes,
                    "role": "primary",
                    "extraction_status": "ok",
                    "text_coverage_ratio": None,
                    "page_count": None,
                    "warnings": [],
                }
            ],
            "warnings": [],
            "error": None,
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
        "conference_context": {
            "name": "Conference on AI Systems",
            "acronym": "CAIS",
            "description": "Research conference for applied AI systems.",
            "domain": ["Artificial Intelligence"],
            "cfp_text": "We invite papers on learning systems and evaluation.",
            "tracks": ["AI", "Systems"],
        },
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


def test_build_inference_payload_sends_only_raw_content_for_materials() -> None:
    request = SubmissionAutofillRunRequest(
        conference_id=210,
        actor=ActorPayload(user_id=123, email="author@example.com", role="author"),
        extra_details="This is a student paper.",
        available_tracks=["Spoofed"],
        conference_context={
            "name": "Conference on AI Systems",
            "acronym": "CAIS",
            "description": "Research conference for applied AI systems.",
            "domain": ["Artificial Intelligence"],
            "cfp_text": "We invite papers on learning systems and evaluation.",
            "tracks": ["AI", "Systems"],
        },
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

    payload = build_inference_payload(
        request=request,
        documents=documents,
        failed_materials=[
            {
                "file_id": "file-3",
                "filename": "broken.pdf",
                "extraction_status": "failed",
                "warnings": ["Material could not be extracted."],
            }
        ],
    )

    assert "primary_material_id" not in payload
    assert "failed_materials" not in payload
    assert payload["materials"] == [
        {"filename": "paper.pdf", "raw_content": "Title Abstract This paper studies reviewer assignment."},
        {"filename": "appendix.tex", "raw_content": "Supplementary appendix text"},
    ]
    assert payload["extra_details"] == "This is a student paper."
    assert payload["conference_context"] == {
        "name": "Conference on AI Systems",
        "acronym": "CAIS",
        "description": "Research conference for applied AI systems.",
        "domain": ["Artificial Intelligence"],
        "cfp_text": "We invite papers on learning systems and evaluation.",
        "tracks": ["AI", "Systems"],
    }
    assert payload["available_tracks"] == ["AI", "Systems"]


def test_submission_autofill_artifact_schema_is_strict_for_user_visible_output() -> None:
    schema = SubmissionAutofillArtifact.model_json_schema()
    defs = schema["$defs"]

    assert schema["additionalProperties"] is False
    assert defs["SubmissionAutofillFields"]["additionalProperties"] is False
    assert defs["AutofillAuthor"]["additionalProperties"] is False
    assert defs["AutofillTrackRanking"]["additionalProperties"] is False
    assert "AutofillEvidence" not in defs
    assert "AutofillConflict" not in defs
    assert "AutofillField" not in defs
    assert "AutofillStringListField" not in defs
    assert "possible_conflicts" not in schema["properties"]
    assert schema["properties"]["track_rankings"]["title"] == "Track Rankings"

    field_properties = schema["$defs"]["SubmissionAutofillFields"]["properties"]
    assert field_properties["title"]["type"] == "string"
    assert field_properties["abstract"]["type"] == "string"
    assert field_properties["keywords"]["type"] == "array"
    assert field_properties["keywords"]["items"]["type"] == "string"
    assert set(defs["AutofillTrackRanking"]["properties"]) == {"track_name", "confidence", "rationale"}
    assert set(defs["AutofillAuthor"]["properties"]) == {"name", "email", "affiliation", "country"}

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
