# 07 - Risks And Edge Cases (Author Phase)

Last updated: 2026-02-17

This file lists high-risk failure modes for public/shared/author migration and how to prevent them.

## 1) Critical Risks

### Risk 1 - Role selection sends users to broken reviewer/chair pages
- Related: `app/role/page.tsx`, shared role switch flow.
- Failure signal: selecting reviewer/chair returns 404.
- Mitigation: include placeholder pages at `/role/reviewer` and `/role/chair` in this phase.

### Risk 2 - Login still routes through `/dashboard`
- Related: `app/login/page.tsx`, `app/dashboard/page.tsx` legacy redirect behavior.
- Failure signal: post-login URL contains `/dashboard`.
- Mitigation: direct push to `/role` in `frontend-v2` login page; remove dependency on legacy dashboard redirect.

### Risk 3 - Author submission detail cannot load without `conferenceId`
- Related: `/role/author/submissions/[submissionId]`, `getSubmissionById`.
- Failure signal: deep links fail for valid submission id.
- Mitigation:
1. include `conferenceId` in UI-generated links when possible
2. fallback resolve conference via `getUserSubmissions(user.email)`
3. show clear not-found state if unresolved

### Risk 4 - Profile route `/profile/[user_id]` cannot resolve email-backed API
- Related: profile page migration from `/dashboard/users/[email]`.
- Failure signal: non-self profiles always fail.
- Mitigation:
1. deterministic resolver order (me -> self id -> email-like slug -> `/users/search`)
2. not-found fallback when mapping missing
3. no backend changes

### Risk 5 - Shared header/sidebar leak legacy routes
- Related: `components/dashboard-header.tsx`, `components/dashboard-sidebar.tsx`.
- Failure signal: author/shared UI still navigates to `/dashboard/*`.
- Mitigation: mandatory grep checks on migrated scope before phase signoff.

### Risk 6 - Duplicate notifications implementation reintroduced
- Related: `/notifications` vs `/dashboard/notifications`.
- Failure signal: two active notifications routes in `frontend-v2`.
- Mitigation: only keep `/notifications`; do not migrate `/dashboard/notifications` page.

### Risk 7 - Legacy deletion breaks unfinished scopes
- Related: deleting shared files still needed by reviewer/chair in legacy app.
- Failure signal: compile/runtime errors in remaining legacy workflows.
- Mitigation: delete only files mapped to completed author/shared/public behavior; defer ambiguous shared files until safe.

### Risk 8 - Route-param naming drift
- Related: `id`, `conference`, `paperId`, `submissionId`, `user_id`.
- Failure signal: mixed params in new routes and broken links.
- Mitigation: enforce canonical names from `03-target-contract.md` and refactor route builders together.

### Risk 9 - Query-param drift in submit/edit flow
- Related: legacy uses `?conference=` and `?edit=`.
- Failure signal: edit or prefill context lost after migration.
- Mitigation:
1. canonical edit route is path-based (`/submissions/[submissionId]/edit`)
2. use `conferenceId` query only as optional context, not primary identity

### Risk 10 - Env mismatch between legacy and `frontend-v2`
- Related: API proxy/auth routes.
- Failure signal: unauthorized errors, failed API proxy calls, broken auth state.
- Mitigation: copy env template and validate base URLs before smoke tests.

## 2) Required Invariants

These invariants must remain true through all commits in this phase:

1. `/notifications` is the single notifications route.
2. login success always lands on `/role`.
3. `/role` always resets role selection state.
4. author routes live under `/role/author/*`.
5. no canonical author/shared/public navigation targets `/dashboard/*`.
6. profile route is `/profile/[user_id]` with resolver fallback.
7. no backend API contract changes.

## 3) Edge-Case Test Focus

Prioritize these during QA:

1. Direct URL entry into submission detail/edit.
2. Empty/invalid `user_id` profile slugs.
3. Author account with zero submissions.
4. Author with multiple conferences and mixed submission states.
5. Expired auth session while opening role/profile/author pages.
6. Browser back navigation from profile/detail pages to list pages.

## 4) Escalation Rule During Migration

If a required behavior conflicts with this document set:

1. stop implementation at that boundary
2. document exact conflict (file + route + expected vs observed)
3. update the author docs before continuing

Do not solve contract conflicts only in code; steering docs are the source of truth for new-session continuity.
