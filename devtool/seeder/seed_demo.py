#!/usr/bin/env python3
"""
Full Demo Seeder for ConferenceSpace
=====================================
Seeds a comprehensive environment for demoing all AI features:
- Submission Gating (Auto-check paper format/content)
- Reviewer Briefing (Smart summary for reviewers)
- Decision Copilot (Chair support for final decisions)
- Semantic Scholar Integration (Author profiles/papers)

Users created (Password: Demo@123):
- Chair: chair@demo.com
- Author: author1@demo.com, author2@demo.com
- Reviewer: reviewer1@demo.com, reviewer2@demo.com, reviewer3@demo.com

Usage:
  py devtool/seeder/seed_demo.py
"""

import requests
import json
import time
import sys
import subprocess
from dataclasses import dataclass
from typing import Optional, List

# --- Config ---
BASE_URL = "http://localhost:8080"
PASSWORD = "Demo@123"
ACRONYM = "GAIS2026"
CONFERENCE_TITLE = "Global AI Summit 2026"

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

def ok(msg):
    print(f"  {C.GREEN}[OK]{C.NC} {msg}")

def warn(msg):
    print(f"  {C.YELLOW}[!]{C.NC} {msg}")

def err(msg):
    print(f"  {C.RED}[ERR]{C.NC} {msg}")

@dataclass
class User:
    email: str
    id: int = 0
    token: str = ""

# --- Database Cleaning ---
def clear_database():
    step(0, "Clearing existing data")
    tables = [
        "rebuttal_points", "paper_assignments", "conference_submissions",
        "conference_reviewers", "conference_user_roles", "conferences",
        "auth_tokens", "notifications", "discussion_messages",
        "discussion_threads", "scholar_profile_papers", "scholar_profiles",
        "scholar_papers", "users"
    ]
    sql = f"TRUNCATE public.{', public.'.join(tables)} CASCADE;"
    ai_sql = "TRUNCATE ai.ai_sessions, ai.ai_messages, ai.ai_tool_audit CASCADE;"
    
    try:
        subprocess.run(["docker-compose", "-f", "backend/docker-compose.yml", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "conferencespace", "-c", sql], check=True, capture_output=True)
        subprocess.run(["docker-compose", "-f", "backend/docker-compose.yml", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "conferencespace", "-c", ai_sql], check=True, capture_output=True)
        subprocess.run(["docker-compose", "-f", "backend/docker-compose.yml", "exec", "-T", "neo4j", "cypher-shell", "-u", "neo4j", "-p", "conferencespace", "MATCH (n) DETACH DELETE n"], check=True, capture_output=True)
        ok("Database cleared successfully")
    except subprocess.CalledProcessError as e:
        err(f"Failed to clear database: {e.stderr.decode()}")
        sys.exit(1)

# --- API Wrapper ---
class API:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")

    def register(self, email: str, first: str, last: str, domains: list) -> Optional[User]:
        r = requests.post(f"{self.base}/api/v1/auth/register", json={
            "user": {"email": email, "first_name": first, "last_name": last, "domain": domains},
            "password": PASSWORD
        })
        if r.status_code == 201:
            return User(email=email, id=r.json().get("data", {}).get("id", 0))
        return self.login(email)

    def login(self, email: str) -> Optional[User]:
        r = requests.post(f"{self.base}/api/v1/auth/login", json={"email": email, "password": PASSWORD})
        if r.status_code == 200:
            data = r.json().get("data", r.json())
            return User(email=email, id=data.get("user", {}).get("id", 0), token=data.get("token", ""))
        return None

    def create_conference(self, chair: User) -> Optional[int]:
        r = requests.post(f"{self.base}/api/v1/conferences", headers={"Authorization": f"Bearer {chair.token}"}, json={
            "conference": {
                "title": CONFERENCE_TITLE,
                "acronym": ACRONYM,
                "description": "The premier conference for Global AI innovations.",
                "chair": chair.email,
                "domain": ["AI", "Machine Learning", "NLP"],
                "tracks": ["Main Track", "Applications"],
                "venue": "San Francisco, CA"
            }
        })
        return r.json().get("data", {}).get("id")

    def add_reviewers(self, conf_id: int, chair_token: str, reviewers: List[User]):
        payload = [{"user_id": r.id, "domain": ["AI", "NLP"]} for r in reviewers]
        requests.post(f"{self.base}/api/v1/conferences/{conf_id}/reviewers", 
                     headers={"Authorization": f"Bearer {chair_token}"}, json={"reviewers": payload})
        
        # Auto-accept
        r = requests.get(f"{self.base}/api/v1/conferences/{conf_id}/reviewers", headers={"Authorization": f"Bearer {chair_token}"})
        for rv in r.json().get("data", {}).get("reviewers", []):
            requests.put(f"{self.base}/api/v1/conferences/{conf_id}/reviewers/{rv['id']}/status",
                        headers={"Authorization": f"Bearer {chair_token}"}, json={"status": "accepted"})

    def create_submission(self, conf_id: int, author: User, title: str, abstract: str) -> Optional[int]:
        pdf = self._generate_pdf(title, abstract)
        payload = {
            "submission": {
                "title": title, "abstract": abstract, "domain": ["AI"], 
                "track": "Main Track", "status": "draft",
                "information": {"keywords": ["AI", "Demo"], "paper_type": "Full Paper"}
            }
        }
        r = requests.post(f"{self.base}/api/v1/conferences/{conf_id}/submissions",
                         headers={"Authorization": f"Bearer {author.token}"},
                         data={"submission": json.dumps(payload)},
                         files={"file": ("paper.pdf", pdf, "application/pdf")})
        sub_id = r.json().get("data", {}).get("id")
        # Publish it
        requests.put(f"{self.base}/api/v1/conferences/{conf_id}/submissions/{sub_id}/status",
                    headers={"Authorization": f"Bearer {author.token}"}, json={"status": "published"})
        return sub_id

    def _generate_pdf(self, title: str, abstract: str) -> bytes:
        content = f"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT /F1 12 Tf 72 720 Td ({title}) Tj 0 -20 Td ({abstract[:50]}...) Tj ET\nendstream\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF"
        return content.encode()

    def transition_conference(self, conf_id: int, token: str, status: str):
        requests.put(f"{self.base}/api/v1/conferences/{conf_id}/status", 
                    headers={"Authorization": f"Bearer {token}"}, json={"conference_id": conf_id, "new_status": status})

    def assign_and_review(self, conf_id: int, chair_token: str, sub_id: int, reviewer: User, score: float, rec: str):
        # Confirm assignments
        requests.post(f"{self.base}/api/v1/conferences/{conf_id}/assignments/suggestions/confirm", 
                     headers={"Authorization": f"Bearer {chair_token}"}, json={})
        
        # Get assignment ID
        r = requests.get(f"{self.base}/api/v1/conferences/{conf_id}/assignments/confirmed", headers={"Authorization": f"Bearer {chair_token}"})
        aid = 0
        for sub in r.json().get("data", {}).get("assignments", []):
            if sub["submission_id"] == sub_id:
                for rv in sub["reviewers"]:
                    if rv["reviewer_email"] == reviewer.email:
                        aid = rv["assignment_id"]
        
        if aid:
            requests.put(f"{self.base}/api/v1/conferences/{conf_id}/assignments/{aid}/review",
                        headers={"Authorization": f"Bearer {reviewer.token}"},
                        json={
                            "assignment_id": aid, "conference_id": conf_id, "status": "submitted",
                            "review_score": score,
                            "review_data": {
                                "criteria": {"originality": 8, "clarity": 7},
                                "feedback": {"summary": "Great paper!", "strengths": "Methodology", "weaknesses": "None"},
                                "recommendation": rec, "confidence": "high"
                            }
                        })

# --- Main Seeder ---
def main():
    clear_database()
    api = API(BASE_URL)
    
    step(1, "Creating users")
    chair = api.register("chair@demo.com", "Demo", "Chair", ["AI"])
    chair = api.login("chair@demo.com")
    
    authors = [api.login(api.register(f"author{i}@demo.com", f"Author{i}", "Demo", ["AI"]).email) for i in range(1, 3)]
    reviewers = [api.login(api.register(f"reviewer{i}@demo.com", f"Reviewer{i}", "Demo", ["AI"]).email) for i in range(1, 4)]
    ok("Users created and logged in")

    step(2, "Creating conference")
    conf_id = api.create_conference(chair)
    ok(f"Conference created: {ACRONYM} (ID: {conf_id})")

    step(3, "Adding reviewers")
    api.add_reviewers(conf_id, chair.token, reviewers)
    ok("Reviewers added and accepted")

    step(4, "Creating submissions (Triggers AI Gating)")
    sub1 = api.create_submission(conf_id, authors[0], "Large Language Models in Healthcare", "This paper explores LLM applications in clinical settings.")
    sub2 = api.create_submission(conf_id, authors[1], "Neural Radiance Fields for VR", "Advancing NeRF for real-time virtual reality rendering.")
    ok("Submissions created and published")

    step(5, "Transitioning to reviewing and submitting reviews")
    api.transition_conference(conf_id, chair.token, "reviewing")
    time.sleep(1) # Wait for auto-assign
    api.assign_and_review(conf_id, chair.token, sub1, reviewers[0], 8.5, "strong_accept")
    api.assign_and_review(conf_id, chair.token, sub1, reviewers[1], 7.0, "weak_accept")
    ok("Reviews submitted for Submission 1")

    step(6, "Seeding Scholar Profiles (Direct SQL)")
    scholar_sql = f"""
    INSERT INTO scholar_profiles (user_id, semantic_scholar_id, name, affiliations, paper_count, citation_count, h_index, url)
    VALUES 
    ({reviewers[0].id}, '2109876', 'Reviewer 1', ARRAY['Stanford University'], 45, 1200, 18, 'https://scholar.google.com'),
    ({authors[0].id}, '1234567', 'Author 1', ARRAY['MIT'], 12, 350, 8, 'https://scholar.google.com');
    """
    subprocess.run(["docker-compose", "-f", "backend/docker-compose.yml", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "conferencespace", "-c", scholar_sql], check=True, capture_output=True)
    ok("Scholar profiles seeded")

    print(f"\n{C.GREEN}{C.BOLD}Demo Seeding Complete!{C.NC}")
    print(f"Chair: chair@demo.com")
    print(f"Password: {PASSWORD}")
    print(f"Conference: {CONFERENCE_TITLE} ({ACRONYM})")

if __name__ == "__main__":
    main()
