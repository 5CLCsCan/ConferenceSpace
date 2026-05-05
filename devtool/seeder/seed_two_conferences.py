#!/usr/bin/env python3
"""
Two-Conference Demo Seeder
==========================
Each run creates a completely fresh set of accounts + conferences using a
unique timestamp suffix, so there are never collisions with previous runs.

Conference 1 — Reviewer Suggestion Demo
    Empty committee. Platform users with varying domain overlap are
    pre-registered so the Suggested Reviewers tab shows a ranked list.
    → Demo: chair opens Committee → Suggested Reviewers → Invite.

Conference 2 — Auto Assignment Demo
    8 accepted reviewers + 7 published submissions, ready for auto-assign.
    → Demo: chair opens Assignments → Auto-Assign.

Usage:
    python3 devtool/seeder/seed_two_conferences.py
    python3 devtool/seeder/seed_two_conferences.py --base-url http://localhost:8080

All accounts use password: Demo@123
Credentials are printed at the end of the run.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from typing import Any, Optional

import requests

DEFAULT_BASE_URL = "http://localhost:8080"
PASSWORD = "Demo@123"
RUN_ID = str(int(time.time()))

CONF1_DOMAINS = ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Natural Language Processing", "Deep Learning"]
CONF2_DOMAINS = ["AI", "Machine Learning", "NLP", "Computer Vision", "Deep Learning"]


class C:
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    RED = "\033[0;31m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    NC = "\033[0m"


def _email(slug: str) -> str:
    return f"{slug}_{RUN_ID}@demo.com"


def banner(msg: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"{C.BOLD}{C.CYAN}  {msg}{C.NC}")
    print(f"{'=' * 60}")


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
    first_name: str = ""
    last_name: str = ""
    id: int = 0
    token: str = ""
    domain: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

class API:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")
        self.http = requests.Session()

    def _auth(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def _data(self, resp: requests.Response) -> dict:
        try:
            body = resp.json()
        except ValueError:
            return {}
        if isinstance(body, dict) and "data" in body and isinstance(body["data"], dict):
            return body["data"]
        return body if isinstance(body, dict) else {}

    def health(self) -> bool:
        try:
            r = self.http.get(f"{self.base}/health", timeout=5)
            return r.status_code == 200
        except Exception:
            return False

    def register_and_login(self, email: str, first: str, last: str, domain: list[str]) -> Optional[User]:
        r = self.http.post(
            f"{self.base}/api/v1/auth/register",
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
        if r.status_code != 201:
            err(f"register {email}: {r.status_code} {r.text[:200]}")
            return None

        lr = self.http.post(
            f"{self.base}/api/v1/auth/login",
            json={"email": email, "password": PASSWORD},
        )
        if lr.status_code != 200:
            err(f"login {email}: {lr.status_code} {lr.text[:200]}")
            return None
        body = self._data(lr)
        return User(
            email=email,
            first_name=first,
            last_name=last,
            id=int(body.get("user", {}).get("id", 0)),
            token=str(body.get("token", "")),
            domain=domain,
        )

    def create_conference(
        self, chair: User, acronym: str, title: str, description: str,
        domains: list[str],
    ) -> Optional[int]:
        r = self.http.post(
            f"{self.base}/api/v1/conferences",
            headers=self._auth(chair.token),
            json={
                "conference": {
                    "title": title,
                    "acronym": acronym,
                    "description": description,
                    "chair": chair.email,
                    "domain": domains,
                    "tracks": ["Main Track"],
                    "venue": "Virtual",
                }
            },
        )
        if r.status_code not in (200, 201):
            err(f"create conference: {r.status_code} {r.text[:300]}")
            return None
        cid = int(self._data(r).get("id", 0))
        ok(f"Created conference {acronym} (ID: {cid})")
        return cid

    def add_reviewer(self, conf_id: int, chair: User, reviewer: User) -> bool:
        r = self.http.post(
            f"{self.base}/api/v1/conferences/{conf_id}/reviewers",
            headers=self._auth(chair.token),
            json={"reviewers": [{"user_id": reviewer.id, "domain": reviewer.domain}]},
        )
        if r.status_code not in (200, 201):
            err(f"invite reviewer {reviewer.email}: {r.status_code} {r.text[:200]}")
            return False
        return True

    def accept_all_reviewers(self, conf_id: int, chair_token: str) -> int:
        r = self.http.get(
            f"{self.base}/api/v1/conferences/{conf_id}/reviewers?limit=100",
            headers=self._auth(chair_token),
        )
        if r.status_code != 200:
            return 0
        accepted = 0
        for rv in self._data(r).get("reviewers", []):
            rid = rv.get("id")
            if not rid or rv.get("status") == "accepted":
                continue
            ar = self.http.put(
                f"{self.base}/api/v1/conferences/{conf_id}/reviewers/{rid}/status",
                headers=self._auth(chair_token),
                json={"status": "accepted"},
            )
            if ar.status_code == 200:
                accepted += 1
        return accepted

    def create_submission(
        self, conf_id: int, author: User, title: str, abstract: str, keywords: list[str],
    ) -> Optional[int]:
        submission_payload = {
            "submission": {
                "title": title,
                "abstract": abstract,
                "domain": keywords,
                "track": "Main Track",
                "status": "draft",
                "information": {
                    "keywords": keywords,
                    "paper_type": "Full Paper",
                    "track_name": "Main Track",
                },
            }
        }
        r = self.http.post(
            f"{self.base}/api/v1/conferences/{conf_id}/submissions",
            headers=self._auth(author.token),
            data={"submission": json.dumps(submission_payload)},
            files={"file": ("paper.pdf", _dummy_pdf(title), "application/pdf")},
        )
        if r.status_code not in (200, 201):
            err(f"create submission: {r.status_code} {r.text[:300]}")
            return None
        sub_id = int(self._data(r).get("id", 0))

        pr = self.http.put(
            f"{self.base}/api/v1/conferences/{conf_id}/submissions/{sub_id}/status",
            headers=self._auth(author.token),
            json={"status": "published"},
        )
        if pr.status_code != 200:
            warn(f"publish submission {sub_id}: {pr.status_code}")
        return sub_id


def _dummy_pdf(title: str) -> bytes:
    return (
        b"%PDF-1.4\n"
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n"
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n"
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R >>endobj\n"
        b"4 0 obj<< /Length 44 >>stream\nBT /F1 12 Tf 100 700 Td ("
        + title.encode("ascii", errors="ignore")[:30]
        + b") Tj ET\nendstream endobj\n"
        b"xref\n0 5\n0000000000 65535 f\n"
        b"trailer<< /Size 5 /Root 1 0 R >>\nstartxref\n300\n%%EOF\n"
    )


# ═══════════════════════════════════════════════════════════════════════════
# Conference 1 — Reviewer Suggestion Demo
# ═══════════════════════════════════════════════════════════════════════════

CONF1_PLATFORM_USERS = [
    # (slug, first, last, domains)
    ("elena",   "Elena",   "Nguyen",   ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Natural Language Processing", "Deep Learning"]),
    ("raj",     "Raj",     "Patel",    ["Machine Learning", "Computer Vision", "Deep Learning"]),
    ("sofia",   "Sofia",   "Martinez", ["Natural Language Processing", "Machine Learning", "Artificial Intelligence"]),
    ("james",   "James",   "Kim",      ["Computer Vision", "Deep Learning"]),
    ("aisha",   "Aisha",   "Rahman",   ["Machine Learning", "Artificial Intelligence"]),
    ("luca",    "Luca",    "Romano",   ["Deep Learning", "Natural Language Processing"]),
    ("mei",     "Mei",     "Zhang",    ["Artificial Intelligence"]),
    ("omar",    "Omar",    "Hassan",   ["Computer Vision"]),
    ("yuki",    "Yuki",    "Tanaka",   ["Natural Language Processing", "Computational Linguistics", "Transformers"]),
    ("anna",    "Anna",    "Kowalski", ["Reinforcement Learning", "Robotics", "Machine Learning"]),
    # Zero overlap — should NOT appear in suggestions
    ("bob",     "Bob",     "Crypto",   ["Cryptography", "Quantum Computing"]),
    ("carol",   "Carol",   "Baines",   ["Bioinformatics", "Genomics"]),
]


def seed_conference_1(api: API, chair: User) -> Optional[int]:
    acronym = f"SUG{RUN_ID}"
    banner("Conference 1 — Reviewer Suggestion Demo")
    print(f"  Acronym: {acronym}")
    print(f"  Purpose: Test the 'Suggested Reviewers' invite flow")
    print(f"  Domains: {CONF1_DOMAINS}")

    step(1, "Register platform users with varying domain overlap")
    for slug, first, last, domains in CONF1_PLATFORM_USERS:
        u = api.register_and_login(_email(slug), first, last, domains)
        if not u:
            return None
        overlap = set(domains) & set(CONF1_DOMAINS)
        tag = f"{C.GREEN}{len(overlap)}/{len(CONF1_DOMAINS)}{C.NC}" if overlap else f"{C.RED}0/{len(CONF1_DOMAINS)}{C.NC}"
        ok(f"{first:<8} {last:<12} overlap={tag}  domains={domains}")

    step(2, "Create conference (empty committee — no reviewers invited)")
    conf_id = api.create_conference(
        chair, acronym,
        "International Conference on AI & NLP 2026",
        "A top-tier conference covering AI, ML, CV, NLP, and Deep Learning. "
        "Use the Suggested Reviewers tab to discover and invite expert reviewers.",
        CONF1_DOMAINS,
    )
    if not conf_id:
        return None

    ok(f"Conference {acronym} ready (ID: {conf_id})")
    return conf_id


# ═══════════════════════════════════════════════════════════════════════════
# Conference 2 — Auto Assignment Demo
# ═══════════════════════════════════════════════════════════════════════════

CONF2_REVIEWERS = [
    # (slug, first, last, domains)
    ("rev_deep",   "Riley",  "Lim",     ["Deep Learning", "NLP", "AI"]),
    ("rev_vision", "Mira",   "Vinay",   ["Computer Vision", "Deep Learning", "Object Detection"]),
    ("rev_nlp",    "Owen",   "Park",    ["NLP", "Sentiment Analysis", "Transformers"]),
    ("rev_rl",     "Sana",   "Iqbal",   ["Reinforcement Learning", "Deep Learning", "Robotics"]),
    ("rev_kg",     "Theo",   "Knox",    ["Knowledge Graphs", "AI", "Embeddings"]),
    ("rev_fed",    "Lina",   "Chen",    ["Federated Learning", "Privacy", "ML"]),
    ("rev_gan",    "Devon",  "Brooks",  ["GANs", "Image Synthesis", "Deep Learning"]),
    ("rev_med",    "Ivy",    "Roman",   ["Computer Vision", "Segmentation", "Medical Imaging"]),
]

CONF2_AUTHORS = [
    ("author_nlp",   "Nora",   "Lang",    ["NLP"]),
    ("author_cv",    "David",  "Rowe",    ["Computer Vision"]),
    ("author_rl",    "Priya",  "Sharma",  ["Reinforcement Learning"]),
    ("author_gen",   "Alex",   "Foster",  ["Generative Models"]),
    ("author_kg",    "Chen",   "Wei",     ["Knowledge Graphs"]),
    ("author_fl",    "Maria",  "Lopez",   ["Federated Learning"]),
    ("author_misc",  "Sam",    "Taylor",  ["AI"]),
]

CONF2_PAPERS = [
    {
        "author_idx": 0,
        "title": "Attention-Augmented Transformers for Sentiment Analysis",
        "abstract": "We extend transformer architectures with custom attention heads tailored for fine-grained sentiment classification across multiple domains.",
        "keywords": ["NLP", "Sentiment Analysis", "Transformers"],
    },
    {
        "author_idx": 1,
        "title": "Real-Time Object Detection with Deep Convolutional Networks",
        "abstract": "A scalable pipeline for real-time object detection in video streams using deep convolutional neural networks with multi-scale feature fusion.",
        "keywords": ["Object Detection", "Deep Learning", "Computer Vision"],
    },
    {
        "author_idx": 2,
        "title": "Reinforcement Learning for Dexterous Robotic Manipulation",
        "abstract": "Training reinforcement learning agents that learn contact-rich manipulation skills for robotic assembly tasks in simulation and real hardware.",
        "keywords": ["Reinforcement Learning", "Robotics", "Deep Learning"],
    },
    {
        "author_idx": 3,
        "title": "High-Resolution Image Synthesis with Generative Adversarial Networks",
        "abstract": "A novel GAN architecture producing photorealistic 1024x1024 images with improved training stability and diversity.",
        "keywords": ["GANs", "Image Synthesis", "Deep Learning"],
    },
    {
        "author_idx": 4,
        "title": "Knowledge Graph Embeddings for Open-Domain Question Answering",
        "abstract": "Learning dense embeddings of large-scale knowledge graphs to power accurate open-domain question answering without retrieval.",
        "keywords": ["Knowledge Graphs", "Embeddings", "AI"],
    },
    {
        "author_idx": 5,
        "title": "Federated Learning with Differential Privacy Guarantees",
        "abstract": "A practical federated learning framework that provides formal differential privacy guarantees under realistic adversary models.",
        "keywords": ["Federated Learning", "Privacy", "ML"],
    },
    {
        "author_idx": 6,
        "title": "Post-Quantum Lattice Cryptography for Secure Voting Protocols",
        "abstract": "A lattice-based cryptographic scheme designed for electronic voting that resists attacks by quantum adversaries.",
        "keywords": ["Quantum Computing", "Cryptography", "Lattice"],
    },
]


def seed_conference_2(api: API, chair: User) -> Optional[int]:
    acronym = f"ASG{RUN_ID}"
    banner("Conference 2 — Auto Assignment Demo")
    print(f"  Acronym: {acronym}")
    print(f"  Purpose: Test the auto-assignment flow")
    print(f"  Domains: {CONF2_DOMAINS}")

    step(1, "Create conference")
    conf_id = api.create_conference(
        chair, acronym,
        "Global Symposium on Intelligent Systems 2026",
        "An interdisciplinary symposium covering AI, ML, NLP, CV and more. "
        "Reviewers are pre-assigned and accepted — ready for auto-assignment.",
        CONF2_DOMAINS,
    )
    if not conf_id:
        return None

    step(2, "Register and invite 8 reviewers")
    reviewers: list[User] = []
    for slug, first, last, domains in CONF2_REVIEWERS:
        rv = api.register_and_login(_email(slug), first, last, domains)
        if not rv:
            return None
        reviewers.append(rv)
        api.add_reviewer(conf_id, chair, rv)

    accepted = api.accept_all_reviewers(conf_id, chair.token)
    ok(f"{len(reviewers)} reviewers invited, {accepted} accepted")

    step(3, "Register authors and create 7 published submissions")
    authors: list[User] = []
    for slug, first, last, domains in CONF2_AUTHORS:
        a = api.register_and_login(_email(slug), first, last, domains)
        if not a:
            return None
        authors.append(a)

    sub_ids: list[int] = []
    for paper in CONF2_PAPERS:
        author = authors[paper["author_idx"]]
        sid = api.create_submission(
            conf_id, author,
            paper["title"], paper["abstract"], paper["keywords"],
        )
        if sid:
            sub_ids.append(sid)
            ok(f"#{sid} {paper['title'][:55]}")

    if not sub_ids:
        err("No submissions created"); return None
    ok(f"{len(sub_ids)} submissions ready for assignment")

    return conf_id


# ═══════════════════════════════════════════════════════════════════════════
# Credential summary
# ═══════════════════════════════════════════════════════════════════════════

def print_credentials(
    chair_email: str, conf1_id: Optional[int], conf2_id: Optional[int],
) -> None:
    banner("Account Credentials")

    if conf1_id:
        print(f"\n  {C.BOLD}{C.CYAN}Conference 1 — Reviewer Suggestion Demo{C.NC}")
        print(f"  Acronym: SUG{RUN_ID}   ID: {conf1_id}")
        print(f"  UI: /role/chair/conferences/{conf1_id}")
        print(f"  Demo: Committee tab → Suggested Reviewers → Invite")

    if conf2_id:
        print(f"\n  {C.BOLD}{C.CYAN}Conference 2 — Auto Assignment Demo{C.NC}")
        print(f"  Acronym: ASG{RUN_ID}   ID: {conf2_id}")
        print(f"  UI: /role/chair/conferences/{conf2_id}")
        print(f"  Demo: Assignments tab → Auto-Assign")

    all_accounts: list[tuple[str, str, str]] = []
    all_accounts.append((chair_email, PASSWORD, "Chair (both)"))

    for slug, first, last, _ in CONF1_PLATFORM_USERS:
        all_accounts.append((_email(slug), PASSWORD, f"Suggestion: {first} {last}"))

    for slug, first, last, _ in CONF2_REVIEWERS:
        all_accounts.append((_email(slug), PASSWORD, f"Reviewer: {first} {last}"))

    for slug, first, last, _ in CONF2_AUTHORS:
        all_accounts.append((_email(slug), PASSWORD, f"Author: {first} {last}"))

    print(f"\n  {C.BOLD}{'Email':<45} {'Password':<12} Role{C.NC}")
    print(f"  {'─' * 80}")
    for email, pwd, role in all_accounts:
        print(f"  {email:<45} {pwd:<12} {role}")

    print()


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

def main() -> int:
    parser = argparse.ArgumentParser(description="Seed two demo conferences (fresh each run)")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Backend API base URL")
    args = parser.parse_args()

    api = API(args.base_url)

    print(f"{C.BOLD}Two-Conference Demo Seeder{C.NC}")
    print(f"  Backend  : {args.base_url}")
    print(f"  Run ID   : {RUN_ID}")
    print(f"  Password : {PASSWORD}")

    if not api.health():
        err(f"Backend not reachable at {args.base_url}")
        return 1
    ok("Backend is healthy")

    chair_email = _email("chair")
    step(0, "Create shared chair account")
    chair = api.register_and_login(chair_email, "Demo", "Chair", CONF1_DOMAINS)
    if not chair or not chair.token:
        err("Chair creation failed")
        return 1
    ok(f"Chair ready: {chair.email} (ID: {chair.id})")

    conf1_id = seed_conference_1(api, chair)
    conf2_id = seed_conference_2(api, chair)

    if not conf1_id and not conf2_id:
        err("Both conferences failed to seed")
        return 1

    print_credentials(chair_email, conf1_id, conf2_id)

    print(f"{C.GREEN}{C.BOLD}Done!{C.NC} Each run creates fresh data — no collisions.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
