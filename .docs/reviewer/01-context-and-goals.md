# 01 - Context And Goals (Reviewer)

Last updated: 2026-02-18

## 1) Mission

Migrate the reviewer experience from legacy `frontend` into canonical `frontend-v2` routes, with explicit contracts and incremental cutover safety.

Requested role: `reviewer`

Output scope: `.docs/reviewer/*` and implementation guidance for `frontend-v2`.

## 2) Primary Grounding Sources

1. Current target implementation: `frontend-v2`
2. Legacy implementation: `frontend`
3. Legacy planning references:
- `.docs/.legacy/route-contract.md`
- `.docs/.legacy/plan.md`
- `.docs/.legacy/proposal.md`
- `.docs/.legacy/evaluation.md`

## 3) Baseline Reality (Evidence)

### 3.1 Legacy reviewer is fully implemented under dashboard paths

Legacy reviewer flows exist in:
- `frontend/app/dashboard/reviewer/page.tsx`
- `frontend/app/dashboard/reviewer/completed/page.tsx`
- `frontend/app/dashboard/reviewer/papers/[id]/page.tsx`
- `frontend/app/dashboard/conference/[id]/reviewer/assigned/page.tsx`
- `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx`

Legacy reviewer component stack exists in:
- `frontend/components/reviewer/*`
- `frontend/components/reviewer/submission-review/*`

### 3.2 `frontend-v2` reviewer is currently placeholder-only

Current target reviewer route:
- `frontend-v2/app/role/reviewer/page.tsx`

Current behavior:
- page renders "Reviewer Migration Pending"
- no reviewer conferences/invitations/completed/assignment subroutes exist yet

### 3.3 Reviewer foundation modules are missing in target

Target gaps verified:
- missing `frontend-v2/components/reviewer/*`
- missing `frontend-v2/lib/api/reviewer.ts`
- missing reviewer hooks:
  - `frontend-v2/hooks/use-reviewer-dashboard.ts`
  - `frontend-v2/hooks/use-conference-papers.ts`
  - `frontend-v2/hooks/use-completed-reviews.ts`
  - `frontend-v2/hooks/use-assignment-review.ts`
  - `frontend-v2/hooks/use-debounce.ts`
- missing `frontend-v2/lib/swr-config.ts`

### 3.4 Legacy reviewer execution has duplicate UI/route models

Two reviewer execution implementations exist in legacy:

1. Assignment/API-backed execution:
- page: `frontend/app/dashboard/reviewer/papers/[id]/page.tsx`
- UI: `frontend/components/reviewer/paper-review.tsx`
- route uses assignment id in `[id]`, but requires query `conference_id`

2. Conference-paper/mock-first execution:
- page: `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx`
- UI: `frontend/components/reviewer/submission-review.tsx`
- naming uses `paperId` and mock-first data flow

### 3.5 Shared shell coupling points that affect reviewer migration

Reviewer reachability and navigation are coupled to shared surfaces:
- role selector map in `frontend-v2/app/role/page.tsx`
- reviewer links in `frontend-v2/components/dashboard-header.tsx`
- reviewer notifications sidebar in `frontend-v2/app/notifications/page.tsx`
- role guard utility available at `frontend-v2/lib/use-role-route-guard.ts`, but no reviewer layout currently uses it

## 4) Goals

1. Implement canonical reviewer route family under `/role/reviewer/*`.
2. Define strict reviewer route parameter naming (`conferenceId`, `assignmentId`).
3. Lock source-of-truth reviewer execution UI to `SubmissionReviewScreen` stack.
4. Replace query-tab reviewer navigation with page-routed reviewer flows.
5. Implement assignment deep-link conference resolution with explicit unresolved fallback state.
6. Provide validation, cleanup, and rollback procedures safe for phased delivery.

## 5) In Scope

- Reviewer dashboard root at `/role/reviewer`.
- Reviewer conferences/invitations/completed pages.
- Conference submissions list at `/role/reviewer/conferences/[conferenceId]/submissions`.
- Assignment execution page at `/role/reviewer/assignments/[assignmentId]`.
- Reviewer-specific API/hook/module foundation in `frontend-v2`.
- Reviewer-coupled shared navigation updates in target shell components.
- Documentation and deletion gates for reviewer legacy cleanup.

## 6) Out Of Scope

- Backend schema or endpoint changes.
- Admin route migration.
- Re-architecting author/chair features beyond reviewer-coupling updates.
- Broad design-system restyling unrelated to reviewer contract correctness.

## 7) Non-Negotiable Constraints

1. No assumed prior context for implementers.
2. Canonical routes and params must be explicit.
3. Phase-by-phase execution with validation gates is mandatory.
4. Cleanup and rollback instructions must be included.
5. Only blocking/materially impactful decisions should be escalated.
6. No backend changes in this migration batch.

## 8) Locked Decisions For This Role Pack

1. Canonical reviewer execution UI is `SubmissionReviewScreen` stack (`submission-review/*`).
2. Assignment deep-link policy:
- auto-resolve `conferenceId` via resolver chain
- render explicit unresolved-assignment state if unresolved after all fallback paths

## 9) Success Criteria

Reviewer migration is successful when all are true:

1. Canonical reviewer routes render under `/role/reviewer/*`.
2. Reviewer navigation no longer depends on query-tab URLs.
3. Reviewer execution route uses `assignmentId` and resolver policy.
4. `SubmissionReviewScreen` stack is canonical execution implementation.
5. No active `frontend-v2` reviewer navigation points to `/dashboard/reviewer*` or `/dashboard/conference/*/reviewer/*`.
6. Static checks, grep checks, and smoke checks pass.
7. Reviewer legacy artifacts marked for cleanup can be removed safely per deletion gates.
