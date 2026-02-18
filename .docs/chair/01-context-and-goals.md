# 01 - Context And Goals (Chair)

Last updated: 2026-02-18

## 1) Mission

Migrate the chair experience from legacy `frontend` into canonical `frontend-v2` routes, with explicit contracts and incremental cutover safety.

Requested role: `chair`

Output scope: `.docs/chair/*` and implementation guidance for `frontend-v2`.

## 2) Primary Grounding Sources

1. Current target implementation: `frontend-v2`
2. Legacy implementation: `frontend`
3. Legacy planning references:
- `.docs/.legacy/route-contract.md`
- `.docs/.legacy/plan.md`
- `.docs/.legacy/proposal.md`
- `.docs/.legacy/evaluation.md`

## 3) Baseline Reality (Evidence)

### 3.1 Legacy chair is fully implemented under dashboard paths

Legacy chair flows exist in:
- `frontend/app/dashboard/chair/page.tsx`
- `frontend/app/dashboard/conference/page.tsx`
- `frontend/app/dashboard/chair/create-conference/page.tsx`
- `frontend/app/dashboard/chair/conference/[id]/page.tsx`
- `frontend/app/dashboard/chair/conference/[id]/submission/[submissionId]/page.tsx`
- `frontend/app/dashboard/chair/schedules/page.tsx`

Legacy chair components and detail stack:
- `frontend/components/chair/*`
- `frontend/components/chair/conference-detail/*`

### 3.2 `frontend-v2` chair is currently only a placeholder

Current target chair route:
- `frontend-v2/app/role/chair/page.tsx` (placeholder "Chair Migration Pending")

Missing in target:
- `/role/chair/conferences`
- `/role/chair/conferences/new`
- `/role/chair/conferences/[conferenceId]`
- `/role/chair/conferences/[conferenceId]/submissions`
- `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`
- `/role/chair/schedules`

### 3.3 Chair logic still leaks into non-chair areas in target

Cross-role coupling in `frontend-v2`:
- `frontend-v2/components/author/submission-detail/index.tsx` renders chair review widget when `currentRole === "chair"`.
- `frontend-v2/app/role/author/submissions/[submissionId]/page.tsx` allows both author and chair role access.
- `frontend-v2/components/conference/author-conferences.tsx` routes chair users to `/role/chair` and still pushes `/conference/${id}` for explore/archived cards.

### 3.4 Chair-relevant API layer already exists in target

Available APIs in `frontend-v2` (currently underused by chair pages):
- `frontend-v2/lib/api/conferences.ts` (`getConferenceById`, `listConferences`, `createConference`, `updateConference`)
- `frontend-v2/lib/api/submissions.ts` (`getConferenceSubmissions`, `getSubmissionById`)
- `frontend-v2/lib/api/reviews.ts` (`getSubmissionReviews`, `getSubmissionReviewAnalytics`, `getAssignmentReview`)

## 4) Goals

1. Implement canonical chair route family under `/role/chair/*`.
2. Define strict route parameter naming and ownership boundaries.
3. Move chair source-of-truth UI from legacy into `frontend-v2` iteratively.
4. Remove active chair navigation dependencies on legacy/public routes.
5. Provide validation, cleanup, and rollback procedures safe for phased delivery.

## 5) In Scope

- Chair dashboard root page behavior at `/role/chair`.
- Chair conferences list/create/detail/submissions/submission-detail/schedules flows.
- Chair-specific navigation updates in shared shell components where required.
- Chair coupling cleanup in author/shared surfaces that currently leak chair behavior.
- Documentation and phase gates for deleting stale chair routing paths.

## 6) Out Of Scope

- Backend schema or endpoint changes.
- Admin route migration.
- Reviewer full migration (reviewer remains placeholder in `frontend-v2`).
- Re-architecting all shared UI styling; only changes required for chair contract correctness.

## 7) Non-Negotiable Constraints

1. No assumed prior context for implementers.
2. Canonical routes and params must be explicit.
3. Phase-by-phase execution with validation gates is mandatory.
4. Cleanup and rollback instructions must be included.
5. Only blocking/materially impactful decisions should be escalated.

## 8) Success Criteria

Chair migration is successful when all are true:

1. Chair flows are reachable through canonical routes in `frontend-v2`.
2. No active chair UI path points to `/dashboard/chair*`, `/dashboard/conference*`, or `/conference/[id]`.
3. Chair pages use canonical params (`conferenceId`, `submissionId`) in routes and navigation.
4. Shared auth/session behavior remains stable (`/login` -> `/role` -> selected role root).
5. Static checks, grep checks, and smoke checks pass.
6. Legacy chair artifacts marked for cleanup can be removed safely per deletion gates.

