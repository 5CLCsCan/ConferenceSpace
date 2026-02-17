# 06 - Validation, Cutover, Rollback (Author + Public + Shared)

Last updated: 2026-02-17

This runbook is designed for a new-session agent. Follow it exactly before deleting legacy files.

## 1) Preflight

1. Confirm workspace:
- repository root is current directory
- `frontend-v2` exists

2. Confirm env:
- copy `frontend/.env.example` to `frontend-v2/.env.example`
- create `frontend-v2/.env.local` with valid values
- minimum required keys:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `BACKEND_API_BASE_URL`
  - `JWT_EXPIRY_SECONDS`

3. Install dependencies for `frontend-v2`:
- preferred: `pnpm install` inside `frontend-v2`
- fallback: `npm install` inside `frontend-v2`

4. Start app:
- preferred: `pnpm dev`
- fallback: `npm run dev`

## 2) Phase Gate Checks

Run these at the end of each phase in `04-execution-plan.md`.

### Gate A - Static quality

From `frontend-v2`:
- `pnpm lint` (or `npm run lint`)
- `pnpm exec tsc --noEmit` (or `npx tsc --noEmit`)
- `pnpm test:run` (or `npm run test:run`) when tests exist for touched code

### Gate B - Route integrity grep

From repository root:

1. Forbidden legacy route strings in migrated scope must be gone:
```powershell
rg --line-number "/dashboard/author|/dashboard/author/submissions|/dashboard/author/submit|/dashboard/notifications|/dashboard/users|/author/conference|/dashboard/conference/.*/submission" frontend-v2/app frontend-v2/components frontend-v2/hooks frontend-v2/lib
```
Expected: no matches.

2. Canonical route strings must be present:
```powershell
rg --line-number "/role/author|/role/author/submissions|/role/author/conferences|/notifications|/profile/" frontend-v2/app frontend-v2/components
```
Expected: matches in migrated pages/components.

3. Login and role selection must not push to `/dashboard`:
```powershell
rg --line-number "/dashboard" frontend-v2/app/login/page.tsx frontend-v2/app/role/page.tsx
```
Expected: no matches.

### Gate C - Runtime smoke flow

Run the manual scenarios in Section 3.

### Gate D - Legacy deletion safety

Only delete legacy files after:
1. Gate A/B/C all pass.
2. Replacement route/page in `frontend-v2` is verified.
3. The legacy file is not required for unfinished reviewer/chair phase work.

## 3) Manual Smoke Scenarios (Required)

Run in this order.

1. `S1` public home:
- Open `/`
- Expected: page renders, no auth loop

2. `S2` login:
- Open `/login`
- Login with valid account
- Expected: success navigates directly to `/role` (no `/dashboard` hop)

3. `S3` role reset:
- While logged in, open `/role` repeatedly
- Expected: role is reset each visit and must be reselected

4. `S4` non-migrated roles safe behavior:
- On `/role`, choose reviewer and chair
- Expected: land on placeholder pages (`/role/reviewer`, `/role/chair`), no 404, clear "pending migration" state, back to `/role` works

5. `S5` author entry:
- Select author role
- Expected: land on `/role/author`

6. `S6` notifications:
- Open `/notifications`
- Expected: notifications UI renders; no navigation item points to `/dashboard/notifications`

7. `S7` author conference navigation:
- From author dashboard, open a conference card/list item
- Expected: route is `/role/author/conferences/[conferenceId]`

8. `S8` conference header actions:
- In conference detail, click "View Submission" or "Submit Paper"
- Expected:
  - existing submission -> `/role/author/submissions` (optionally with query context)
  - new submission -> `/role/author/submissions/new` (optionally with `conferenceId`)

9. `S9` submissions list:
- Open `/role/author/submissions`
- Click a row
- Expected: `/role/author/submissions/[submissionId]` (query may include `conferenceId`)

10. `S10` submission detail deep-link:
- Open `/role/author/submissions/[submissionId]` without `conferenceId`
- Expected: app resolves conference via fallback lookup or shows clean not-found state with back-to-list action

11. `S11` submission edit:
- Open draft submission and click edit
- Expected: `/role/author/submissions/[submissionId]/edit` and save/submit works

12. `S12` submit success path:
- Submit or update a paper
- Expected: post-success navigation stays in canonical author routes (no `/dashboard/conference/...`)

13. `S13` profile self:
- Open `/profile/me`
- Expected: profile loads and save works for own profile

14. `S14` profile other user:
- Open `/profile/[user_id]` for another user
- Expected: public profile data loads when resolvable; unresolved id shows non-crashing not-found UI

15. `S15` logout:
- Logout from header/profile menu
- Expected: returns to `/`

## 4) Legacy Deletion Checklist (Per File)

Before deleting each legacy file in `frontend`:

1. The replacement route/component exists in `frontend-v2`.
2. Matching smoke scenario passed.
3. No active reference to legacy route string in `frontend-v2`.
4. Deletion is committed separately from feature refactor commit.

Recommended split:
- Commit A: migrate/canonicalize in `frontend-v2`
- Commit B: delete matched legacy file(s) in `frontend`

## 5) Cutover Procedure

1. Work in feature branch dedicated to author phase.
2. Keep changes grouped by phase (Phase 0..7 from execution plan).
3. After each phase:
- run Gate A/B/C
- commit phase checkpoint
4. After Phase 7 signoff:
- execute legacy deletions by mapped groups
- run Gate A/B/C again
- open PR with:
  - list of migrated canonical routes
  - list of deleted legacy files
  - smoke scenario evidence

## 6) Rollback Procedure

Use smallest rollback scope first.

1. Single regression in `frontend-v2`:
- revert last migration commit only

2. Legacy deletion mistake:
- restore deleted file(s) from git history
- rerun smoke checks

3. Broad failure after multiple phases:
- revert to last phase checkpoint tag/commit
- re-apply phases incrementally

4. Env/config regression:
- compare `frontend-v2/.env.local` against `frontend/.env.example`
- validate API base URL and auth cookie behavior

## 7) Final Signoff Criteria

All must be true:

1. Public/shared/author canonical routes function in `frontend-v2`.
2. No migrated scope route points to legacy `/dashboard/*` or `/author/conference/*`.
3. Login lands on `/role`; role reselection enforced.
4. Reviewer/chair selections are safe placeholders (no broken navigation).
5. Author submissions and profile flows handle deep-link edge cases gracefully.
6. Legacy files scheduled for this phase are deleted or explicitly deferred with reason.
