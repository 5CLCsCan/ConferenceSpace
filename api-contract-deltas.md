# API Contract Deltas

This document is the authoritative `ApiDelta` log for functional/API migration.

## 1. Delta Model

```ts
ApiDelta {
  id: string
  legacy_api: string
  v2_api: string
  delta_type:
    | "missing-module"
    | "missing-route"
    | "mock-instead-of-api"
    | "schema-gap"
    | "blocked-backend"
  required_change: string
  frontend_impact: string
  backend_request_id: string | null
  owner: "frontend-v2" | "backend"
  priority: "P0" | "P1" | "P2" | "P3"
  acceptance: string
}
```

## 2. Delta Ledger

| id | legacy_api | v2_api | delta_type | required_change | frontend_impact | backend_request_id | owner | priority | acceptance | related_parity_items |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-001 | `frontend/lib/api/discussions.ts` | `frontend-v2/lib/api/discussions.ts` | missing-module | Completed: Port discussion thread/message API module to v2 and wire role UIs to it | Author/reviewer/chair discussion tabs now load/create/reply through backend discussion APIs | null | frontend-v2 | P0 | Discussion tabs use live thread/message APIs with no mock source of truth | PAR-032, PAR-043 |
| AD-002 | `frontend/lib/api/user.ts` | `frontend-v2/lib/api/user.ts` | missing-module | Completed: Port user API helper (`getMe`, academic profile, link/unlink) to v2 | Restores legacy profile utility contracts and unblocks academic profile flows | null | frontend-v2 | P1 | v2 profile uses `user.ts` helpers for profile and academic-link operations | PAR-033, PAR-050 |
| AD-003 | `frontend/lib/api/semantic-scholar.ts` | `frontend-v2/lib/api/semantic-scholar.ts` | missing-module | Completed: Port semantic-scholar author search/detail/papers APIs into v2 | Enables academic profile linking and test profile-link parity | null | frontend-v2 | P2 | Semantic scholar lookup flow works in v2 profile linking paths | PAR-034, PAR-050 |
| AD-004 | `frontend/lib/api/coi.ts` | `frontend-v2/lib/api/coi.ts` | missing-module | Completed: Port real COI API module to v2 and bind chair COI surfaces | Chair COI dashboard now consumes backend `/api/v1/coi/*` read/rebuild endpoints | null | frontend-v2 | P1 | Chair COI surfaces consume real `/api/v1/coi/*` responses | PAR-035 |
| AD-005 | `frontend/lib/api/coi-mock.ts` | `frontend-v2/lib/api/coi-mock.ts` | missing-module | Completed: Restore development COI mock shim parity where required | Preserves dev/test behavior expected by parity policy | null | frontend-v2 | P2 | COI mock shim availability matches legacy test/dev expectations | PAR-036 |
| AD-006 | `frontend/app/api/chat/route.ts` | `frontend-v2/app/api/chat/route.ts` | missing-route | Completed: Recreate v2 `/api/chat` route with equivalent request/response behavior | Restores chatbot runtime transport path for v2 | null | frontend-v2 | P0 | `frontend-v2/components/chatbot/chat-view.tsx` succeeds against `/api/chat` | PAR-041, PAR-051 |
| AD-007 | `frontend/app/api/test/discussion-setup/route.ts` | `frontend-v2/app/api/test/discussion-setup/route.ts` | missing-route | Completed: Recreate deterministic discussion setup helper route in v2 | Restores fast test seed path for discussion parity validation | null | frontend-v2 | P1 | Test route seeds conference/submission/discussion as legacy did | PAR-042, PAR-052 |
| AD-008 | `frontend/app/api/v1/auth/test-login/route.ts` | `frontend-v2/app/api/v1/auth/test-login/route.ts` | missing-route | Completed: Recreate test-login helper route in v2 | Enables deterministic test identity switching in v2 harness pages | null | frontend-v2 | P1 | Test-login route returns expected token/user payload and sets auth cookies | PAR-040, PAR-052 |
| AD-009 | Legacy notifications page consumed API list | `frontend-v2/app/notifications/page.tsx` now consumes `notifications.ts` + `useNotifications` | mock-instead-of-api | Completed: Replace page-level notification list/actions with API operations and legacy action URL mapping | Closes high-visibility behavior drift in shared UX | null | frontend-v2 | P0 | No hard-coded mock notification list remains in production route | PAR-021, PAR-049 |
| AD-010 | Legacy discussion components bound to backend threads/messages | `frontend-v2/components/shared/discussion/*` wired via `api-adapter.ts` + `discussions.ts` | mock-instead-of-api | Completed: Bind shared discussion components to backend APIs with role-specific permissions | Resolves P0 parity gap for author/reviewer/chair interactions | null | frontend-v2 | P0 | Thread creation/list/reply persists and reloads from backend | PAR-012, PAR-015, PAR-020, PAR-043 |
| AD-011 | Legacy rebuttal behavior tied to review lifecycle | v2 rebuttal is read-only with explicit disabled write actions | blocked-backend | Keep rebuttal writes disabled with explicit messaging until backend role-aware persistence endpoints are available | Prevents false local-save behavior while preserving safe read-only UX | BR-004 | backend | P1 | Rebuttal acknowledgments and state transitions persist through backend APIs across roles | PAR-044 |
| AD-012 | Chair analytics expected in operational workflows | v2 uses synthetic/derived fallback analytics without authoritative stats contract | blocked-backend | Replace fallback analytics with real conference stats endpoint integration once contract is available | Chair metrics cannot be production-accurate otherwise | BR-001 | backend | P0 | Chair analytics consume authoritative backend stats with validated schema | PAR-026, PAR-045 |
| AD-013 | Conference tracks expected for management views | `frontend-v2/lib/api/conferences.ts#getConferenceTracks` derives from `conference.tracks` payload | schema-gap | Completed: Use conference payload tracks as authoritative source and normalize in wrapper | Track-aware flows now work without a separate tracks endpoint | null | frontend-v2 | P1 | `getConferenceTracks` returns normalized tracks from conference payload data | PAR-026, PAR-046 |
| AD-014 | Paper lifecycle requires camera-ready upload support | v2 `papers.ts` has upload placeholder TODO | blocked-backend | Implement camera-ready upload endpoint and bind client call | Blocks full file lifecycle parity in author flows | BR-003 | backend | P2 | Camera-ready upload succeeds with stable validation/error schema | PAR-028, PAR-047 |
| AD-015 | Chair decision outcome must be persisted | `frontend-v2/components/chair/submission-review-tab.tsx` + `updateSubmissionStatus` binding | schema-gap | Completed: Bind decision submit UI to backend-supported statuses (`accepted`, `rejected`) and disable unsupported revision decisions with explicit explanation | Chair can finalize supported decisions without false success states | null | frontend-v2 | P1 | Supported decision writes persist and reload correctly | PAR-020, PAR-048 |
| AD-016 | Legacy profile supports academic link/unlink and synced publications | `frontend-v2/app/profile/[user_id]/page.tsx` + `components/profile/profile-onboarding-modal.tsx` | schema-gap | Completed: Implement profile-level academic linkage UX and synced publication rendering in v2 | Closes profile parity gap for academic profile workflows | null | frontend-v2 | P2 | Users can link/unlink academic profiles and view synced metadata | PAR-022, PAR-050 |
| AD-017 | Legacy test pages exist for discussion/profile-link | `frontend-v2/app/test/discussion/page.tsx` and `frontend-v2/app/test/profile-link/page.tsx` | missing-route | Completed: Restore deterministic test parity pages in v2 | Restores QA/parity scaffolding for high-risk flows | null | frontend-v2 | P2 | Both test pages are available and wired to restored test APIs | PAR-023, PAR-024, PAR-052 |
| AD-018 | Author conference detail derives submission ownership state | `frontend-v2/components/author/author-conference-detail.tsx` derives ownership via submissions API | schema-gap | Completed: Derive submission state from real submissions query | Prevents incorrect author CTA/state behavior | null | frontend-v2 | P1 | Submission CTA/state matches actual author submission presence | PAR-018 |
| AD-019 | Legacy profile deep-links from review/chair surfaces | chair/reviewer surfaces route to `/profile/[user_id]` | schema-gap | Completed: Implement profile deep-links from chair/reviewer submission surfaces | Restores cross-role profile navigation continuity | null | frontend-v2 | P2 | Clicking author/reviewer identities navigates correctly to profiles | PAR-020 |
| AD-020 | Legacy chatbot server route supports frontend chat transport | `frontend-v2/app/api/chat/route.ts` restored | missing-route | Completed via AD-006 implementation; retained as release gate coverage item | Prevents silent failure in cross-cutting assistant | null | frontend-v2 | P0 | Chatbot transport end-to-end verified in release gate | PAR-051 |

## 3. Backend Request Registry

### BR-001
- Trigger: chair dashboard and conference analytics need authoritative stats contract.
- Request text:
  - `BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/stats; chair dashboard and conference analytics in frontend-v2 currently require synthetic/derived fallback metrics without an authoritative stats contract; return stable aggregates (submission totals, review progress, acceptance metrics, track/time breakdowns) with explicit field schema and empty-state behavior for new conferences.>`
- Blocking level: blocking

### BR-002
- Trigger: previously raised for dedicated tracks endpoint.
- Resolution:
  - Closed by frontend migration: `getConferenceTracks` now derives normalized tracks from existing `conference.tracks` payload (no backend endpoint required under current assumptions).
- Blocking level: none

### BR-003
- Trigger: `frontend-v2/lib/api/papers.ts` camera-ready upload placeholder.
- Request text:
  - `BACKEND REQUEST: <Implement camera-ready upload contract for conference submissions; frontend-v2 papers API contains placeholder logic because backend upload endpoint is unavailable; provide authenticated multipart upload endpoint, validation/error schema, and final artifact metadata response compatible with current submission model.>`
- Blocking level: medium

### BR-004
- Trigger: reviewer acknowledgment and author rebuttal state persistence writes are unavailable.
- Request text:
  - `BACKEND REQUEST: <Implement rebuttal persistence APIs for reviewer acknowledgment and author rebuttal state transitions; frontend-v2 rebuttal actions are now explicitly disabled because backend write contract is unavailable; expose idempotent role-aware endpoints with allowed status enums, audit metadata, and reload-consistent state across author/reviewer/chair views.>`
- Blocking level: high

## 4. Delta Closure Rules
1. Any delta with `owner=frontend-v2` must map to concrete code changes in `frontend-v2/**`.
2. Any delta with `owner=backend` must keep frontend behavior safe and explicit (no silent mock fallback) and include linked `BR-*`.
3. A parity item cannot be marked resolved until its linked deltas satisfy acceptance criteria.
