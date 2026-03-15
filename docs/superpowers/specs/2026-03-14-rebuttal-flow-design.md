# Rebuttal Flow Design

**Date:** 2026-03-14
**Branch:** Rebuttal
**Status:** Approved

## Overview

Implement a complete, pure-text rebuttal flow (Option A) for ConferenceSpace. Authors respond to reviewer comments in text only — no paper revision allowed. The flow is chair-controlled at the conference level, with individual submission tracking. Authors are locked after submitting. Reviewers can update post-rebuttal scores. Discussion phase is optional.

---

## State Machine

### Conference-level (`conferences.rebuttal_phase`)
```
not_started → awaiting → submitted → discussion (optional) → finalized
```

### Submission-level (`conference_submissions.rebuttal_phase`)
Tracks individual progress within the conference phase.

**Effective phase** = `MIN(conference_phase, submission_phase)`

**Rules:**
- Chair drives conference-level transitions via explicit API actions
- Author drives `awaiting → submitted` for their own submission
- Author edits are locked after submit — no re-submission
- If author does not submit before deadline → auto-advanced to `finalized` with no rebuttal on record
- Deadline auto-finalization runs hourly via cron job

---

## Data Model Changes

### Migration: add to `conferences` table
```sql
rebuttal_enabled         BOOLEAN DEFAULT false
rebuttal_phase           VARCHAR(20) DEFAULT 'not_started'
rebuttal_start_at        TIMESTAMPTZ
rebuttal_deadline        TIMESTAMPTZ
char_limit_general       INT DEFAULT 3000
char_limit_per_point     INT DEFAULT 1000
allow_discussion         BOOLEAN DEFAULT false
```

### Migration: add to `paper_assignments` table
```sql
post_rebuttal_score          INT
post_rebuttal_recommendation VARCHAR(20)   -- accept | reject | borderline
post_rebuttal_comment        TEXT
post_rebuttal_updated_at     TIMESTAMPTZ
```

No new tables required. Existing `rebuttal_points` table is sufficient.

---

## Backend API

### New: Chair Endpoints (conference controller)
```
PATCH /api/v1/conferences/{id}/rebuttal/settings      — save rebuttal config
GET   /api/v1/conferences/{id}/rebuttal/settings      — get rebuttal config
POST  /api/v1/conferences/{id}/rebuttal/open          — transition not_started → awaiting (bulk all eligible submissions)
POST  /api/v1/conferences/{id}/rebuttal/finalize      — transition any → finalized (bulk)
POST  /api/v1/conferences/{id}/rebuttal/open-discussion — transition submitted → discussion (requires allow_discussion=true)
```

### New: Reviewer Endpoint
```
PUT /api/v1/conferences/{id}/assignments/{assignment_id}/post-rebuttal-score
    Body: { score, recommendation, comment }
```

### Hardened: Existing Endpoints
- `PUT /submissions/{id}/rebuttal` — block if conference `rebuttal_phase != awaiting`; enforce `char_limit_general` and `char_limit_per_point`
- `PUT /assignments/{id}/rebuttal/acknowledge` — block if submission `rebuttal_phase != submitted`
- `PUT /assignments/{id}/rebuttal/points/{point_id}/acknowledge` — block if reviewer has no submitted review for this submission

### Cron Job
- Runs every hour
- If `rebuttal_deadline` has passed and conference `rebuttal_phase` is not `finalized` → auto-finalize (bulk-update all submissions)

---

## Frontend

### Chair (new components)
- **Rebuttal Settings Tab** in conference settings page
  - Toggle: Enable Rebuttal Phase
  - Date pickers: Start Date, Deadline
  - Number inputs: Char limit (general), Char limit (per point)
  - Toggle: Allow Discussion Phase
  - Save → calls `PATCH /rebuttal/settings`

- **Rebuttal Management Page** in chair dashboard
  - Phase status banner: "Current Phase: AWAITING"
  - Action buttons: Open Rebuttal / Open Discussion / Finalize Rebuttal
  - Submission overview table: Paper title | Rebuttal status | Reviewers acknowledged (2/3) | Has response
  - Filter by status

### Author (update `rebuttal-tab.tsx`)
Phase-aware rendering:
- `not_started` → "Rebuttal period not yet open"
- `awaiting` → editable form, deadline countdown, char limit counter (hard block at limit), Submit button
- `submitted` → locked view, acknowledgment progress ("2 of 3 reviewers acknowledged"), per-point ack status
- `finalized` → locked read-only, final outcome

### Reviewer (update `rebuttal-tab.tsx`)
Phase-aware rendering:
- `awaiting` → "Author hasn't submitted yet"
- `submitted` → full rebuttal view, per-point ack buttons, "Mark all read" shortcut, post-rebuttal score form (score + recommendation + comment)
- `finalized` → locked read-only

---

## Notifications

| Event | Recipients |
|---|---|
| Chair opens rebuttal period | All authors with submissions under review |
| Author submits rebuttal | All assigned reviewers for that submission |
| Reviewer acknowledges all points | Author of the submission |
| Chair finalizes rebuttal | All authors + reviewers |
| 24h before deadline | Authors who haven't submitted yet |

Uses existing notification system.

---

## Task List & Execution Order

| # | Task | Layer | Depends On |
|---|---|---|---|
| T1 | Migration: add rebuttal config to conferences + post-rebuttal score to assignments | Backend | — |
| T2 | Conference rebuttal settings API (PATCH/GET) | Backend | T1 |
| T3 | Phase transition endpoints (open, finalize, open-discussion) | Backend | T1 |
| T4 | Validation hardening on existing endpoints + cron auto-finalize | Backend | T1 |
| T5 | Post-rebuttal score endpoint for reviewers | Backend | T1 |
| T6 | Notifications for all rebuttal events | Backend | T3 |
| T7 | Chair: Rebuttal settings UI in conference settings | Frontend | T2 |
| T8 | Chair: Rebuttal management page (phase control + overview table) | Frontend | T3 |
| T9 | Author rebuttal tab — phase-aware, ack progress, char limit enforcement | Frontend | T4 |
| T10 | Reviewer rebuttal tab — phase-aware, ack buttons, post-score form | Frontend | T4, T5 |

**Execution order:**
```
T1
 ├── T2 → T7
 ├── T3 → T6, T8
 ├── T4 → T9
 └── T5 → T10
```
T2, T3, T4, T5 can run in parallel after T1.
T7, T8, T9, T10 can run in parallel after their respective backend tasks.

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Paper revision allowed? | No (Option A) | Standard academic practice (NeurIPS, ICML, CVPR) |
| Author can edit after submit? | No — locked | Prevents gaming, consistent with paper submission |
| Reviewer score updates? | Yes, optional via post_rebuttal_score | Common in real conferences |
| Discussion phase mandatory? | No — chair opt-in via allow_discussion flag | Keeps default flow simple |
| Deadline auto-finalize? | Yes — hourly cron | Reduces chair operational burden |
| Author not submitting? | Auto-finalized with no rebuttal | Clean state, no limbo |
