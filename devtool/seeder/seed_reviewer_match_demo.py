#!/usr/bin/env python3
"""
Seed a reviewer-suggestion demo that exercises the full "Match Details" UI.

The match score is a domain Jaccard similarity:

    score = |submission.keywords  ∩  reviewer.domain|
            ───────────────────────────────────────
            |submission.keywords  ∪  reviewer.domain|

Each suggestion row carries a SuggestionMetadata payload with:

  - source: "auto_pass1" | "auto_pass2" | "manual"
  - matched_keywords / unmatched_paper_keywords / extra_reviewer_keywords
  - coi_checks: { self_author, declared_conflicts, relationship → status }
  - assignment_count: live count of papers already assigned to the reviewer

This seeder creates a fresh conference each run so all three `source` types
appear in the UI:

  - auto_pass1 — the matcher's primary greedy assignment with overlap
  - auto_pass2 — the fallback pass to satisfy min_reviewers_per_paper
  - manual    — added afterwards through the chair's "Add Reviewer" dialog

Output prints every metadata field for every suggestion so you can confirm
the API contract before opening the UI.

Usage:
  python3 devtool/seeder/seed_reviewer_match_demo.py
"""

from __future__ import annotations

import json
import sys
import time
from dataclasses import dataclass, field
from typing import Optional

import requests

BASE_URL = "http://localhost:8080"
PASSWORD = "Demo@123"
RUN_ID = int(time.time())
ACRONYM = f"RMD{RUN_ID}"
CONFERENCE_TITLE = "Reviewer Match Demo"


class C:
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    RED = "\033[0;31m"
    BLUE = "\033[0;34m"
    BOLD = "\033[1m"
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


def register_and_login(email: str, first: str, last: str, domain: list[str]) -> Optional[User]:
    u = register(email, first, last, domain)
    if not u:
        return None
    return login(email, domain)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_conference(chair: User) -> Optional[int]:
    r = requests.post(
        f"{BASE_URL}/api/v1/conferences",
        headers=auth_headers(chair.token),
        json={
            "conference": {
                "title": f"{CONFERENCE_TITLE} {RUN_ID}",
                "acronym": ACRONYM,
                "description": "Demo conference for reviewer-match suggestions.",
                "chair": chair.email,
                "domain": ["AI", "Machine Learning", "NLP", "Computer Vision", "Deep Learning"],
                "tracks": ["Main Track"],
                "venue": "Virtual",
            }
        },
    )
    if r.status_code not in (200, 201):
        err(f"create_conference failed: {r.status_code} {r.text[:300]}")
        return None
    return int(_data(r).get("id", 0))


def add_reviewers(conf_id: int, chair_token: str, reviewers: list[User]) -> bool:
    payload = {
        "reviewers": [
            {"user_id": r.id, "domain": r.domain} for r in reviewers if r.id
        ]
    }
    r = requests.post(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/reviewers",
        headers=auth_headers(chair_token),
        json=payload,
    )
    if r.status_code not in (200, 201):
        err(f"add_reviewers failed: {r.status_code} {r.text[:300]}")
        return False
    return True


def accept_all_reviewers(conf_id: int, chair_token: str) -> int:
    r = requests.get(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/reviewers?limit=100",
        headers=auth_headers(chair_token),
    )
    if r.status_code != 200:
        err(f"list reviewers failed: {r.status_code} {r.text[:200]}")
        return 0
    reviewers = _data(r).get("reviewers", [])
    accepted = 0
    for rv in reviewers:
        rid = rv.get("id")
        if not rid:
            continue
        ar = requests.put(
            f"{BASE_URL}/api/v1/conferences/{conf_id}/reviewers/{rid}/status",
            headers=auth_headers(chair_token),
            json={"status": "accepted"},
        )
        if ar.status_code == 200:
            accepted += 1
        else:
            warn(f"Couldn't accept reviewer {rid}: {ar.status_code} {ar.text[:120]}")
    return accepted


# Minimal valid PDF that the file storage will accept as application/pdf.
def _dummy_pdf(title: str) -> bytes:
    body = (
        b"%PDF-1.4\n"
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>endobj\n"
        b"4 0 obj<< /Length 44 >>stream\nBT /F1 12 Tf 100 700 Td ("
        + title.encode("ascii", errors="ignore")[:30]
        + b") Tj ET\nendstream endobj\n"
        b"xref\n0 5\n0000000000 65535 f\n"
        b"trailer<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF\n"
    )
    return body


def create_submission(
    conf_id: int,
    author: User,
    title: str,
    abstract: str,
    keywords: list[str],
    track: str = "Main Track",
) -> Optional[int]:
    submission = {
        "submission": {
            "title": title,
            "abstract": abstract,
            "domain": keywords,
            "track": track,
            "status": "draft",
            "information": {
                "keywords": keywords,
                "paper_type": "Full Paper",
                "track_name": track,
            },
        }
    }
    r = requests.post(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/submissions",
        headers=auth_headers(author.token),
        data={"submission": json.dumps(submission)},
        files={"file": ("paper.pdf", _dummy_pdf(title), "application/pdf")},
    )
    if r.status_code not in (200, 201):
        err(f"create_submission failed: {r.status_code} {r.text[:300]}")
        return None
    sub_id = int(_data(r).get("id", 0))

    # Publish so it becomes eligible for auto-assign.
    pr = requests.put(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/submissions/{sub_id}/status",
        headers=auth_headers(author.token),
        json={"status": "published"},
    )
    if pr.status_code != 200:
        warn(f"publish submission {sub_id} returned {pr.status_code}: {pr.text[:200]}")
    return sub_id


def trigger_auto_assign(conf_id: int, chair_token: str) -> Optional[dict]:
    # min_score_threshold > 0 forces zero-overlap reviewers to be picked up by
    # Pass 2 (the fallback) so the demo includes source="auto_pass2" rows.
    r = requests.post(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/submissions/auto-assign",
        headers=auth_headers(chair_token),
        json={
            "min_reviewers_per_paper": 2,
            "max_reviewers_per_paper": 3,
            "min_score_threshold": 0.1,
            "dry_run": False,
        },
    )
    if r.status_code != 200:
        err(f"auto-assign failed: {r.status_code} {r.text[:300]}")
        return None
    return _data(r)


def fetch_suggestions(conf_id: int, chair_token: str) -> list[dict]:
    r = requests.get(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/assignments/suggestions",
        headers=auth_headers(chair_token),
    )
    if r.status_code != 200:
        err(f"fetch suggestions failed: {r.status_code} {r.text[:200]}")
        return []
    return _data(r).get("suggestions", []) or []


def add_manual_suggestion(
    conf_id: int, chair_token: str, submission_id: int, reviewer_id: int
) -> Optional[dict]:
    """Create a manual suggestion via POST /assignments/suggestions.

    Used to demonstrate the metadata.source == "manual" code path."""
    r = requests.post(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/assignments/suggestions",
        headers=auth_headers(chair_token),
        json={"submission_id": submission_id, "reviewer_id": reviewer_id},
    )
    if r.status_code not in (200, 201):
        err(f"add manual suggestion failed: {r.status_code} {r.text[:200]}")
        return None
    return _data(r)


# ---------------------------------------------------------------------------
# Pretty-printing helpers for the new SuggestionMetadata payload.
# ---------------------------------------------------------------------------

SOURCE_LABEL = {
    "auto_pass1": f"{C.GREEN}auto_pass1{C.NC}",
    "auto_pass2": f"{C.YELLOW}auto_pass2 (fallback){C.NC}",
    "manual":     f"{C.BLUE}manual{C.NC}",
}

COI_STATUS_LABEL = {
    "passed":                    f"{C.GREEN}passed{C.NC}",
    "skipped_neo4j_unavailable": f"{C.YELLOW}skipped (neo4j unavailable){C.NC}",
    "conflict_detected":         f"{C.RED}conflict detected{C.NC}",
}


def _fmt_kw_list(label: str, items: list[str], color: str = "") -> str:
    if not items:
        return f"        {label:<14} (none)"
    pretty = ", ".join(f"{color}{kw}{C.NC}" if color else kw for kw in items)
    return f"        {label:<14} {pretty}"


def print_suggestion_detail(rv: dict) -> None:
    """Render a single SuggestedReviewer with full metadata."""
    score = float(rv.get("score", 0))
    pct = round(score * 100)
    if pct >= 70:
        score_tag = f"{C.GREEN}{pct}%{C.NC}"
    elif pct >= 40:
        score_tag = f"{C.YELLOW}{pct}%{C.NC}"
    else:
        score_tag = f"{C.RED}{pct}%{C.NC}"

    md = rv.get("metadata") or {}
    source = md.get("source", "?")
    source_tag = SOURCE_LABEL.get(source, source)
    load = rv.get("assignment_count", 0)

    print(
        f"      → {rv['reviewer_email']:<48} "
        f"match={score_tag}  source={source_tag}  load={load}"
    )

    if not md:
        print(f"        {C.RED}metadata=null{C.NC} (legacy row?)")
        return

    matched = md.get("matched_keywords") or []
    paper_only = md.get("unmatched_paper_keywords") or []
    rev_only = md.get("extra_reviewer_keywords") or []
    print(_fmt_kw_list("matched:",     matched,    C.GREEN))
    print(_fmt_kw_list("paper only:",  paper_only))
    print(_fmt_kw_list("reviewer only:", rev_only))

    coi_checks = md.get("coi_checks") or {}
    if coi_checks:
        coi_str = ", ".join(
            f"{name}={COI_STATUS_LABEL.get(status, status)}"
            for name, status in coi_checks.items()
        )
        print(f"        coi:           {coi_str}")
    else:
        print(f"        coi:           (no checks recorded)")

    if md.get("created_at"):
        print(f"        created_at:    {md['created_at']}")


# ---------------------------------------------------------------------------
# Demo data — picked so every paper has at least one matching reviewer domain
# ---------------------------------------------------------------------------

REVIEWERS_SPEC = [
    ("rmd_reviewer1", "Riley", "DLin",  ["Deep Learning", "NLP", "AI"]),
    ("rmd_reviewer2", "Mira",  "Vinay", ["Computer Vision", "Deep Learning", "Object Detection"]),
    ("rmd_reviewer3", "Owen",  "Park",  ["NLP", "Sentiment Analysis", "Transformers"]),
    ("rmd_reviewer4", "Sana",  "Iqbal", ["Reinforcement Learning", "Deep Learning", "Robotics"]),
    ("rmd_reviewer5", "Theo",  "Knox",  ["Knowledge Graphs", "AI", "Embeddings"]),
    ("rmd_reviewer6", "Lina",  "Chen",  ["Federated Learning", "Privacy", "ML"]),
    ("rmd_reviewer7", "Devon", "Brooks",["GANs", "Image Synthesis", "Deep Learning"]),
    ("rmd_reviewer8", "Ivy",   "Roman", ["Computer Vision", "Segmentation", "Medical Imaging"]),
]

PAPERS_SPEC = [
    {
        "title": "Attention-Augmented Transformers for Sentiment Analysis",
        "abstract": "We extend transformer architectures with custom attention heads to improve sentiment classification.",
        "keywords": ["NLP", "Sentiment Analysis", "Transformers"],
        # → matches reviewer3 perfectly (3/3=1.0), reviewer1 partially via NLP.
    },
    {
        "title": "Object Detection with Deep CNNs in Real-Time Video",
        "abstract": "A pipeline for real-time object detection using deep convolutional networks.",
        "keywords": ["Object Detection", "Deep Learning", "Computer Vision"],
        # → reviewer2 perfect (3/3=1.0), reviewer8 partial.
    },
    {
        "title": "Reinforcement Learning Agents for Robotic Manipulation",
        "abstract": "Training reinforcement learning agents for dexterous robotic tasks.",
        "keywords": ["Reinforcement Learning", "Robotics", "Deep Learning"],
        # → reviewer4 perfect, reviewer1 partial via Deep Learning.
    },
    {
        "title": "Generative Adversarial Networks for Photorealistic Image Synthesis",
        "abstract": "High-resolution image synthesis using novel GAN architectures.",
        "keywords": ["GANs", "Image Synthesis", "Deep Learning"],
        # → reviewer7 perfect (3/3=1.0), reviewer1/reviewer2 partial.
    },
    {
        "title": "Knowledge Graph Embeddings for Question Answering",
        "abstract": "We learn dense embeddings of large-scale knowledge graphs for QA tasks.",
        "keywords": ["Knowledge Graphs", "Embeddings", "AI"],
        # → reviewer5 perfect.
    },
    {
        "title": "Federated Learning with Differential Privacy",
        "abstract": "Privacy-preserving federated learning under strong adversaries.",
        "keywords": ["Federated Learning", "Privacy", "ML"],
        # → reviewer6 perfect.
    },
    {
        "title": "Post-Quantum Lattice Cryptography for Secure Voting",
        "abstract": "A lattice-based cryptographic scheme resilient to quantum adversaries.",
        "keywords": ["Quantum Computing", "Cryptography", "Lattice"],
        # → No reviewer has any of these domains, so Pass 1 finds 0 candidates
        # above the score threshold. The greedy matcher's fallback (Pass 2)
        # then fills this paper with the highest-scored available reviewer,
        # producing a row with metadata.source == "auto_pass2".
    },
]


def main() -> int:
    print(f"{C.BOLD}== Reviewer Match Demo Seeder =={C.NC}")
    print(f"Base URL    : {BASE_URL}")
    print(f"Run ID      : {RUN_ID}")
    print(f"Acronym     : {ACRONYM}")
    print(f"Password    : {PASSWORD}")

    # Sanity: ensure backend is reachable.
    try:
        h = requests.get(f"{BASE_URL}/health", timeout=3)
        if h.status_code != 200:
            err(f"Backend health check failed: {h.status_code}")
            return 1
    except Exception as exc:
        err(f"Backend not reachable at {BASE_URL}: {exc}")
        return 1

    step(1, "Create chair, authors and reviewers")
    chair_email = f"rmd_chair_{RUN_ID}@demo.com"
    chair = register_and_login(chair_email, "Match", "Chair", ["AI", "ML", "NLP"])
    if not chair or not chair.token:
        err("chair login failed")
        return 1
    ok(f"chair: {chair_email} (id={chair.id})")

    authors: list[User] = []
    for i in range(len(PAPERS_SPEC)):
        a = register_and_login(
            f"rmd_author{i+1}_{RUN_ID}@demo.com",
            f"Author{i+1}",
            "Demo",
            ["AI"],
        )
        if not a:
            return 1
        authors.append(a)
    ok(f"{len(authors)} authors created")

    reviewers: list[User] = []
    for slug, first, last, dom in REVIEWERS_SPEC:
        r = register_and_login(
            f"{slug}_{RUN_ID}@demo.com", first, last, dom
        )
        if not r:
            return 1
        r.domain = dom
        reviewers.append(r)
    ok(f"{len(reviewers)} reviewers created with diverse domains")

    step(2, "Create conference")
    conf_id = create_conference(chair)
    if not conf_id:
        return 1
    ok(f"conference id={conf_id} acronym={ACRONYM}")

    step(3, "Invite reviewers and auto-accept invitations")
    if not add_reviewers(conf_id, chair.token, reviewers):
        return 1
    accepted = accept_all_reviewers(conf_id, chair.token)
    ok(f"accepted {accepted} reviewer invitations")

    step(4, "Create and publish submissions")
    sub_ids: list[int] = []
    for author, paper in zip(authors, PAPERS_SPEC):
        sid = create_submission(
            conf_id,
            author,
            paper["title"],
            paper["abstract"],
            paper["keywords"],
        )
        if sid:
            sub_ids.append(sid)
            ok(f"#{sid}  {paper['title'][:55]}  keywords={paper['keywords']}")
    if not sub_ids:
        err("no submissions created; aborting")
        return 1

    step(5, "Trigger auto-assign (computes Jaccard scores)")
    result = trigger_auto_assign(conf_id, chair.token)
    if not result:
        return 1
    ok(
        f"submissions={result.get('total_submissions')} "
        f"reviewers={result.get('total_reviewers')} "
        f"assignments={result.get('total_assignments')} "
        f"avg_score={result.get('average_score'):.3f}"
    )

    step(6, "Add a manual suggestion (demonstrates source=manual)")
    # The /assignments/suggestions endpoint expects the conference_reviewers
    # row id (NOT the user_id), so resolve it from the reviewers list.
    rv_list = requests.get(
        f"{BASE_URL}/api/v1/conferences/{conf_id}/reviewers?limit=100",
        headers=auth_headers(chair.token),
    )
    cr_by_email: dict[str, int] = {}
    if rv_list.status_code == 200:
        for rv in _data(rv_list).get("reviewers", []):
            cr_by_email[rv.get("email", "")] = rv.get("id", 0)

    # Pick a (paper, reviewer) pair that the auto-assign step did NOT create,
    # otherwise the unique (submission_id, reviewer_id) constraint rejects it.
    pre_groups = fetch_suggestions(conf_id, chair.token)
    existing_pairs: set[tuple[int, int]] = set()
    for g in pre_groups:
        for rv in g.get("reviewers", []):
            existing_pairs.add((g["submission_id"], rv["reviewer_id"]))

    manual_target_sub = sub_ids[0]  # Sentiment Analysis paper
    manual_target_reviewer = None
    manual_target_cr_id = 0
    for r in reviewers:
        cr_id = cr_by_email.get(r.email, 0)
        if cr_id and (manual_target_sub, cr_id) not in existing_pairs:
            manual_target_reviewer = r
            manual_target_cr_id = cr_id
            break

    if manual_target_reviewer is None:
        warn("could not find a reviewer free for manual suggestion; skipping")
    else:
        manual_resp = add_manual_suggestion(
            conf_id, chair.token, manual_target_sub, manual_target_cr_id
        )
        if manual_resp:
            ok(
                f"manual suggestion added: paper #{manual_target_sub} "
                f"← {manual_target_reviewer.email} (cr_id={manual_target_cr_id})"
            )
        else:
            warn("manual suggestion endpoint returned an error")

    step(7, "Fetch suggestions and show full match details")
    groups = fetch_suggestions(conf_id, chair.token)
    if not groups:
        err("no suggestions returned")
        return 1

    by_source: dict[str, int] = {}
    nonzero = 0
    total = 0
    print()
    for g in groups:
        print(f"  {C.BOLD}#{g['submission_id']}{C.NC} {g['submission_title']}")
        for rv in g.get("reviewers", []):
            total += 1
            if float(rv.get("score", 0)) > 0:
                nonzero += 1
            md = rv.get("metadata") or {}
            src = md.get("source", "(none)")
            by_source[src] = by_source.get(src, 0) + 1
            print_suggestion_detail(rv)
            print()  # blank line between reviewers for readability

    ok(f"{nonzero}/{total} suggestions have score > 0")
    ok(
        "source breakdown: "
        + ", ".join(f"{k}={v}" for k, v in sorted(by_source.items()))
    )

    print(f"\n{C.GREEN}{C.BOLD}Done!{C.NC}")
    print(f"  Login as : {chair_email} / {PASSWORD}")
    print(f"  Open     : /role/chair/conferences/{conf_id} → Assignments tab")
    print(
        f"  In the UI, click the {C.BOLD}'Match Details'{C.NC} chevron on any "
        f"suggestion to see matched/unmatched keywords, COI checks, "
        f"reviewer load, and source."
    )
    print(f"\n  Reviewer logins (for manual demo of the invitation flow):")
    for rv in reviewers[:4]:
        print(f"    {rv.email} / {PASSWORD}")

    return 0 if nonzero >= total - 1 else 2


if __name__ == "__main__":
    sys.exit(main())
