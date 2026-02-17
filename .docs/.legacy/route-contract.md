# Frontend Routing Restructure - Canonical Route Contract

Date: 2026-02-16
Status: Locked for current migration phase

This document is the single source of truth for canonical frontend route paths, route parameter names, access rules, and migration constraints.

## 1) Global Routes

- Homepage: `/`
- Login: `/login`
- Register: `/register`
- Role selector: `/role`
- Notifications: `/notifications`
- Profile: `/profile/[user_id]`

All routes except `/`, `/login`, `/register` are authenticated routes.

## 2) Role Root Dashboards

Role root pages remain dashboard pages, with canonical paths:

- Author dashboard root: `/role/author`
- Reviewer dashboard root: `/role/reviewer`
- Chair dashboard root: `/role/chair`

Note: dashboard behavior is preserved; only path contract changes.

## 3) Canonical Role Families

## Author Family

- Submission list: `/role/author/submissions`
- Submission create: `/role/author/submissions/new`
- Submission detail: `/role/author/submissions/[submissionId]`
- Submission edit: `/role/author/submissions/[submissionId]/edit`
- Conference detail (author-facing): `/role/author/conferences/[conferenceId]`

## Reviewer Family

- Conferences list: `/role/reviewer/conferences`
- Conference submissions list: `/role/reviewer/conferences/[conferenceId]/submissions`
- Invitations list: `/role/reviewer/invitations`
- Completed reviews: `/role/reviewer/completed`
- Review execution: `/role/reviewer/assignments/[assignmentId]`

Rule: reviewer execution routes use `assignmentId` only. Do not use `submissionId` there.

## Chair Family

- Conferences list: `/role/chair/conferences`
- Conference creation: `/role/chair/conferences/new`
- Conference detail: `/role/chair/conferences/[conferenceId]`
- Conference submissions list: `/role/chair/conferences/[conferenceId]/submissions`
- Submission detail: `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
- Schedule: `/role/chair/schedules`

## 4) Canonical Route Parameter Naming

Use these exact parameter names in file-system routes and route builders:

- `conferenceId`
- `submissionId`
- `assignmentId`
- `user_id`

Do not introduce alternate names (`paperId`, `id`, `submission_id`, etc.) for canonical routes.

## 5) Access And Visibility Rules

## Authentication

- Protected routes require authenticated user.
- After successful login, always route to `/role`.
- Role must be explicitly re-selected after each login.

## Profile Visibility

- All authenticated users may view public profile fields of any user.
- `/profile/[user_id]` is canonical for self and non-self profile views.

## Chair Explore/Archived Behavior

- Public route `/conference/[id]` is not supported.
- Explore/Archived conference cards must:
  - navigate to `/role/chair/conferences/[conferenceId]` if accessible
  - show disabled/no-access state otherwise

Current data-model constraint:

- No explicit accessibility field currently exists in `ExploreConference`.
- Access must be derived from frontend-known accessible conference ids.

## 6) Backend Compatibility Constraints

- No backend changes in this migration.
- Profile backend remains email-keyed.
- Frontend must resolve `user_id -> email` before calling profile endpoints.

Allowed profile endpoint usage:

- `/api/v1/users/me`
- `/api/v1/users/{email}`

## 7) Legacy Route Decommissioning

Legacy routes are allowed only as short-lived migration wrappers during implementation. They must be removed before release.

Routes to decommission from active UI navigation:

- `/dashboard/*`
- `/author/conference/*`
- `/conference/[id]` (public)
- reviewer `?tab=` query-tab navigation patterns

## 8) Migration Order

Required order:

1. Author
2. Reviewer
3. Chair

## 9) Scope Boundaries

- Admin route migration is excluded from this phase.
- All route migration work in this phase is frontend-only.

## 10) Decision Locks Remaining (Requires Product Input)

These items must be explicitly resolved to eliminate migration ambiguity and guarantee release-safe implementation.

1. Chair review-detail canonical route is not locked.
   - Current legacy behavior references: `/dashboard/conference/[id]/review/[reviewId]`
   - Related files:
     - `frontend/app/dashboard/conference/[id]/review/[reviewId]/page.tsx`
     - `frontend/components/chair/submission-review-tab.tsx`

2. Shared submission-detail ownership is not locked.
   - Current mixed usage references: `/dashboard/conference/[id]/submission/[submissionId]`
   - Related files:
     - `frontend/app/dashboard/conference/[id]/submission/[submissionId]/page.tsx`
     - `frontend/components/author/author-submissions-list.tsx`

3. Reviewer review UI source-of-truth is not locked.
   - Two active implementations exist:
     - assignment-driven `PaperReview`
     - conference-paper route-driven `SubmissionReviewScreen`
   - Related files:
     - `frontend/app/dashboard/reviewer/papers/[id]/page.tsx`
     - `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx`
     - `frontend/components/reviewer/paper-review.tsx`
     - `frontend/components/reviewer/submission-review.tsx`

4. Author submission detail source-of-truth is not locked.
   - One flow is mock-data based; another is API-backed.
   - Related files:
     - `frontend/app/dashboard/author/papers/[id]/page.tsx`
     - `frontend/app/dashboard/conference/[id]/submission/[submissionId]/page.tsx`

5. Profile resolver fallback behavior is not locked.
   - Open question: what should `/profile/[user_id]` do when frontend cannot resolve `user_id -> email`?

6. Reviewer assignment deep-link fallback behavior is not locked.
   - Open question: what should `/role/reviewer/assignments/[assignmentId]` do when `conferenceId` cannot be resolved?

7. Invalid/dead legacy route behavior is not locked.
   - Detected dead link: `/dashboard/chair/tasks`
   - Related file:
     - `frontend/components/chair/chair-dashboard.tsx`
