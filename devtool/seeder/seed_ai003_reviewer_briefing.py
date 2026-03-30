#!/usr/bin/env python3
"""
Seed a minimal, reviewable AI-003 scenario for manual smoke testing.

Creates:
- 1 conference chaired by chair.main@conferencespace.local
- 1 accepted reviewer: qa.reviewer@conferencespace.local
- 1 published submission by nora.author@conferencespace.local
- 1 confirmed reviewer assignment backed by a real manuscript PDF

Usage:
  python devtool/seeder/seed_ai003_reviewer_briefing.py
  python devtool/seeder/seed_ai003_reviewer_briefing.py --base-url http://localhost:8080
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import requests


DEFAULT_BASE_URL = "http://localhost:8080"
DEFAULT_PASSWORD = "DemoPass123!"
DEFAULT_FRONTEND_URL = "http://localhost:3000"

CHAIR_EMAIL = "chair.main@conferencespace.local"
AUTHOR_EMAIL = "nora.author@conferencespace.local"
REVIEWER_EMAIL = "qa.reviewer@conferencespace.local"

PDF_CANDIDATES = [
    Path("backend/uploads/submissions/41/20/1773632721_2510.24793v3.pdf"),
    Path("backend/tests/api/test_paper.pdf"),
]


class C:
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    RED = "\033[0;31m"
    CYAN = "\033[0;36m"
    BOLD = "\033[1m"
    NC = "\033[0m"


def step(label: str) -> None:
    print(f"\n{C.YELLOW}{C.BOLD}{label}{C.NC}")


def ok(message: str) -> None:
    print(f"  {C.GREEN}✓{C.NC} {message}")


def warn(message: str) -> None:
    print(f"  {C.YELLOW}!{C.NC} {message}")


def fail(message: str) -> None:
    print(f"  {C.RED}✗{C.NC} {message}")


def info(message: str) -> None:
    print(f"  {C.CYAN}→{C.NC} {message}")


@dataclass
class Session:
    email: str
    token: str
    user_id: int


class API:
    def __init__(self, base_url: str, password: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.password = password
        self.http = requests.Session()
        self.http.timeout = 30

    def _auth(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def _unwrap(self, response: requests.Response) -> Any:
        payload = response.json()
        return payload.get("data", payload)

    def healthcheck(self) -> None:
        response = self.http.get(f"{self.base_url}/health", timeout=10)
        response.raise_for_status()

    def login(self, email: str) -> Session:
        response = self.http.post(
            f"{self.base_url}/api/v1/auth/login",
            json={"email": email, "password": self.password},
            timeout=15,
        )
        response.raise_for_status()
        data = self._unwrap(response)
        return Session(
            email=email,
            token=data["token"],
            user_id=data["user"]["id"],
        )

    def find_conference_by_acronym(self, chair_token: str, acronym: str) -> Optional[dict[str, Any]]:
        response = self.http.get(
            f"{self.base_url}/api/v1/conferences",
            params={"acronym": acronym, "limit": 10, "offset": 0},
            headers=self._auth(chair_token),
            timeout=15,
        )
        response.raise_for_status()
        data = self._unwrap(response)
        for item in data.get("conferences", []):
            if str(item.get("acronym", "")).lower() == acronym.lower():
                return item
        return None

    def create_conference(self, chair: Session, acronym: str) -> dict[str, Any]:
        existing = self.find_conference_by_acronym(chair.token, acronym)
        if existing is not None:
            ok(f"Reusing conference {acronym} (ID: {existing['id']})")
            return existing

        now = datetime.now(timezone.utc)
        config = {
            "start_date": (now + timedelta(days=45)).isoformat().replace("+00:00", "Z"),
            "end_date": (now + timedelta(days=48)).isoformat().replace("+00:00", "Z"),
            "abstract_submission_deadline": (now + timedelta(days=10)).isoformat().replace("+00:00", "Z"),
            "full_paper_submission_deadline": (now + timedelta(days=14)).isoformat().replace("+00:00", "Z"),
            "camera_ready_deadline": (now + timedelta(days=28)).isoformat().replace("+00:00", "Z"),
            "review_type": "double_blind",
            "submission_type": "full_paper",
            "submission_format": "pdf",
            "maximum_pages": 12,
            "have_coi": True,
        }

        payload = {
            "conference": {
                "title": "AI-003 Reviewer Pre-Read Smoke Conference",
                "acronym": acronym,
                "description": "Minimal conference for reviewer pre-read smoke testing.",
                "chair": chair.email,
                "domain": ["Artificial Intelligence", "Machine Learning", "Scientific Document Analysis"],
                "tracks": ["Main Track"],
                "venue": "Local QA Environment",
                "configurations": config,
            }
        }
        response = self.http.post(
            f"{self.base_url}/api/v1/conferences",
            headers=self._auth(chair.token),
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        conference = self._unwrap(response)
        ok(f"Created conference {acronym} (ID: {conference['id']})")
        return conference

    def list_reviewers(self, conference_id: int, chair_token: str) -> list[dict[str, Any]]:
        response = self.http.get(
            f"{self.base_url}/api/v1/conferences/{conference_id}/reviewers",
            params={"limit": 100, "offset": 0},
            headers=self._auth(chair_token),
            timeout=15,
        )
        response.raise_for_status()
        return self._unwrap(response).get("reviewers", [])

    def ensure_reviewer(self, conference_id: int, chair: Session, reviewer: Session) -> None:
        reviewers = self.list_reviewers(conference_id, chair.token)
        existing = next((item for item in reviewers if str(item.get("email", "")).lower() == reviewer.email.lower()), None)

        if existing is None:
            response = self.http.post(
                f"{self.base_url}/api/v1/conferences/{conference_id}/reviewers",
                headers=self._auth(chair.token),
                json={
                    "reviewers": [
                        {
                            "user_id": reviewer.user_id,
                            "domain": ["Artificial Intelligence", "Machine Learning", "Scientific Document Analysis"],
                        }
                    ]
                },
                timeout=20,
            )
            response.raise_for_status()
            success = self._unwrap(response).get("success", [])
            if not success:
                raise RuntimeError("reviewer invite did not create a reviewer record")
            existing = success[0]
            ok(f"Invited reviewer {reviewer.email}")
        else:
            ok(f"Reviewer {reviewer.email} already invited")

        reviewer_id = existing["id"]
        if existing.get("status") != "accepted":
            response = self.http.put(
                f"{self.base_url}/api/v1/conferences/{conference_id}/reviewers/{reviewer_id}/status",
                headers=self._auth(reviewer.token),
                json={"conference_id": conference_id, "reviewer_id": reviewer_id, "status": "accepted"},
                timeout=15,
            )
            response.raise_for_status()
            ok(f"Accepted reviewer invitation for {reviewer.email}")
        else:
            ok(f"Reviewer {reviewer.email} already accepted")

    def list_submissions(self, conference_id: int, token: str, author: Optional[str] = None) -> list[dict[str, Any]]:
        params = {"limit": 100, "offset": 0}
        if author:
            params["author"] = author
        response = self.http.get(
            f"{self.base_url}/api/v1/conferences/{conference_id}/submissions",
            params=params,
            headers=self._auth(token),
            timeout=20,
        )
        response.raise_for_status()
        return self._unwrap(response).get("submissions", [])

    def create_draft_submission(self, conference_id: int, author: Session, title: str) -> dict[str, Any]:
        existing = next(
            (item for item in self.list_submissions(conference_id, author.token, author.email) if item.get("title") == title),
            None,
        )
        if existing is not None:
            ok(f"Reusing submission '{title}' (ID: {existing['id']})")
            return existing

        submission_payload = json.dumps(
            {
                "submission": {
                    "title": title,
                    "abstract": (
                        "This submission is dedicated to smoke-testing the reviewer pre-read briefing feature "
                        "against a real manuscript file and reviewer-owned assignment."
                    ),
                    "domain": [
                        "Artificial Intelligence",
                        "Machine Learning",
                        "Scientific Document Analysis",
                    ],
                    "track": "Main Track",
                    "status": "draft",
                    "information": {
                        "track_name": "Main Track",
                        "paper_type": "research",
                        "keywords": [
                            "reviewer briefing",
                            "scientific document analysis",
                            "structured pre-read",
                        ],
                    },
                }
            }
        )
        response = self.http.post(
            f"{self.base_url}/api/v1/conferences/{conference_id}/submissions",
            headers=self._auth(author.token),
            files={"submission": (None, submission_payload)},
            timeout=30,
        )
        response.raise_for_status()
        submission = self._unwrap(response)
        ok(f"Created draft submission '{title}' (ID: {submission['id']})")
        return submission

    def publish_submission(self, conference_id: int, submission_id: int, author: Session, pdf_path: Path) -> None:
        submission = self.get_submission(conference_id, submission_id, author.token)
        if submission.get("status") == "published" and submission.get("file"):
            ok(f"Submission {submission_id} is already published with a file")
            return

        with pdf_path.open("rb") as handle:
            files = {"file": (pdf_path.name, handle, "application/pdf")}
            response = self.http.post(
                f"{self.base_url}/api/v1/conferences/{conference_id}/submissions/{submission_id}/publish",
                headers=self._auth(author.token),
                files=files,
                timeout=120,
            )
        response.raise_for_status()
        ok(f"Published submission {submission_id} with manuscript {pdf_path.name}")

    def get_submission(self, conference_id: int, submission_id: int, token: str) -> dict[str, Any]:
        response = self.http.get(
            f"{self.base_url}/api/v1/conferences/{conference_id}/submissions/{submission_id}",
            headers=self._auth(token),
            timeout=20,
        )
        response.raise_for_status()
        return self._unwrap(response)

    def transition_conference(self, conference_id: int, chair: Session, current_status: str, desired_status: str) -> str:
        if current_status == desired_status:
            ok(f"Conference {conference_id} already in status {desired_status}")
            return desired_status

        response = self.http.put(
            f"{self.base_url}/api/v1/conferences/{conference_id}/status",
            headers=self._auth(chair.token),
            json={"conference_id": conference_id, "new_status": desired_status},
            timeout=20,
        )
        response.raise_for_status()
        ok(f"Conference {conference_id} transitioned to {desired_status}")
        return desired_status

    def confirm_suggestions(self, conference_id: int, chair: Session) -> None:
        response = self.http.post(
            f"{self.base_url}/api/v1/conferences/{conference_id}/assignments/suggestions/confirm",
            headers=self._auth(chair.token),
            json={},
            timeout=30,
        )
        response.raise_for_status()
        ok(f"Confirmed assignment suggestions for conference {conference_id}")

    def get_reviewer_papers(self, conference_id: int, reviewer: Session) -> list[dict[str, Any]]:
        response = self.http.get(
            f"{self.base_url}/api/v1/reviewer/{reviewer.email}/conferences/{conference_id}/papers",
            headers=self._auth(reviewer.token),
            timeout=20,
        )
        response.raise_for_status()
        return self._unwrap(response).get("papers", [])


def resolve_pdf_path(repo_root: Path) -> Path:
    for relative in PDF_CANDIDATES:
        candidate = repo_root / relative
        if candidate.exists() and candidate.stat().st_size > 0:
            return candidate
    raise FileNotFoundError("No candidate PDF fixture found for reviewer briefing smoke seed")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed one AI-003 reviewer briefing smoke scenario")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend API base URL")
    parser.add_argument("--frontend-url", default=DEFAULT_FRONTEND_URL, help="Frontend base URL")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Password for the seeded accounts")
    parser.add_argument(
        "--acronym",
        default=f"AI003{datetime.now().strftime('%m%d%H%M%S')}",
        help="Conference acronym to create or reuse",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    pdf_path = resolve_pdf_path(repo_root)
    api = API(args.base_url, args.password)

    step("Checking backend availability")
    try:
        api.healthcheck()
    except Exception as exc:
        fail(f"Backend is not reachable: {exc}")
        return 1
    ok(f"Backend is reachable at {args.base_url}")
    info(f"Using manuscript fixture: {pdf_path.relative_to(repo_root)} ({pdf_path.stat().st_size} bytes)")

    step("Logging into seeded accounts")
    try:
        chair = api.login(CHAIR_EMAIL)
        author = api.login(AUTHOR_EMAIL)
        reviewer = api.login(REVIEWER_EMAIL)
    except Exception as exc:
        fail(f"Failed to log into seeded accounts: {exc}")
        return 1
    ok("Seed account logins succeeded")

    step("Creating isolated AI-003 smoke conference")
    try:
        conference = api.create_conference(chair, args.acronym)
        conference_id = int(conference["id"])
    except Exception as exc:
        fail(f"Failed to create or reuse conference: {exc}")
        return 1

    step("Ensuring accepted reviewer")
    try:
        api.ensure_reviewer(conference_id, chair, reviewer)
    except Exception as exc:
        fail(f"Failed to ensure reviewer membership: {exc}")
        return 1

    step("Creating draft submission and publishing manuscript")
    title = "AI-003 Reviewer Pre-Read Smoke Submission"
    try:
        submission = api.create_draft_submission(conference_id, author, title)
        submission_id = int(submission["id"])
        api.publish_submission(conference_id, submission_id, author, pdf_path)
    except Exception as exc:
        fail(f"Failed to create or publish submission: {exc}")
        return 1

    step("Transitioning conference to reviewing and confirming assignments")
    try:
        current_status = str(conference.get("status", "open"))
        api.transition_conference(conference_id, chair, current_status, "reviewing")
        api.confirm_suggestions(conference_id, chair)
    except Exception as exc:
        fail(f"Failed to reach confirmed-assignment state: {exc}")
        return 1

    step("Resolving reviewer assignment")
    try:
        papers = api.get_reviewer_papers(conference_id, reviewer)
    except Exception as exc:
        fail(f"Failed to load reviewer papers: {exc}")
        return 1

    assignment = next(
        (
            paper
            for paper in papers
            if int(paper.get("submission_id") or paper.get("id") or 0) == submission_id
        ),
        None,
    )
    if assignment is None:
        fail("No reviewer assignment was created for the seeded submission")
        return 1

    assignment_id = int(assignment["assignment_id"])
    review_url = (
        f"{args.frontend_url}/role/reviewer/assignments/{assignment_id}"
        f"?conferenceId={conference_id}"
    )

    print()
    print(f"{C.BOLD}{C.GREEN}AI-003 smoke scenario is ready.{C.NC}")
    print(f"Conference ID: {conference_id}")
    print(f"Submission ID: {submission_id}")
    print(f"Assignment ID: {assignment_id}")
    print(f"Reviewer: {REVIEWER_EMAIL}")
    print(f"Password: {args.password}")
    print(f"Review URL: {review_url}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
