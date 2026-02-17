# Frontend Routing Restructure - Detailed Approach Proposal

Date: 2026-02-16
Related documents:

- Evaluation: `frontend/.docs/evaluation.md`
- Plan: `frontend/.docs/plan.md`
- Route contract: `frontend/.docs/route-contract.md`

## 1) Proposal Objective

Restructure frontend routing to a role-domain-first architecture while preserving current business behavior and removing legacy paths before release.

Target URL contract:

- `/`
- `/login`, `/register`
- `/notifications`
- `/role`
- `/profile/[user_id]`
- `/role/author/*`
- `/role/reviewer/*`
- `/role/chair/*`

## 1.1) Locked Decisions (Batches 1-3)

- Notifications canonical path is `/notifications`.
- Keep existing `/notifications` UI as source of truth.
- Login success route is always `/role`.
- Role must always be re-selected each login.
- No public/shared conference route (`/conference/[id]`).
- Canonical naming uses plural resources + explicit action routes.
- Profile route is `/profile/[user_id]`.
- All authenticated users can view public profile fields of anyone.
- No backend changes in this phase; frontend must adapt.
- Reviewer canonical family:
  - `/role/reviewer/conferences`
  - `/role/reviewer/conferences/[conferenceId]/submissions`
  - `/role/reviewer/assignments/[assignmentId]`
- Author canonical family:
  - `/role/author/submissions`
  - `/role/author/submissions/[submissionId]`
  - `/role/author/submissions/[submissionId]/edit`
- Chair canonical family:
  - `/role/chair/conferences/[conferenceId]/submissions`
  - `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
- Role root pages remain dashboards (do not remove role dashboards).
- Admin routing is out of scope.
- Legacy redirect wrappers should be removed before release.
- Role migration order is fixed: `author -> reviewer -> chair`.

## 2) Design Principles

- Domain-first URLs, not shell/container-first URLs.
- One canonical route per user-visible screen.
- Preserve role dashboard concept at `/role/{role}` roots.
- Centralized route and navigation definitions.
- Shared protected layout guard, not repeated per page.
- Frontend-only migration (no backend endpoint changes).
- Transition shims allowed during development only, not in release branch.

## 3) Target Route Architecture

Use route groups for internal organization while keeping public URL shape:

```txt
frontend/app
  /(public)/page.tsx
  /(auth)/login/page.tsx
  /(auth)/register/page.tsx
  /(protected)/layout.tsx
  /(protected)/notifications/page.tsx
  /(protected)/profile/[user_id]/page.tsx
  /(protected)/role/page.tsx

  /(protected)/role/author/page.tsx                          # author dashboard root
  /(protected)/role/author/conferences/[conferenceId]/page.tsx
  /(protected)/role/author/submissions/page.tsx
  /(protected)/role/author/submissions/new/page.tsx
  /(protected)/role/author/submissions/[submissionId]/page.tsx
  /(protected)/role/author/submissions/[submissionId]/edit/page.tsx

  /(protected)/role/reviewer/page.tsx                        # reviewer dashboard root
  /(protected)/role/reviewer/conferences/page.tsx
  /(protected)/role/reviewer/conferences/[conferenceId]/submissions/page.tsx
  /(protected)/role/reviewer/invitations/page.tsx
  /(protected)/role/reviewer/completed/page.tsx
  /(protected)/role/reviewer/assignments/[assignmentId]/page.tsx

  /(protected)/role/chair/page.tsx                           # chair dashboard root
  /(protected)/role/chair/conferences/page.tsx
  /(protected)/role/chair/conferences/new/page.tsx
  /(protected)/role/chair/conferences/[conferenceId]/page.tsx
  /(protected)/role/chair/conferences/[conferenceId]/submissions/page.tsx
  /(protected)/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx
  /(protected)/role/chair/schedules/page.tsx

  /api/*
```

## 4) Legacy-To-Canonical Mapping

- `/dashboard` -> `/role`
- `/dashboard/notifications` -> `/notifications`
- `/dashboard/users/[email]` -> `/profile/[user_id]`

Author:

- `/dashboard/author` -> `/role/author`
- `/dashboard/author/submissions` -> `/role/author/submissions`
- `/dashboard/author/submit` -> `/role/author/submissions/new`
- `/dashboard/author/papers/[id]` -> `/role/author/submissions/[submissionId]`
- `/author/conference/[id]` -> `/role/author/conferences/[conferenceId]`

Reviewer:

- `/dashboard/reviewer` -> `/role/reviewer`
- `/dashboard/reviewer?tab=conferences` -> `/role/reviewer/conferences`
- `/dashboard/reviewer?tab=invitations` -> `/role/reviewer/invitations`
- `/dashboard/reviewer/completed` -> `/role/reviewer/completed`
- `/dashboard/conference/[id]/reviewer/assigned` -> `/role/reviewer/conferences/[conferenceId]/submissions`
- `/dashboard/reviewer/papers/[id]` -> `/role/reviewer/assignments/[assignmentId]`
- `/dashboard/conference/[id]/reviewer/submissions/[paperId]` -> `/role/reviewer/assignments/[assignmentId]`

Chair:

- `/dashboard/chair` -> `/role/chair`
- `/dashboard/conference` -> `/role/chair/conferences`
- `/dashboard/chair/schedules` -> `/role/chair/schedules`
- `/dashboard/chair/create-conference` -> `/role/chair/conferences/new`
- `/dashboard/chair/conference/[id]` -> `/role/chair/conferences/[conferenceId]`
- `/dashboard/chair/conference/[id]/submission/[submissionId]` -> `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`

Compatibility policy:

- During implementation: temporary redirects/wrappers are allowed.
- Release branch: all temporary legacy wrappers must be removed.

## 5) Core Engineering Changes

### 5.1 Centralize Route Definitions

Add `frontend/lib/routes.ts` with typed route builders.

Minimum structure:

- `routes.home`, `routes.login`, `routes.register`, `routes.notifications`, `routes.role`
- `routes.profile(userId)`
- `routes.author.*`
- `routes.reviewer.*`
- `routes.chair.*`

Outcome: no more scattered hardcoded path strings.

### 5.2 Centralize Navigation Configuration

Add `frontend/lib/navigation.ts`:

- role sidebar items
- role header links
- role root dashboard links

Outcome: dashboard/menu behavior stays consistent while paths migrate.

### 5.3 Shared Protected Layout Guard

Implement auth gate in `/(protected)/layout.tsx`:

- unauthenticated -> `/login`
- authenticated -> render

Outcome: removes duplicated per-page `authChecked` guards.

### 5.4 Notifications Unification

- Keep `frontend/app/notifications/page.tsx`.
- Repoint all header/sidebar links to `/notifications`.
- Remove `frontend/app/dashboard/notifications/page.tsx` after all references are migrated.

### 5.5 Preserve Role Dashboard Roots

Role roots remain dashboard home screens:

- `/role/author`
- `/role/reviewer`
- `/role/chair`

Only path contract changes; dashboard behavior remains.

### 5.6 Reviewer Flow Normalization (Critical)

Required shape:

- Conference submission list: `/role/reviewer/conferences/[conferenceId]/submissions`
- Review execution: `/role/reviewer/assignments/[assignmentId]`

Implementation notes:

- Replace legacy `paperId`-named route params with `assignmentId` for execution pages.
- Keep conference list route as real page (not query-tab fallback).
- Back navigation should return to conference-specific submissions list route.
- Remove reviewer query-tab dependence (`?tab=`).

Conference id resolution for assignment page (frontend-only):

- Step 1: use cached assignment metadata (from reviewer dashboard/list payloads).
- Step 2: support temporary query fallback (`?conferenceId=`) during migration only.
- Step 3: if unresolved, fetch assignment-containing dataset and resolve by assignment id.

No backend change is required.

### 5.7 Chair Explore/Archived Access Gating

Decision:

- Explore/Archived cards target `/role/chair/conferences/[conferenceId]` only when accessible.
- Otherwise render disabled/no-access state.

Current model gap:

- `ExploreConference` has no explicit accessibility flag.

Frontend strategy:

- Derive access from known chair-accessible conference ids (from chair-managed list payloads).
- If `conferenceId` not in accessible set, disable navigation and show no-access affordance.

### 5.8 Profile Route Migration (`/profile/[user_id]`)

Decision constraints:

- all authenticated users can view public profile fields
- backend remains email-based for user detail endpoint

Frontend strategy:

- Build `user_id -> email` resolver module.
- Populate resolver from authenticated user data and fetched user collections where both id/email are present.
- Route `/profile/[user_id]` resolves email first, then calls current endpoint:
  - `/api/v1/users/me` for self
  - `/api/v1/users/{email}` for others
- Keep only public-profile fields for non-self view.

### 5.9 Keep Dual Conference Components But Rename Clearly

Keep both components, but remove ambiguous naming:

- keep author-facing component as author source of truth
- rename chair/event-management component from `author-conferences.tsx` to chair-specific name
- remove any push to `/conference/${id}`

### 5.10 Decouple Types From Route Files

Move route-owned types into shared modules before route moves.

Example:

- from `@/app/dashboard/chair/create-conference/page`
- to `components/wizard/creation/types.ts` or `frontend/lib/types`

## 6) Migration Strategy

Recommended strategy: incremental, role-ordered, with temporary transition wrappers only during development.

Sequence:

1. route constants + navigation constants + login-to-role direct routing
2. notifications unification
3. author migration
4. reviewer migration
5. chair migration
6. profile migration + cleanup + wrapper removal

Rationale:

- highest-shared dependencies first
- honors required role order (`author -> reviewer -> chair`)
- isolates reviewer high-risk changes into one phase

## 7) Risks And Mitigations

Risk: reviewer route regression due assignment/paper id drift.  
Mitigation: hard-lock `assignmentId` for review execution routes and add migration tests for deep links.

Risk: direct deep-link to assignment lacks `conferenceId`.  
Mitigation: frontend resolver chain and temporary query fallback during migration.

Risk: chair Explore/Archived entries have no access metadata.  
Mitigation: derive accessible set from chair-managed conference payload and disable others.

Risk: profile route migration cannot resolve arbitrary user id.  
Mitigation: build shared resolver cache and fail gracefully when mapping is unavailable.

Risk: stale hardcoded legacy links survive migration.  
Mitigation: add grep-based checks for forbidden prefixes before release.

## 8) Deliverables

- Canonical route tree under `/role/{role}`, `/notifications`, `/profile/[user_id]`
- Dedicated route contract document (`frontend/.docs/route-contract.md`)
- Centralized `routes` and `navigation` modules
- Reviewer flow migrated to explicit subroutes and `assignmentId` execution route
- Chair explore/archive no-access handling
- Frontend-only user-id profile resolution
- Legacy wrappers removed before release
- Updated docs/tests/readme

## 9) Definition Of Done

- No active user flow requires `/dashboard/*`, `/author/conference/*`, or `/conference/[id]`
- Role dashboard roots exist and function at `/role/author`, `/role/reviewer`, `/role/chair`
- Notifications only resolve through `/notifications`
- Reviewer flow uses:
  - `/role/reviewer/conferences/[conferenceId]/submissions`
  - `/role/reviewer/assignments/[assignmentId]`
- Profile route resolves through `/profile/[user_id]` with frontend-only mapping
- All temporary legacy wrappers removed from release branch
- Smoke flows pass for login, role selection, author/reviewer/chair primary tasks
