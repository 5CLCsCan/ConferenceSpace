# 02 - Current State Audit (Reviewer)

Last updated: 2026-02-18

## 1) Route Topology Inventory

### 1.1 Legacy route topology (`frontend/app`)

Reviewer-related runtime routes in legacy:

| Route | Source file | Notes |
|---|---|---|
| `/dashboard/reviewer` | `frontend/app/dashboard/reviewer/page.tsx` | Query-tab dashboard (`tab=conferences`, `tab=invitations`) |
| `/dashboard/reviewer/completed` | `frontend/app/dashboard/reviewer/completed/page.tsx` | Completed reviews list |
| `/dashboard/reviewer/papers/[id]` | `frontend/app/dashboard/reviewer/papers/[id]/page.tsx` | Assignment execution (API-backed) |
| `/dashboard/conference/[id]/reviewer/assigned` | `frontend/app/dashboard/conference/[id]/reviewer/assigned/page.tsx` | Conference-specific assigned papers |
| `/dashboard/conference/[id]/reviewer/submissions/[paperId]` | `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx` | Alternate execution path using `paperId` naming |

### 1.2 Target route topology (`frontend-v2/app`)

Reviewer route state in target:

| Route | Source file | Status |
|---|---|---|
| `/role/reviewer` | `frontend-v2/app/role/reviewer/page.tsx` | Placeholder only |
| `/role/reviewer/conferences` | N/A | Missing |
| `/role/reviewer/conferences/[conferenceId]/submissions` | N/A | Missing |
| `/role/reviewer/invitations` | N/A | Missing |
| `/role/reviewer/completed` | N/A | Missing |
| `/role/reviewer/assignments/[assignmentId]` | N/A | Missing |

Additional target context:
- Author route family is already implemented under `/role/author/*`.
- Chair route family is already implemented under `/role/chair/*`.

## 2) Duplicated And Conflicting Implementations

### 2.1 Duplicate reviewer execution implementations

1. `PaperReview` path (legacy API-backed):
- `frontend/app/dashboard/reviewer/papers/[id]/page.tsx`
- `frontend/components/reviewer/paper-review.tsx`

2. `SubmissionReviewScreen` path (legacy mock-first):
- `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx`
- `frontend/components/reviewer/submission-review.tsx`
- `frontend/components/reviewer/submission-review/*`

Conflict:
- two parallel execution UIs with different route semantics and data assumptions.

### 2.2 Query-tab routing still drives legacy reviewer navigation

Legacy reviewer dashboard relies on query tabs:
- `frontend/app/dashboard/reviewer/page.tsx`
- tab patterns in active use: `?tab=conferences`, `?tab=invitations`, `?tab=conference-papers`

Impact:
- not aligned with canonical reviewer page-routed family required in target.

### 2.3 Parameter naming drift (`paperId` vs assignment identity)

Evidence:
- `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx`
- `frontend/components/reviewer/assigned-dashboard.tsx` pushes `/dashboard/conference/${conferenceId}/reviewer/submissions/${paperId}`
- `frontend/app/dashboard/reviewer/papers/[id]/page.tsx` treats route id as assignment id

Impact:
- execution identity is ambiguous unless canonicalized to `assignmentId`.

## 3) Role-Specific Flow Entry Points (Current)

Current reviewer entry points in target:

1. Role selector:
- `frontend-v2/app/role/page.tsx` routes reviewer to `/role/reviewer`.

2. Shared header links:
- `frontend-v2/components/dashboard-header.tsx` reviewer links currently point only to `/role/reviewer`.

3. Notifications reviewer menu:
- `frontend-v2/app/notifications/page.tsx` reviewer menu includes dashboard + notifications only.

4. Reviewer route:
- `frontend-v2/app/role/reviewer/page.tsx` placeholder, no reviewer business flow reachable.

## 4) API Usage Audit For Reviewer Flows

### 4.1 Legacy reviewer API usage

| Flow | Files | API modules used |
|---|---|---|
| Reviewer dashboard/conferences/invitations | `frontend/app/dashboard/reviewer/page.tsx` | `frontend/hooks/use-reviewer-dashboard.ts` -> `frontend/lib/api/reviewer.ts` |
| Conference papers | `frontend/components/reviewer/assigned-dashboard.tsx` | `frontend/hooks/use-conference-papers.ts` -> `frontend/lib/api/reviewer.ts` |
| Completed reviews | `frontend/components/reviewer/completed-reviews.tsx` | `frontend/hooks/use-completed-reviews.ts` -> `frontend/lib/api/reviews.ts` |
| Assignment review get/save | `frontend/components/reviewer/paper-review.tsx` | `frontend/hooks/use-assignment-review.ts` -> `frontend/lib/api/reviews.ts` |
| Invitation response | `frontend/components/reviewer/reviewer-invitations.tsx` | `frontend/lib/api/reviewer.ts` |

### 4.2 Target reviewer API usage

Current target status:
- `frontend-v2/lib/api/reviews.ts` exists (assignment/conference review endpoints available).
- `frontend-v2/lib/api/reviewer.ts` does not exist.
- no reviewer pages/components currently consume reviewer endpoints in target runtime.

Gap:
- target has partial API foundation only; reviewer-specific API adapter and consumers are missing.

## 5) Cross-Role Coupling Points Affecting Reviewer Migration

1. Shared header reviewer links are not yet reviewer-flow complete:
- `frontend-v2/components/dashboard-header.tsx`

2. Shared notifications reviewer sidebar lacks reviewer subroutes:
- `frontend-v2/app/notifications/page.tsx`

3. Role guard pattern exists but not applied to reviewer family:
- utility: `frontend-v2/lib/use-role-route-guard.ts`
- applied for chair only via `frontend-v2/app/role/chair/layout.tsx`

4. Shared discussion is already present in target and reusable:
- `frontend-v2/components/shared/discussion/*`

5. Shared rebuttal stack needed by reviewer submission-review tabs is absent in target:
- present only in legacy at `frontend/components/shared/rebuttal/*`

## 6) Migrated Vs Pending Summary

### 6.1 Already migrated (reviewer-adjacent shared foundation)

- Login to role selection (`/login` -> `/role`) in `frontend-v2/app/login/page.tsx`.
- Role selection route and reviewer entry card in `frontend-v2/app/role/page.tsx`.
- Canonical shared notifications and profile routes (`/notifications`, `/profile/[user_id]`).
- Role access/session infrastructure in `frontend-v2/lib/auth-context.tsx` and `frontend-v2/lib/session-manager.ts`.

### 6.2 Pending for reviewer migration

- All functional reviewer routes beyond `/role/reviewer`.
- Reviewer component stack in target.
- Reviewer API adapter and reviewer hooks in target.
- Canonical assignment execution page and conference resolver.
- Shared rebuttal dependency migration for submission-review tabs.
- Shared nav updates to include canonical reviewer subroutes.

## 7) Audit Conclusion

`frontend-v2` has shared auth and global route foundations, but reviewer business flows are effectively unmigrated. Legacy `frontend` still contains the only complete reviewer implementation, including duplicated execution UIs and query-tab routing that must be normalized under one canonical reviewer contract.
