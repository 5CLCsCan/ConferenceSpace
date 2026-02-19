# 04 - Execution Plan (Reviewer)

Last updated: 2026-02-18

This plan is written for a new-session implementation agent.

## Status Legend

- `[ ]` pending
- `[~]` in progress
- `[x]` complete

## Recommended Reviewer Sub-Flow Order

1. Reviewer route skeleton and role guard
2. Reviewer API and hook foundation
3. Reviewer conferences and invitations pages
4. Reviewer conference submissions page
5. Reviewer assignment execution page (`SubmissionReviewScreen` canonical)
6. Reviewer completed page and shared nav updates
7. Cleanup, hardening, release readiness

## Phase 0 - Guardrails And Baseline

Status: `[ ]`

Objective:
- Lock baseline and prevent route drift during reviewer implementation.

Tasks:
1. Capture baseline reviewer route inventory from `frontend-v2/app`.
2. Add reviewer grep guard checks from `06-validation-cutover-rollback.md` to local workflow.
3. Record locked reviewer decisions from `07-risks-and-edge-cases.md`.

Exit criteria:
- Baseline and guard checks documented.
- Locked decisions are reflected in implementation checklist.

Deletion gate:
- No deletions in this phase.

Dependencies:
- None.

## Phase 1 - Reviewer Route Skeleton + Guard

Status: `[ ]`

Objective:
- Replace placeholder-only reviewer state with canonical route skeleton protected by reviewer role guard.

Tasks:
1. Replace `frontend-v2/app/role/reviewer/page.tsx` placeholder with real dashboard root shell.
2. Add reviewer role layout:
- `frontend-v2/app/role/reviewer/layout.tsx` using `useRoleRouteGuard("reviewer")`.
3. Create missing reviewer routes:
- `frontend-v2/app/role/reviewer/conferences/page.tsx`
- `frontend-v2/app/role/reviewer/invitations/page.tsx`
- `frontend-v2/app/role/reviewer/completed/page.tsx`
- `frontend-v2/app/role/reviewer/conferences/[conferenceId]/submissions/page.tsx`
- `frontend-v2/app/role/reviewer/assignments/[assignmentId]/page.tsx`

Exit criteria:
- All canonical reviewer routes resolve (no placeholder-only page).
- Reviewer route family is guarded by role layout.

Deletion gate:
- Placeholder copy removed from reviewer root page.

Dependencies:
- Shared auth/session foundation in `frontend-v2` is already present.

## Phase 2 - Reviewer API/Hook Foundation

Status: `[ ]`

Objective:
- Build reviewer data foundation in target with no backend contract changes.

Tasks:
1. Add `frontend-v2/lib/api/reviewer.ts` (adapt from legacy `frontend/lib/api/reviewer.ts`).
2. Add `frontend-v2/lib/swr-config.ts`.
3. Add reviewer hooks:
- `frontend-v2/hooks/use-reviewer-dashboard.ts`
- `frontend-v2/hooks/use-conference-papers.ts`
- `frontend-v2/hooks/use-completed-reviews.ts`
- `frontend-v2/hooks/use-assignment-review.ts`
- `frontend-v2/hooks/use-debounce.ts`
4. Keep `frontend-v2/lib/api/reviews.ts` as assignment review API source.

Exit criteria:
- Reviewer pages can load dashboard/conference/invitation/completed data from target API hooks.
- No backend API modifications introduced.

Deletion gate:
- No deletions in this phase.

Dependencies:
- Phase 1 route skeleton complete.

## Phase 3 - Conferences And Invitations Routes

Status: `[ ]`

Objective:
- Deliver canonical reviewer list flows as dedicated routes (not query tabs).

Tasks:
1. Implement conferences list page and wire conference selection to canonical submissions route.
2. Implement invitations page and wire accept/decline flow.
3. Ensure sidebar/header reviewer links can reach conferences and invitations canonical paths.
4. Remove query-tab behavior from reviewer runtime flow in target implementation.

Exit criteria:
- `/role/reviewer/conferences` renders and navigates correctly.
- `/role/reviewer/invitations` renders and actions work.

Deletion gate:
- Do not delete legacy query-tab files until all reviewer list links in target are canonical and smoke-tested.

Dependencies:
- Phase 2 foundation complete.

## Phase 4 - Conference Submissions Route

Status: `[ ]`

Objective:
- Deliver conference-scoped reviewer submissions list under canonical route.

Tasks:
1. Implement `/role/reviewer/conferences/[conferenceId]/submissions` page using reviewer conference submissions component.
2. Remove mock-only behavior from submissions list path (legacy `USE_MOCK_DATA` toggle is not acceptable for final cutover).
3. Ensure row/action navigation points to `/role/reviewer/assignments/[assignmentId]`.

Exit criteria:
- Reviewer can open a conference and see assigned submissions under canonical route.
- No `paperId`-named route usage in target.

Deletion gate:
- Do not delete legacy conference reviewer routes until assignment flow (Phase 5) passes smoke checks.

Dependencies:
- Phase 3 conferences route complete.

## Phase 5 - Assignment Execution Route (Canonical)

Status: `[ ]`

Objective:
- Deliver assignment execution using `SubmissionReviewScreen` as source-of-truth, with resolver-based conference resolution.

Tasks:
1. Migrate/copy `frontend/components/reviewer/submission-review.tsx` and `frontend/components/reviewer/submission-review/*` into `frontend-v2/components/reviewer/*`.
2. Add missing shared rebuttal dependency in target:
- `frontend-v2/components/shared/rebuttal/*` (if absent).
3. Implement assignment page data-loading and resolver:
- resolve `conferenceId` via query/cache/lookup chain
- render explicit unresolved-assignment state if unresolved
4. Wire discussion and rebuttal tabs in execution UI.
5. Keep canonical URL identity by `assignmentId` route segment.

Exit criteria:
- `/role/reviewer/assignments/[assignmentId]` loads execution UI for resolvable links.
- unresolved assignment path renders explicit fallback state.
- execution UI source-of-truth is `SubmissionReviewScreen`, not `PaperReview`.

Deletion gate:
- `PaperReview`-based target artifacts can only be removed after assignment route validation passes.

Dependencies:
- Phase 4 conference submissions route complete.

## Phase 6 - Completed Route + Shared Navigation Updates

Status: `[ ]`

Objective:
- Complete reviewer route family and align shared shell navigation.

Tasks:
1. Implement `/role/reviewer/completed` page and wire to canonical assignment route.
2. Update reviewer links in shared header:
- `frontend-v2/components/dashboard-header.tsx`
3. Update reviewer menu in notifications page:
- `frontend-v2/app/notifications/page.tsx`
4. Ensure reviewer sidebar contract includes conferences, invitations, completed, notifications.

Exit criteria:
- Completed flow works and routes to canonical assignment page.
- shared nav/header/notifications contain no reviewer legacy path patterns.

Deletion gate:
- no reviewer legacy paths remain in active `frontend-v2` navigation before cleanup phase starts.

Dependencies:
- Phases 3-5 complete.

## Phase 7 - Cleanup, Hardening, Release Readiness

Status: `[ ]`

Objective:
- Remove stale reviewer artifacts safely and validate release readiness.

Tasks:
1. Execute static + grep + smoke checks from `06-validation-cutover-rollback.md`.
2. Clean stale reviewer artifacts in target and legacy only when deletion gates pass.
3. Keep deletion commits separate from migration refactor commits.
4. Final docs consistency pass across reviewer pack files.

Exit criteria:
- Final signoff criteria all pass.
- reviewer contract implemented without contradictions.

Deletion gate:
- each deletion must satisfy:
  1. equivalent behavior exists in `frontend-v2`
  2. no active target references remain
  3. deletion does not break unfinished scopes

Dependencies:
- All prior phases complete.

## Mandatory Deletion Policy

For any reviewer legacy file deletion:

1. Equivalent behavior must already exist in `frontend-v2`.
2. No active target reference may remain.
3. Deletion must be validated through grep + smoke checks.
4. Deletion commits should be separate and reversible.
