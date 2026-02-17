# 05 - File Mapping (Legacy `frontend` -> `frontend-v2`)

Last updated: 2026-02-17

This mapping is authoritative for this phase.

Legend:
- Action `Copy`: copy as-is first, then refactor imports/routes.
- Action `Refactor`: copy then modify behavior to match `03-target-contract.md`.
- Action `New`: create new file in `frontend-v2`.
- Action `Delete-Legacy`: delete from `frontend` only after validation gates pass.

## A) Bootstrap / Runtime Foundation

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/package.json` | `frontend-v2/package.json` | Copy | Keep scripts/deps aligned for migration speed |
| `frontend/tsconfig.json` | `frontend-v2/tsconfig.json` | Copy | Keeps `@/*` alias |
| `frontend/next.config.mjs` | `frontend-v2/next.config.mjs` | Copy | Baseline Next behavior |
| `frontend/postcss.config.mjs` | `frontend-v2/postcss.config.mjs` | Copy | Required by Tailwind pipeline |
| `frontend/components.json` | `frontend-v2/components.json` | Copy | UI generator config |
| `frontend/.eslintrc.json` | `frontend-v2/.eslintrc.json` | Copy | Lint parity |
| `frontend/prettier.config.cjs` | `frontend-v2/prettier.config.cjs` | Copy | Formatting parity |
| `frontend/.env.example` | `frontend-v2/.env.example` | Copy | Env template parity |
| `frontend/.env` | `frontend-v2/.env.local` | Copy (local only) | Local runtime for auth/API proxy |
| `frontend/app/layout.tsx` | `frontend-v2/app/layout.tsx` | Refactor | Keep providers; adjust as needed for migrated scope |
| `frontend/app/globals.css` | `frontend-v2/app/globals.css` | Copy | Shared design tokens and utility scaling |
| `frontend/lib/config.ts` | `frontend-v2/lib/config.ts` | Copy | Cookie/storage keys |
| `frontend/lib/session-manager.ts` | `frontend-v2/lib/session-manager.ts` | Copy | Role/session behavior |
| `frontend/lib/auth-context.tsx` | `frontend-v2/lib/auth-context.tsx` | Refactor | Ensure login success path contract remains `/role` via page logic |
| `frontend/lib/api/client.ts` | `frontend-v2/lib/api/client.ts` | Copy | API proxy/fetch wrapper |
| `frontend/lib/i18n/translation-context.tsx` | `frontend-v2/lib/i18n/translation-context.tsx` | Copy | Needed by most pages |
| `frontend/components/ui/*` (used primitives) | `frontend-v2/components/ui/*` | Copy | Include primitives used by migrated files |
| `frontend/components/chatbot/*` | `frontend-v2/components/chatbot/*` | Copy | Required by layout unless intentionally removed |

## B) API Proxy/Auth Routes

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/app/api/backend/[...path]/route.ts` | `frontend-v2/app/api/backend/[...path]/route.ts` | Copy | Required for authenticated API proxy |
| `frontend/app/api/v1/auth/login/route.ts` | `frontend-v2/app/api/v1/auth/login/route.ts` | Copy | Cookie creation logic |
| `frontend/app/api/v1/auth/logout/route.ts` | `frontend-v2/app/api/v1/auth/logout/route.ts` | Copy | Cookie clear logic |

## C) Public Routes

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/app/page.tsx` | `frontend-v2/app/page.tsx` | Copy | Landing page |
| `frontend/app/login/page.tsx` | `frontend-v2/app/login/page.tsx` | Refactor | Replace `/dashboard` push with `/role` |
| `frontend/app/register/page.tsx` | `frontend-v2/app/register/page.tsx` | Copy | Keep register flow |
| `frontend/app/login/layout.tsx` | `frontend-v2/app/login/layout.tsx` | Copy | Optional; keep if needed |

## D) Shared Routes And Shared UI

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/app/role/page.tsx` | `frontend-v2/app/role/page.tsx` | Refactor | Route to canonical paths; non-migrated roles go to placeholder pages |
| N/A | `frontend-v2/app/role/reviewer/page.tsx` | New | Placeholder only, no reviewer business logic |
| N/A | `frontend-v2/app/role/chair/page.tsx` | New | Placeholder only, no chair business logic |
| `frontend/app/notifications/page.tsx` | `frontend-v2/app/notifications/page.tsx` | Refactor | Keep source-of-truth notifications screen; menu links to canonical routes |
| `frontend/app/dashboard/notifications/page.tsx` | N/A | Delete-Legacy | Remove duplicate notifications page after migration |
| `frontend/app/dashboard/users/[email]/page.tsx` | `frontend-v2/app/profile/[user_id]/page.tsx` | Refactor | Re-key route param, add `user_id -> email` resolution |
| `frontend/components/dashboard-sidebar.tsx` | `frontend-v2/components/dashboard-sidebar.tsx` | Refactor | Canonical author/shared menu links |
| `frontend/components/dashboard-header.tsx` | `frontend-v2/components/dashboard-header.tsx` | Refactor | Notifications/profile/switch-role canonical links |
| `frontend/components/notifications/*` | `frontend-v2/components/notifications/*` | Copy | Shared notifications UI pieces |
| `frontend/hooks/use-notifications.ts` | `frontend-v2/hooks/use-notifications.ts` | Copy | Shared unread/notification behavior |
| `frontend/lib/api/notifications.ts` | `frontend-v2/lib/api/notifications.ts` | Copy | Shared notifications API layer |

## E) Author Routes

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/app/dashboard/author/page.tsx` | `frontend-v2/app/role/author/page.tsx` | Refactor | Sidebar links and route namespace |
| `frontend/app/author/conference/[id]/page.tsx` | `frontend-v2/app/role/author/conferences/[conferenceId]/page.tsx` | Refactor | Canonical conference route |
| `frontend/app/dashboard/author/submissions/page.tsx` | `frontend-v2/app/role/author/submissions/page.tsx` | Refactor | Canonical namespace |
| `frontend/app/dashboard/author/submit/page.tsx` | `frontend-v2/app/role/author/submissions/new/page.tsx` | Refactor | Create route |
| `frontend/app/dashboard/conference/[id]/submission/[submissionId]/page.tsx` | `frontend-v2/app/role/author/submissions/[submissionId]/page.tsx` | Refactor | API-backed detail as canonical author detail |
| N/A | `frontend-v2/app/role/author/submissions/[submissionId]/edit/page.tsx` | New | Split edit route; can wrap existing submit form with edit mode |
| `frontend/app/dashboard/author/papers/[id]/page.tsx` | N/A | Delete-Legacy | Mock-based path; do not migrate as canonical |

## F) Author Components

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/components/author/author-conferences.tsx` | `frontend-v2/components/author/author-conferences.tsx` | Refactor | Replace `/author/conference/*` pushes |
| `frontend/components/author/author-conference-cards.tsx` | same | Copy | Dependency of `author-conferences` |
| `frontend/components/author/author-conference-list.tsx` | same | Copy | Dependency of `author-conferences` |
| `frontend/components/author/author-mock-data.ts` | same | Copy | Keep until API integration is finalized |
| `frontend/components/author/author-conference-detail.tsx` | same | Copy | Route target component |
| `frontend/components/author/conference-detail/*` | same | Refactor | Update push links to canonical author routes |
| `frontend/components/author/author-submissions-list.tsx` | same | Refactor | Row click to canonical submission detail route |
| `frontend/components/author/submit/*` | same | Refactor | Submit success/cancel/actions to canonical routes |
| `frontend/components/author/submission-detail/*` | same | Refactor | Breadcrumb/back/edit links to canonical routes |
| `frontend/components/author/paper-detail-view.tsx` | N/A | Delete-Legacy | Mock-only path dependency |
| `frontend/components/author/author-dashboard.tsx` | N/A | Delete-Legacy | Unused legacy component |

## G) External Author Dependencies

These are not author folder files but are required by author components.

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| `frontend/components/conference/explore-cards.tsx` | `frontend-v2/components/conference/explore-cards.tsx` | Copy | Imported by `author-conferences.tsx` |
| `frontend/components/conference/types.ts` | `frontend-v2/components/conference/types.ts` | Copy | `ExploreConference` type dependency |
| `frontend/lib/api/conferences.ts` | `frontend-v2/lib/api/conferences.ts` | Copy | Conference fetch/list/bookmark used by author components |
| `frontend/lib/api/submissions.ts` | `frontend-v2/lib/api/submissions.ts` | Copy | Submission list/detail APIs |
| `frontend/lib/api/papers.ts` | `frontend-v2/lib/api/papers.ts` | Copy | Submit/update/publish APIs |
| `frontend/lib/types.ts` | `frontend-v2/lib/types.ts` | Copy | Shared models |
| `frontend/lib/utils.ts` | `frontend-v2/lib/utils.ts` | Copy | Common helper imports |
| `frontend/lib/typography.ts` | `frontend-v2/lib/typography.ts` | Copy | UI typography constants |

## H) New Helper Files (Create In `frontend-v2`)

| Legacy source | `frontend-v2` target | Action | Notes |
|---|---|---|---|
| N/A | `frontend-v2/lib/profile/resolve-user-email.ts` | New | Encapsulate `user_id -> email` resolution order from target contract |
| N/A | `frontend-v2/lib/submissions/resolve-submission-conference.ts` | New | Resolve `conferenceId` for submission detail/edit when query param missing |

## I) Legacy Cleanup Mapping (After Validation)

Delete from legacy `frontend` only when migrated equivalent in `frontend-v2` is verified.

1. Shared/public cleanup candidates:
- `app/dashboard/page.tsx`
- `app/dashboard/notifications/page.tsx`
- `app/dashboard/users/[email]/page.tsx`

2. Author route cleanup candidates:
- `app/dashboard/author/page.tsx`
- `app/dashboard/author/submissions/page.tsx`
- `app/dashboard/author/submit/page.tsx`
- `app/author/conference/[id]/page.tsx`
- `app/dashboard/author/papers/[id]/page.tsx`
- `app/dashboard/conference/[id]/submission/[submissionId]/page.tsx` (only after no longer required by other in-progress scopes)

3. Author component cleanup candidates:
- `components/author/author-dashboard.tsx`
- `components/author/paper-detail-view.tsx`

## J) Route String Refactor Targets

Refactor these strings in migrated `frontend-v2` files:

- `/dashboard/author` -> `/role/author`
- `/dashboard/author/submissions` -> `/role/author/submissions`
- `/dashboard/author/submit` -> `/role/author/submissions/new`
- `/dashboard/conference/{conferenceId}/submission/{submissionId}` -> `/role/author/submissions/{submissionId}?conferenceId={conferenceId}`
- `/author/conference/{id}` -> `/role/author/conferences/{conferenceId}`
- `/dashboard/notifications` -> `/notifications`
- `/dashboard/users/me` -> `/profile/{user_id}`
- `/dashboard` (switch role) -> `/role`
