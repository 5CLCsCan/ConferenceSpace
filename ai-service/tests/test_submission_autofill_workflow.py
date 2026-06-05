from __future__ import annotations

import json

import pytest
from fastapi import FastAPI, HTTPException, status
from fastapi.testclient import TestClient

from app.core.auth import Identity
from app.workflows.submission_autofill.router import router as submission_autofill_router
from app.workflows.submission_autofill.metadata import extract_submission_metadata
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


def test_extract_submission_metadata_reads_title_abstract_and_authors_from_excerpt() -> None:
    text = """
    Graph-Based Reviewer Assignment for Academic Conferences
    Alice Nguyen, Bob Tran
    University of Science, Vietnam
    alice@example.com, bob@example.com

    Abstract
    This paper studies graph-based reviewer assignment for academic conferences. It combines topic similarity,
    workload balancing, and conflict checks to improve assignment quality.

    Keywords: reviewer assignment, graph matching, academic conferences
    1. Introduction
    Reviewer assignment remains a difficult operational problem.
    """

    metadata = extract_submission_metadata(text)

    assert metadata == {
        "title": "Graph-Based Reviewer Assignment for Academic Conferences",
        "abstract": "This paper studies graph-based reviewer assignment for academic conferences. It combines topic similarity, workload balancing, and conflict checks to improve assignment quality.",
        "authors": [
            {"name": "Alice Nguyen", "email": "alice@example.com", "affiliation": "University of Science, Vietnam", "country": ""},
            {"name": "Bob Tran", "email": "bob@example.com", "affiliation": "University of Science, Vietnam", "country": ""},
        ],
        "keywords": ["reviewer assignment", "graph matching", "academic conferences"],
    }


def test_extract_submission_metadata_handles_markitdown_two_column_front_matter() -> None:
    text = """
A note on Pearson Correlation Coefficient as a metric
of similarity in recommender system
|     |                             | Leily Sheugh  |     |     |     | Sasan H. Alizadeh           |     |     |     |     |
| --- | --------------------------- | ------------- | --- | --- | --- | --------------------------- | --- | --- | --- | --- |
|     | Faculty of Computer and IT  |               |     |     |     | Faculty of Computer and IT  |     |     |     |     |
Islamic Azad University, Qazvin branch  Islamic Azad University, Qazvin branch
|     |                         |  Qazvin, Iran  |     |     |     |  Qazvin, Iran                |     |     |     |     |
| --- | ----------------------- | -------------- | --- | --- | --- | ---------------------------- | --- | --- | --- | --- |
|     | leily.sheugh@gmail.com  |                |     |     |     | Sasan.H.Alizadeh@qiau.ac.ir  |     |     |     |     |

Abstract— Recommender systems help users to find information  The Collaborative Filtering includes item-based, user-based
that best fits their preferences and needs in an overloaded search  and  model-based  [7].  In  case  of  Item  based  Collaborative
space. Most recommender systems researches have been focused  Filtering, predicts the similarity among items by adopt pairwise
on the accuracy improvement of recommendation algorithms.
| Choosing  | appropriate  | similarity  | measure  is  a  | key  to  the  |     |     |     |     |     |     |
Keywords—recommender system, Collaborative Filtering,
similarity measure, Pearson Correlation Coefficient
|     |     | I.  INTRODUCTION  |     |     |     |     |     |     |     |     |
"""

    metadata = extract_submission_metadata(text)

    assert metadata["title"] == "A note on Pearson Correlation Coefficient as a metric of similarity in recommender system"
    assert metadata["abstract"].startswith("Recommender systems help users to find information")
    assert "Keywords" not in metadata["abstract"]
    assert metadata["keywords"] == ["recommender system", "Collaborative Filtering", "similarity measure", "Pearson Correlation Coefficient"]
    assert metadata["authors"] == [
        {
            "name": "Leily Sheugh",
            "email": "leily.sheugh@gmail.com",
            "affiliation": "Faculty of Computer and IT Islamic Azad University, Qazvin branch",
            "country": "Iran",
        },
        {
            "name": "Sasan H. Alizadeh",
            "email": "Sasan.H.Alizadeh@qiau.ac.ir",
            "affiliation": "Faculty of Computer and IT Islamic Azad University, Qazvin branch",
            "country": "Iran",
        },
    ]


def test_extract_submission_metadata_keeps_multiline_single_column_title_out_of_authors() -> None:
    text = """
Learning Interpretable BEV Based VIO without
Deep Neural Networks
Zexi Chen
Haozhe Du
Xuecheng Xu
Rong Xiong
Yiyi Liao∗
Yue Wang∗∗
Zhejiang University
{chenzexi,hzdu,xuechengxu,rxiong,yiyi.liao,ywang24}@zju.edu.cn
Abstract: Monocular visual-inertial odometry (VIO) is a critical problem in robotics and autonomous driving.

Keywords: VIO, Interpretable Learning

1 Introduction
"""

    metadata = extract_submission_metadata(text)

    assert metadata["title"] == "Learning Interpretable BEV Based VIO without Deep Neural Networks"
    assert [author["name"] for author in metadata["authors"]] == [
        "Zexi Chen",
        "Haozhe Du",
        "Xuecheng Xu",
        "Rong Xiong",
        "Yiyi Liao",
        "Yue Wang",
    ]
    assert metadata["keywords"] == ["VIO", "Interpretable Learning"]


def test_build_inference_payload_sends_extracted_metadata_and_primary_excerpt() -> None:
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
    assert "materials" not in payload
    assert payload["primary_material"] == {
        "filename": "paper.pdf",
        "excerpt": "Title Abstract This paper studies reviewer assignment.",
    }
    assert payload["extracted_metadata"] == {
        "title": "Title",
        "abstract": "This paper studies reviewer assignment.",
        "authors": [],
        "keywords": [],
    }
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
