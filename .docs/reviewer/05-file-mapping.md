# 05 - File Mapping (Reviewer: `frontend` -> `frontend-v2`)

Last updated: 2026-02-18

Legend:
- `Copy`: copy baseline implementation first, then adjust imports/routes.
- `Refactor`: adapt behavior and routes to canonical contract.
- `New`: create file directly in target.
- `Move/Rename`: relocate or rename existing target file for ownership clarity.
- `Delete`: remove only after validation gates pass.

## A) Route Pages

| Source | Target | Action | Notes |
|---|---|---|---|
| `frontend-v2/app/role/reviewer/page.tsx` (placeholder) | `frontend-v2/app/role/reviewer/page.tsx` | Refactor | Replace placeholder with real reviewer dashboard root |
| N/A | `frontend-v2/app/role/reviewer/layout.tsx` | New | Add reviewer role guard using `useRoleRouteGuard("reviewer")` |
| `frontend/app/dashboard/reviewer/page.tsx` | `frontend-v2/app/role/reviewer/conferences/page.tsx` and `frontend-v2/app/role/reviewer/invitations/page.tsx` | Refactor + Split | Replace query-tab model with dedicated pages |
| `frontend/app/dashboard/reviewer/completed/page.tsx` | `frontend-v2/app/role/reviewer/completed/page.tsx` | Refactor | Canonical completed reviews route |
| `frontend/app/dashboard/conference/[id]/reviewer/assigned/page.tsx` | `frontend-v2/app/role/reviewer/conferences/[conferenceId]/submissions/page.tsx` | Refactor | Canonical conference submissions route |
| `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx` | `frontend-v2/app/role/reviewer/assignments/[assignmentId]/page.tsx` | Refactor | Canonical execution route and naming |
| `frontend/app/dashboard/reviewer/papers/[id]/page.tsx` | `frontend-v2/app/role/reviewer/assignments/[assignmentId]/page.tsx` | Partial refactor/merge | Reuse resolver and API-fetch patterns only; `PaperReview` UI is not canonical |

## B) Reviewer Component Stack

| Source | Target | Action | Notes |
|---|---|---|---|
| `frontend/components/reviewer/reviewer-dashboard.tsx` | `frontend-v2/components/reviewer/reviewer-dashboard.tsx` | Copy + Refactor | Reviewer root dashboard content |
| `frontend/components/reviewer/reviewer-conferences.tsx` | `frontend-v2/components/reviewer/reviewer-conferences.tsx` | Copy + Refactor | Conferences list page UI |
| `frontend/components/reviewer/reviewer-invitations.tsx` | `frontend-v2/components/reviewer/reviewer-invitations.tsx` | Copy + Refactor | Invitations page UI |
| `frontend/components/reviewer/completed-reviews.tsx` | `frontend-v2/components/reviewer/completed-reviews.tsx` | Copy + Refactor | Completed reviews list |
| `frontend/components/reviewer/assigned-dashboard.tsx` | `frontend-v2/components/reviewer/assigned-dashboard.tsx` (or role-named equivalent) | Copy + Refactor | Conference submissions list; remove mock-only mode |
| `frontend/components/reviewer/loading-skeletons.tsx` | `frontend-v2/components/reviewer/loading-skeletons.tsx` | Copy | Reviewer loading states |
| `frontend/components/reviewer/submission-review.tsx` | `frontend-v2/components/reviewer/submission-review.tsx` | Copy + Refactor | Canonical execution UI wrapper |
| `frontend/components/reviewer/submission-review/*` | `frontend-v2/components/reviewer/submission-review/*` | Copy + Refactor | Execution UI modules |
| `frontend/components/reviewer/reviewer-mock-data.ts` | `frontend-v2/components/reviewer/reviewer-mock-data.ts` | Transitional | Keep only if needed during rollout; remove for full API-backed flow |
| `frontend/components/reviewer/paper-review.tsx` | N/A (target canonical execution) | Do not migrate as canonical | Legacy/non-canonical execution UI; cleanup candidate |

## C) Reviewer Hooks And API Foundation

| Source | Target | Action | Notes |
|---|---|---|---|
| `frontend/lib/api/reviewer.ts` | `frontend-v2/lib/api/reviewer.ts` | Copy + Refactor | Required reviewer API adapter missing in target |
| `frontend/lib/api/reviews.ts` | `frontend-v2/lib/api/reviews.ts` | Keep + Refactor usage | Already present in target |
| `frontend/lib/swr-config.ts` | `frontend-v2/lib/swr-config.ts` | Copy | Missing reviewer SWR base config |
| `frontend/hooks/use-reviewer-dashboard.ts` | `frontend-v2/hooks/use-reviewer-dashboard.ts` | Copy + Refactor | Dashboard/conference/invitation data |
| `frontend/hooks/use-conference-papers.ts` | `frontend-v2/hooks/use-conference-papers.ts` | Copy + Refactor | Conference submissions data |
| `frontend/hooks/use-completed-reviews.ts` | `frontend-v2/hooks/use-completed-reviews.ts` | Copy + Refactor | Completed reviews data |
| `frontend/hooks/use-assignment-review.ts` | `frontend-v2/hooks/use-assignment-review.ts` | Copy + Refactor | Assignment get/save review |
| `frontend/hooks/use-debounce.ts` | `frontend-v2/hooks/use-debounce.ts` | Copy | Shared reviewer filter/search support |
| N/A | `frontend-v2/lib/reviewer/resolve-assignment-conference.ts` | New | Assignment deep-link conference resolver contract |

## D) Shared Dependencies Outside Reviewer Folder

| Dependency file | Action | Why it matters |
|---|---|---|
| `frontend/components/shared/rebuttal/*` | Copy -> `frontend-v2/components/shared/rebuttal/*` | Required by reviewer `rebuttal-tab.tsx`; absent in target |
| `frontend-v2/components/shared/discussion/*` | Keep / use | Required by reviewer `discussion-tab.tsx`; already in target |
| `frontend-v2/components/dashboard-sidebar.tsx` | Refactor usage | Reviewer menu must include canonical reviewer routes |
| `frontend-v2/components/dashboard-header.tsx` | Refactor | Reviewer top-nav links must point to canonical reviewer pages |
| `frontend-v2/app/notifications/page.tsx` | Refactor | Reviewer sidebar on notifications must include reviewer canonical routes |
| `frontend-v2/lib/use-role-route-guard.ts` | Keep / use | Reviewer role protection via new layout |
| `frontend-v2/locales/en.json`, `frontend-v2/locales/vi.json` | Verify/extend keys | Reviewer route labels and page text consistency |

## E) Target Cleanup Mapping

| File / Pattern | Action | Gate |
|---|---|---|
| `frontend-v2/app/role/reviewer/page.tsx` placeholder text | Delete placeholder content | After real dashboard renders |
| Reviewer query-tab-like patterns in target code | Delete / refactor | After dedicated reviewer routes are wired |
| Reviewer references that still point to legacy dashboard paths | Delete / refactor | After canonical nav smoke checks pass |
| Transitional reviewer mock data wiring | Delete / reduce | After API-backed reviewer flows are stable |

## F) Legacy Cleanup Candidates (Post-Cutover, Gated)

| Legacy file | Action | Deletion gate |
|---|---|---|
| `frontend/app/dashboard/reviewer/page.tsx` | Delete | Target conferences/invitations/dashboard routes fully working |
| `frontend/app/dashboard/reviewer/completed/page.tsx` | Delete | Target completed route fully working |
| `frontend/app/dashboard/reviewer/papers/[id]/page.tsx` | Delete | Target assignment route + resolver + unresolved state validated |
| `frontend/app/dashboard/conference/[id]/reviewer/assigned/page.tsx` | Delete | Target conference submissions route validated |
| `frontend/app/dashboard/conference/[id]/reviewer/submissions/[paperId]/page.tsx` | Delete | Target assignment route canonicalized to `assignmentId` |
| `frontend/components/reviewer/paper-review.tsx` | Delete or archive | Canonical execution source locked to submission-review stack |

## G) Forbidden String Refactor Targets (Reviewer Scope)

Remove/replace these from active `frontend-v2` reviewer implementation:

- `/dashboard/reviewer`
- `/dashboard/conference/`
- `?tab=conferences`
- `?tab=invitations`
- `?tab=conference-papers`
- `/reviewer/submissions/[paperId]` route patterns
