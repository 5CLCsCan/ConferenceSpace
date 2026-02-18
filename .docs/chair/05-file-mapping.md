# 05 - File Mapping (Chair: `frontend` -> `frontend-v2`)

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
| `frontend-v2/app/role/chair/page.tsx` (placeholder) | `frontend-v2/app/role/chair/page.tsx` | Refactor | Replace placeholder with real chair dashboard root |
| `frontend/app/dashboard/conference/page.tsx` | `frontend-v2/app/role/chair/conferences/page.tsx` | Refactor | Canonical conferences list route |
| `frontend/app/dashboard/chair/create-conference/page.tsx` | `frontend-v2/app/role/chair/conferences/new/page.tsx` | Refactor | Canonical create-conference route |
| `frontend/app/dashboard/chair/conference/[id]/page.tsx` | `frontend-v2/app/role/chair/conferences/[conferenceId]/page.tsx` | Refactor | Rename params + canonical paths |
| `frontend/app/dashboard/chair/conference/[id]/submission/[submissionId]/page.tsx` | `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/[submissionId]/page.tsx` | Refactor | Canonical submission detail route |
| N/A | `frontend-v2/app/role/chair/conferences/[conferenceId]/submissions/page.tsx` | New | Explicit submissions list route for contract completeness |
| `frontend/app/dashboard/chair/schedules/page.tsx` | `frontend-v2/app/role/chair/schedules/page.tsx` | Refactor | Canonical schedules route |

## B) Chair Component Stack

| Source | Target | Action | Notes |
|---|---|---|---|
| `frontend/components/chair/chair-dashboard.tsx` | `frontend-v2/components/chair/chair-dashboard.tsx` | Copy + Refactor | Remove dead `/dashboard/chair/tasks` link |
| `frontend/components/chair/action-card.tsx` | `frontend-v2/components/chair/action-card.tsx` | Copy | Dashboard dependency |
| `frontend/components/chair/conference-detail/*` | `frontend-v2/components/chair/conference-detail/*` | Copy + Refactor | Full chair detail tabs and subcomponents |
| `frontend/components/chair/conference-detail/submission-detail/*` | `frontend-v2/components/chair/conference-detail/submission-detail/*` | Copy + Refactor | Submission sub-tabs and shared types/components |
| `frontend-v2/components/chair/submission-review-tab.tsx` | same path | Refactor | Keep as reusable review analytics widget; fix routing behavior |
| `frontend-v2/components/chair/submission-analytics.tsx` | same path | Keep | Reused by chair review widget |
| `frontend/components/conference/author-conferences.tsx` | `frontend-v2/components/chair/chair-conferences.tsx` | Move/Rename + Refactor | Remove ambiguous naming; chair ownership explicit |

## C) Chair Conference List Dependencies

| Source | Target | Action | Notes |
|---|---|---|---|
| `frontend-v2/components/conference/conference-cards.tsx` | same path (reuse) | Keep | Used by chair conference list |
| `frontend-v2/components/conference/conference-list.tsx` | same path (reuse) | Keep | Used by chair conference list |
| `frontend-v2/components/conference/create-conference-card.tsx` | same path (reuse) | Keep | Used by chair conference list |
| `frontend-v2/components/conference/empty-state.tsx` | same path (reuse) | Keep | Used by chair conference list |
| `frontend-v2/components/conference/explore-cards.tsx` | same path (reuse) | Refactor | Route to canonical chair detail paths; do not add unknown-access fallback branch |
| `frontend-v2/components/conference/mock-data.ts` | same path | Transitional | Keep only until API-backed chair list is complete |
| `frontend-v2/components/conference/types.ts` | same path | Keep | No extra accessibility metadata required for chair list gating in this phase |

## D) Create-Conference Wizard Dependencies

`frontend-v2` currently has no `components/wizard` directory. These must be created from legacy sources.

| Source | Target | Action | Notes |
|---|---|---|---|
| `frontend/components/wizard/creation/*` | `frontend-v2/components/wizard/creation/*` | Copy + Refactor | Main wizard implementation and steps |
| `frontend/components/wizard/creation/steps/*` | `frontend-v2/components/wizard/creation/steps/*` | Copy + Refactor | Ensure imports are route-agnostic |
| `frontend/components/wizard/creation/types.ts` | `frontend-v2/components/wizard/creation/types.ts` | Copy | Keep form contract separate from route file |

## E) API And Shared Dependencies Outside Chair Folder

| Dependency file | Action | Why it matters |
|---|---|---|
| `frontend-v2/lib/api/conferences.ts` | Keep / use | Conference listing/detail/create/update used by chair flows |
| `frontend-v2/lib/api/submissions.ts` | Keep / use | Submissions list/detail in conference scope |
| `frontend-v2/lib/api/reviews.ts` | Keep / use | Submission review analytics/list used inside chair submission-detail tabs |
| `frontend-v2/hooks/use-notifications.ts` | Keep / use | Sidebar notification badge in chair pages |
| `frontend-v2/components/dashboard-sidebar.tsx` | Refactor usage | Chair menu contract and canonical links |
| `frontend-v2/components/dashboard-header.tsx` | Refactor usage | Shared header chair links remain canonical |
| `frontend-v2/components/shared/discussion/*` | Keep / use | Chair discussion tab wrapper dependency |
| `frontend-v2/locales/en.json` + `frontend-v2/locales/vi.json` | Verify keys | Chair page labels and wizard messages already partly present |

## F) Target Cleanup Mapping

| File | Action | Gate |
|---|---|---|
| `frontend-v2/components/conference/author-conferences.tsx` | Delete or convert to wrapper | After `chair-conferences` is wired and no imports remain |
| `frontend-v2/app/role/chair/page.tsx` placeholder text | Delete placeholder content | After real dashboard renders |
| Chair references inside author detail (`frontend-v2/components/author/submission-detail/index.tsx`) | Remove chair-specific behavior | After chair canonical submission detail path is complete |
| Chair role allowance in author route (`frontend-v2/app/role/author/submissions/[submissionId]/page.tsx`) | Remove | At cutover (chair must no longer access author submission route) |

## G) Forbidden String Refactor Targets (Chair Scope)

Replace/remove these strings in `frontend-v2` chair-related files:

- `/dashboard/chair`
- `/dashboard/conference`
- `/dashboard/chair/tasks`
- `/conference/${id}`
- `?tab=submissions`
