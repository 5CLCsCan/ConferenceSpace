# 03 - Target Contract (Chair)

Last updated: 2026-02-18

This document is the strict implementation contract for chair migration in `frontend-v2`.

## 1) Canonical Chair Route Family

The chair route family must be:

1. `/role/chair`
2. `/role/chair/conferences`
3. `/role/chair/conferences/new`
4. `/role/chair/conferences/[conferenceId]`
5. `/role/chair/conferences/[conferenceId]/submissions`
6. `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
7. `/role/chair/schedules`

Notes:
- `/role/chair` remains a dashboard root, but no longer placeholder-only.
- No chair flow should require `/dashboard/chair*` or `/dashboard/conference*`.

## 2) Canonical Route Parameter Naming

Use these exact names:

- `conferenceId`
- `submissionId`
- `user_id` (shared profile links)

Do not introduce legacy variants in canonical routes:
- `id` for chair conference routes
- mixed singular/plural submission path segments
- query-driven tab paths like `?tab=submissions`

## 3) Source-Of-Truth Decisions

## 3.1 Chair page ownership

| Screen | Source-of-truth target |
|---|---|
| Chair dashboard root | `frontend-v2/app/role/chair/page.tsx` + `frontend-v2/components/chair/chair-dashboard.tsx` |
| Chair conferences list | `frontend-v2/app/role/chair/conferences/page.tsx` + `frontend-v2/components/chair/chair-conferences.tsx` |
| Chair conference detail | `frontend-v2/app/role/chair/conferences/[conferenceId]/page.tsx` + `frontend-v2/components/chair/conference-detail/*` |
| Chair submission detail | `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` + `frontend-v2/components/chair/conference-detail/submission-detail/*` |
| Chair schedules | `frontend-v2/app/role/chair/schedules/page.tsx` |
| Chair conference creation | `frontend-v2/app/role/chair/conferences/new/page.tsx` + `frontend-v2/components/wizard/creation/*` |

## 3.2 Duplicate implementation resolution

1. `frontend-v2/components/conference/author-conferences.tsx` is not the final source-of-truth for chair naming.
2. Chair conference list must be explicitly role-named (`chair-conferences`) to avoid author/chair naming collision.
3. `frontend-v2/components/author/author-conferences.tsx` remains author-only.

## 3.3 Author route isolation after cutover

- `/role/author/*` stays canonical for author flows.
- Chair runtime should not rely on author route internals for primary chair workflows.
- Chair access must be removed from `/role/author/submissions/[submissionId]` at cutover.

## 3.4 Chair review detail and explore/archive behavior

- No dedicated chair review-detail route is allowed.
- Review detail must remain embedded in `/role/chair/conferences/[conferenceId]/submissions/[submissionId]` tabs.
- Chair conference lists (including explore/archive views) rely on backend-filtered accessibility; do not add client-side unknown-access fallback logic.

## 4) Auth, Session, And Shared Navigation Contract

1. Login success remains `/role` (`frontend-v2/app/login/page.tsx`).
2. Role selection remains explicit on `/role` (`frontend-v2/app/role/page.tsx`).
3. Chair pages require authenticated user with `chair` role.
4. Sidebar/header chair links must resolve to canonical chair routes only.

Minimum chair sidebar contract:
- Dashboard -> `/role/chair`
- Conferences -> `/role/chair/conferences`
- Schedules -> `/role/chair/schedules`
- Notifications -> `/notifications`
- Role switch -> `/role`

## 5) Backend/API Contract (No Backend Changes)

Chair migration must use existing APIs only.

Expected endpoints:

- `GET /api/v1/conferences`
- `GET /api/v1/conferences/:conferenceId`
- `POST /api/v1/conferences`
- `PUT /api/v1/conferences/:conferenceId`
- `GET /api/v1/conferences/:conferenceId/submissions`
- `GET /api/v1/conferences/:conferenceId/submissions/:submissionId`
- `GET /api/v1/conferences/:conferenceId/submissions/:submissionId/reviews`
- `GET /api/v1/conferences/:conferenceId/submissions/:submissionId/reviews/analytics`

## 6) Migration Boundaries

1. Do not change backend contracts or add endpoints.
2. Do not migrate reviewer full experience as part of this pack.
3. Do not migrate admin.
4. Do not reintroduce public conference route (`/conference/[id]`).
5. Do not keep active chair navigation to legacy dashboard routes in `frontend-v2`.

## 7) Forbidden Route Strings In Final Chair Cutover

The following must not appear in active `frontend-v2` chair navigation:

- `/dashboard/chair`
- `/dashboard/conference`
- `/dashboard/chair/tasks`
- `?tab=submissions`
- `/conference/${id}`

## 8) Contract Dependencies

No open blocking decisions remain for this role pack as of 2026-02-18.

Implementation must follow locked decisions in:
- `07-risks-and-edge-cases.md` (Locked Decisions section)
