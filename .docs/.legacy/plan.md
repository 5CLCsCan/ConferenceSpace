# Frontend Routing Restructure - Iterative Execution Plan

Date: 2026-02-16
References:

- Evaluation: `frontend/.docs/evaluation.md`
- Proposal: `frontend/.docs/proposal.md`
- Route contract: `frontend/.docs/route-contract.md`

## 1) Planning Method

This is an incremental plan with short-lived transition shims only during implementation. Each phase is independently verifiable.

Status legend:

- `[ ]` pending
- `[~]` in progress
- `[x]` complete

## 2) Decision Lock (Batch 1 + Batch 2 + Batch 3)

Status: `[x]`

Locked product decisions:

- [x] Canonical notifications path is `/notifications`.
- [x] Keep current `/notifications` UI as source of truth.
- [x] Remove dashboard notifications route once dependencies are migrated.
- [x] Login success destination is `/role`.
- [x] Always require explicit role selection after login.
- [x] No public conference detail route (`/conference/[id]`).
- [x] Canonical naming uses plural collections + explicit actions.
- [x] Canonical profile route is `/profile/[user_id]`.
- [x] All authenticated users can view public profile fields of anyone.
- [x] No backend changes in this phase.
- [x] Frontend resolves `user_id -> email` for profile fetches.
- [x] Reviewer canonical routes:
  - `/role/reviewer/conferences`
  - `/role/reviewer/conferences/[conferenceId]/submissions`
  - `/role/reviewer/assignments/[assignmentId]`
- [x] Reviewer execution route uses `assignmentId` (not `submissionId`).
- [x] Author canonical routes:
  - `/role/author/submissions`
  - `/role/author/submissions/[submissionId]`
  - `/role/author/submissions/[submissionId]/edit`
- [x] Chair canonical routes:
  - `/role/chair/conferences/[conferenceId]/submissions`
  - `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
- [x] Chair Explore/Archived items route to `/role/chair/conferences/[id]` if accessible, else disabled/no-access.
- [x] Admin routing is deferred out of this phase.
- [x] Keep author/chair conference components separate; rename chair file to role-specific name.
- [x] Role root pages remain dashboards.
- [x] Role migration order is `author -> reviewer -> chair`.
- [x] Clean release target: remove legacy wrappers before release.

Double-check findings captured:

- [x] No explicit inaccessible-state field exists in `frontend/components/conference/types.ts`.
- [x] Chair explore/archive still pushes `/conference/${id}` in `frontend/components/conference/author-conferences.tsx`.
- [x] Reviewer still uses query-tab routing and mixed `paperId`/assignment semantics.
- [x] Profile page currently keys on email route param (`frontend/app/dashboard/users/[email]/page.tsx`).

## 3) High-Level Phase Timeline

- Phase 0: contract freeze and guardrails
- Phase 1: shared route/navigation layer
- Phase 2: notifications + login flow normalization
- Phase 3: author migration
- Phase 4: reviewer migration (critical)
- Phase 5: chair migration
- Phase 6: profile migration (`/profile/[user_id]`)
- Phase 7: cleanup, hardening, release readiness

## 4) Detailed Phase Plan

## Phase 0 - Contract Freeze And Guardrails

Status: `[~]`

Tasks:

- [x] Lock decisions in docs (`evaluation`, `proposal`, `plan`).
- [x] Add explicit route contract document (`route-contract.md`).
- [ ] Add grep checks for forbidden legacy literals:
  - `/dashboard`
  - `/author/conference`
  - `/conference/` (public route)
- [ ] Capture baseline smoke-flow notes for current behavior.

Exit criteria:

- Contract is explicit and implementers can validate path usage quickly.

## Phase 1 - Shared Route And Navigation Layer

Status: `[ ]`

Tasks:

- [ ] Create `frontend/lib/routes.ts` with typed builders for all canonical paths.
- [ ] Encode canonical parameter naming:
  - `conferenceId`, `submissionId`, `assignmentId`, `user_id`
- [ ] Create `frontend/lib/navigation.ts` for role header/sidebar config.
- [ ] Update shared navigation components to use helpers:
  - `frontend/components/dashboard-sidebar.tsx`
  - `frontend/components/dashboard-header.tsx`
- [ ] Ensure role root dashboard links map to `/role/author`, `/role/reviewer`, `/role/chair`.

Exit criteria:

- New navigation updates only require touching route helper modules.

## Phase 2 - Notifications And Login Flow Normalization

Status: `[ ]`

Tasks:

- [ ] Keep `frontend/app/notifications/page.tsx` as canonical notification page.
- [ ] Repoint all notification links to `/notifications`.
- [ ] Remove `frontend/app/dashboard/notifications/page.tsx` when unused.
- [ ] Update login success flow to push directly to `/role`.
- [ ] Verify role re-selection is always required after login.

Exit criteria:

- Single notifications destination.
- Login does not pass through `/dashboard`.

## Phase 3 - Author Migration

Status: `[ ]`

Tasks:

- [ ] Implement canonical author dashboard root at `/role/author`.
- [ ] Migrate author submission routes:
  - `/role/author/submissions`
  - `/role/author/submissions/new`
  - `/role/author/submissions/[submissionId]`
  - `/role/author/submissions/[submissionId]/edit`
- [ ] Migrate author conference details route:
  - `/role/author/conferences/[conferenceId]`
- [ ] Update author components to route helpers.
- [ ] Remove active dependencies on `/dashboard/author/*` and `/author/conference/*`.

Exit criteria:

- Author flows operate entirely under `/role/author/*` with canonical ids.

## Phase 4 - Reviewer Migration (Critical)

Status: `[ ]`

Tasks:

- [ ] Implement reviewer dashboard root at `/role/reviewer`.
- [ ] Implement reviewer list routes:
  - `/role/reviewer/conferences`
  - `/role/reviewer/invitations`
  - `/role/reviewer/completed`
- [ ] Implement conference submissions list route:
  - `/role/reviewer/conferences/[conferenceId]/submissions`
- [ ] Implement assignment execution route:
  - `/role/reviewer/assignments/[assignmentId]`
- [ ] Remove query-tab routing (`?tab=`) from reviewer navigation.
- [ ] Replace `paperId` route naming in reviewer execution flows with `assignmentId`.
- [ ] Implement conference-id resolver for assignment page (frontend-only):
  - cached assignment metadata
  - temporary query fallback while migrating
  - dataset lookup fallback
- [ ] Update back-navigation to return to conference submissions route.

Exit criteria:

- Reviewer primary flow no longer depends on query tabs or `paperId` execution URLs.

## Phase 5 - Chair Migration

Status: `[ ]`

Tasks:

- [ ] Implement chair dashboard root at `/role/chair`.
- [ ] Implement canonical chair routes:
  - `/role/chair/conferences`
  - `/role/chair/conferences/new`
  - `/role/chair/conferences/[conferenceId]`
  - `/role/chair/conferences/[conferenceId]/submissions`
  - `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
  - `/role/chair/schedules`
- [ ] Rename `frontend/components/conference/author-conferences.tsx` to chair-specific name.
- [ ] Replace public push `/conference/${id}` with role-specific routing.
- [ ] Implement no-access disabled behavior for Explore/Archived entries when conference not accessible.
- [ ] Remove stale `?tab=submissions` chair links.
- [ ] Decouple wizard shared types from route files.

Exit criteria:

- Chair workflows run fully under canonical chair route family.

## Phase 6 - Profile Migration (`/profile/[user_id]`)

Status: `[ ]`

Tasks:

- [ ] Create canonical route `/profile/[user_id]`.
- [ ] Migrate profile entry points from `/dashboard/users/[email]`.
- [ ] Implement frontend `user_id -> email` resolver module.
- [ ] Keep endpoint usage email-based (`/api/v1/users/{email}` and `/me`).
- [ ] Enforce public-field-only rendering for non-self profile views.
- [ ] Update header profile navigation to canonical profile route.

Exit criteria:

- Profile behavior matches policy without backend changes.

## Phase 7 - Cleanup, Hardening, Release Readiness

Status: `[ ]`

Tasks:

- [ ] Remove all temporary migration wrappers/redirects.
- [ ] Remove dead components and stale route constants.
- [ ] Update `frontend/README.md` to final route model.
- [ ] Add route-contract validation checks in CI or local scripts.
- [ ] Run manual smoke tests for login, role selection, author, reviewer, chair, profile, notifications.

Exit criteria:

- Release branch contains only canonical route contract.

## 5) Immediate Next Iteration (Recommended)

1. Build `routes.ts` and `navigation.ts` first (Phase 1).
2. Normalize notifications and login routing (Phase 2).
3. Start author migration per required order (Phase 3).

Reason:

- Reduces global path churn before role-specific refactors.
- Makes reviewer/chair migration smaller and safer.

## 6) Verification Checklist (Per Phase)

- [ ] App compiles and touched pages render.
- [ ] Role dashboard roots remain functional (`/role/author|reviewer|chair`).
- [ ] Notifications resolve only to `/notifications`.
- [ ] Reviewer routes use canonical list + assignment execution URLs.
- [ ] No active UI path points to `/conference/[id]` public route.
- [ ] Chair Explore/Archived no-access behavior works.
- [ ] Profile route resolves via `/profile/[user_id]` with frontend-only mapping.
- [ ] No new hardcoded legacy paths are introduced.
- [ ] Temporary wrappers (if any) are removed before release.

## 7) Progress Log

- 2026-02-15: Initial evaluation/proposal/plan docs created.
- 2026-02-15: Batch-1 decisions integrated and code-checked.
- 2026-02-15: Batch-2 decisions integrated (plural naming, profile target, no public conference route, admin deferral, clean-release wrapper policy, role order).
- 2026-02-16: Batch-3 decisions integrated (reviewer assignment route contract, chair accessibility behavior, profile visibility policy, frontend-only id->email constraint, role-dashboard-root preservation).
