# Frontend Routing Restructure - Current Status Evaluation

Date: 2026-02-16

## 1) Goal And Scope

Target information architecture requested:

- Homepage
- Login/Register
- Notification
- Role switcher
- Author space and author-specific screens
- Reviewer space and reviewer-specific screens
- Chair space and chair-specific screens

Intended URL shape:

- `/`
- `/login`, `/register`
- `/notifications`
- `/role`
- `/role/author/...`
- `/role/reviewer/...`
- `/role/chair/...`

This document evaluates the current state and identifies what blocks that target.

## 2) Snapshot Summary

Measured from current codebase:

- `26` route pages under `frontend/app/**/page.tsx`
- `17` app pages contain manual `authChecked` guard logic
- `14` app pages import and configure `DashboardSidebar` directly
- `2` notification pages exist (`/notifications`, `/dashboard/notifications`)
- `5` wizard component files import type from route file (`@/app/dashboard/chair/create-conference/page`)
- `120` occurrences of `"/dashboard"` route string in app/components
- `4` occurrences of `"/author/conference"` route string

Implication: path semantics are mixed between role-domain paths and UI-shell paths.

## 2.1) Confirmed Product Decisions (Batch 1)

- Canonical notifications URL is `/notifications`.
- `/notification` should not be introduced.
- Keep current `/notifications` screen as source of truth.
- Remove `/dashboard/notifications` after migration.
- Post-auth landing must always be `/role`.
- Role must always be re-selected after login.
- Reviewer query tabs must migrate to subroutes.

## 2.2) Confirmed Product Decisions (Batch 2)

- No public/shared conference detail route (no `/conference/[id]`).
- Canonical subpath naming uses plural collections + explicit actions.
- Canonical profile route becomes `/profile/<user_id>`.
- Admin routes are out of scope in this phase.
- Legacy redirects should be removed in the same release.
- Role migration order is fixed: `author -> reviewer -> chair`.
- Author and chair conference-list implementations are both needed and remain separate.

## 2.3) Confirmed Product Decisions (Batch 3)

- Keep reviewer conference-papers as a real route via:
  - `/role/reviewer/conferences/[conferenceId]/submissions`
- Canonical route parameter naming:
  - Reviewer:
    - `/role/reviewer/conferences`
    - `/role/reviewer/conferences/[conferenceId]/submissions`
    - `/role/reviewer/assignments/[assignmentId]`
    - Do not use `submissionId` for review execution routes.
  - Author:
    - `/role/author/submissions`
    - `/role/author/submissions/[submissionId]`
    - `/role/author/submissions/[submissionId]/edit`
  - Chair:
    - `/role/chair/conferences/[conferenceId]/submissions`
    - `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
- Chair Explore/Archived target after public route removal:
  - route to `/role/chair/conferences/[id]` when accessible
  - otherwise show disabled/no-access state
- Profile policy:
  - all authenticated users can view public profile fields of anyone
- Backend constraint:
  - no backend changes in this phase
  - frontend must resolve `user_id -> email` before using current email-based profile endpoint
- Role root pages remain dashboards (concept preserved at `/role/{role}`).

## 3) Current Route Topology

Current route tree source: `frontend/app`.

Top-level routes:

- `/` -> `frontend/app/page.tsx`
- `/login` -> `frontend/app/login/page.tsx`
- `/register` -> `frontend/app/register/page.tsx`
- `/role` -> `frontend/app/role/page.tsx`
- `/notifications` -> `frontend/app/notifications/page.tsx`
- `/author/conference/[id]` -> `frontend/app/author/conference/[id]/page.tsx`
- `/dashboard/*` -> multiple role and conference screens

### 3.1 Dashboard Namespace

Role dashboards currently in use:

- `/dashboard/author`
- `/dashboard/reviewer`
- `/dashboard/chair`

Role-specific screens:

- Author:
  - `/dashboard/author/submissions`
  - `/dashboard/author/submit`
  - `/dashboard/author/papers/[id]`
- Reviewer:
  - `/dashboard/reviewer/completed`
  - `/dashboard/reviewer/papers/[id]`
  - `/dashboard/conference/[id]/reviewer/assigned`
  - `/dashboard/conference/[id]/reviewer/submissions/[paperId]`
- Chair:
  - `/dashboard/chair/schedules`
  - `/dashboard/chair/create-conference`
  - `/dashboard/chair/conference/[id]`
  - `/dashboard/chair/conference/[id]/submission/[submissionId]`

Shared dashboard routes:

- `/dashboard/page.tsx` redirects to `/role`
- `/dashboard/notifications`
- `/dashboard/users/[email]`
- `/dashboard/conference`, `/dashboard/conference/[id]/*`

## 4) Behavioral Findings

### 4.1 Login And Role Flow Is Indirect

- `frontend/app/login/page.tsx` pushes to `/dashboard` after auth.
- `frontend/app/dashboard/page.tsx` redirects to `/role`.
- `frontend/app/role/page.tsx` then pushes to `/dashboard/${role}`.

Result: users pass through two path transitions before reaching role home.

### 4.2 Notifications Flow Is Duplicated

- Canonical page exists at `frontend/app/notifications/page.tsx`.
- A second page exists at `frontend/app/dashboard/notifications/page.tsx`.
- Header still pushes to dashboard path in:
  - `frontend/components/dashboard-header.tsx`

Result: duplicate UI destinations for one domain concept.

### 4.3 Author Conference Paths Are Split

- Author detail page exists at `/author/conference/[id]`.
- Author dashboard routes mostly use `/dashboard/author/*`.
- Author components still push to `/author/conference/*`:
  - `frontend/components/author/author-conferences.tsx`
  - `frontend/components/author/author-dashboard.tsx`

Result: mixed author path model.

### 4.4 Reviewer Flow Uses Mixed Identifiers And Navigation Models

Observed reviewer execution flows:

- Assignment-centric review page exists at:
  - `/dashboard/reviewer/papers/[id]`
  - It treats URL `id` as assignment id, then fetches assignment and resolves `submission_id`.
- Conference-scoped review page exists at:
  - `/dashboard/conference/[id]/reviewer/submissions/[paperId]`
  - It is still paper-id named and driven by `SubmissionReviewScreen` mock-first UI.
- Back behavior uses query tab state and ad-hoc values:
  - `?tab=conferences`, `?tab=invitations`, `?tab=conference-papers`, `conference_id`, `from_conference_id`

Result: reviewer navigation is the highest-risk migration area and needs one explicit route contract.

### 4.5 Chair Explore/Archived Uses Removed Public Route

In `frontend/components/conference/author-conferences.tsx`:

- Explore/Archived cards push to `/conference/${id}`.

But public `/conference/[id]` is removed by product decision.

Additional verification:

- `frontend/components/conference/types.ts` has no explicit `isAccessible`/permission field for explore entries.
- `ExploreConference` currently lacks access-state metadata.

Result: migration must introduce frontend-derived access gating and disabled state behavior.

### 4.6 Component Naming Confusion Is Real

Two similarly named components represent different domains:

- `frontend/components/author/author-conferences.tsx` (author-facing)
- `frontend/components/conference/author-conferences.tsx` (chair/event-management-facing)

Result: both are needed, but the chair-facing component name is misleading and should be renamed.

### 4.7 Profile Route Is Email-Param Based Today

Current state:

- route: `frontend/app/dashboard/users/[email]/page.tsx`
- fetches `/api/v1/users/me` and `/api/v1/users/${userEmail}`
- user menu links to `/dashboard/users/me` in `frontend/components/dashboard-header.tsx`

Target state:

- canonical route `/profile/[user_id]`
- no backend changes
- frontend resolves `user_id -> email` before calling current endpoint
- all authenticated users can view public profile fields

### 4.8 Route-Coupled Type Imports

Wizard files import types from route module:

- `@/app/dashboard/chair/create-conference/page`

Result: route moves can break unrelated component builds unless types are extracted.

### 4.9 Auth Guard Duplication

`authChecked` + redirect logic is duplicated across many pages.

Result: high maintenance overhead during migration and higher regression risk.

## 5) Structural Quality Assessment

### 5.1 What Is Good

- App Router structure is modular enough for phased migration.
- Auth context and session manager already support role switching.
- Role dashboards already exist conceptually and should be preserved under new role roots.

### 5.2 What Is Weak

- URL semantics still reflect container (`/dashboard`) over domain (`/role/{role}`).
- Navigation links are hardcoded in many files.
- Reviewer flow has overlapping route patterns and inconsistent ids.
- Chair explore/archive behavior assumes a public route that is now out of scope.

### 5.3 Migration Risk Level

- Reviewer flow: high risk (query tabs + paperId/assignmentId drift).
- Chair explore/archive: medium risk (missing explicit access state).
- Profile migration: medium risk (id-to-email resolver requirement).
- Backend API stability risk: low (frontend-only migration mandated).

## 6) Baseline Acceptance Gaps (Against Target)

Not yet satisfied:

- No canonical `/role/{author|reviewer|chair}` route tree.
- Notifications not yet unified to `/notifications` only.
- Reviewer still depends on query-tab navigation and mixed identifiers.
- No canonical reviewer list route at `/role/reviewer/conferences/[conferenceId]/submissions` yet.
- No canonical reviewer execution route at `/role/reviewer/assignments/[assignmentId]` yet.
- Chair explore/archive still points to removed public route and lacks explicit inaccessible-state handling.
- Profile route is still `/dashboard/users/[email]` instead of `/profile/[user_id]`.
- Frontend `user_id -> email` resolution path is not implemented yet.

## 7) Evaluation Conclusion

The frontend is functionally rich but path architecture remains inconsistent. The migration is feasible without a big-bang rewrite if route contracts are locked first, reviewer identifiers are normalized early, and profile/chair access behaviors are explicitly defined in frontend-only logic.
