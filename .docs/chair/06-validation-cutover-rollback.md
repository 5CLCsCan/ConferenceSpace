# 06 - Validation, Cutover, Rollback (Chair)

Last updated: 2026-02-18

This runbook defines mandatory checks before chair cutover.

## 1) Preflight

1. Confirm working directory is repo root.
2. Confirm target app directory exists: `frontend-v2`.
3. Install dependencies in `frontend-v2`:
- `pnpm install` (preferred)
- or `npm install`
4. Run app in target:
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

### 3.1 Forbidden legacy/public chair paths must be gone from target chair scope

```powershell
rg --line-number "/dashboard/chair|/dashboard/conference|/dashboard/chair/tasks|\\?tab=submissions|/conference/\\$\\{id\\}" frontend-v2/app frontend-v2/components
```

Expected:
- No matches in active chair implementation files.

### 3.2 Canonical chair routes must exist in target code

```powershell
rg --line-number "/role/chair|/role/chair/conferences|/role/chair/schedules" frontend-v2/app frontend-v2/components
```

Expected:
- Positive matches in chair pages/components.

### 3.3 Placeholder-only chair copy must be removed

```powershell
rg --line-number "Chair Migration Pending" frontend-v2/app/role/chair
```

Expected:
- No matches.

### 3.4 Chair coupling in author submission route must be removed at cutover

```powershell
rg --line-number "currentRole === \"chair\"|roles.includes\\(\"chair\"\\)" frontend-v2/app/role/author frontend-v2/components/author
```

Expected:
- Zero matches before final signoff.

## 4) Manual Smoke Scenarios

Execute in order:

1. `S1` Login and role selection
- Login at `/login`.
- Expected: redirect to `/role`, then selecting chair opens `/role/chair`.

2. `S2` Chair dashboard root
- Open `/role/chair`.
- Expected: real chair dashboard (not placeholder), sidebar links functional.

3. `S3` Chair conferences list
- Open `/role/chair/conferences`.
- Expected: list renders and navigation actions resolve to canonical chair paths.

4. `S4` Explore/archived access behavior
- Trigger Explore/Archived card action.
- Expected: canonical navigation behavior only for entries returned by backend-filtered list.

5. `S5` Create conference entry
- Click create action from chair conference list.
- Expected: `/role/chair/conferences/new`.

6. `S6` Create conference submit/cancel
- Execute cancel and submit paths.
- Expected:
  - cancel returns to `/role/chair` or `/role/chair/conferences` per contract
  - successful submit shows success feedback and canonical redirect.

7. `S7` Conference detail tabs
- Open `/role/chair/conferences/[conferenceId]`.
- Switch tabs (dashboard/overview/cfp/dates/committee/submissions/coi).
- Expected: tab content loads and no legacy link appears.

8. `S8` Submission detail
- From conference detail submissions tab, open a submission.
- Expected: `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`.

9. `S9` Review surfaces inside submission detail
- Open reviews/discussion/history tabs.
- Expected: analytics and discussion render without redirect to legacy routes.

10. `S10` Schedules
- Open `/role/chair/schedules`.
- Expected: schedules page renders, sidebar remains canonical.

11. `S11` Notifications integration
- Open `/notifications` while chair role is active.
- Expected: chair menu entry points back to `/role/chair` and no dashboard links.

12. `S12` Role switch + profile
- Use switch role and profile from header/sidebar.
- Expected:
  - switch role -> `/role`
  - profile -> `/profile/[user_id]`

13. `S13` Chair denied on author submission route
- While authenticated as chair, open `/role/author/submissions/[submissionId]`.
- Expected: chair cannot use this route after cutover (redirect/forbidden per app guard), with no chair-specific author detail rendering.

## 5) Final Signoff Criteria

All must be true:

1. Canonical chair routes render and are navigable.
2. Forbidden legacy/public chair path grep checks pass.
3. Create conference and schedules flows work in `frontend-v2`.
4. Chair submission detail and review surfaces work on canonical routes.
5. Chair cross-role coupling in author submission route is removed.
6. Cleanup candidates in `05-file-mapping.md` are completed or intentionally deferred with reason.

## 6) Cutover Procedure

1. Implement by phase order from `04-execution-plan.md`.
2. After each phase:
- run static checks (Section 2)
- run grep checks (Section 3)
- run affected smoke scenarios (Section 4)
3. Commit in small phase checkpoints.
4. Perform deletion/cleanup commits separately from feature migration commits.
5. Re-run full Section 2-4 before merge.

## 7) Rollback Procedure

If regression is found:

1. Roll back smallest affected commit set first (prefer single-phase revert).
2. If cleanup caused regression, restore deleted files and re-run smoke checks.
3. If route contract regression is broad, revert to last known-good phase checkpoint and re-apply incrementally.
4. Keep locked route contracts intact while restoring minimal behavior needed to recover service.
