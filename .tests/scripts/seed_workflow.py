from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any

from .common import BackendClient, TestUserSeed, minimal_pdf_bytes, unwrap_data, utc_now_iso


@dataclass(frozen=True)
class SeedUsers:
    chair: TestUserSeed = field(
        default_factory=lambda: TestUserSeed(
            email="test.discussion.chair@example.com",
            first_name="Test",
            last_name="Chair",
        )
    )
    reviewer: TestUserSeed = field(
        default_factory=lambda: TestUserSeed(
            email="test.discussion.reviewer@example.com",
            first_name="Test",
            last_name="Reviewer",
        )
    )
    author: TestUserSeed = field(
        default_factory=lambda: TestUserSeed(
            email="test.discussion.author@example.com",
            first_name="Test",
            last_name="Author",
        )
    )
    profile: TestUserSeed = field(
        default_factory=lambda: TestUserSeed(
            email="test.profile@example.com",
            first_name="Test",
            last_name="ProfileUser",
        )
    )


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _extract_assignment_id_from_dashboard(payload: Any, submission_id: int) -> int | None:
    data = unwrap_data(payload)
    recent_assignments = []
    if isinstance(data, dict):
        raw = data.get("recent_assignments")
        if isinstance(raw, list):
            recent_assignments = raw
        elif isinstance(raw, dict):
            nested = raw.get("data")
            if isinstance(nested, list):
                recent_assignments = nested

    for assignment in recent_assignments:
        if not isinstance(assignment, dict):
            continue
        paper_id = _to_int(assignment.get("paper_id") or assignment.get("submission_id"))
        if paper_id != submission_id:
            continue
        candidate = assignment.get("assignment_id") or assignment.get("id")
        found = _to_int(candidate)
        if found:
            return found

    for assignment in recent_assignments:
        if isinstance(assignment, dict):
            candidate = assignment.get("assignment_id") or assignment.get("id")
            found = _to_int(candidate)
            if found:
                return found

    return None


def _extract_assignment_id_from_papers(payload: Any) -> int | None:
    data = unwrap_data(payload)
    papers = []
    if isinstance(data, dict):
        raw = data.get("papers")
        if isinstance(raw, list):
            papers = raw
        elif isinstance(raw, dict):
            nested = raw.get("data")
            if isinstance(nested, list):
                papers = nested
    for paper in papers:
        if not isinstance(paper, dict):
            continue
        candidate = paper.get("assignment_id") or paper.get("assignmentId")
        found = _to_int(candidate)
        if found:
            return found
    return None


def _extract_thread_id(payload: Any) -> int | None:
    data = unwrap_data(payload)
    if not isinstance(data, dict):
        return None
    thread = data.get("thread") if isinstance(data.get("thread"), dict) else data
    return _to_int(thread.get("id")) if isinstance(thread, dict) else None


def _extract_submission_id(payload: Any) -> int:
    data = unwrap_data(payload)
    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected submission create response: {data!r}")
    submission_id = _to_int(data.get("id") or data.get("submission_id"))
    if not submission_id:
        raise RuntimeError(f"Missing submission id in response: {data!r}")
    return submission_id


def _extract_conference_id(payload: Any) -> int:
    data = unwrap_data(payload)
    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected conference create response: {data!r}")
    conference_id = _to_int(data.get("id") or data.get("conference_id"))
    if not conference_id:
        raise RuntimeError(f"Missing conference id in response: {data!r}")
    return conference_id


def _extract_reviewer_record_id(payload: Any) -> int:
    data = unwrap_data(payload)
    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected reviewer invite response: {data!r}")
    success = data.get("success")
    if not isinstance(success, list) or not success:
        raise RuntimeError(f"Reviewer invite returned no success records: {data!r}")
    reviewer = success[0]
    if not isinstance(reviewer, dict):
        raise RuntimeError(f"Unexpected reviewer record shape: {reviewer!r}")
    reviewer_id = _to_int(reviewer.get("id"))
    if not reviewer_id:
        raise RuntimeError(f"Missing reviewer record id in response: {reviewer!r}")
    return reviewer_id


def seed_dataset(
    client: BackendClient,
    *,
    prefix: str,
    include_discussion_seed: bool = True,
    include_draft_review_seed: bool = True,
    chair_decision: str | None = None,
) -> dict[str, Any]:
    users = SeedUsers()
    stamp = int(time.time() * 1000)
    acronym = f"{prefix.upper()[:6]}{stamp % 1_000_000:06d}"
    open_acronym = f"{acronym}O"

    chair_login = client.login_test_user(users.chair)
    reviewer_login = client.login_test_user(users.reviewer)
    author_login = client.login_test_user(users.author)
    profile_login = client.login_test_user(users.profile)

    chair_token = chair_login.get("token")
    reviewer_token = reviewer_login.get("token")
    author_token = author_login.get("token")

    if not chair_token or not reviewer_token or not author_token:
        raise RuntimeError("Test-login response missing token for chair/reviewer/author")

    conference_payload = {
        "conference": {
            "title": f"{prefix.upper()} Conference {stamp}",
            "acronym": acronym,
            "description": "Seeded by .tests/upload_mock_data.py for full frontend-v2 E2E runs.",
            "chair": users.chair.email,
            "domain": ["AI", "ML", "NLP"],
        }
    }
    conference_resp, _ = client.request(
        "POST",
        "/api/v1/conferences",
        token=chair_token,
        json_body=conference_payload,
        expected_status=(200, 201),
    )
    conference_id = _extract_conference_id(conference_resp)

    open_conference_payload = {
        "conference": {
            "title": f"{prefix.upper()} Open Conference {stamp}",
            "acronym": open_acronym,
            "description": "Seeded open conference used for author new-submission E2E checks.",
            "chair": users.chair.email,
            "domain": ["AI", "ML"],
        }
    }
    open_conference_resp, _ = client.request(
        "POST",
        "/api/v1/conferences",
        token=chair_token,
        json_body=open_conference_payload,
        expected_status=(200, 201),
    )
    open_conference_id = _extract_conference_id(open_conference_resp)

    invite_payload = {
        "reviewers": [
            {
                "user_id": reviewer_login.get("user", {}).get("id"),
                "domain": ["AI", "ML"],
            }
        ]
    }
    invite_resp, _ = client.request(
        "POST",
        f"/api/v1/conferences/{conference_id}/reviewers",
        token=chair_token,
        json_body=invite_payload,
        expected_status=(200, 201),
    )
    reviewer_record_id = _extract_reviewer_record_id(invite_resp)

    client.request(
        "PUT",
        f"/api/v1/conferences/{conference_id}/reviewers/{reviewer_record_id}/status",
        token=reviewer_token,
        json_body={"status": "accepted"},
        expected_status=(200, 201),
    )

    draft_submission = {
        "submission": {
            "title": f"{prefix.upper()} Submission {stamp}",
            "abstract": "Seed submission for frontend-v2 E2E validation, including multipart upload.",
            "domain": ["AI"],
            "status": "draft",
            "information": {
                "keywords": ["AI", "migration", "e2e"],
                "paper_type": "research",
            },
        }
    }

    create_submission_resp, _ = client.request(
        "POST",
        f"/api/v1/conferences/{conference_id}/submissions",
        token=author_token,
        data={"submission": json.dumps(draft_submission)},
        files={"file": ("seed_submission.pdf", minimal_pdf_bytes(), "application/pdf")},
        expected_status=(200, 201),
    )
    submission_id = _extract_submission_id(create_submission_resp)

    publish_submission = {
        "submission": {
            "title": draft_submission["submission"]["title"],
            "abstract": draft_submission["submission"]["abstract"],
            "domain": draft_submission["submission"]["domain"],
            "status": "submitted",
            "information": draft_submission["submission"]["information"],
        }
    }
    client.request(
        "POST",
        f"/api/v1/conferences/{conference_id}/submissions/{submission_id}/publish",
        token=author_token,
        data={"submission": json.dumps(publish_submission)},
        files={"file": ("seed_submission.pdf", minimal_pdf_bytes(), "application/pdf")},
        expected_status=(200, 201),
    )

    client.request(
        "PUT",
        f"/api/v1/conferences/{conference_id}/status",
        token=chair_token,
        json_body={"conference_id": conference_id, "new_status": "reviewing"},
        expected_status=(200, 201),
    )

    dashboard_resp, _ = client.request(
        "GET",
        f"/api/v1/reviewer/{users.reviewer.email}/dashboard",
        token=reviewer_token,
        expected_status=(200, 201),
    )
    assignment_id = _extract_assignment_id_from_dashboard(dashboard_resp, submission_id)
    if assignment_id is None:
        papers_resp, _ = client.request(
            "GET",
            f"/api/v1/reviewer/{users.reviewer.email}/conferences/{conference_id}/papers",
            token=reviewer_token,
            expected_status=(200, 201),
        )
        assignment_id = _extract_assignment_id_from_papers(papers_resp)

    thread_id: int | None = None
    if include_discussion_seed:
        thread_resp, _ = client.request(
            "POST",
            f"/api/v1/conferences/{conference_id}/submissions/{submission_id}/threads",
            token=reviewer_token,
            json_body={
                "title": "Seeded reviewer discussion thread",
                "content": "Please clarify the methodology in section 3.",
            },
            expected_status=(200, 201),
        )
        thread_id = _extract_thread_id(thread_resp)
        if thread_id is not None:
            client.request(
                "POST",
                f"/api/v1/threads/{thread_id}/messages",
                token=author_token,
                json_body={"content": "Thanks, we added clarification in the experiment section."},
                expected_status=(200, 201),
            )

    if include_draft_review_seed and assignment_id is not None:
        review_payload = {
            "assignment_id": assignment_id,
            "conference_id": conference_id,
            "review_score": None,
            "status": "draft",
            "review_data": {
                "criteria": {
                    "originality": 7,
                    "technical_quality": 8,
                    "clarity": 8,
                    "significance": 7,
                    "methodology": 8,
                },
                "recommendation": "accept",
                "confidence": "high",
                "feedback": {
                    "strengths": "Clear methodology and reproducible setup.",
                    "weaknesses": "Needs broader comparison baseline.",
                    "questions": "Can you provide ablation results?",
                },
            },
        }
        client.request(
            "PUT",
            f"/api/v1/conferences/{conference_id}/assignments/{assignment_id}/review",
            token=reviewer_token,
            json_body=review_payload,
            expected_status=(200, 201),
        )

    if chair_decision in {"accepted", "rejected"}:
        client.request(
            "PUT",
            f"/api/v1/conferences/{conference_id}/submissions/{submission_id}/status",
            token=chair_token,
            json_body={"status": chair_decision},
            expected_status=(200, 201),
        )

    profile_user = profile_login.get("user") if isinstance(profile_login, dict) else {}

    return {
        "generated_at": utc_now_iso(),
        "base_url": client.base_url,
        "seed_options": {
            "prefix": prefix,
            "include_discussion_seed": include_discussion_seed,
            "include_draft_review_seed": include_draft_review_seed,
            "chair_decision": chair_decision,
        },
        "users": {
            "chair": {
                "email": users.chair.email,
                "first_name": users.chair.first_name,
                "last_name": users.chair.last_name,
                "id": chair_login.get("user", {}).get("id"),
            },
            "reviewer": {
                "email": users.reviewer.email,
                "first_name": users.reviewer.first_name,
                "last_name": users.reviewer.last_name,
                "id": reviewer_login.get("user", {}).get("id"),
            },
            "author": {
                "email": users.author.email,
                "first_name": users.author.first_name,
                "last_name": users.author.last_name,
                "id": author_login.get("user", {}).get("id"),
            },
            "profile": {
                "email": users.profile.email,
                "first_name": users.profile.first_name,
                "last_name": users.profile.last_name,
                "id": (profile_user or {}).get("id"),
            },
        },
        "entities": {
            "conference_id": conference_id,
            "open_conference_id": open_conference_id,
            "conference_ids": [conference_id, open_conference_id],
            "submission_id": submission_id,
            "reviewer_record_id": reviewer_record_id,
            "assignment_id": assignment_id,
            "thread_id": thread_id,
        },
        "cleanup_targets": {
            "prefix": prefix,
            "conference_ids": [conference_id, open_conference_id],
        },
        "frontend_urls": {
            "author_submission_discussion": f"/role/author/submissions/{submission_id}?conferenceId={conference_id}&tab=discussion",
            "reviewer_assignment_discussion": (
                f"/role/reviewer/assignments/{assignment_id}?conferenceId={conference_id}&tab=discussion"
                if assignment_id is not None
                else None
            ),
            "chair_submission_detail": (
                f"/role/chair/conferences/{conference_id}/submissions/{submission_id}"
            ),
            "conference_detail_chair": f"/role/chair/conferences/{conference_id}",
            "conference_detail_author": f"/role/author/conferences/{conference_id}",
            "conference_detail_author_open": f"/role/author/conferences/{open_conference_id}",
            "author_new_submission_open": (
                f"/role/author/submissions/new?conferenceId={open_conference_id}"
            ),
            "test_login_author": "/test/login?role=author",
            "test_login_reviewer": "/test/login?role=reviewer",
            "test_login_chair": "/test/login?role=chair",
            "test_login_profile": "/test/login?role=profile",
        },
        "known_backend_blockers": [
            "BR-001: /api/v1/conferences/:conference_id/stats missing authoritative analytics contract",
            "BR-003: camera-ready upload contract missing",
            "BR-004: rebuttal persistence write APIs missing for author/reviewer",
        ],
    }
