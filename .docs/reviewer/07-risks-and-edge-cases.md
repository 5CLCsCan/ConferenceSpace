# 07 - Risks And Edge Cases (Reviewer)

Last updated: 2026-02-18

## 1) High-Risk Areas And Mitigations

### Risk 1 - Reviewer route exists but remains placeholder-only
- Evidence: `frontend-v2/app/role/reviewer/page.tsx`.
- Failure signal: reviewer selection lands on non-functional page.
- Mitigation: replace placeholder with real dashboard and complete reviewer route family before any legacy deletion.

### Risk 2 - Duplicate reviewer execution UIs reintroduce route complexity
- Evidence:
  - `frontend/components/reviewer/paper-review.tsx`
  - `frontend/components/reviewer/submission-review.tsx`
- Failure signal: mixed execution paths with contradictory behavior.
- Mitigation: enforce locked source-of-truth to `SubmissionReviewScreen` stack only.

### Risk 3 - Assignment route cannot load due missing conference context
- Evidence: assignment review APIs require both `conferenceId` and `assignmentId`.
- Failure signal: deep links to `/role/reviewer/assignments/[assignmentId]` fail without query context.
- Mitigation: implement resolver chain and explicit unresolved-assignment state.

### Risk 4 - Reviewer foundations missing in target increase integration risk
- Evidence:
  - missing `frontend-v2/lib/api/reviewer.ts`
  - missing reviewer hooks and `frontend-v2/lib/swr-config.ts`
- Failure signal: reviewer routes compile but fail data loading.
- Mitigation: complete foundation phase before route behavior phase.

### Risk 5 - Mock-only behavior leaks into production reviewer submissions flow
- Evidence: legacy `frontend/components/reviewer/assigned-dashboard.tsx` has `USE_MOCK_DATA = true`.
- Failure signal: list UI appears functional but detached from backend data.
- Mitigation: remove mock toggle in target canonical path and wire API-backed hooks.

### Risk 6 - Shared rebuttal dependency missing in target breaks review tabs
- Evidence:
  - reviewer rebuttal tab imports `@/components/shared/rebuttal`
  - target currently has no `frontend-v2/components/shared/rebuttal/*`
- Failure signal: assignment page compile/runtime failures in rebuttal tab.
- Mitigation: migrate shared rebuttal module set into target before final assignment page integration.

### Risk 7 - Shared shell navigation drifts from canonical reviewer routes
- Evidence:
  - reviewer header links currently do not include reviewer subroutes
  - notifications reviewer menu currently lacks conferences/invitations/completed links
- Failure signal: users cannot reach canonical reviewer pages from shared nav.
- Mitigation: update shared header/sidebar/notifications reviewer menu contracts in dedicated phase.

### Risk 8 - Reviewer role guard omitted from reviewer route family
- Evidence:
  - guard utility exists at `frontend-v2/lib/use-role-route-guard.ts`
  - currently used by chair layout only
- Failure signal: unauthorized role access or inconsistent reviewer session behavior.
- Mitigation: require `frontend-v2/app/role/reviewer/layout.tsx` with reviewer guard hook.

### Risk 9 - Legacy reviewer query-tab patterns survive cutover
- Evidence: legacy reviewer dashboard uses `?tab=*` routing.
- Failure signal: mixed reviewer URLs and regressions in browser navigation/back behavior.
- Mitigation: canonical page routes only, with grep gates for tab query patterns.

## 2) Edge Cases To Explicitly Test

1. Direct URL deep-link to `/role/reviewer/assignments/[assignmentId]` with and without `conferenceId` query.
2. Assignment id not resolvable by query/cache/lookup should show unresolved state, not crash.
3. Reviewer user without valid reviewer role opening reviewer routes should be redirected by guard.
4. Reviewer invitations accept/decline under slow or failing API responses.
5. Completed review entries that map to assignments across different conferences.
6. Discussion and rebuttal tabs rendering after migration to target shared dependencies.
7. Notifications page while reviewer role active should keep canonical reviewer menu links.

## 3) Locked Decisions (Resolved)

1. Canonical reviewer execution UI:
- use `SubmissionReviewScreen` stack (`submission-review/*`) as source-of-truth.
- `PaperReview` is non-canonical and cleanup candidate.

2. Assignment deep-link fallback behavior:
- auto-resolve `conferenceId` through resolver chain.
- if still unresolved, render explicit unresolved-assignment state.

3. Reviewer route model:
- page-routed reviewer flows only.
- query-tab reviewer routing is not allowed in final target.

## 4) Unresolved Decisions

No unresolved blocking decisions remain for this role pack as of 2026-02-18.

If a future blocker appears, capture it using this exact format:

> <Question>
- related components, screens, flows, etc.
- why you need this information
- how should i answer
- example answers
