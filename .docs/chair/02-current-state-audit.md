# 02 - Current State Audit (Chair)

Last updated: 2026-02-18

## 1) Route Topology Inventory

### 1.1 Legacy route topology (`frontend/app`)

Chair-related runtime routes in legacy:

| Route | Source file | Notes |
|---|---|---|
| `/dashboard/chair` | `frontend/app/dashboard/chair/page.tsx` | Chair dashboard root |
| `/dashboard/conference` | `frontend/app/dashboard/conference/page.tsx` | Chair conference list entry |
| `/dashboard/chair/create-conference` | `frontend/app/dashboard/chair/create-conference/page.tsx` | Conference creation wizard |
| `/dashboard/chair/conference/[id]` | `frontend/app/dashboard/chair/conference/[id]/page.tsx` | Conference detail tabs |
| `/dashboard/chair/conference/[id]/submission/[submissionId]` | `frontend/app/dashboard/chair/conference/[id]/submission/[submissionId]/page.tsx` | Submission detail |
| `/dashboard/chair/schedules` | `frontend/app/dashboard/chair/schedules/page.tsx` | Schedules/calendar |
| `/dashboard/conference/[id]/review/[reviewId]` | `frontend/app/dashboard/conference/[id]/review/[reviewId]/page.tsx` | Review detail page used by chair review list |

### 1.2 Target route topology (`frontend-v2/app`)

Chair route state in target:

| Route | Source file | Status |
|---|---|---|
| `/role/chair` | `frontend-v2/app/role/chair/page.tsx` | Placeholder only |
| `/role/chair/conferences` | N/A | Missing |
| `/role/chair/conferences/new` | N/A | Missing |
| `/role/chair/conferences/[conferenceId]` | N/A | Missing |
| `/role/chair/conferences/[conferenceId]/submissions` | N/A | Missing |
| `/role/chair/conferences/[conferenceId]/submissions/[submissionId]` | N/A | Missing |
| `/role/chair/schedules` | N/A | Missing |

Additional target context:
- Author canonical family exists under `/role/author/*`.
- Reviewer is also placeholder-only at `/role/reviewer`.

## 2) Duplicated And Conflicting Implementations

## 2.1 Duplicate "conference list" implementations with conflicting ownership

- Author-owned list:
  - `frontend-v2/components/author/author-conferences.tsx`
- Chair-leaning but ambiguously named list:
  - `frontend-v2/components/conference/author-conferences.tsx`

Conflict:
- One file name (`author-conferences.tsx`) is used in both author and chair contexts across legacy/target history.
- This creates migration ambiguity and import mistakes.

## 2.2 Conflicting path patterns still present

Detected conflicting patterns:
- Public-like route push still present in target:
  - `frontend-v2/components/conference/author-conferences.tsx` -> `router.push(\`/conference/${id}\`)`
- Legacy dashboard chair routes remain heavily embedded in legacy chair components:
  - `frontend/components/chair/conference-detail/conference-submissions.tsx`
  - `frontend/components/chair/conference-detail/submission-detail-header.tsx`
  - `frontend/components/chair/submission-review-tab.tsx`

## 2.3 Mixed role ownership in author detail route

- `frontend-v2/app/role/author/submissions/[submissionId]/page.tsx` allows `author` and `chair`.
- `frontend-v2/components/author/submission-detail/index.tsx` conditionally renders chair review UI (`SubmissionReviewTab`) inside author page tabs.

This means part of chair behavior currently depends on author route runtime.

## 3) Role-Specific Flow Entry Points (Current)

Current chair entry points in target:

1. Role selector:
- `frontend-v2/app/role/page.tsx` routes `chair` -> `/role/chair`.

2. Shared nav links:
- `frontend-v2/components/dashboard-header.tsx` includes chair link to `/role/chair`.
- `frontend-v2/app/notifications/page.tsx` includes chair dashboard menu item to `/role/chair`.

3. Chair-like conference card component (not currently routed as canonical chair page):
- `frontend-v2/components/conference/author-conferences.tsx`.

## 4) API Usage Audit For Chair Flows

## 4.1 Legacy chair API usage

| Flow | File | APIs used |
|---|---|---|
| Create conference | `frontend/app/dashboard/chair/create-conference/page.tsx` | `createConference` from `@/lib/api/conferences` |
| Submission review analytics/list | `frontend/components/chair/submission-review-tab.tsx` | `getSubmissionReviews`, `getSubmissionReviewAnalytics` from `@/lib/api/reviews` |
| Review detail page | `frontend/app/dashboard/conference/[id]/review/[reviewId]/page.tsx` | `getAssignmentReview`, `getPaperById` |

## 4.2 Target chair API usage

Current target chair usage is limited:
- `frontend-v2/components/chair/submission-review-tab.tsx` still uses `getSubmissionReviews` and `getSubmissionReviewAnalytics`.
- No target route currently uses `createConference`.
- Chair placeholder route has no business API calls (`frontend-v2/app/role/chair/page.tsx`).

## 4.3 API capability available but not wired to chair routes

Reusable endpoints in target API layer:
- `frontend-v2/lib/api/conferences.ts`
- `frontend-v2/lib/api/submissions.ts`
- `frontend-v2/lib/api/reviews.ts`

Gap:
- API surface exists, but route/page wiring for chair canonical paths is missing.

## 5) Cross-Role Coupling Points Affecting Migration Order

1. Author route currently doubles as partial chair experience:
- `frontend-v2/app/role/author/submissions/[submissionId]/page.tsx`
- `frontend-v2/components/author/submission-detail/index.tsx`

2. Chair conference list logic lives in generic `conference` folder:
- `frontend-v2/components/conference/author-conferences.tsx`
- `frontend-v2/components/conference/*` support files.

3. Shared shell components control chair reachability and must be kept aligned:
- `frontend-v2/components/dashboard-header.tsx`
- `frontend-v2/components/dashboard-sidebar.tsx`
- `frontend-v2/app/notifications/page.tsx`

## 6) Migrated Vs Pending Summary

### 6.1 Already migrated (chair-adjacent)

- Login to role selection (`/login` -> `/role`) in `frontend-v2/app/login/page.tsx`.
- Role selection page with chair option in `frontend-v2/app/role/page.tsx`.
- Shared profile and notifications routes are canonical in target.

### 6.2 Pending for chair migration

- All functional chair routes under `/role/chair/*`.
- Chair conference/create/schedules/submission-detail page implementations.
- Chair-specific source-of-truth component placement and naming cleanup.
- Removal of chair behavior leakage in author route stack.

## 7) Audit Conclusion

`frontend-v2` has foundational shared/auth infrastructure and API clients ready, but chair business flows are still effectively unmigrated. Legacy `frontend` remains the only complete chair implementation, with route conventions and component naming that must be normalized before safe cutover.

