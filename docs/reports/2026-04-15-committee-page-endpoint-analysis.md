# Committee Page Endpoint Analysis

**Date:** 2026-04-15
**Scope:** Frontend committee pages — endpoint usage, data displayed, coauthor/PC visibility

---

## Issue Summary

Both committee pages (chair admin and author public) only display **reviewers** fetched from the reviewers endpoint (`GET /api/v1/conferences/:id/reviewers`). The backend defines PC members and reviewers as **separate roles** (`RolePC = "pc"` vs `RoleReviewer = "reviewer"` in `model/conference.go`), stored in the `conference_user_roles` table. However, the committee pages only query the reviewers endpoint — they do not fetch or display PC members (`role = "pc"`) from the `conference_user_roles` table. Co-authors are also completely missing — there is no endpoint call, no UI section, and no data model support to show co-authorship information on either page. Co-author data exists elsewhere in the system (COI and submission APIs) but is never surfaced on the committee views.

---

## Overview

There are two committee-related pages in the frontend:

1. **Chair Committee Page** — `frontend/components/chair/conference-detail/conference-committee.tsx`
2. **Author Committee Tab** — `frontend/components/author/conference-detail/committee-tab.tsx`

Neither page calls any endpoint to display coauthor data. Both rely exclusively on the reviewers endpoint to show PC (Program Committee) members.

---

## 1. Chair Committee Page (Admin)

**Component:** `frontend/components/chair/conference-detail/conference-committee.tsx`
**Audience:** Conference chairs and PC members with admin access
**Mode:** Full CRUD management

### Endpoints Called

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/conferences/:id/reviewers?limit=200` | GET | Fetch all committee members |
| `/api/v1/conferences/:id/reviewers?limit=1&status=pending` | GET | Get pending invite count |
| `/api/v1/users/search?q=...&limit=10` | GET | Search users when inviting new members |
| `/api/v1/conferences/:id/reviewers` | POST | Invite reviewers (batch) |
| `/api/v1/conferences/:id/reviewers/:reviewer_id` | DELETE | Remove a reviewer |

### Data Displayed

- Total members count, accepted reviewer count, pending invite count
- Area Chairs count (hardcoded to `0` — not yet implemented)
- Per-member: name (derived from email), email, role badge ("Reviewer"), primary track (from `domain[0]`), status (accepted/pending/rejected)
- Assignments column exists but shows "N/A" for all members

### Features

- Filter by role (all / reviewer), status (all / active / invited / declined)
- Text search by name, email, affiliation
- Paginated table (8 per page)
- Invite flow with user search + direct email entry
- Remove reviewer action
- Import CSV / Export buttons (UI only, not wired)
- Respects read-only role (hides invite/remove when `isReadOnlyRole`)

---

## 2. Author Committee Tab (Public)

**Component:** `frontend/components/author/conference-detail/committee-tab.tsx`
**Audience:** Authors and general users viewing a conference
**Mode:** Read-only

### Endpoints Called

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/conferences/:id/reviewers?status=accepted&limit=100` | GET | Fetch accepted PC members only |
| `/api/v1/users/by-email/:email` | GET | Resolve chair/co-chair names (one call per chair) |

### Data Displayed

- **General Chairs section:** Chair and co-chairs from the conference object (`conference.chair`, `conference.co_chairs`), displayed as featured cards with name, email, organization
- **Program Committee section:** Accepted reviewers shown as card grid (1-3 columns), with name, email, and domain/role

### Features

- Google Scholar link on member click
- No filtering, pagination, or management actions
- Only shows accepted reviewers (hides pending/rejected)

---

## Comparison

| Aspect | Chair Page | Author Tab |
|--------|-----------|------------|
| Audience | Chair / PC admin | Authors / public |
| Mode | Full CRUD | Read-only |
| Reviewers shown | All statuses | Accepted only |
| Shows chairs? | No | Yes (featured section) |
| Layout | Data table + pagination | Card grid |
| Filtering | Role, status, text search | None |
| Actions | Invite, remove, edit | View only |
| Coauthor data | Not shown | Not shown |

---

## Key Finding: No Coauthor Data

Neither committee page fetches or displays coauthor information. The coauthor data lives in COI (Conflict of Interest) and submission-related APIs:

- `frontend/lib/api/coi.ts` — COI detection endpoints
- `frontend/components/author/submit/conflicts-step.tsx` — Author conflict declaration
- `frontend/components/author/submit/authors-step.tsx` — Submission coauthor entry

The reviewers endpoint (`GET /api/v1/conferences/:id/reviewers`) returns the following per reviewer:

```
id, user_id, conference_id, email, first_name, last_name, status, domain[], created_at, updated_at
```

No coauthor relationships, co-authorship networks, or COI flags are included in this response.

---

## Backend Route Configuration

From `backend/cmd/server/main.go`:

```
conferences.Group("/:conference_id/reviewers")
  GET ""              → requireChairOrPC → ctrl.Reviewer.List
  GET "/:reviewer_id" → requireChairOrPC → ctrl.Reviewer.Get
  POST ""             → requireChair     → ctrl.Reviewer.BatchInvite
  ...
```

The `List` handler (`backend/internal/controller/reviewer/reviewer.go`) calls `reviewerStorage.List()` with basic pagination/status filters and returns `dto.ReviewerListResponse` containing `[]*dto.Reviewer` — flat reviewer records with no relational data.
