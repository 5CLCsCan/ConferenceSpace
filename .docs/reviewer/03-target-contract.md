# 03 - Target Contract (Reviewer)

Last updated: 2026-02-18

This document is the strict implementation contract for reviewer migration in `frontend-v2`.

## 1) Canonical Reviewer Route Family

The reviewer route family must be:

1. `/role/reviewer`
2. `/role/reviewer/conferences`
3. `/role/reviewer/conferences/[conferenceId]/submissions`
4. `/role/reviewer/invitations`
5. `/role/reviewer/completed`
6. `/role/reviewer/assignments/[assignmentId]`

Notes:
- `/role/reviewer` remains reviewer dashboard root, but no longer placeholder-only.
- reviewer flows must not depend on query tabs or `/dashboard/*` routes.

## 2) Canonical Route Parameter Naming

Use these exact names:

- `conferenceId`
- `assignmentId`
- `user_id` (shared profile links)

Do not introduce legacy variants in canonical reviewer routes:
- `paperId`
- generic `id` for assignment execution route segment
- query-tab pseudo-routing (`?tab=conferences`, `?tab=invitations`, `?tab=conference-papers`)

## 3) Source-Of-Truth Decisions

### 3.1 Reviewer page ownership

| Screen | Source-of-truth target |
|---|---|
| Reviewer dashboard root | `frontend-v2/app/role/reviewer/page.tsx` + `frontend-v2/components/reviewer/reviewer-dashboard.tsx` |
| Reviewer conferences list | `frontend-v2/app/role/reviewer/conferences/page.tsx` + `frontend-v2/components/reviewer/reviewer-conferences.tsx` |
| Reviewer invitations | `frontend-v2/app/role/reviewer/invitations/page.tsx` + `frontend-v2/components/reviewer/reviewer-invitations.tsx` |
| Reviewer completed reviews | `frontend-v2/app/role/reviewer/completed/page.tsx` + `frontend-v2/components/reviewer/completed-reviews.tsx` |
| Reviewer conference submissions | `frontend-v2/app/role/reviewer/conferences/[conferenceId]/submissions/page.tsx` + `frontend-v2/components/reviewer/assigned-dashboard.tsx` (or renamed equivalent) |
| Reviewer assignment execution | `frontend-v2/app/role/reviewer/assignments/[assignmentId]/page.tsx` + `frontend-v2/components/reviewer/submission-review.tsx` and `frontend-v2/components/reviewer/submission-review/*` |

### 3.2 Duplicate implementation resolution

1. `SubmissionReviewScreen` stack is canonical reviewer execution UI.
2. `PaperReview` stack is legacy/non-canonical and cleanup candidate.
3. Reviewer execution route contract is assignment-driven (`assignmentId`) even though UI source-of-truth is `SubmissionReviewScreen`.

### 3.3 Shared dependency ownership

1. Shared discussion dependency stays in:
- `frontend-v2/components/shared/discussion/*`

2. Shared rebuttal dependency required by reviewer tabs must exist in target:
- `frontend-v2/components/shared/rebuttal/*`

3. Reviewer-specific APIs must live in target:
- `frontend-v2/lib/api/reviewer.ts`
- `frontend-v2/lib/api/reviews.ts` remains authoritative for assignment review endpoints

## 4) Auth, Session, And Shared Navigation Contract

1. Login success remains `/role` (`frontend-v2/app/login/page.tsx`).
2. Role selection remains explicit on `/role` (`frontend-v2/app/role/page.tsx`).
3. Reviewer routes require authenticated user with reviewer role.
4. Reviewer route family must be protected by reviewer role guard layout:
- `frontend-v2/app/role/reviewer/layout.tsx` using `useRoleRouteGuard("reviewer")`.

Minimum reviewer sidebar contract:
- Dashboard -> `/role/reviewer`
- Conferences -> `/role/reviewer/conferences`
- Invitations -> `/role/reviewer/invitations`
- Completed -> `/role/reviewer/completed`
- Notifications -> `/notifications`
- Role switch -> `/role`

## 5) Assignment Deep-Link Resolver Contract

Assignment execution page (`/role/reviewer/assignments/[assignmentId]`) must resolve `conferenceId` before loading assignment data.

Resolver interface:

- Input:
  - `assignmentId: string`
  - `reviewerEmail: string`
  - `conferenceId?: string | null` (optional query hint)
  - optional cached context (assignment metadata)

- Output:
  - `{ conferenceId: string, source: "query" | "cache" | "lookup" }`
  - or unresolved result:
  - `{ conferenceId: null, source: "unresolved" }`

Resolution order:
1. query hint if provided and valid
2. cached assignment metadata from reviewer navigation flows
3. lookup through available reviewer datasets/endpoints
4. unresolved result

Unresolved behavior:
- render explicit unresolved-assignment state on assignment page
- do not hard-crash
- do not silently redirect without user feedback

## 6) Backend/API Contract (No Backend Changes)

Reviewer migration must use existing API contracts only.

Expected reviewer endpoints already in legacy adapters:
- `GET /api/v1/reviewer/:reviewerEmail/dashboard`
- `GET /api/v1/reviewer/:reviewerEmail/conferences/:conferenceId/papers`
- `GET /api/v1/reviewer/:reviewerEmail/completed-papers`
- `PUT /api/v1/conferences/:conferenceId/reviewers/:reviewerId/status`
- `GET /api/v1/conferences/:conferenceId/assignments/:assignmentId/review`
- `PUT /api/v1/conferences/:conferenceId/assignments/:assignmentId/review`

No endpoint shape changes are allowed in this phase.

## 7) Migration Boundaries

1. Do not change backend contracts or add endpoints.
2. Do not migrate admin.
3. Do not break existing author/chair canonical route families.
4. Do not preserve query-tab reviewer routing in final target.
5. Do not keep active reviewer navigation to legacy dashboard reviewer routes.

## 8) Forbidden Route Strings In Final Reviewer Cutover

The following must not appear in active `frontend-v2` reviewer navigation/flows:

- `/dashboard/reviewer`
- `/dashboard/conference/`
- `?tab=conferences`
- `?tab=invitations`
- `?tab=conference-papers`
- `/reviewer/submissions/[paperId]` route patterns

## 9) Contract Dependencies

No unresolved blocking decisions remain for this role pack as of 2026-02-18.

Implementation must follow locked decisions in:
- `07-risks-and-edge-cases.md` (Locked Decisions section)
