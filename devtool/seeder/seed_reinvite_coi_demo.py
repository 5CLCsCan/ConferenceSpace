#!/usr/bin/env python3
"""
Seed data to manually test re-invite + COI enforcement (UI uses addSuggestion + confirm).

Scenarios:
  1. CLEAN — reviewer declined, no COI → Re-invite should succeed
  2. RECIP  — reciprocal cross-review COI → Re-invite should fail (409 coi_conflict)

Prerequisites: backend on http://localhost:8080

Usage:
  python3 devtool/seeder/seed_reinvite_coi_demo.py
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from typing import Any, Optional

import requests

PASSWORD = "Demo@123"
ACRONYM = "REINVCOI"
CONFERENCE_TITLE = "Re-invite COI Demo"

CHAIR_EMAIL = "reinvite-chair@demo.com"
ALICE_EMAIL = "reinvite-alice@demo.com"
BOB_EMAIL = "reinvite-bob@demo.com"
CLEAN_AUTHOR_EMAIL = "reinvite-author@demo.com"
CLEAN_REVIEWER_EMAIL = "reinvite-clean@demo.com"


class C:
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    RED = "\033[0;31m"
    BOLD = "\033[1m"
    NC = "\033[0m"


def ok(msg: str) -> None:
    print(f"  {C.GREEN}✓{C.NC} {msg}")


def warn(msg: str) -> None:
    print(f"  {C.YELLOW}!{C.NC} {msg}")


def err(msg: str) -> None:
    print(f"  {C.RED}✗{C.NC} {msg}")


@dataclass
class User:
    email: str
    id: int = 0
    token: str = ""


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def data(resp: requests.Response) -> Any:
    return resp.json().get("data", resp.json())


def register_or_login(base: str, email: str, first: str, last: str, domains: list[str]) -> Optional[User]:
    r = requests.post(
        f"{base}/api/v1/auth/register",
        json={
            "user": {
                "email": email,
                "first_name": first,
                "last_name": last,
                "domain": domains,
            },
            "password": PASSWORD,
        },
        timeout=30,
    )
    if r.status_code == 201:
        return login(base, email)
    return login(base, email)


def login(base: str, email: str) -> Optional[User]:
    r = requests.post(
        f"{base}/api/v1/auth/login",
        json={"email": email, "password": PASSWORD},
        timeout=30,
    )
    if r.status_code != 200:
        err(f"Login failed for {email}: {r.status_code} {r.text[:200]}")
        return None
    payload = data(r)
    user = payload.get("user", {})
    return User(email=email, id=user.get("id", 0), token=payload.get("token", ""))


def find_conference(base: str, token: str, acronym: str) -> Optional[int]:
    r = requests.get(
        f"{base}/api/v1/conferences",
        headers=auth(token),
        params={"acronym": acronym, "limit": 1},
        timeout=30,
    )
    if r.status_code != 200:
        return None
    conferences = data(r).get("conferences", [])
    return conferences[0].get("id") if conferences else None


def minimal_pdf(title: str) -> bytes:
    safe = title.replace("(", "[").replace(")", "]")[:50]
    return (
        f"%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
        f"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
        f"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>endobj\n"
        f"4 0 obj<< /Length 44 >>stream\nBT /F1 12 Tf 72 720 Td ({safe}) Tj ET\nendstream endobj\n"
        f"trailer<< /Size 5 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n"
    ).encode("latin-1", errors="ignore")


def add_reviewer(base: str, chair: User, conf_id: int, reviewer: User) -> Optional[int]:
    requests.post(
        f"{base}/api/v1/conferences/{conf_id}/reviewers",
        headers=auth(chair.token),
        json={"reviewers": [{"user_id": reviewer.id, "domain": ["AI", "ML"]}]},
        timeout=30,
    )
    rv_list = requests.get(
        f"{base}/api/v1/conferences/{conf_id}/reviewers",
        headers=auth(chair.token),
        params={"limit": 50},
        timeout=30,
    )
    for rv in data(rv_list).get("reviewers", []):
        if rv.get("email", "").lower() == reviewer.email.lower():
            requests.put(
                f"{base}/api/v1/conferences/{conf_id}/reviewers/{rv['id']}/status",
                headers=auth(chair.token),
                json={"status": "accepted"},
                timeout=30,
            )
            return rv["id"]
    return None


def create_submission(
    base: str,
    conf_id: int,
    author: User,
    title: str,
    co_authors: list[str] | None = None,
) -> Optional[int]:
    sub_payload = {
        "submission": {
            "title": title,
            "abstract": "Re-invite COI demo paper.",
            "domain": ["AI"],
            "track": "Main Track",
            "status": "draft",
            "information": {
                "keywords": ["AI", "demo"],
                "paper_type": "research",
                "co_authors": co_authors or [],
            },
        }
    }
    sr = requests.post(
        f"{base}/api/v1/conferences/{conf_id}/submissions",
        headers=auth(author.token),
        data={"submission": json.dumps(sub_payload)},
        files={"file": ("paper.pdf", minimal_pdf(title), "application/pdf")},
        timeout=60,
    )
    if sr.status_code not in (200, 201):
        err(f"Create submission '{title}': {sr.status_code} {sr.text[:300]}")
        return None
    sub_id = data(sr).get("id")
    requests.put(
        f"{base}/api/v1/conferences/{conf_id}/submissions/{sub_id}/status",
        headers=auth(author.token),
        json={"status": "published"},
        timeout=30,
    )
    return sub_id


def add_suggestion(base: str, chair: User, conf_id: int, sub_id: int, reviewer_id: int) -> tuple[int, int]:
    r = requests.post(
        f"{base}/api/v1/conferences/{conf_id}/assignments/suggestions",
        headers=auth(chair.token),
        json={"submission_id": sub_id, "reviewer_id": reviewer_id},
        timeout=30,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"add suggestion failed: {r.status_code} {r.text[:300]}")
    assignment = data(r).get("assignment", {})
    return assignment.get("id"), r.status_code


def confirm_suggestions(base: str, chair: User, conf_id: int, assignment_ids: list[int]) -> requests.Response:
    return requests.post(
        f"{base}/api/v1/conferences/{conf_id}/assignments/suggestions/confirm",
        headers=auth(chair.token),
        json={"assignment_ids": assignment_ids},
        timeout=30,
    )


def respond(base: str, reviewer: User, assignment_id: int, action: str) -> None:
    requests.put(
        f"{base}/api/v1/reviewer/{reviewer.email}/assignments/{assignment_id}/respond",
        headers=auth(reviewer.token),
        json={"action": action},
        timeout=30,
    )


def try_reinvite(base: str, chair: User, conf_id: int, sub_id: int, reviewer_id: int) -> requests.Response:
    add_r = requests.post(
        f"{base}/api/v1/conferences/{conf_id}/assignments/suggestions",
        headers=auth(chair.token),
        json={"submission_id": sub_id, "reviewer_id": reviewer_id},
        timeout=30,
    )
    if add_r.status_code not in (200, 201):
        return add_r
    aid = data(add_r).get("assignment", {}).get("id")
    if not aid:
        return add_r
    return confirm_suggestions(base, chair, conf_id, [aid])


def find_submission_by_title(base: str, chair: User, conf_id: int, title: str) -> Optional[int]:
    r = requests.get(
        f"{base}/api/v1/conferences/{conf_id}/submissions",
        headers=auth(chair.token),
        params={"title": title, "limit": 20},
        timeout=30,
    )
    if r.status_code != 200:
        return None
    for sub in data(r).get("submissions", []):
        if sub.get("title") == title:
            return sub.get("id")
    return None


def seed_scenarios(
    base: str,
    chair: User,
    alice: User,
    bob: User,
    clean_author: User,
    clean_reviewer: User,
    conf_id: int,
) -> tuple[int | None, int | None, int | None, int | None]:
    bob_rv_id = add_reviewer(base, chair, conf_id, bob)
    alice_rv_id = add_reviewer(base, chair, conf_id, alice)
    clean_rv_id = add_reviewer(base, chair, conf_id, clean_reviewer)
    if not bob_rv_id or not alice_rv_id or not clean_rv_id:
        err("Failed to resolve reviewer record IDs")
        return None, None, None, None

    clean_sub_id = find_submission_by_title(base, chair, conf_id, "Clean Reinvite Paper")
    if not clean_sub_id:
        clean_sub_id = create_submission(base, conf_id, clean_author, "Clean Reinvite Paper")
    if not clean_sub_id:
        return None, None, None, None

    clean_aid: int | None = None
    try:
        clean_aid, _ = add_suggestion(base, chair, conf_id, clean_sub_id, clean_rv_id)
        confirm_suggestions(base, chair, conf_id, [clean_aid])
        respond(base, clean_reviewer, clean_aid, "decline")
        ok(f"Scenario A: submission {clean_sub_id}, declined assignment {clean_aid}")
    except RuntimeError as exc:
        warn(f"Scenario A setup: {exc}")

    alice_sub_id = find_submission_by_title(base, chair, conf_id, "Alice Paper (reciprocal COI)")
    bob_sub_id = find_submission_by_title(base, chair, conf_id, "Bob Paper (reciprocal COI)")
    if not alice_sub_id:
        alice_sub_id = create_submission(base, conf_id, alice, "Alice Paper (reciprocal COI)")
    if not bob_sub_id:
        bob_sub_id = create_submission(base, conf_id, bob, "Bob Paper (reciprocal COI)")
    if not alice_sub_id or not bob_sub_id:
        return clean_sub_id, bob_sub_id, clean_aid, None

    alice_on_bob_aid: int | None = None
    try:
        alice_on_bob_aid, _ = add_suggestion(base, chair, conf_id, bob_sub_id, alice_rv_id)
        confirm_suggestions(base, chair, conf_id, [alice_on_bob_aid])
        respond(base, alice, alice_on_bob_aid, "decline")

        bob_on_alice_aid, _ = add_suggestion(base, chair, conf_id, alice_sub_id, bob_rv_id)
        confirm_suggestions(base, chair, conf_id, [bob_on_alice_aid])
        respond(base, bob, bob_on_alice_aid, "accept")
        ok("Scenario B: Alice declined Bob's paper; Bob accepted Alice's paper")
    except RuntimeError as exc:
        warn(f"Scenario B setup: {exc}")

    return clean_sub_id, bob_sub_id, clean_aid, alice_on_bob_aid


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8080")
    parser.add_argument(
        "--fresh",
        action="store_true",
        help="Use a timestamped acronym when REINVCOI already exists",
    )
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    acronym = ACRONYM

    print(f"{C.BOLD}Re-invite COI demo seeder{C.NC}\n")

    try:
        requests.post(f"{base}/api/v1/auth/login", json={"email": "probe", "password": "x"}, timeout=5)
    except requests.RequestException:
        err("Backend not reachable. Run: cd backend && make dev")
        return 1

    chair = register_or_login(base, CHAIR_EMAIL, "Reinvite", "Chair", ["AI"])
    alice = register_or_login(base, ALICE_EMAIL, "Alice", "Author", ["AI"])
    bob = register_or_login(base, BOB_EMAIL, "Bob", "Author", ["AI"])
    clean_author = register_or_login(base, CLEAN_AUTHOR_EMAIL, "Clean", "Author", ["AI"])
    clean_reviewer = register_or_login(base, CLEAN_REVIEWER_EMAIL, "Clean", "Reviewer", ["AI"])
    if not all([chair, alice, bob, clean_author, clean_reviewer]):
        return 1
    ok("Users ready")

    conf_id = None
    if not args.fresh:
        conf_id = find_conference(base, chair.token, acronym)

    if conf_id:
        warn(f"Conference {acronym} already exists (id={conf_id}) — completing scenarios")
    else:
        if args.fresh:
            import time

            acronym = f"{ACRONYM}{int(time.time())}"
            warn(f"Creating fresh conference: {acronym}")
        r = requests.post(
            f"{base}/api/v1/conferences",
            headers=auth(chair.token),
            json={
                "conference": {
                    "title": CONFERENCE_TITLE,
                    "acronym": acronym,
                    "description": "Test re-invite with and without COI",
                    "chair": chair.email,
                    "domain": ["AI", "Machine Learning"],
                    "tracks": ["Main Track"],
                    "venue": "Virtual",
                }
            },
            timeout=30,
        )
        if r.status_code not in (200, 201):
            err(f"Create conference: {r.status_code} {r.text[:300]}")
            return 1
        conf_id = data(r).get("id")
        ok(f"Conference {acronym} (id={conf_id})")

    clean_sub_id, bob_sub_id, clean_aid, alice_on_bob_aid = seed_scenarios(
        base, chair, alice, bob, clean_author, clean_reviewer, conf_id,
    )
    if not clean_sub_id or not bob_sub_id:
        return 1

    bob_rv_id = add_reviewer(base, chair, conf_id, bob)
    alice_rv_id = add_reviewer(base, chair, conf_id, alice)
    clean_rv_id = add_reviewer(base, chair, conf_id, clean_reviewer)

    reinvite_clean = try_reinvite(base, chair, conf_id, clean_sub_id, clean_rv_id or 0)
    reinvite_recip = try_reinvite(base, chair, conf_id, bob_sub_id, alice_rv_id or 0)

    print(f"\n{C.BOLD}API smoke (re-invite = add suggestion + confirm):{C.NC}")
    if reinvite_clean.status_code in (200, 201):
        ok("Scenario A API: re-invite clean reviewer → success (expected)")
    else:
        warn(f"Scenario A API: {reinvite_clean.status_code} {reinvite_clean.text[:200]}")

    if reinvite_recip.status_code == 409:
        ok("Scenario B API: re-invite with reciprocal COI → blocked (expected)")
    else:
        warn(f"Scenario B API: {reinvite_recip.status_code} {reinvite_recip.text[:200]} (expected 409)")

    print_credentials(conf_id, clean_sub_id, bob_sub_id, clean_aid, alice_on_bob_aid, acronym)
    return 0


def print_credentials(
    conf_id: int | None = None,
    clean_sub_id: int | None = None,
    bob_sub_id: int | None = None,
    clean_aid: int | None = None,
    alice_aid: int | None = None,
    acronym: str = ACRONYM,
) -> None:
    print(f"\n{C.GREEN}{C.BOLD}Login & manual UI test{C.NC}")
    print(f"  Frontend: http://localhost:3000")
    print(f"  Chair:    {CHAIR_EMAIL} / {PASSWORD}")
    print(f"  Conference: {CONFERENCE_TITLE} ({acronym})")
    if conf_id:
        print(f"  Conference id: {conf_id}")
    print()
    print("  Scenario A — re-invite should SUCCEED:")
    print(f"    Paper: 'Clean Reinvite Paper' (id={clean_sub_id})")
    print(f"    Declined reviewer: {CLEAN_REVIEWER_EMAIL}")
    print("    UI: Assignments tab (Confirmed) or Submission → Reviews → Re-invite")
    print()
    print("  Scenario B — re-invite should FAIL (COI reciprocal):")
    print(f"    Paper: 'Bob Paper (reciprocal COI)' (id={bob_sub_id})")
    print(f"    Declined reviewer: {ALICE_EMAIL} (Bob already reviews Alice's paper)")
    if alice_aid:
        print(f"    Assignment id: {alice_aid}")
    print("    Expect error toast / COI conflict on Re-invite")


if __name__ == "__main__":
    sys.exit(main())
