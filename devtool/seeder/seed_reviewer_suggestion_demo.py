#!/usr/bin/env python3
"""
Seed a conference that exercises the chair-side "Suggested reviewers" tab.

Endpoint under demo:
    GET /api/v1/conferences/{id}/reviewer-suggestions?limit=20

The suggestion service merges two streams and ranks them by score:

  - Internal suggestions: platform users whose declared `domain` field overlaps
    the conference's `domain`. Excludes the chair, co-chairs, and any user
    already invited as a reviewer.

  - External suggestions: Semantic Scholar authors discovered by searching
    the conference topics. Only appears when a Semantic Scholar API key is
    configured on the backend.

This seeder constructs a fresh conference each run and registers users at a
range of overlap levels so the response is easy to eyeball:

  Conference domains: ["AI", "Machine Learning", "Computer Vision", "NLP"]

  perfect_match      → 4/4 overlap   → top of suggestions
  strong_match_a/b   → 3/4 overlap
  medium_match_a/b   → 2/4 overlap
  weak_match_a/b     → 1/4 overlap
  no_overlap_a/b     → 0/4 overlap   → MUST NOT appear
  chair, co_chair    → excluded by role

The committee starts EMPTY (just chair + co-chair) so the "Suggested Reviewers"
tab is the only thing populated — exactly the state a chair sees when first
setting up a new conference. The "already-invited reviewer is excluded from
suggestions" rule is covered by the integration tests, not by this seeder.

After seeding, the script GETs /reviewer-suggestions, asserts the exclusion
rules hold, and prints the ranked list with matched fields per row.

Usage:
  python3 devtool/seeder/seed_reviewer_suggestion_demo.py
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass, field
from typing import Optional

import requests

BASE_URL = "http://localhost:8080"
PASSWORD = "Demo@123"
RUN_ID = int(time.time())
ACRONYM = f"RSD{RUN_ID}"
CONFERENCE_TITLE = "Reviewer Suggestion Demo"
CONFERENCE_DOMAINS = ["AI", "Machine Learning", "Computer Vision", "NLP"]


class C:
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    RED = "\033[0;31m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    NC = "\033[0m"


def step(n: int, msg: str) -> None:
    print(f"\n{C.YELLOW}{C.BOLD}[Step {n}]{C.NC} {msg}")


def ok(msg: str) -> None:
    print(f"  {C.GREEN}✓{C.NC} {msg}")


def warn(msg: str) -> None:
    print(f"  {C.YELLOW}!{C.NC} {msg}")


def err(msg: str) -> None:
    print(f"  {C.RED}✗{C.NC} {msg}")


@dataclass
class User:
    email: str
    label: str = ""
    id: int = 0
    token: str = ""
    domain: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------


def _data(resp: requests.Response) -> dict:
    """Backend wraps responses in {data: ...} but a few endpoints return raw."""
    try:
        body = resp.json()
    except ValueError:
        return {}
    if isinstance(body, dict) and "data" in body and isinstance(body["data"], dict):
        return body["data"]
    return body if isinstance(body, dict) else {}


def register(email: str, first: str, last: str, domain: list[str]) -> Optional[User]:
    r = requests.post(
        f"{BASE_URL}/api/v1/auth/register",
        json={
            "user": {
                "email": email,
                "first_name": first,
                "last_name": last,
                "domain": domain,
            },
            "password": PASSWORD,
        },
    )
    if r.status_code == 201:
        body = _data(r)
        return User(email=email, id=int(body.get("id", 0)), domain=domain)
    if "already exists" in r.text.lower() or "duplicate" in r.text.lower():
        return login(email, domain)
    err(f"Failed to register {email}: {r.status_code} {r.text[:200]}")
    return None


def login(email: str, domain: Optional[list[str]] = None) -> Optional[User]:
    r = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={"email": email, "password": PASSWORD},
    )
    if r.status_code != 200:
        err(f"Failed to login {email}: {r.status_code} {r.text[:200]}")
        return None
    body = _data(r)
    return User(
        email=email,
        id=int(body.get("user", {}).get("id", 0)),
        token=str(body.get("token", "")),
        domain=domain or [],
    )


def register_and_login(
    email: str, first: str, last: str, domain: list[str], label: str = ""
) -> Optional[User]:
    u = register(email, first, last, domain)
    if not u:
        return None
    logged = login(email, domain)
    if logged:
        logged.label = label
    return logged


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_conference(chair: User, co_chair: User) -> Optional[int]:
    r = requests.post(
        f"{BASE_URL}/api/v1/conferences",
        headers=auth_headers(chair.token),
        json={
            "conference": {
                "title": f"{CONFERENCE_TITLE} {RUN_ID}",
                "acronym": ACRONYM,
                "description": (
                    "Demo conference for the chair-side Suggested Reviewers tab. "
                    "Domains chosen so suggestion ranking is easy to eyeball."
                ),
                "chair": chair.email,
                "co_chairs": [co_chair.email],
                "domain": CONFERENCE_DOMAINS,
                "tracks": ["Main Track"],
                "venue": "Virtual",
            }
        },
    )
    if r.status_code not in (200, 201):
        err(f"create_conference failed: {r.status_code} {r.text[:300]}")
        return None
    return int(_data(r).get("id", 0))


def fetch_suggestions(conf_id: int, chair_token: str, limit: int = 50) -> Optional[dict]:
    r = requests.get(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/reviewer-suggestions?limit={limit}",
        headers=auth_headers(chair_token),
    )
    if r.status_code != 200:
        err(
            f"fetch reviewer-suggestions failed: {r.status_code} {r.text[:200]}"
        )
        return None
    return _data(r)


# ---------------------------------------------------------------------------
# Pretty printing
# ---------------------------------------------------------------------------


SOURCE_LABEL = {
    "internal": f"{C.GREEN}internal{C.NC}",
    "external": f"{C.BLUE}external{C.NC}",
}


def _score_tag(score: int) -> str:
    if score >= 70:
        return f"{C.GREEN}{score}%{C.NC}"
    if score >= 40:
        return f"{C.YELLOW}{score}%{C.NC}"
    return f"{C.RED}{score}%{C.NC}"


def print_suggestion(rv: dict, idx: int) -> None:
    score = int(rv.get("score", 0))
    source = rv.get("source", "?")
    source_tag = SOURCE_LABEL.get(source, source)
    on_platform = rv.get("on_platform")
    on_platform_tag = (
        f"{C.GREEN}on_platform{C.NC}" if on_platform else f"{C.DIM}off_platform{C.NC}"
    )
    name = rv.get("name") or "(no name)"
    email = rv.get("email") or "(no email)"
    matched = rv.get("matched_fields") or []
    fields = rv.get("fields") or []
    pubs = rv.get("publications", 0)

    print(
        f"  {idx:>2}. {C.BOLD}{name}{C.NC}  <{email}>"
        f"  match={_score_tag(score)}  source={source_tag}  {on_platform_tag}"
    )
    print(
        f"      matched: {C.GREEN}{', '.join(matched) if matched else '(none)'}{C.NC}"
    )
    if fields and fields != matched:
        print(f"      fields:  {', '.join(fields)}")
    if pubs:
        print(f"      pubs:    {pubs}")


# ---------------------------------------------------------------------------
# Demo data — overlap with CONFERENCE_DOMAINS is what determines ranking
# ---------------------------------------------------------------------------


# (slug, first, last, domain, label, expected_to_appear)
SUGGESTION_CANDIDATES: list[tuple[str, str, str, list[str], str, bool]] = [
    (
        "rsd_perfect",
        "Pia",
        "Perfect",
        ["AI", "Machine Learning", "Computer Vision", "NLP"],
        "perfect_match (4/4)",
        True,
    ),
    (
        "rsd_strong_a",
        "Sergio",
        "Strong",
        ["AI", "Machine Learning", "Computer Vision"],
        "strong_match_a (3/4)",
        True,
    ),
    (
        "rsd_strong_b",
        "Sana",
        "Sharp",
        ["AI", "Machine Learning", "NLP"],
        "strong_match_b (3/4)",
        True,
    ),
    (
        "rsd_medium_a",
        "Mira",
        "Mid",
        ["AI", "Machine Learning"],
        "medium_match_a (2/4)",
        True,
    ),
    (
        "rsd_medium_b",
        "Mateo",
        "Mid",
        ["Computer Vision", "NLP"],
        "medium_match_b (2/4)",
        True,
    ),
    (
        "rsd_weak_a",
        "Wren",
        "Weak",
        ["AI", "Robotics"],
        "weak_match_a (1/4 + extras)",
        True,
    ),
    (
        "rsd_weak_b",
        "Wei",
        "Wong",
        ["NLP", "Sentiment Analysis"],
        "weak_match_b (1/4 + extras)",
        True,
    ),
    (
        "rsd_no_overlap_a",
        "Nora",
        "None",
        ["Quantum Computing", "Cryptography"],
        "no_overlap_a — must be EXCLUDED",
        False,
    ),
    (
        "rsd_no_overlap_b",
        "Nico",
        "Null",
        ["Embedded Systems", "Hardware"],
        "no_overlap_b — must be EXCLUDED",
        False,
    ),
]


def main() -> int:
    print(f"{C.BOLD}== Reviewer Suggestion Demo Seeder =={C.NC}")
    print(f"Base URL    : {BASE_URL}")
    print(f"Run ID      : {RUN_ID}")
    print(f"Acronym     : {ACRONYM}")
    print(f"Password    : {PASSWORD}")
    print(f"Domains     : {CONFERENCE_DOMAINS}")

    try:
        h = requests.get(f"{BASE_URL}/health", timeout=3)
        if h.status_code != 200:
            err(f"Backend health check failed: {h.status_code}")
            return 1
    except Exception as exc:
        err(f"Backend not reachable at {BASE_URL}: {exc}")
        return 1

    step(1, "Register chair and co-chair (excluded by role)")
    chair = register_and_login(
        f"rsd_chair_{RUN_ID}@demo.com", "Cara", "Chair", CONFERENCE_DOMAINS, "chair"
    )
    if not chair or not chair.token:
        err("chair login failed")
        return 1
    ok(f"chair: {chair.email}")

    co_chair = register_and_login(
        f"rsd_cochair_{RUN_ID}@demo.com",
        "Co",
        "Chair",
        CONFERENCE_DOMAINS,
        "co_chair",
    )
    if not co_chair or not co_chair.token:
        err("co-chair login failed")
        return 1
    ok(f"co-chair: {co_chair.email}")

    step(2, "Register suggestion candidates with varying domain overlap")
    candidates: list[tuple[User, str, bool]] = []  # (user, label, expected_to_appear)
    for slug, first, last, dom, label, expected in SUGGESTION_CANDIDATES:
        u = register_and_login(
            f"{slug}_{RUN_ID}@demo.com", first, last, dom, label
        )
        if not u:
            return 1
        candidates.append((u, label, expected))
        marker = (
            f"{C.GREEN}should appear{C.NC}"
            if expected
            else f"{C.RED}must be excluded{C.NC}"
        )
        ok(f"{label:<32} domain={dom}  → {marker}")

    step(3, "Create conference (chair + co-chair only — committee starts empty)")
    conf_id = create_conference(chair, co_chair)
    if not conf_id:
        return 1
    ok(f"conference id={conf_id} acronym={ACRONYM} domains={CONFERENCE_DOMAINS}")

    step(4, "Fetch reviewer suggestions and verify ranking + exclusions")
    body = fetch_suggestions(conf_id, chair.token)
    if body is None:
        return 1

    topics = body.get("conference_topics") or []
    suggestions = body.get("suggestions") or []
    total = body.get("total", len(suggestions))

    print(f"\n  conference_topics: {topics}")
    print(f"  total suggestions: {total}")
    print()

    # Print ranked list.
    if not suggestions:
        warn("no suggestions returned — that's unexpected for this seed set")
    else:
        for idx, rv in enumerate(suggestions, start=1):
            print_suggestion(rv, idx)
            print()

    # Build a lookup by lowercased email so we can verify exclusion contracts.
    by_email = {(s.get("email") or "").lower(): s for s in suggestions}

    must_be_excluded: list[tuple[str, str]] = [
        (chair.email, "chair"),
        (co_chair.email, "co_chair"),
    ]
    for u, label, expected in candidates:
        if not expected:
            must_be_excluded.append((u.email, label))

    step(5, "Assertions")
    failures = 0

    # (a) Excluded users must not appear.
    for email, why in must_be_excluded:
        if email.lower() in by_email:
            err(f"EXCLUSION VIOLATED: {why} ({email}) appears in suggestions")
            failures += 1
        else:
            ok(f"excluded as expected: {why} ({email})")

    # (b) Expected-to-appear candidates must appear, with internal source.
    # Weak-match (1/4 = 25%) candidates can legitimately fall off the top-N
    # when the shared dev DB has many other 25% users from prior seed runs.
    # Treat that case as a warning rather than an assertion failure.
    weak_candidates = {u.email.lower() for u, label, _ in candidates if "weak_match" in label}
    for u, label, expected in candidates:
        if not expected:
            continue
        s = by_email.get(u.email.lower())
        is_weak = u.email.lower() in weak_candidates
        if not s:
            if is_weak:
                warn(
                    f"{label} ({u.email}) did not make the top-{len(suggestions)}; "
                    "this is expected when the dev DB is polluted with many 25% users."
                )
            else:
                err(f"MISSING: {label} ({u.email}) should appear but did not")
                failures += 1
            continue
        if s.get("source") != "internal":
            err(
                f"WRONG SOURCE: {label} ({u.email}) source={s.get('source')!r}, "
                f"expected 'internal'"
            )
            failures += 1
            continue
        if not s.get("on_platform"):
            err(f"on_platform=false for internal suggestion {u.email}")
            failures += 1
            continue
        ok(
            f"present: {label:<32} score={s.get('score')}  "
            f"matched={s.get('matched_fields')}"
        )

    # (c) Ranking sanity: scores must be sorted descending.
    scores = [int(s.get("score", 0)) for s in suggestions]
    if scores != sorted(scores, reverse=True):
        err(f"RANKING VIOLATED: scores not in descending order: {scores}")
        failures += 1
    else:
        ok(f"ranking is descending: {scores}")

    # (d) Perfect match should beat all weaker matches when present.
    perfect = next((u for u, _, exp in candidates if exp and "perfect" in u.email), None)
    if perfect:
        s = by_email.get(perfect.email.lower())
        if s and suggestions and suggestions[0].get("email", "").lower() != perfect.email.lower():
            warn(
                f"perfect_match did not rank first; top was "
                f"{suggestions[0].get('email')} (score={suggestions[0].get('score')})"
            )

    print()
    if failures:
        err(f"{failures} assertion(s) failed")
    else:
        ok("all assertions passed")

    print(f"\n{C.GREEN}{C.BOLD}Done!{C.NC}")
    print(f"  Login as : {chair.email} / {PASSWORD}")
    print(
        f"  Open     : /role/chair/conferences/{conf_id} → "
        f"{C.BOLD}Committee → Suggested Reviewers{C.NC}"
    )
    print()
    print(f"  Try in the UI:")
    print(f"    - Use the '{C.BOLD}On platform{C.NC}' filter to confirm only platform users show.")
    print(f"    - Use '{C.BOLD}Highest match{C.NC}' / '{C.BOLD}Most publications{C.NC}' sort.")
    print(f"    - Click '{C.BOLD}Invite{C.NC}' on a row to add that user as a conference reviewer.")
    print(f"    - Click '{C.BOLD}Refresh{C.NC}' to re-query the endpoint after inviting.")
    print()
    if failures:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
