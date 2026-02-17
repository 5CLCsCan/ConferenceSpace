# 04 - Execution Plan (Author + Public + Shared)

Last updated: 2026-02-17

This plan is written for a new session agent with no prior context.

## Status Legend

- `[ ]` pending
- `[~]` in progress
- `[x]` complete

## Phase 0 - Bootstrap `frontend-v2`

Status: `[ ]`

Goal:
- Create a runnable Next.js app workspace (`frontend-v2`) that can host migrated public/shared/author pieces.

Tasks:
1. Create `frontend-v2` directory.
2. Copy baseline framework/config files from `frontend`:
- `package.json`
- lockfile used by repo (`pnpm-lock.yaml` or `package-lock.json`)
- `tsconfig.json`
- `next.config.mjs`
- `postcss.config.mjs`
- `components.json`
- `.eslintrc.json`
- `prettier.config.cjs`
- `next-env.d.ts`
3. Copy env baseline:
- `frontend/.env.example` -> `frontend-v2/.env.example`
- create `frontend-v2/.env.local` from example values for local dev
4. Copy app skeleton and providers required by migrated routes:
- `app/layout.tsx`
- `app/globals.css`
- `lib/auth-context.tsx`
- `lib/session-manager.ts`
- `lib/config.ts`
- `lib/api/client.ts`
- `lib/i18n/translation-context.tsx`
- `components/ui/*` required primitives
- `components/chatbot/*` and `components/ui/toaster*` used by layout
5. Copy API proxy/auth routes required for auth/session continuity:
- `app/api/backend/[...path]/route.ts`
- `app/api/v1/auth/login/route.ts`
- `app/api/v1/auth/logout/route.ts`

Exit criteria:
- `frontend-v2` boots with `npm run dev` or `pnpm dev`.
- Root layout renders without import errors.
- API proxy routes load with no runtime env errors.

## Phase 1 - Migrate Public Routes

Status: `[ ]`

Goal:
- Move public entry pages and align login behavior to canonical flow.

Tasks:
1. Copy and adapt routes:
- `app/page.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
2. Update login flow in `frontend-v2/app/login/page.tsx`:
- replace `/dashboard` push with `/role`
3. Keep registration success redirect to `/login?registered=1`.

Exit criteria:
- `/`, `/login`, `/register` work in `frontend-v2`.
- Successful login lands on `/role` directly.

Legacy deletion gate:
- Do not delete legacy public pages yet unless `frontend-v2` is primary runtime for QA.

## Phase 2 - Migrate Shared Foundation Routes

Status: `[ ]`

Goal:
- Establish canonical shared pages and nav behavior.

Tasks:
1. Copy and adapt:
- `app/role/page.tsx`
- `app/notifications/page.tsx`
- create `app/profile/[user_id]/page.tsx` from profile logic in legacy email page
2. Copy shared components/hook used by these pages:
- `components/dashboard-sidebar.tsx`
- `components/dashboard-header.tsx`
- `components/notifications/*`
- `hooks/use-notifications.ts`
- `lib/api/notifications.ts`
3. Replace shared legacy route pushes:
- `/dashboard/notifications` -> `/notifications`
- `/dashboard/users/me` -> `/profile/{currentUserId}`
- `/dashboard` (switch role) -> `/role`
4. In role page, replace role target `/dashboard/${role}` with canonical role routes.
5. Add non-migrated role placeholders:
- `app/role/reviewer/page.tsx`
- `app/role/chair/page.tsx`
- these pages only explain that migration is pending and provide navigation back to `/role`.

Exit criteria:
- `/role` works and role reset behavior is preserved.
- `/notifications` is the only notifications destination.
- profile entry is canonicalized in header.
- selecting reviewer/chair does not hit a 404 in `frontend-v2`.

Legacy deletion gate:
- After successful validation, delete:
- `frontend/app/dashboard/page.tsx`
- `frontend/app/dashboard/notifications/page.tsx`

## Phase 3 - Migrate Author Dashboard + Conference Detail

Status: `[ ]`

Goal:
- Move author root and conference detail experience under canonical role namespace.

Tasks:
1. Create canonical author routes in `frontend-v2`:
- `app/role/author/page.tsx`
- `app/role/author/conferences/[conferenceId]/page.tsx`
2. Copy and adapt components:
- `components/author/author-conferences.tsx`
- `components/author/author-conference-detail.tsx`
- `components/author/author-conference-*`
- `components/author/conference-detail/*`
3. Replace all author conference route pushes:
- `/author/conference/${id}` -> `/role/author/conferences/${conferenceId}`
4. Update sidebar menu items for author pages to canonical paths.

Exit criteria:
- Author dashboard and conference detail work at canonical routes.
- No author flow in `frontend-v2` points to `/author/conference/*`.

Legacy deletion gate:
- After validation, delete legacy route files:
- `frontend/app/dashboard/author/page.tsx`
- `frontend/app/author/conference/[id]/page.tsx`

## Phase 4 - Migrate Author Submissions + Submit/Edit + Detail

Status: `[ ]`

Goal:
- Build one coherent author submission flow under canonical author namespace.

Tasks:
1. Create canonical routes:
- `app/role/author/submissions/page.tsx`
- `app/role/author/submissions/new/page.tsx`
- `app/role/author/submissions/[submissionId]/page.tsx`
- `app/role/author/submissions/[submissionId]/edit/page.tsx`
2. Copy and adapt components:
- `components/author/author-submissions-list.tsx`
- `components/author/submit/*`
- `components/author/submission-detail/*`
3. Keep API-backed detail logic (from legacy conference/submission route), but expose author-scoped route.
4. Replace route pushes/links inside author components:
- `/dashboard/author/submissions` -> `/role/author/submissions`
- `/dashboard/author/submit?...` -> `/role/author/submissions/new?...` or `/role/author/submissions/[id]/edit?...`
- `/dashboard/conference/{id}/submission/{submissionId}` -> `/role/author/submissions/{submissionId}?conferenceId={id}`
- `/dashboard/conference/{id}` -> `/role/author/conferences/{id}`
5. Deprecate mock detail path and component usage:
- stop using `/dashboard/author/papers/[id]`
- do not carry mock detail flow into canonical route tree

Exit criteria:
- Author submissions list/detail/edit/new are fully canonical and functional.
- No author route in `frontend-v2` points to any `/dashboard/*` path.

Legacy deletion gate:
- After validation, delete:
- `frontend/app/dashboard/author/submissions/page.tsx`
- `frontend/app/dashboard/author/submit/page.tsx`
- `frontend/app/dashboard/author/papers/[id]/page.tsx`
- `frontend/app/dashboard/conference/[id]/submission/[submissionId]/page.tsx` (only when no longer needed by non-author scope)
- `frontend/components/author/paper-detail-view.tsx` (if no imports remain)

## Phase 5 - Migrate Shared Profile Route

Status: `[ ]`

Goal:
- Move profile to canonical `/profile/[user_id]` while keeping backend untouched.

Tasks:
1. Create `frontend-v2/app/profile/[user_id]/page.tsx` from legacy profile page logic.
2. Implement frontend resolver strategy:
- self route: `/profile/me` supported (mapped to `/api/v1/users/me`)
- if `user_id` equals current user id, map to `/api/v1/users/me`
- if `user_id` looks like email, map directly to `/api/v1/users/{email}`
- else resolve by `/api/v1/users/search?q={user_id}&limit=10`, then fetch `/api/v1/users/{resolvedEmail}`
3. Non-resolvable id fallback:
- show not found message + back action (do not crash/loop)
4. Repoint header profile links to `/profile/{user_id}`.

Exit criteria:
- Profile page works for self and known users.
- No shared entry points in `frontend-v2` use `/dashboard/users/*`.

Legacy deletion gate:
- After validation, delete:
- `frontend/app/dashboard/users/[email]/page.tsx`

## Phase 6 - Cleanup And Legacy Pruning

Status: `[ ]`

Goal:
- Remove legacy-only author/public/shared artifacts and dead code.

Tasks:
1. Remove legacy route references from `frontend-v2`:
- `/dashboard/*`
- `/author/conference/*`
2. Remove legacy/unused author component not part of canonical flow:
- `components/author/author-dashboard.tsx` (if still unused)
3. Run grep checks listed in `06-validation-cutover-rollback.md`.

Exit criteria:
- `frontend-v2` contains only canonical author/public/shared paths.

## Phase 7 - Cutover Readiness

Status: `[ ]`

Goal:
- Make `frontend-v2` author/public/shared ready for integration testing.

Tasks:
1. Run smoke flows and regression checklist.
2. Confirm no open blockers in this scope.
3. Document deferred items (reviewer/chair) clearly.

Exit criteria:
- Phase sign-off achieved for author/public/shared.

## Deletion Policy (Mandatory)

For each legacy file deletion in `frontend`, all must be true:

1. Equivalent behavior exists and is verified in `frontend-v2`.
2. `rg` in `frontend-v2` shows no dependency on deleted legacy path strings.
3. If legacy `frontend` still must compile for teammates, postpone deletion until branch cutover.

Recommended command before deletion:
- `rg --line-number '/dashboard/author|/author/conference|/dashboard/notifications|/dashboard/users' frontend-v2`
