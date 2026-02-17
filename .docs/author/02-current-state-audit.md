# 02 - Current State Audit (Public + Shared + Author)

Last updated: 2026-02-17

This audit captures only the portions relevant to this phase.

## 1) Current Route Topology In Legacy `frontend`

Public:
- `/` -> `frontend/app/page.tsx`
- `/login` -> `frontend/app/login/page.tsx`
- `/register` -> `frontend/app/register/page.tsx`

Shared:
- `/role` -> `frontend/app/role/page.tsx`
- `/notifications` -> `frontend/app/notifications/page.tsx`
- `/dashboard` -> redirect page `frontend/app/dashboard/page.tsx`
- `/dashboard/notifications` -> duplicate notifications page `frontend/app/dashboard/notifications/page.tsx`
- `/dashboard/users/[email]` -> profile page `frontend/app/dashboard/users/[email]/page.tsx`

Author:
- `/dashboard/author` -> `frontend/app/dashboard/author/page.tsx`
- `/dashboard/author/submissions` -> `frontend/app/dashboard/author/submissions/page.tsx`
- `/dashboard/author/submit` -> `frontend/app/dashboard/author/submit/page.tsx`
- `/dashboard/author/papers/[id]` -> `frontend/app/dashboard/author/papers/[id]/page.tsx` (mock-data path)
- `/author/conference/[id]` -> `frontend/app/author/conference/[id]/page.tsx`
- `/dashboard/conference/[id]/submission/[submissionId]` -> `frontend/app/dashboard/conference/[id]/submission/[submissionId]/page.tsx` (API-backed author submission detail)

## 2) Current Auth/Role Flow Behavior

Current behavior in code:
1. Login success pushes to `/dashboard` (`frontend/app/login/page.tsx`).
2. `/dashboard` immediately redirects to `/role` (`frontend/app/dashboard/page.tsx`).
3. Role selection pushes to `/dashboard/${role}` (`frontend/app/role/page.tsx`).

Result:
- Indirect double-hop flow.
- Not aligned with target canonical `/role` -> `/role/{role}` path model.

## 3) Shared Navigation State

### 3.1 Sidebar

`frontend/components/dashboard-sidebar.tsx`:
- Active-link logic explicitly supports query-tab matching with `?tab=`.
- Contains static mock recent conference list (non-route-critical but shared UI concern).

### 3.2 Header

`frontend/components/dashboard-header.tsx` currently routes to legacy destinations:
- Author role links: `/dashboard/author`, `/dashboard/author/submissions`
- Notifications dropdown "see all": `/dashboard/notifications`
- Profile menu: `/dashboard/users/me`
- Switch role action: `/dashboard` (indirectly to `/role` via redirect page)

## 4) Notifications Duplication

Two separate implementations exist:

1. Canonical candidate: `frontend/app/notifications/page.tsx`
- Uses `DashboardSidebar`
- Uses `MOCK_NOTIFICATIONS` for UI rendering
- Role-specific menu arrays still include legacy links

2. Legacy duplicate: `frontend/app/dashboard/notifications/page.tsx`
- Uses `DashboardHeader`
- Uses `NotificationList` and API-backed `useNotifications`

This duplication is a primary source of route confusion in shared layer.

## 5) Author Domain: Current Behavior And Inconsistencies

### 5.1 Author dashboard page

`frontend/app/dashboard/author/page.tsx` renders `AuthorConferences` and uses sidebar links under `/dashboard/author/*`.

### 5.2 Conference detail path split

Author conference navigation in components:
- `frontend/components/author/author-conferences.tsx`
- `frontend/components/author/author-dashboard.tsx` (unused component)

Both push to `/author/conference/${id}`.

### 5.3 Submissions list to detail

`frontend/components/author/author-submissions-list.tsx` pushes:
- `/dashboard/conference/${conference_id}/submission/${submission_id}`

This path is not author-namespaced and currently acts as shared submission detail route.

### 5.4 Submit/edit flow

`frontend/components/author/conference-detail/conference-header.tsx` pushes:
- `/dashboard/author/submissions?conference=${conferenceId}`
- `/dashboard/author/submit?conference=${conferenceId}`

`frontend/components/author/submission-detail/submission-header.tsx` links:
- back to `/dashboard/author/submissions`
- conference link to `/dashboard/conference/${conferenceId}`
- edit link to `/dashboard/author/submit?conference=${conferenceId}&edit=${submission.id}`

`frontend/components/author/submit/paper-submission-form.tsx` success action pushes:
- `/dashboard/conference/${conference?.id}`

### 5.5 Two author detail implementations

1. Mock-based detail path:
- `frontend/app/dashboard/author/papers/[id]/page.tsx`
- uses `mockPapers` and `PaperDetailView`

2. API-backed detail path:
- `frontend/app/dashboard/conference/[id]/submission/[submissionId]/page.tsx`
- uses `getSubmissionById` + `getConferenceById`
- renders `SubmissionDetailView`

This duplication must be resolved in canonical contract.

### 5.6 Unused legacy author component

`frontend/components/author/author-dashboard.tsx` is not imported by any app route.

## 6) Shared Profile Behavior

Current profile route:
- `/dashboard/users/[email]` in `frontend/app/dashboard/users/[email]/page.tsx`

Current fetch behavior:
- self: `/api/v1/users/me`
- other: `/api/v1/users/${email}`

Current header profile entry point:
- `frontend/components/dashboard-header.tsx` -> `/dashboard/users/me`

Target requirement in this phase:
- canonical route `/profile/[user_id]`
- frontend-only `user_id -> email` resolution

## 7) API Layer Used By Public/Shared/Author

### 7.1 Auth

- login route proxy: `frontend/app/api/v1/auth/login/route.ts`
- logout route proxy: `frontend/app/api/v1/auth/logout/route.ts`
- auth context: `frontend/lib/auth-context.tsx`
- session manager: `frontend/lib/session-manager.ts`

### 7.2 API proxy

- backend passthrough route: `frontend/app/api/backend/[...path]/route.ts`
- fetch helper: `frontend/lib/api/client.ts`

### 7.3 Author data APIs

- conferences: `frontend/lib/api/conferences.ts`
- submissions: `frontend/lib/api/submissions.ts`
- papers submit/update: `frontend/lib/api/papers.ts`

### 7.4 Notifications

- hook: `frontend/hooks/use-notifications.ts`
- API: `frontend/lib/api/notifications.ts`

## 8) Critical Edge Cases To Preserve

1. Role reset on entering `/role` is currently implemented via `resetRole()` in `frontend/app/role/page.tsx`.
2. Author submit page supports both create and edit via query params (`conference`, `edit`).
3. Submission detail page currently allows both author and chair role checks.
4. Notifications unread badge in sidebar/header uses `useNotifications({ limit: 1 or 5 })`.
5. Profile page supports viewing other users by email slug today; new slug will be user id.

## 9) Audit Conclusion

The author/public/shared scope is traceable but has three major inconsistencies that must be normalized in `frontend-v2`:

1. Legacy route namespace usage (`/dashboard/*`, `/author/conference/*`).
2. Duplicate feature pages (notifications, author submission detail).
3. Shared navigation still hardcoded to legacy links.

These are fully addressable in this phase without backend changes.
