# 04 - Execution Plan (Chair)

Last updated: 2026-02-18

This plan is written for a new-session implementation agent.

## Status Legend

- `[ ]` pending
- `[~]` in progress
- `[x]` complete

## Recommended Chair Sub-Flow Order

1. Chair route skeleton and navigation contract
2. Chair conferences list and create entry
3. Chair conference detail and submissions list
4. Chair submission detail (reviews/discussion/history)
5. Chair schedules
6. Chair create-conference wizard
7. Cross-role cleanup and final cutover

## Phase 0 - Guardrails And Baseline

Status: `[ ]`

Objective:
- Lock current baseline and prevent accidental route drift while implementing chair pages.

Tasks:
1. Capture baseline route inventory from `frontend-v2/app`.
2. Add grep guard checks from `06-validation-cutover-rollback.md` to local workflow.
3. Record locked decisions from `07-risks-and-edge-cases.md` as implementation guardrails.

Exit criteria:
- Baseline route and grep checks documented.
- Locked decisions are reflected in implementation tasks.

Deletion gate:
- No deletions in this phase.

Dependencies:
- None.

## Phase 1 - Chair Route Skeleton + Shared Nav Wiring

Status: `[ ]`

Objective:
- Replace placeholder-only chair state with canonical route tree in `frontend-v2`.

Tasks:
1. Replace `frontend-v2/app/role/chair/page.tsx` placeholder with real chair dashboard page.
2. Create missing chair routes:
- `frontend-v2/app/role/chair/conferences/page.tsx`
- `frontend-v2/app/role/chair/conferences/new/page.tsx`
- `frontend-v2/app/role/chair/conferences/[conferenceId]/page.tsx`
- `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/page.tsx`
- `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx`
- `frontend-v2/app/role/chair/schedules/page.tsx`
3. Keep shared role selection contract unchanged (`/role` still required).
4. Ensure sidebar/header links for chair paths point only to canonical routes.

Exit criteria:
- Chair canonical routes resolve without 404.
- Chair menu links do not use `/dashboard/*`.

Deletion gate:
- Placeholder-only content removed from `/role/chair`.

Dependencies:
- Shared auth/session foundation already present in `frontend-v2`.

## Phase 2 - Conferences List And Access Gating

Status: `[ ]`

Objective:
- Deliver chair conferences landing with explicit ownership and safe explore/archive behavior.

Tasks:
1. Migrate and rename chair conference list source:
- from legacy behavior in `frontend/components/conference/author-conferences.tsx`
- to explicit chair component in `frontend-v2` (`chair-conferences` naming).
2. Route list actions to canonical chair paths:
- my conference -> `/role/chair/conferences/[conferenceId]`
- create conference -> `/role/chair/conferences/new`
3. Remove public route pushes (`/conference/${id}`) from chair list code.
4. Keep explore/archive card behavior aligned with backend-filtered data; route selected entries to canonical chair detail paths without unknown-access fallback branches.

Exit criteria:
- Chair conferences screen works under `/role/chair/conferences`.
- No chair list action links to `/conference/[id]` or `/dashboard/*`.

Deletion gate:
- Remove/retire ambiguous chair list entrypoint file when replacement is wired:
  - `frontend-v2/components/conference/author-conferences.tsx` (or keep only as temporary wrapper with zero legacy paths).

Dependencies:
- Phase 1 route skeleton complete.

## Phase 3 - Conference Detail + Submissions List

Status: `[ ]`

Objective:
- Migrate chair conference detail tabs and submissions listing into canonical chair detail routes.

Tasks:
1. Copy/refactor legacy detail stack:
- `frontend/components/chair/conference-detail/*`
- `frontend/components/chair/conference-detail/submission-detail/*` (shared types/components)
2. Refactor route params:
- `[id]` -> `[conferenceId]` in page and navigation code.
3. Remove legacy breadcrumb links:
- `/dashboard/conference`
- `/dashboard/chair/conference/...`
- `?tab=submissions`
4. Ensure conference detail tabs are state-driven without query-tab coupling.

Exit criteria:
- `/role/chair/conferences/[conferenceId]` renders dashboard/overview/cfp/dates/committee/coi/submissions tabs.
- Submission list in detail navigates to canonical chair submission detail route.

Deletion gate:
- Legacy tab query push patterns removed from migrated target files.

Dependencies:
- Phase 2 list page live, so navigation into detail can be verified.

## Phase 4 - Submission Detail + Chair Review Surfaces

Status: `[ ]`

Objective:
- Deliver chair-owned submission detail flow under canonical chair routes, including review analytics/discussion/history.

Tasks:
1. Implement `/role/chair/conferences/[conferenceId]/submissions/[submissionId]` using chair detail components.
2. Wire review analytics/list API calls in chair detail context:
- `getSubmissionReviews`
- `getSubmissionReviewAnalytics`
3. Keep review detail embedded inside chair submission-detail tabs (no dedicated review-detail route).
4. Remove chair-as-author primary dependency for chair workflow:
- reduce/eliminate reliance on `frontend-v2/components/author/submission-detail/index.tsx` for chair runtime.

Exit criteria:
- Chair can review submission details from canonical chair path end-to-end.
- No critical chair action depends on `/role/author/submissions/*`.

Deletion gate:
- Chair submission navigation from chair pages no longer points into author route family.

Dependencies:
- Phase 3 conference detail and submissions list complete.

## Phase 5 - Schedules + Create Conference

Status: `[ ]`

Objective:
- Restore remaining chair operational flows (schedules and conference creation) under canonical routes.

Tasks:
1. Migrate schedules page from legacy:
- `frontend/app/dashboard/chair/schedules/page.tsx`
- target: `frontend-v2/app/role/chair/schedules/page.tsx`
2. Migrate create-conference page from legacy:
- `frontend/app/dashboard/chair/create-conference/page.tsx`
- target: `frontend-v2/app/role/chair/conferences/new/page.tsx`
3. Copy/create wizard dependencies in target:
- `frontend/components/wizard/creation/*` -> `frontend-v2/components/wizard/creation/*`
4. Ensure create success/cancel actions use canonical chair routes.

Exit criteria:
- `/role/chair/schedules` and `/role/chair/conferences/new` work without importing legacy app paths.
- `createConference` API flow works from target route.

Deletion gate:
- Remove any route-coupled type imports from old app paths in migrated target code.

Dependencies:
- Phase 1 route scaffold complete.

## Phase 6 - Cross-Role Decoupling + Cleanup

Status: `[ ]`

Objective:
- Remove temporary chair coupling in author/shared layers and clean stale route strings.

Tasks:
1. Remove author detail chair conditional behavior:
- `frontend-v2/components/author/submission-detail/index.tsx`
- `frontend-v2/app/role/author/submissions/[submissionId]/page.tsx`
2. Remove chair role allowance from author submission route at cutover (`/role/author/submissions/[submissionId]`).
3. Remove stale route strings from target:
- `/dashboard/chair*`
- `/dashboard/conference*`
- `/conference/${id}`
- `?tab=submissions`
4. Remove/rename ambiguous duplicate chair list artifacts in `components/conference`.
5. Validate chair navigation from shared notifications/header/sidebar.

Exit criteria:
- Chair workflow is self-contained under `/role/chair/*`.
- Target grep checks for forbidden strings pass.

Deletion gate:
- Delete target files only after replacement paths are verified in smoke checks.

Dependencies:
- Phases 2-5 complete.

## Phase 7 - Hardening, Signoff, Release Readiness

Status: `[ ]`

Objective:
- Prove migration correctness and make rollback-safe cutover.

Tasks:
1. Run all static + grep + smoke checks in `06-validation-cutover-rollback.md`.
2. Perform final docs consistency pass across all 7 chair docs.
3. Prepare cutover change list and rollback commits.

Exit criteria:
- Final signoff criteria in `06-validation-cutover-rollback.md` all pass.
- Locked decisions are implemented with no contradictions.

Deletion gate:
- Legacy cleanup only after full signoff.

Dependencies:
- All earlier phases complete.

## Mandatory Deletion Policy

For any legacy file deletion:

1. Equivalent behavior must already exist in `frontend-v2`.
2. No active target reference may remain.
3. Deletions should be committed separately from migration refactors.
