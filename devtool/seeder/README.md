# Demo Seeders

Python scripts that populate a running ConferenceSpace instance with demo data.

## Prerequisites

1. **Backend running** on `http://localhost:8080` — run `make dev` from `/backend`
2. **Frontend running** on `http://localhost:3000` — run `npm run dev` from `/frontend` (to view the UI)
3. **Python 3** with the `requests` package — `pip install requests`

## Seeders

### `seed_demo.py` — Full-Feature Demo

Seeds a comprehensive environment covering all AI features: Submission Gating, Reviewer Briefing, Decision Copilot, and Semantic Scholar integration.

```bash
python3 devtool/seeder/seed_demo.py
```

| Role     | Email                  | Password  |
|----------|------------------------|-----------|
| Chair    | chair@demo.com         | Demo@123  |
| Author   | author1@demo.com       | Demo@123  |
| Author   | author2@demo.com       | Demo@123  |
| Reviewer | reviewer1@demo.com     | Demo@123  |
| Reviewer | reviewer2@demo.com     | Demo@123  |
| Reviewer | reviewer3@demo.com     | Demo@123  |

---

### `seed_test_data.py` — Suggestions Workflow

Creates 1 chair, 10 authors, 15 reviewers, 1 conference, and 10 submissions for manual testing of the suggestions workflow.

```bash
python3 devtool/seeder/seed_test_data.py
```

Password for all users: `password123`

---

### `seed_reviewer_suggestion_demo.py` — Reviewer Suggestion Ranking

Exercises the chair-side **Suggested Reviewers** tab. Registers users at varying domain-overlap levels (0/4 to 4/4) against the conference domains (AI, Machine Learning, Computer Vision, NLP) so you can see how ranking works.

```bash
python3 devtool/seeder/seed_reviewer_suggestion_demo.py
```

Password for all users: `Demo@123`

---

### `seed_reviewer_match_demo.py` — Match Details UI

Seeds the full **Match Details** UI with Jaccard similarity scoring. Creates suggestions from all three source types (`auto_pass1`, `auto_pass2`, `manual`) and prints every metadata field for verification.

```bash
python3 devtool/seeder/seed_reviewer_match_demo.py
```

Password for all users: `Demo@123`. Each run creates a fresh conference (timestamped acronym).

---

### `seed_ai003_reviewer_briefing.py` — Reviewer Briefing (AI-003)

Minimal scenario for smoke-testing the reviewer briefing feature: 1 conference, 1 reviewer, 1 submission with a real PDF, and a confirmed assignment.

```bash
python3 devtool/seeder/seed_ai003_reviewer_briefing.py
python3 devtool/seeder/seed_ai003_reviewer_briefing.py --base-url http://localhost:8080
```

| Role     | Email                                | Password      |
|----------|--------------------------------------|---------------|
| Chair    | chair.main@conferencespace.local     | DemoPass123!  |
| Author   | nora.author@conferencespace.local    | DemoPass123!  |
| Reviewer | qa.reviewer@conferencespace.local    | DemoPass123!  |

---

### `seed_rebuttal_demo.py` — Rebuttal Phase

Seeds a conference in the **awaiting rebuttal** phase with 3 submissions in different states:

1. **Fully Acknowledged** — author rebutted, all reviewers acknowledged
2. **Partially Acknowledged** — author rebutted, only one reviewer acknowledged
3. **Awaiting Author Response** — reviews submitted, no rebuttal yet

```bash
python3 devtool/seeder/seed_rebuttal_demo.py
python3 devtool/seeder/seed_rebuttal_demo.py --base-url http://localhost:8080 --acronym RD2026
```

| Role     | Email                              | Password    |
|----------|------------------------------------|-------------|
| Chair    | demo_rebuttal_chair@test.com       | Demo@12345  |
| Authors  | demo_rebuttal_author_1-3@test.com  | Demo@12345  |
| Reviewers| demo_rebuttal_reviewer_1-4@test.com| Demo@12345  |

## Quick Reference

| Script                              | What it demos                | Fresh each run? |
|-------------------------------------|------------------------------|-----------------|
| `seed_demo.py`                      | All AI features              | No              |
| `seed_test_data.py`                 | Suggestions workflow         | No              |
| `seed_reviewer_suggestion_demo.py`  | Reviewer suggestion ranking  | Yes             |
| `seed_reviewer_match_demo.py`       | Match details UI             | Yes             |
| `seed_ai003_reviewer_briefing.py`   | Reviewer briefing (AI-003)   | No              |
| `seed_rebuttal_demo.py`            | Rebuttal phase states        | Yes (default)   |
