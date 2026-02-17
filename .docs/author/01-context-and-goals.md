# 01 - Context And Goals

Last updated: 2026-02-17

## 1) Objective

Migrate only the Public + Shared + Author experience from legacy `frontend` into a new project `frontend-v2`, role-by-role, with a safer copy/refactor/delete workflow.

The goal is to produce a clean author-ready routing architecture in `frontend-v2` while avoiding reviewer/chair migration work in this phase.

## 2) Why This Strategy

Legacy routing is currently mixed across:
- shell-based prefixes (`/dashboard/*`)
- role-specific pages (`/dashboard/author/*`)
- non-canonical author pages (`/author/conference/[id]`)
- duplicate shared pages (`/notifications` and `/dashboard/notifications`)

A full-system migration in one pass increases regression risk. This phase intentionally isolates author plus required shared/public infrastructure.

## 3) Project Boundaries

In scope:
- Public routes: `/`, `/login`, `/register`
- Shared routes: `/role`, `/notifications`, `/profile/[user_id]`
- Author routes under canonical `/role/author/*`
- Shared UI/navigation/auth pieces needed by those routes
- API proxy/auth glue required for those pages to function

Out of scope:
- Reviewer domain migration
- Chair domain migration
- Admin migration
- Backend API changes

## 4) Hard Constraints

1. New project workspace is `frontend-v2`.
2. Migration is file-by-file, phase-by-phase.
3. After each piece is fully migrated and verified, legacy source files in `frontend` should be deleted when safe.
4. No backend API modifications.
5. Final output should not depend on legacy `/dashboard/*` or `/author/conference/*` routes.
6. `frontend-v2` must carry its own env configuration (copied from `frontend/.env.example` and filled in local `.env`/`.env.local`).

## 5) Locked Product Decisions Used In This Phase

These are treated as fixed requirements for author/shared/public migration:

1. Notifications canonical route is `/notifications`.
- Keep existing `frontend/app/notifications/page.tsx` behavior as the notifications source-of-truth.
- Do not keep `/dashboard/notifications` as active destination.

2. Authentication flow.
- Post-login destination is always `/role`.
- Role selection is required every login session.

3. Author route naming conventions.
- Use plural resources and explicit action paths.
- Canonical author family:
  - `/role/author`
  - `/role/author/conferences/[conferenceId]`
  - `/role/author/submissions`
  - `/role/author/submissions/new`
  - `/role/author/submissions/[submissionId]`
  - `/role/author/submissions/[submissionId]/edit`

4. Profile route.
- Canonical profile route is `/profile/[user_id]`.
- All authenticated users can view public profile fields of anyone.
- Backend remains email-keyed; frontend resolves `user_id -> email`.

5. Release cleanliness.
- Legacy wrappers/redirect routes are not long-lived in release.

6. Non-migrated role safety in this phase.
- Reviewer/chair business flows are not migrated into `frontend-v2` yet.
- `/role` must not send users to broken pages.
- Keep role cards visible, but route reviewer/chair to explicit placeholder pages (`/role/reviewer`, `/role/chair`) until their phases.

## 6) Operational Safety Model

This migration uses explicit safety gates:

1. Copy to `frontend-v2` first.
2. Refactor paths and imports in `frontend-v2`.
3. Verify build/smoke checks in `frontend-v2`.
4. Only then delete corresponding legacy file(s) in `frontend` if no longer needed for ongoing work.

## 7) Execution Order In This Phase

1. Bootstrap `frontend-v2` runtime skeleton.
2. Migrate public/shared foundation pages.
3. Migrate author dashboard + conference detail.
4. Migrate author submissions + submit/edit + detail.
5. Migrate shared profile route.
6. Remove legacy artifacts for completed author/public/shared parts.

## 8) Deliverable Definition For This Phase

This phase is complete when:

1. `frontend-v2` serves working public/shared/author flows using canonical routes.
2. Author flow no longer relies on any legacy path conventions.
3. Shared navigation (header/sidebar) points only to canonical routes for migrated scope.
4. Legacy author/public/shared files listed for deletion are removed or explicitly deferred with rationale.
5. Reviewer/chair behavior remains untouched except where shared components are route-updated in a non-breaking way.
