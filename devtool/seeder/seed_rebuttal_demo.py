#!/usr/bin/env python3
"""
Rebuttal Demo Seeder
====================
Creates a conference in the 'awaiting' rebuttal phase with 3 submissions
demonstrating different rebuttal states:

  Submission 1 — "Fully Acknowledged"
    - Author submitted rebuttal + per-point responses
    - All assigned reviewers acknowledged all points
    → Shows: complete flow, green acks

  Submission 2 — "Partially Acknowledged"
    - Author submitted rebuttal + per-point responses
    - Only one reviewer acknowledged (others pending)
    → Shows: in-progress ack state

  Submission 3 — "Awaiting Author Response"
    - Reviews submitted, rebuttal period open
    - Author has NOT submitted rebuttal yet
    → Shows: the awaiting state from author perspective

Users created:
  Chair:       demo_rebuttal_chair@test.com
  Authors:     demo_rebuttal_author_1-3@test.com
    Reviewers:   demo_rebuttal_reviewer_1-4@test.com  (password: Demo@123)

Usage:
  python3 seed_rebuttal_demo.py
  python3 seed_rebuttal_demo.py --base-url http://localhost:8080
"""

import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import requests


# ─── Config ──────────────────────────────────────────────────────────────────

DEFAULT_BASE_URL = "http://localhost:8080"
PASSWORD = "Demo@123"
# Default acronym includes a timestamp so each run creates a fresh conference.
# Pass --acronym RD2026 to reuse a specific conference (idempotent).
DEFAULT_ACRONYM_PREFIX = "RD"


# ─── Terminal Colors ──────────────────────────────────────────────────────────

class C:
    RED    = "\033[0;31m"
    GREEN  = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE   = "\033[0;34m"
    CYAN   = "\033[0;36m"
    BOLD   = "\033[1m"
    NC     = "\033[0m"


def step(n: int, msg: str):
    print(f"\n{C.YELLOW}{C.BOLD}Step {n}: {msg}{C.NC}")

def ok(msg: str):
    print(f"  {C.GREEN}✓{C.NC} {msg}")

def warn(msg: str):
    print(f"  {C.YELLOW}!{C.NC} {msg}")

def err(msg: str):
    print(f"  {C.RED}✗{C.NC} {msg}")

def info(msg: str):
    print(f"  {C.CYAN}→{C.NC} {msg}")


# ─── Data Classes ─────────────────────────────────────────────────────────────

@dataclass
class User:
    email: str
    id: int = 0
    token: str = ""

@dataclass
class AssignmentInfo:
    """Confirmed assignment linking a submission to a reviewer."""
    assignment_id: int
    submission_id: int
    reviewer_email: str


# ─── API Client ───────────────────────────────────────────────────────────────

class API:
    """All communication with the ConferenceSpace backend happens here."""

    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")

    def _h(self, token: str) -> dict:
        return {"Authorization": f"Bearer {token}"}

    # ── Auth ──────────────────────────────────────────────────────────────────

    def register(self, email: str, first: str, last: str, domains: list[str]) -> Optional[User]:
        r = requests.post(f"{self.base}/api/v1/auth/register", json={
            "user": {
                "email": email,
                "first_name": first,
                "last_name": last,
                "domain": domains,
            },
            "password": PASSWORD,
        })
        if r.status_code == 201:
            uid = r.json().get("data", {}).get("id", 0)
            ok(f"Registered {email} (ID: {uid})")
            return User(email=email, id=uid)
        if "already" in r.text.lower() or "duplicate" in r.text.lower():
            warn(f"{email} already exists — logging in")
            return self.login(email)
        err(f"Register {email}: {r.status_code} {r.text[:120]}")
        return None

    def login(self, email: str) -> Optional[User]:
        r = requests.post(f"{self.base}/api/v1/auth/login",
                          json={"email": email, "password": PASSWORD})
        if r.status_code == 200:
            d = r.json().get("data", r.json())
            u = User(
                email=email,
                id=d.get("user", {}).get("id", 0),
                token=d.get("token", ""),
            )
            ok(f"Logged in {email}")
            return u
        err(f"Login {email}: {r.status_code} {r.text[:120]}")
        return None

    # ── Conference ────────────────────────────────────────────────────────────

    def find_conference_by_acronym(self, token: str, acronym: str) -> Optional[int]:
        r = requests.get(
            f"{self.base}/api/v1/conferences?acronym={acronym}&limit=1",
            headers=self._h(token),
        )
        if r.status_code == 200:
            confs = r.json().get("data", {}).get("conferences", [])
            if confs:
                return confs[0]["id"]
        return None

    def create_conference(self, chair: User, acronym: str) -> Optional[int]:
        r = requests.post(
            f"{self.base}/api/v1/conferences",
            headers=self._h(chair.token),
            json={"conference": {
                "title": "Demo Conference for Rebuttal Feature",
                "acronym": acronym,
                "description": (
                    "A demo conference showcasing the complete rebuttal workflow. "
                    "Papers are in various stages of the rebuttal process."
                ),
                "chair": chair.email,
                "domain": ["AI", "ML", "NLP", "Computer Vision"],
                "tracks": ["Main Track"],
                "venue": "Virtual",
            }},
        )
        if r.status_code in [200, 201]:
            cid = r.json().get("data", r.json()).get("id")
            ok(f"Created conference (ID: {cid})")
            return cid
        err(f"Create conference: {r.status_code} {r.text[:120]}")
        return None

    def transition_conference(self, conf_id: int, chair_token: str, new_status: str):
        r = requests.put(
            f"{self.base}/api/v1/conferences/{conf_id}/status",
            headers=self._h(chair_token),
            json={"conference_id": conf_id, "new_status": new_status},
        )
        if r.status_code == 200:
            ok(f"Conference status → {new_status}")
        else:
            err(f"Transition to {new_status}: {r.status_code} {r.text[:120]}")

    # ── Reviewers ─────────────────────────────────────────────────────────────

    def add_reviewers(self, conf_id: int, chair_token: str,
                      reviewers: list[User], domains: list[list[str]]):
        payload = [
            {"user_id": rv.id, "domain": domains[i]}
            for i, rv in enumerate(reviewers)
            if rv.id
        ]
        r = requests.post(
            f"{self.base}/api/v1/conferences/{conf_id}/reviewers",
            headers=self._h(chair_token),
            json={"reviewers": payload},
        )
        if r.status_code in [200, 201]:
            ok(f"Invited {len(payload)} reviewers")
        else:
            err(f"Add reviewers: {r.status_code} {r.text[:120]}")

    def accept_all_reviewer_invitations(self, conf_id: int, chair_token: str):
        """Chair force-accepts all pending reviewer invitations."""
        r = requests.get(
            f"{self.base}/api/v1/conferences/{conf_id}/reviewers?limit=50",
            headers=self._h(chair_token),
        )
        if r.status_code != 200:
            err(f"List reviewers: {r.status_code} {r.text[:120]}")
            return
        for rv in r.json().get("data", {}).get("reviewers", []):
            rv_id = rv.get("id")
            if not rv_id:
                continue
            resp = requests.put(
                f"{self.base}/api/v1/conferences/{conf_id}/reviewers/{rv_id}/status",
                headers=self._h(chair_token),
                json={"status": "accepted"},
            )
            if resp.status_code == 200:
                ok(f"Accepted reviewer record ID {rv_id}")
            else:
                warn(f"Could not accept reviewer {rv_id}: {resp.text[:80]}")

    # ── Submissions ───────────────────────────────────────────────────────────

    def create_submission(self, conf_id: int, author: User, title: str,
                          abstract: str, domains: list[str],
                          keywords: list[str]) -> Optional[int]:
        pdf = _minimal_pdf(title)
        sub_payload = {
            "submission": {
                "title": title,
                "abstract": abstract,
                "domain": domains,
                "track": "Main Track",
                "status": "draft",
                "information": {"keywords": keywords, "paper_type": "Full Paper"},
            }
        }
        r = requests.post(
            f"{self.base}/api/v1/conferences/{conf_id}/submissions",
            headers=self._h(author.token),
            data={"submission": json.dumps(sub_payload)},
            files={"file": ("paper.pdf", pdf, "application/pdf")},
        )
        if r.status_code not in [200, 201]:
            err(f"Create '{title[:40]}': {r.status_code} {r.text[:120]}")
            return None
        sub_id = r.json().get("data", r.json()).get("id")

        # Publish the submission
        pr = requests.put(
            f"{self.base}/api/v1/conferences/{conf_id}/submissions/{sub_id}/status",
            headers=self._h(author.token),
            json={"status": "published"},
        )
        if pr.status_code == 200:
            ok(f"Submission '{title[:55]}' (ID: {sub_id})")
        else:
            warn(f"Submission {sub_id} created but publish failed: {pr.text[:80]}")
        return sub_id

    # ── Assignments ───────────────────────────────────────────────────────────

    def confirm_all_suggestions(self, conf_id: int, chair_token: str):
        r = requests.post(
            f"{self.base}/api/v1/conferences/{conf_id}/assignments/suggestions/confirm",
            headers=self._h(chair_token),
            json={},
        )
        if r.status_code in [200, 201]:
            ok("Confirmed all assignment suggestions")
        else:
            err(f"Confirm suggestions: {r.status_code} {r.text[:120]}")

    def get_confirmed_assignments(self, conf_id: int,
                                  chair_token: str) -> list[AssignmentInfo]:
        """
        Returns a flat list of AssignmentInfo for all confirmed assignments.
        Uses GET /conferences/{id}/assignments/confirmed which returns:
          { data: { assignments: [ { submission_id, reviewers: [ { assignment_id, reviewer_email } ] } ] } }
        """
        r = requests.get(
            f"{self.base}/api/v1/conferences/{conf_id}/assignments/confirmed",
            headers=self._h(chair_token),
        )
        if r.status_code != 200:
            err(f"Get confirmed assignments: {r.status_code} {r.text[:120]}")
            return []

        result: list[AssignmentInfo] = []
        groups = r.json().get("data", {}).get("assignments", [])
        for group in groups:
            sub_id = group.get("submission_id")
            for rv in group.get("reviewers", []):
                a_id = rv.get("assignment_id")
                rv_email = rv.get("reviewer_email", "")
                if sub_id and a_id:
                    result.append(AssignmentInfo(
                        assignment_id=a_id,
                        submission_id=sub_id,
                        reviewer_email=rv_email,
                    ))
        info(f"Found {len(result)} confirmed assignment(s)")
        return result

    # ── Reviews ───────────────────────────────────────────────────────────────

    def submit_review(self, conf_id: int, assignment_id: int, reviewer_token: str,
                      score: float, recommendation: str, summary: str,
                      weaknesses: str, questions: str) -> bool:
        # Map float score to int for criteria fields (1-10 range)
        int_score = max(1, min(10, round(score)))
        r = requests.put(
            f"{self.base}/api/v1/conferences/{conf_id}/assignments/{assignment_id}/review",
            headers=self._h(reviewer_token),
            json={
                "assignment_id": assignment_id,
                "conference_id": conf_id,
                "status": "submitted",
                "review_score": score,
                "review_data": {
                    "criteria": {
                        "originality":       int_score,
                        "technical_quality": int_score,
                        "clarity":           int_score,
                        "significance":      int_score,
                        "methodology":       int_score,
                    },
                    "feedback": {
                        "summary":   summary,
                        "strengths": "Well-motivated approach with strong empirical results.",
                        "weaknesses": weaknesses,
                        "questions":  questions,
                    },
                    "recommendation": recommendation,
                    "confidence":     "high",
                },
            },
        )
        if r.status_code == 200:
            ok(f"Review submitted (assignment {assignment_id}, score {score}, rec: {recommendation})")
            return True
        err(f"Submit review for assignment {assignment_id}: {r.status_code} {r.text[:120]}")
        return False

    # ── Rebuttal ──────────────────────────────────────────────────────────────

    def save_rebuttal_settings(self, conf_id: int, chair_token: str):
        r = requests.patch(
            f"{self.base}/api/v1/conferences/{conf_id}/rebuttal/settings",
            headers=self._h(chair_token),
            json={
                "enabled": True,
                "char_limit_general": 3000,
                "char_limit_per_point": 1000,
                "allow_discussion": True,
            },
        )
        if r.status_code == 200:
            ok("Rebuttal settings saved (enabled, char limits, allow_discussion=true)")
        else:
            err(f"Save rebuttal settings: {r.status_code} {r.text[:120]}")

    def open_rebuttal(self, conf_id: int, chair_token: str):
        r = requests.post(
            f"{self.base}/api/v1/conferences/{conf_id}/rebuttal/open",
            headers=self._h(chair_token),
        )
        if r.status_code == 200:
            ok("Rebuttal period opened (phase → awaiting)")
        else:
            err(f"Open rebuttal: {r.status_code} {r.text[:120]}")

    def submit_rebuttal(self, conf_id: int, sub_id: int, author_token: str,
                        general_response: str, points: list[dict]) -> bool:
        r = requests.put(
            f"{self.base}/api/v1/conferences/{conf_id}/submissions/{sub_id}/rebuttal",
            headers=self._h(author_token),
            json={"general_response": general_response, "points": points},
        )
        if r.status_code == 200:
            ok(f"Rebuttal submitted for submission {sub_id}")
            return True
        err(f"Submit rebuttal {sub_id}: {r.status_code} {r.text[:120]}")
        return False

    def acknowledge_point(self, conf_id: int, assignment_id: int, reviewer_token: str,
                          point_id: str, status: str, note: str) -> bool:
        r = requests.put(
            f"{self.base}/api/v1/conferences/{conf_id}/assignments/{assignment_id}"
            f"/rebuttal/points/{point_id}/acknowledge",
            headers=self._h(reviewer_token),
            json={"status": status, "note": note},
        )
        if r.status_code == 200:
            ok(f"Point '{point_id}' → {status} (assignment {assignment_id})")
            return True
        err(f"Acknowledge point {point_id}: {r.status_code} {r.text[:120]}")
        return False

    def acknowledge_rebuttal(self, conf_id: int, assignment_id: int,
                              reviewer_token: str) -> bool:
        r = requests.put(
            f"{self.base}/api/v1/conferences/{conf_id}/assignments/{assignment_id}"
            f"/rebuttal/acknowledge",
            headers=self._h(reviewer_token),
        )
        if r.status_code == 200:
            ok(f"Rebuttal marked read (assignment {assignment_id})")
            return True
        err(f"Acknowledge rebuttal {assignment_id}: {r.status_code} {r.text[:120]}")
        return False


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _minimal_pdf(title: str) -> bytes:
    """Generate a minimal valid PDF for upload."""
    content = f"BT /F1 12 Tf 72 720 Td ({title[:60].replace('(','').replace(')','')} ) Tj ET"
    body = (
        "%PDF-1.4\n"
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]"
        " /Contents 4 0 R >>\nendobj\n"
        f"4 0 obj\n<< /Length {len(content)} >>\nstream\n{content}\nendstream\nendobj\n"
        "xref\n0 5\n0000000000 65535 f \n"
        "trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n9\n%%EOF"
    )
    return body.encode()


def _find_reviewer(email: str, reviewer_map: dict[str, User]) -> Optional[User]:
    """Look up a reviewer User by email (case-insensitive)."""
    return reviewer_map.get(email.lower())


# ─── Submission Definitions ───────────────────────────────────────────────────
# Each entry defines the paper content and what review + rebuttal state to create.

SUBMISSIONS = [
    # ── Submission 1: Fully acknowledged ─────────────────────────────────────
    {
        "title": "Efficient Attention Mechanisms for Long-Context Transformers",
        "abstract": (
            "We propose a novel sparse attention mechanism that reduces the quadratic "
            "complexity of self-attention to near-linear while maintaining competitive "
            "performance on long-context benchmarks including SCROLLS and LONG-BENCH. "
            "Our approach combines sliding window attention with a learned global token "
            "selection strategy, achieving 3.2x speedup over standard transformers on "
            "sequences of 32k tokens."
        ),
        "domains": ["NLP", "AI"],
        "keywords": ["Transformers", "Attention", "Efficiency", "Long Context"],
        "review": {
            "score": 6.0,
            "recommendation": "weak_accept",
            "summary": "The paper presents an interesting approach to reducing attention complexity with strong empirical backing.",
            "weaknesses": (
                "The ablation study is insufficient — it is unclear which component "
                "contributes most to the speedup. Additionally, the comparison with "
                "Longformer is missing from Table 2."
            ),
            "questions": (
                "How does performance degrade as context length exceeds 32k tokens? "
                "Have you tested on non-English corpora?"
            ),
        },
        "rebuttal_general": (
            "We thank the reviewer for their thorough evaluation. The main concerns "
            "were around the ablation study and the missing Longformer comparison. "
            "We have addressed both: a new ablation table isolates each component's "
            "contribution, and Longformer results are now included in Table 2. "
            "We are confident this revision fully addresses all reviewer concerns."
        ),
        "rebuttal_points": [
            {
                "point_key": "ablation",
                "category": "weakness",
                "section": "Weaknesses",
                "original": "The ablation study is insufficient — it is unclear which component contributes most to the speedup.",
                "response": (
                    "We have added a comprehensive ablation in Appendix B (Table 5). "
                    "Sliding window alone gives 1.8x speedup; global token selection adds 1.4x more. "
                    "Together they achieve the reported 3.2x speedup over baseline transformers."
                ),
                "ack_status": "addressed",
                "ack_note": "The new ablation table clearly answers my concern — the contribution of each component is now transparent.",
            },
            {
                "point_key": "longformer",
                "category": "question",
                "section": "Questions",
                "original": "The comparison with Longformer is missing from Table 2.",
                "response": (
                    "Longformer results have been added to Table 2. Our method outperforms "
                    "Longformer by 1.3 F1 on SCROLLS while being 1.7x faster due to the "
                    "adaptive global token selection that Longformer lacks."
                ),
                "ack_status": "addressed",
                "ack_note": "The Longformer comparison is now complete and convincing.",
            },
        ],
        "demo_state": "fully_acknowledged",
    },

    # ── Submission 2: Partially acknowledged ─────────────────────────────────
    {
        "title": "Multimodal Contrastive Learning for Zero-Shot Image-Text Retrieval",
        "abstract": (
            "We present MMCL, a multimodal contrastive learning framework for zero-shot "
            "image-text retrieval that does not require paired training data. By leveraging "
            "unpaired image collections and text corpora, MMCL learns cross-modal "
            "representations through a novel asymmetric contrastive objective. We demonstrate "
            "state-of-the-art zero-shot retrieval on MS-COCO, Flickr30k, and LAION benchmarks."
        ),
        "domains": ["Computer Vision", "NLP"],
        "keywords": ["Contrastive Learning", "Multimodal", "Zero-Shot", "Retrieval"],
        "review": {
            "score": 5.5,
            "recommendation": "borderline",
            "summary": "Interesting approach but the experimental comparison raises fairness concerns.",
            "weaknesses": (
                "The comparison with CLIP is unfair since CLIP uses 400M image-text pairs "
                "while MMCL uses unpaired data. The claim of 'state-of-the-art' should "
                "be qualified. Figure 3 is hard to read in grayscale."
            ),
            "questions": (
                "What is the training data size compared to CLIP? "
                "Could you include experiments with matched data budgets?"
            ),
        },
        "rebuttal_general": (
            "We thank the reviewer for the constructive feedback. The fairness concern "
            "about CLIP comparison is well-taken. We have added a matched-budget experiment "
            "in Table 5 where CLIP is trained on the same volume of unpaired data as MMCL. "
            "MMCL still outperforms by 4.2 R@1 on Flickr30k, demonstrating the advantage "
            "of our asymmetric objective independent of data volume. Figure 3 has been "
            "redesigned with distinct markers for colorblind-friendly display."
        ),
        "rebuttal_points": [
            {
                "point_key": "clip-fair",
                "category": "weakness",
                "section": "Weaknesses",
                "original": "The comparison with CLIP is unfair since CLIP uses 400M image-text pairs while MMCL uses unpaired data.",
                "response": (
                    "We agree this needed clarification. Table 5 now includes a matched-budget "
                    "experiment where CLIP is trained on equivalent unpaired data. MMCL "
                    "outperforms by 4.2 R@1 on Flickr30k, confirming our method's advantage "
                    "is due to the asymmetric objective, not data volume."
                ),
                "ack_status": "partially_addressed",
                "ack_note": (
                    "Appreciate the matched-budget experiment. Would still like to see "
                    "results on LAION-5B scale to confirm the trend holds."
                ),
            },
            {
                "point_key": "figure3",
                "category": "clarification",
                "section": "Weaknesses",
                "original": "Figure 3 is hard to read in grayscale.",
                "response": (
                    "Figure 3 has been redesigned using distinct line markers (circle, square, "
                    "triangle) in addition to color, making it readable in both color and "
                    "grayscale. The revised figure is included in the supplementary PDF."
                ),
                "ack_status": "addressed",
                "ack_note": "The new figure is clear. Thank you.",
            },
        ],
        "demo_state": "partially_acknowledged",  # Only first point acked; second reviewer hasn't acked yet
    },

    # ── Submission 3: Awaiting — author has not submitted rebuttal ────────────
    {
        "title": "Privacy-Preserving Federated Learning via Gradient Compression",
        "abstract": (
            "This paper introduces GradComp, a privacy-preserving federated learning "
            "framework that combines gradient compression with differential privacy guarantees. "
            "GradComp reduces communication overhead by 85% while maintaining epsilon-DP "
            "with epsilon < 1.0. We evaluate on image classification and language modeling "
            "tasks across heterogeneous client distributions in both IID and non-IID settings."
        ),
        "domains": ["AI", "ML"],
        "keywords": ["Federated Learning", "Differential Privacy", "Gradient Compression"],
        "review": {
            "score": 4.5,
            "recommendation": "weak_reject",
            "summary": "The combination of gradient compression and DP is interesting but the privacy analysis has gaps.",
            "weaknesses": (
                "The privacy analysis in Theorem 1 applies the composition theorem incorrectly "
                "— the epsilon does not compose additively under the assumed noise model. "
                "The epsilon=1.0 bound is too loose for practical deployment scenarios."
            ),
            "questions": (
                "Can you provide a corrected privacy proof? "
                "How does accuracy degrade for epsilon < 0.5? "
                "How does GradComp compare to SecAgg at similar communication budgets?"
            ),
        },
        "rebuttal_general": None,   # Author has NOT submitted — demo awaiting state
        "rebuttal_points": [],
        "demo_state": "awaiting",
    },
]


# ─── Main ─────────────────────────────────────────────────────────────────────

def main(base_url: str, acronym: str):
    print(f"\n{C.BOLD}{C.YELLOW}{'='*62}{C.NC}")
    print(f"{C.BOLD}{C.YELLOW}  Rebuttal Demo Seeder  —  ConferenceSpace{C.NC}")
    print(f"{C.BOLD}{C.YELLOW}{'='*62}{C.NC}")
    print(f"  Target:  {base_url}")
    print(f"  Acronym: {acronym}\n")

    api = API(base_url)

    # ── Step 1: Register & login all users ───────────────────────────────────
    step(1, "Registering users")

    chair = api.register("demo_rebuttal_chair@test.com", "Demo", "Chair",
                         ["AI", "ML", "NLP", "Computer Vision"])
    chair = api.login("demo_rebuttal_chair@test.com")
    if not chair or not chair.token:
        err("Cannot proceed without chair token. Exiting.")
        sys.exit(1)

    reviewer_domains = [
        ["AI", "NLP", "Transformers"],
        ["Computer Vision", "Multimodal", "NLP"],
        ["AI", "ML", "Federated Learning"],
        ["NLP", "Computer Vision", "AI"],
    ]
    reviewers: list[User] = []
    reviewer_map: dict[str, User] = {}   # email.lower() → User (with token)
    for i in range(1, 5):
        email = f"demo_rebuttal_reviewer_{i}@test.com"
        api.register(email, f"Reviewer{i}", "Demo", reviewer_domains[i - 1])
        rv = api.login(email)
        if rv:
            reviewers.append(rv)
            reviewer_map[email.lower()] = rv

    author_domains = [
        ["NLP", "AI"],
        ["Computer Vision", "NLP"],
        ["AI", "ML"],
    ]
    authors: list[User] = []
    for i in range(1, 4):
        email = f"demo_rebuttal_author_{i}@test.com"
        api.register(email, f"Author{i}", "Demo", author_domains[i - 1])
        au = api.login(email)
        if au:
            authors.append(au)

    if len(reviewers) < 4:
        err(f"Only {len(reviewers)} reviewers created (need 4). Exiting.")
        sys.exit(1)
    if len(authors) < 3:
        err(f"Only {len(authors)} authors created (need 3). Exiting.")
        sys.exit(1)

    # ── Step 2: Create conference ────────────────────────────────────────────
    step(2, f"Creating conference ({acronym})")
    conf_id = api.create_conference(chair, acronym)
    if not conf_id:
        sys.exit(1)

    # ── Step 3: Add reviewers + accept invitations ───────────────────────────
    step(3, "Adding reviewers and accepting invitations")
    api.add_reviewers(conf_id, chair.token, reviewers, reviewer_domains)
    time.sleep(0.3)
    api.accept_all_reviewer_invitations(conf_id, chair.token)

    # ── Step 4: Create 3 submissions ─────────────────────────────────────────
    step(4, "Creating submissions")
    submission_ids: list[int] = []
    for i, sub_def in enumerate(SUBMISSIONS):
        sub_id = api.create_submission(
            conf_id, authors[i],
            sub_def["title"], sub_def["abstract"],
            sub_def["domains"], sub_def["keywords"],  # type: ignore[arg-type]
        )
        if not sub_id:
            err(f"Failed to create submission {i + 1}. Exiting.")
            sys.exit(1)
        submission_ids.append(sub_id)

    # ── Step 5: Transition → reviewing + confirm assignments ─────────────────
    step(5, "Transitioning conference to reviewing + confirming assignments")
    api.transition_conference(conf_id, chair.token, "reviewing")
    time.sleep(1)   # give auto-assign time to run
    api.confirm_all_suggestions(conf_id, chair.token)
    time.sleep(0.5)

    # ── Step 6: Collect confirmed assignments (assignment_id + reviewer_email) ─
    step(6, "Collecting confirmed assignments")
    confirmed = api.get_confirmed_assignments(conf_id, chair.token)

    if not confirmed:
        err("No confirmed assignments found. Cannot submit reviews.")
        err("The auto-assign may not have matched any reviewers to papers.")
        err("Check that reviewer domains overlap with submission domains.")
        sys.exit(1)

    # Build lookup: submission_id → list of AssignmentInfo
    sub_to_assignments: dict[int, list[AssignmentInfo]] = {}
    for a in confirmed:
        sub_to_assignments.setdefault(a.submission_id, []).append(a)
        reviewer = _find_reviewer(a.reviewer_email, reviewer_map)
        rv_name = reviewer.email if reviewer else f"unknown({a.reviewer_email})"
        info(f"Submission {a.submission_id} ← assignment {a.assignment_id} ← {rv_name}")

    # ── Step 7: Submit reviews ────────────────────────────────────────────────
    step(7, "Submitting reviews for all assignments")
    for sub_idx, sub_id in enumerate(submission_ids):
        assignments = sub_to_assignments.get(sub_id, [])
        if not assignments:
            warn(f"No assignments for submission {sub_id} — skipping reviews")
            continue

        sub_def = SUBMISSIONS[sub_idx]
        review_def = sub_def["review"]  # type: ignore[index]

        for assignment in assignments:
            reviewer = _find_reviewer(assignment.reviewer_email, reviewer_map)
            if not reviewer:
                warn(f"Reviewer {assignment.reviewer_email} not in our user set — skipping")
                continue
            api.submit_review(
                conf_id, assignment.assignment_id, reviewer.token,
                score=review_def["score"],
                recommendation=review_def["recommendation"],
                summary=review_def["summary"],
                weaknesses=review_def["weaknesses"],
                questions=review_def["questions"],
            )

    # ── Step 8: Configure + open rebuttal ────────────────────────────────────
    step(8, "Configuring and opening rebuttal period")
    api.save_rebuttal_settings(conf_id, chair.token)
    api.open_rebuttal(conf_id, chair.token)

    # ── Step 9: Author rebuttals ──────────────────────────────────────────────
    step(9, "Submitting author rebuttals")

    for sub_idx, sub_id in enumerate(submission_ids):
        sub_def = SUBMISSIONS[sub_idx]
        general = sub_def.get("rebuttal_general")  # type: ignore[call-overload]

        if general is None:
            info(f"Submission {sub_id} [{sub_def['demo_state']}] — author leaving rebuttal unsubmitted")
            continue

        assignments = sub_to_assignments.get(sub_id, [])
        point_defs = sub_def.get("rebuttal_points", [])  # type: ignore[call-overload]

        # Build per-point payload — prefix point_id with assignment_id to ensure uniqueness
        points_payload: list[dict] = []
        for assignment in assignments:
            for pt in point_defs:  # type: ignore[union-attr]
                points_payload.append({
                    "point_id":         f"{assignment.assignment_id}-{pt['point_key']}",
                    "assignment_id":    assignment.assignment_id,
                    "category":         pt["category"],
                    "section":          pt["section"],
                    "original_comment": pt["original"],
                    "author_response":  pt["response"],
                })

        api.submit_rebuttal(conf_id, sub_id, authors[sub_idx].token,
                            general_response=general,
                            points=points_payload)

    # ── Step 10: Reviewer acknowledgments ────────────────────────────────────
    step(10, "Simulating reviewer acknowledgments")

    for sub_idx, sub_id in enumerate(submission_ids):
        sub_def = SUBMISSIONS[sub_idx]
        demo_state = sub_def["demo_state"]
        assignments = sub_to_assignments.get(sub_id, [])
        point_defs = sub_def.get("rebuttal_points", [])  # type: ignore[call-overload]

        if demo_state == "awaiting":
            info(f"Submission {sub_id} — awaiting state, no acks needed")
            continue

        if demo_state == "fully_acknowledged":
            # ALL assignments: acknowledge ALL points
            for assignment in assignments:
                reviewer = _find_reviewer(assignment.reviewer_email, reviewer_map)
                if not reviewer:
                    warn(f"Reviewer {assignment.reviewer_email} not found — skip ack")
                    continue
                for pt in point_defs:  # type: ignore[union-attr]
                    point_id = f"{assignment.assignment_id}-{pt['point_key']}"
                    api.acknowledge_point(
                        conf_id, assignment.assignment_id, reviewer.token,
                        point_id, pt["ack_status"], pt["ack_note"],
                    )
                api.acknowledge_rebuttal(conf_id, assignment.assignment_id, reviewer.token)

        elif demo_state == "partially_acknowledged":
            # Reviewer acknowledges individual points but does NOT call acknowledge_rebuttal.
            # This means assignment rebuttal_status stays 'submitted' (not 'acknowledged'),
            # so the chair table shows 0/1 acked — visually distinct from submission 1 (1/1).
            if len(assignments) >= 1:
                first = assignments[0]
                reviewer = _find_reviewer(first.reviewer_email, reviewer_map)
                if reviewer:
                    for pt in point_defs:  # type: ignore[union-attr]
                        point_id = f"{first.assignment_id}-{pt['point_key']}"
                        api.acknowledge_point(
                            conf_id, first.assignment_id, reviewer.token,
                            point_id, pt["ack_status"], pt["ack_note"],
                        )
                    # Deliberately NOT calling acknowledge_rebuttal here —
                    # reviewer has reviewed the points but hasn't marked the full rebuttal as read.
                    info(f"Submission {sub_id}: reviewer read all points but has NOT marked rebuttal as fully acknowledged (0/1 in table)")
                else:
                    warn(f"Reviewer {first.reviewer_email} not found — partial ack skipped")

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{C.BOLD}{C.YELLOW}{'='*62}{C.NC}")
    print(f"{C.BOLD}{C.GREEN}  ✓ Rebuttal Demo Seeded Successfully!{C.NC}")
    print(f"{C.BOLD}{C.YELLOW}{'='*62}{C.NC}\n")

    print(f"  {C.BOLD}Conference ID:{C.NC}  {C.GREEN}{conf_id}{C.NC}")
    print(f"  {C.BOLD}Direct URL:{C.NC}     /role/chair/conferences/{conf_id}\n")

    print(f"  {C.BOLD}Credentials  (password: {PASSWORD}){C.NC}")
    print(f"    {'Chair':<12}  demo_rebuttal_chair@test.com")
    for i in range(1, 4):
        print(f"    {'Author ' + str(i):<12}  demo_rebuttal_author_{i}@test.com")
    for i in range(1, 5):
        print(f"    {'Reviewer ' + str(i):<12}  demo_rebuttal_reviewer_{i}@test.com")

    print(f"\n  {C.BOLD}Submission Demo States:{C.NC}")
    labels = {
        "fully_acknowledged": f"{C.GREEN}FULLY ACKNOWLEDGED{C.NC}",
        "partially_acknowledged": f"{C.YELLOW}PARTIALLY ACKNOWLEDGED{C.NC}",
        "awaiting": f"{C.BLUE}AWAITING AUTHOR RESPONSE{C.NC}",
    }
    for i, (sub_id, sub_def) in enumerate(zip(submission_ids, SUBMISSIONS)):
        state_label = labels.get(sub_def["demo_state"], sub_def["demo_state"])
        print(f"    [{C.GREEN}{sub_id}{C.NC}] {sub_def['title'][:52]}…")
        print(f"           → {state_label}")

    print(f"\n  {C.BOLD}Demo Script:{C.NC}")
    print(f"    1. Chair → /role/chair/conferences/{conf_id} → {C.CYAN}Rebuttal{C.NC} tab")
    print(f"       • See phase banner, submission overview table, action buttons")
    print(f"    2. Author 1 → Submission {submission_ids[0] if submission_ids else '?'} → Rebuttal tab")
    print(f"       • Locked panel, {C.GREEN}all reviewers acknowledged{C.NC}")
    print(f"    3. Author 2 → Submission {submission_ids[1] if len(submission_ids) > 1 else '?'} → Rebuttal tab")
    print(f"       • Locked panel, {C.YELLOW}partial acknowledgment progress{C.NC}")
    print(f"    4. Author 3 → Submission {submission_ids[2] if len(submission_ids) > 2 else '?'} → Rebuttal tab")
    print(f"       • {C.BLUE}Editable form{C.NC} — submit a rebuttal live in the demo")
    print(f"    5. Reviewer 1 → paper → Rebuttal tab → all points acked, post-score form available")
    print(f"    6. Reviewer 2 → paper → Rebuttal tab → can acknowledge submission 2's open points live")
    print()


if __name__ == "__main__":
    # Generate a short timestamp-based acronym so each run is independent by default.
    default_acronym = f"{DEFAULT_ACRONYM_PREFIX}{datetime.now().strftime('%m%d%H%M%S')}"

    parser = argparse.ArgumentParser(
        description="Seed rebuttal demo data for ConferenceSpace",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Backend API base URL (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--acronym",
        default=default_acronym,
        help=(
            f"Conference acronym (default: auto-generated e.g. {default_acronym}). "
            "Pass a fixed value to reuse an existing conference."
        ),
    )
    args = parser.parse_args()
    main(args.base_url, args.acronym)
