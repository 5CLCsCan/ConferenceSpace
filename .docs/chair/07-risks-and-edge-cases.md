# 07 - Risks And Edge Cases (Chair)

Last updated: 2026-02-18

## 1) High-Risk Areas And Mitigations

### Risk 1 - Chair route skeleton exists but business screens remain missing
- Evidence: `frontend-v2/app/role/chair/page.tsx` is placeholder-only.
- Failure signal: chair selection reaches non-functional page.
- Mitigation: implement full canonical chair family before deleting any transitional hooks.

### Risk 2 - Legacy/public path leakage
- Evidence: `frontend-v2/components/conference/author-conferences.tsx` still pushes `/conference/${id}`.
- Failure signal: explore/archived flows navigate outside canonical contract.
- Mitigation: replace with explicit chair-owned route behavior and canonical `/role/chair/...` navigation; rely on backend-filtered list data for accessibility.

### Risk 3 - Duplicate conference-list ownership causes accidental regressions
- Evidence: both `frontend-v2/components/author/author-conferences.tsx` and `frontend-v2/components/conference/author-conferences.tsx` exist.
- Failure signal: wrong list component imported into chair page or author page.
- Mitigation: rename chair list source-of-truth (`chair-conferences`) and remove ambiguous imports.

### Risk 4 - Chair behavior coupled to author submission detail
- Evidence:
  - `frontend-v2/components/author/submission-detail/index.tsx`
  - `frontend-v2/app/role/author/submissions/[submissionId]/page.tsx`
- Failure signal: chair flow breaks if author page changes.
- Mitigation: make chair submission detail canonical under `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`.

### Risk 5 - Review-detail route creep outside submission-detail contract
- Evidence:
  - legacy route exists: `frontend/app/dashboard/conference/[id]/review/[reviewId]/page.tsx`
  - target has no reviewer component directory (`frontend-v2/components/reviewer` missing)
- Failure signal: new dedicated review route appears in target, creating route and component sprawl.
- Mitigation: keep review detail embedded in `/role/chair/conferences/[conferenceId]/submissions/[submissionId]` tabs; do not add dedicated review-detail routes.

### Risk 6 - Create-conference wizard dependency gap in target
- Evidence: `frontend-v2/components/wizard` directory does not exist.
- Failure signal: `/role/chair/conferences/new` fails due missing imports.
- Mitigation: migrate `frontend/components/wizard/creation/*` as part of chair phase, and keep route-agnostic type ownership.

### Risk 7 - Mock-heavy chair detail components may drift from backend reality
- Evidence: many legacy chair detail components are mock-data-driven.
- Failure signal: UI renders but actions/data are inconsistent with real API payloads.
- Mitigation: prioritize API-backed wiring for high-value screens (conference/submission/review analytics), and label unsupported actions explicitly.

### Risk 8 - Parameter naming drift (`id` vs `conferenceId`)
- Evidence: legacy chair pages use `[id]`.
- Failure signal: broken links and loader failures after migration.
- Mitigation: enforce `conferenceId` and `submissionId` in page segments and router pushes.

### Risk 9 - Dead links survive cutover
- Evidence: legacy chair dashboard uses `/dashboard/chair/tasks`.
- Failure signal: 404 after migration.
- Mitigation: remove or replace dead actions during dashboard migration.

## 2) Edge Cases To Explicitly Test

1. Deep link directly to `/role/chair/conferences/[conferenceId]/submissions/[submissionId]`.
2. Conference card in explore/archive should navigate normally because list is backend-filtered for chair profile.
3. Chair user opening author route after chair cutover must be denied (redirect/forbidden) and cannot access author submission detail.
4. Chair create-conference form submit with minimal required fields.
5. Role switch from chair pages to reviewer/author and back.
6. Notifications page with chair role active.

## 3) Locked Decisions (Resolved)

1. Review detail stays embedded under:
- `/role/chair/conferences/[conferenceId]/submissions/[submissionId]` tabs.
- No dedicated review-detail route is added in `frontend-v2`.

2. Chair access must be removed from author submission route:
- `/role/author/submissions/[submissionId]` is author-only after chair cutover.
- Chair-specific logic in author submission detail must be removed.

3. Explore/Archived accessibility handling policy:
- Conference list data is already backend-filtered per profile.
- No explicit client-side unknown-access handling is required for chair list cards.
