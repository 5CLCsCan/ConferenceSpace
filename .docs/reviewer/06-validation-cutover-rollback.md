# 06 - Validation, Cutover, Rollback (Reviewer)

Last updated: 2026-02-18

This runbook defines mandatory checks before reviewer cutover.

## 1) Preflight

1. Confirm working directory is repo root.
2. Confirm target app directory exists: `frontend-v2`.
3. Install dependencies in `frontend-v2`:
- `pnpm install` (preferred)
- or `npm install`
4. Run target app:
- `pnpm dev`
- or `npm run dev`

## 2) Static Checks

Run from `frontend-v2`:

1. Lint
```powershell
pnpm lint
```

2. Type check
```powershell
pnpm exec tsc --noEmit
```

3. Build
```powershell
pnpm build
```

4. Tests (if touched scope has tests)
```powershell
pnpm test:run
```

## 3) Grep Checks

Run from repository root.

### 3.1 Forbidden legacy reviewer routes must be absent in target reviewer scope

```powershell
rg --line-number "/dashboard/reviewer|/dashboard/conference|\\?tab=conferences|\\?tab=invitations|\\?tab=conference-papers|/reviewer/submissions/\\[paperId\\]" frontend-v2/app frontend-v2/components frontend-v2/lib
```

Expected:
- no matches in active reviewer implementation files.

### 3.2 Canonical reviewer routes must exist in target code

```powershell
rg --line-number "/role/reviewer|/role/reviewer/conferences|/role/reviewer/invitations|/role/reviewer/completed|/role/reviewer/assignments" frontend-v2/app frontend-v2/components
```

Expected:
- positive matches in reviewer pages/components.

### 3.3 Placeholder-only reviewer copy must be removed

```powershell
rg --line-number "Reviewer Migration Pending" frontend-v2/app/role/reviewer
```

Expected:
- no matches.

### 3.4 Canonical execution UI should not use PaperReview in target

```powershell
rg --line-number "paper-review|PaperReview" frontend-v2/app/role/reviewer frontend-v2/components/reviewer
```

Expected:
- no active reviewer execution imports/usages.

### 3.5 Reviewer role family must have role guard layout

```powershell
rg --line-number "useRoleRouteGuard\\(\"reviewer\"\\)" frontend-v2/app/role/reviewer
```

Expected:
- positive match in reviewer layout.

## 4) Manual Smoke Scenarios

Execute in order:

1. `S1` Login and role selection
- Login at `/login`.
- Expected: redirect to `/role`, selecting reviewer opens `/role/reviewer`.

2. `S2` Reviewer dashboard root
- Open `/role/reviewer`.
- Expected: real reviewer dashboard (not placeholder), reviewer sidebar links functional.

3. `S3` Conferences list flow
- Open `/role/reviewer/conferences`.
- Open one conference.
- Expected: navigates to `/role/reviewer/conferences/[conferenceId]/submissions`.

4. `S4` Invitations flow
- Open `/role/reviewer/invitations`.
- Accept/decline an invitation.
- Expected: action path executes and list refresh behavior is correct.

5. `S5` Completed flow
- Open `/role/reviewer/completed`.
- Open one completed item.
- Expected: navigates to `/role/reviewer/assignments/[assignmentId]`.

6. `S6` Assignment deep link with query conference hint
- Open `/role/reviewer/assignments/[assignmentId]?conferenceId=<id>`.
- Expected: assignment loads successfully.

7. `S7` Assignment deep link without query conference hint
- Open `/role/reviewer/assignments/[assignmentId]`.
- Expected: resolver attempts fallback chain and loads if resolvable.

8. `S8` Unresolvable assignment deep link
- Open assignment URL known to be unresolved by resolver.
- Expected: explicit unresolved-assignment state shown (non-crash, user-visible guidance).

9. `S9` Discussion and rebuttal tabs in assignment execution
- Open assignment page and switch tabs.
- Expected: discussion and rebuttal tabs render.

10. `S10` Shared nav integrity
- From reviewer context, navigate through header/sidebar/notifications.
- Expected: no reviewer nav path points to `/dashboard/reviewer*`, `/dashboard/conference/*/reviewer/*`, or query-tab reviewer URLs.

## 5) Final Signoff Criteria

All must be true:

1. Canonical reviewer routes render and are navigable.
2. Forbidden legacy reviewer path grep checks pass.
3. Assignment resolver and unresolved fallback behavior match contract.
4. `SubmissionReviewScreen` stack is active canonical execution UI.
5. Reviewer role guard layout is active for reviewer route family.
6. Shared nav/header/notifications reviewer links are canonical.
7. Cleanup candidates in `05-file-mapping.md` are completed or explicitly deferred with reason.

## 6) Cutover Procedure

1. Implement by phase order from `04-execution-plan.md`.
2. After each phase:
- run static checks (Section 2)
- run grep checks (Section 3)
- run affected smoke scenarios (Section 4)
3. Commit in small phase checkpoints.
4. Keep deletion/cleanup commits separate from migration feature commits.
5. Re-run full Section 2-4 before merge.

## 7) Rollback Procedure

If regression is found:

1. Roll back smallest affected commit set first (prefer single-phase revert).
2. If cleanup caused regression, restore deleted files and re-run smoke checks.
3. If route contract regression is broad, revert to last known-good phase checkpoint and re-apply incrementally.
4. Keep locked reviewer route contracts intact while restoring minimal behavior needed to recover service.
