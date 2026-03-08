# Manual Workflow Seed and QA Flow

## Goal

Create a repeatable local dataset so the app can be tested through a realistic flow:

1. Chair has multiple conferences with real-looking metadata.
2. Reviewers have accepted, pending, and rejected invitations.
3. Authors already have draft submissions attached to conferences.
4. Recent conferences in the sidebar are populated.
5. You can manually test desk rejection, COI, recent-conference archive/hide, and final submission.

## What Was Added

- Dev seed command: `backend/cmd/devseed/main.go`
- Sidebar recent-conference archive/hide:
  - per-user
  - per-role
  - persisted in `localStorage`
  - UI-only, does not change backend conference lifecycle status

## Seeded Accounts

All seeded accounts use the same password by default:

`DemoPass123!`

Accounts:

- `chair.main@conferencespace.local`
- `chair.ops@conferencespace.local`
- `nora.author@conferencespace.local`
- `liam.author@conferencespace.local`
- `qa.reviewer@conferencespace.local`
- `ml.reviewer@conferencespace.local`
- `coi.reviewer@conferencespace.local`

## Seeded Conferences

### 1. `ICAI26`

Purpose:

- main happy-path conference
- COI enabled
- lenient precheck settings
- accepted reviewers already present
- draft submission already present for author flow

Use this to test:

- recent conferences
- reviewer accepted state
- author final submit
- COI after declared conflicts

### 2. `RSDL26`

Purpose:

- stricter desk rejection configuration
- pending reviewer invitation
- draft submission already present

Use this to test:

- reviewer pending invitation
- stricter precheck / desk rejection behavior
- settings-driven precheck rules

### 3. `NEUROPS26`

Purpose:

- rejected reviewer invitation state

Use this to test:

- reviewer rejected tab

### 4. `SEAA25`

Purpose:

- completed conference for archive-like behavior in the overall workflow
- useful target for sidebar recent-conference hiding

Use this to test:

- completed conference visibility
- sidebar archive/hide action

## How To Run

### 1. Start backend

```bash
cd backend
make dev
```

`make dev` starts PostgreSQL, Redis, Neo4j, runs migrations, initializes Neo4j schema, and starts the API on `http://localhost:8080`.

### 2. Seed the dataset

Open a second terminal:

```bash
cd backend
go run ./cmd/devseed -base-url http://localhost:8080
```

The command is API-driven. It:

- creates or logs into the fixed accounts
- creates or updates the demo conferences
- invites reviewers
- sets reviewer invitation states
- creates draft submissions for authors

### 3. Start frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Recommended Manual Test Order

## A. Chair flow

Login:

- email: `chair.main@conferencespace.local`
- password: `DemoPass123!`

Checks:

1. Confirm recent conferences are populated in the sidebar.
2. On `SEAA25`, use the archive icon in the recent-conferences sidebar section.
3. Confirm the archived conference disappears from the visible recent list.
4. Toggle `Archived` in the sidebar and restore it.
5. Open `ICAI26` and verify:
   - conference details load
   - accepted reviewers exist
   - COI tab loads
6. Open `RSDL26` and verify:
   - stricter conference configuration is present
   - pending reviewer invitation exists

Expected result:

- chair has a realistic working dashboard state
- recent conferences are not hardcoded
- recent conference archive/hide works per user

## B. Reviewer flow

Login:

- email: `qa.reviewer@conferencespace.local`
- password: `DemoPass123!`

Checks:

1. Open reviewer invitations.
2. Verify:
   - `ICAI26` appears under accepted
   - `RSDL26` appears under pending
   - `NEUROPS26` appears under declined/rejected
3. Change tabs and confirm the counts and cards remain consistent.

Expected result:

- accepted/pending/rejected invitation states are all visible from one reviewer account
- tab switching no longer uses the wrong backend status value

## C. Author happy path submit

Login:

- email: `nora.author@conferencespace.local`
- password: `DemoPass123!`

Conference:

- `ICAI26`

Draft already present:

- `Efficient Adapter Routing for Multimodal Review Systems`

Checks:

1. Open the draft submission.
2. Edit metadata if needed.
3. Upload a realistic PDF.
4. Verify precheck runs.
5. Confirm declared conflicts include `coi.reviewer@conferencespace.local`.
6. Final submit.

Expected result:

- final submit should be easiest here because `ICAI26` uses the lenient precheck config
- after successful submit, the chair can inspect COI against the declared conflict

Note:

- For best results, upload a real paper PDF with clear sections.
- The small repo fixture `backend/tests/api/test_paper.pdf` is acceptable for smoke testing upload, but it is not a rich “real paper” fixture.

## D. Author desk rejection / stricter precheck

Login:

- email: `liam.author@conferencespace.local`
- password: `DemoPass123!`

Conference:

- `RSDL26`

Draft already present:

- `Audit Trails for Responsible Reviewer Assignment`

Checks:

1. Open the draft.
2. Upload a weaker / incomplete PDF first.
3. Verify precheck blocks final submit if the decision is not `accept_for_review`.
4. Improve metadata or switch to a stronger PDF and try again.

Expected result:

- this conference is the better place to verify strict desk rejection behavior

## E. Chair COI verification

Login again as:

- `chair.main@conferencespace.local`

Conference:

- `ICAI26`

Checks:

1. Open the COI tab.
2. Verify a conflict involving `coi.reviewer@conferencespace.local` appears after the author submission includes the declared conflict.
3. Open assignment suggestions / assignment UI and confirm COI warnings match the persisted conflict signal.

Expected result:

- declared conflicts should surface in the COI views and assignment warnings

## Operational Notes

### Recent conference archive

The new recent-conference archive is:

- per-user
- per-role
- sidebar-only
- stored in browser `localStorage`

It does **not** change conference status in the backend.

### Conference “archive” vs completed status

Current backend lifecycle status remains:

- `open`
- `reviewing`
- `completed`

So today there are two separate concepts:

1. `completed`:
   lifecycle status in backend
2. archived recent conference:
   user-level sidebar visibility preference

### COI degradation behavior

If Neo4j or richer graph data is not available, COI still has useful signal from:

- declared conflicts
- direct author/reviewer overlap checks

### Desk rejection degradation behavior

If Gemini is not configured, precheck still runs deterministic checks. The results are simpler, but the workflow is still testable.

## Quick Reset Guidance

If you want a clean local environment before reseeding, reset your backend data first, then rerun:

1. backend services reset / clean database
2. `make dev`
3. `go run ./cmd/devseed -base-url http://localhost:8080`

Because the seed command is API-driven and best-effort idempotent, rerunning on a used database usually works, but the cleanest QA pass is still against a fresh local DB.
