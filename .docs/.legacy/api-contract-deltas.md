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
| AD-001 | `frontend/lib/api/discussions.ts` | missing | missing-module | Port discussion thread/message API module to v2 and wire role UIs to it | Unblocks author/reviewer/chair discussion tabs from mock data | null | frontend-v2 | P0 | Author/reviewer/chair discussion tabs use live thread/message APIs only | PAR-032, PAR-043 |
| AD-002 | `frontend/lib/api/user.ts` | missing | missing-module | Port user API helper (`getMe`, academic profile, link/unlink) to v2 | Restores legacy profile utility contracts | null | frontend-v2 | P1 | v2 profile accesses user and academic profile helpers through module | PAR-033, PAR-050 |
| AD-003 | `frontend/lib/api/semantic-scholar.ts` | missing | missing-module | Port semantic-scholar author search/detail/papers APIs into v2 | Enables academic profile linking and test profile-link parity | null | frontend-v2 | P2 | Semantic scholar lookup flow works in v2 profile linking paths | PAR-034, PAR-050 |
| AD-004 | `frontend/lib/api/coi.ts` | missing | missing-module | Port real COI API module to v2 and bind chair COI surfaces | Enables migration away from chair COI mock datasets | null | frontend-v2 | P1 | Chair COI surfaces consume real `/api/v1/coi/*` responses | PAR-035 |
| AD-005 | `frontend/lib/api/coi-mock.ts` | missing | missing-module | Restore development COI mock shim parity where required | Preserves dev/test behavior expected by parity policy | null | frontend-v2 | P2 | COI mock shim availability matches legacy test/dev expectations | PAR-036 |
| AD-006 | `frontend/app/api/chat/route.ts` | missing | missing-route | Recreate v2 `/api/chat` route with equivalent request/response behavior | Prevents chatbot runtime transport failures | null | frontend-v2 | P0 | `frontend-v2/components/chatbot/chat-view.tsx` succeeds against `/api/chat` | PAR-041, PAR-051 |
| AD-007 | `frontend/app/api/test/discussion-setup/route.ts` | missing | missing-route | Recreate deterministic discussion setup helper route in v2 | Restores fast test seed path for discussion parity validation | null | frontend-v2 | P1 | Test route seeds conference/submission/discussion as legacy did | PAR-042, PAR-052 |
| AD-008 | `frontend/app/api/v1/auth/test-login/route.ts` | missing | missing-route | Recreate test-login helper route in v2 | Enables deterministic test identity switching | null | frontend-v2 | P1 | Test-login route returns expected token/user payload | PAR-040, PAR-052 |
| AD-009 | Legacy notifications page consumed API list | v2 notifications page consumes `MOCK_NOTIFICATIONS` | mock-instead-of-api | Replace page-level notification list/actions with `notifications.ts` API operations | Closes high-visibility behavior drift in shared UX | null | frontend-v2 | P0 | No hard-coded mock notification list remains in production route | PAR-021, PAR-049 |
| AD-010 | Legacy discussion components bound to backend threads/messages | v2 shared discussion components use static mock datasets | mock-instead-of-api | Bind shared discussion components to `discussions.ts` APIs and role-specific permissions | Resolves P0 parity gap for author/reviewer/chair interactions | null | frontend-v2 | P0 | Thread creation/list/reply persists and reloads from backend | PAR-012, PAR-015, PAR-020, PAR-043 |
| AD-011 | Legacy rebuttal behavior tied to review lifecycle | v2 rebuttal uses mock points/settings with local-only state | mock-instead-of-api | Introduce API-backed rebuttal read/write contract integration | Removes local-only state and TODO persistence seams | BR-004 | frontend-v2 | P1 | Rebuttal acknowledgments and state transitions persist through API | PAR-044 |
| AD-012 | Chair analytics expected in operational workflows | v2 `getConferenceStats` returns synthetic data | blocked-backend | Replace placeholder with real endpoint integration once contract is available | Chair metrics cannot be production-accurate otherwise | BR-001 | backend | P0 | `getConferenceStats` uses backend contract with validated schema | PAR-026, PAR-045 |
| AD-013 | Conference tracks expected for management views | v2 `getConferenceTracks` returns empty placeholder | blocked-backend | Integrate dedicated tracks endpoint or equivalent payload expansion | Track-aware flows remain incomplete without contract | BR-002 | backend | P1 | Track APIs return normalized list consumed by v2 forms/tabs | PAR-026, PAR-046 |
| AD-014 | Paper lifecycle requires camera-ready upload support | v2 `papers.ts` has upload placeholder TODO | blocked-backend | Implement camera-ready upload endpoint and bind client call | Blocks full file lifecycle parity in author flows | BR-003 | backend | P2 | Camera-ready upload succeeds with stable validation/error schema | PAR-028, PAR-047 |
| AD-015 | Chair decision outcome must be persisted | v2 chair reviews tab has submit TODO only | blocked-backend | Bind decision submit UI to authoritative write endpoint | Chair cannot finalize submission decisions reliably | BR-004 | backend | P1 | Decision writes are persisted, auditable, and reflected on reload | PAR-020, PAR-048 |
| AD-016 | Legacy profile supports academic link/unlink and synced publications | v2 profile lacks academic profile management | schema-gap | Implement profile-level academic linkage UX and data rendering in v2 | Feature parity gap in user profile workflows | null | frontend-v2 | P2 | Users can link/unlink academic profiles and view synced metadata | PAR-022, PAR-050 |
| AD-017 | Legacy test pages exist for discussion/profile-link | v2 lacks `/test/discussion` and `/test/profile-link` pages | missing-route | Recreate or provide equivalent test parity pages in v2 | Slows QA and parity verification for high-risk areas | null | frontend-v2 | P2 | Both test pages available and wired to restored test APIs | PAR-023, PAR-024, PAR-052 |
| AD-018 | Author conference detail derives submission ownership state | v2 sets hard-coded `setHasSubmission(false)` TODO | schema-gap | Derive submission state from existing submissions API query | Prevents incorrect author CTA/state behavior | null | frontend-v2 | P1 | Submission CTA/state matches actual author submission presence | PAR-018 |
| AD-019 | Legacy profile deep-links from review/chair surfaces | v2 has TODO profile navigation hooks in chair submission detail views | schema-gap | Implement route navigation to `/profile/[user_id]` with resolver compatibility | Restores cross-role profile navigation continuity | null | frontend-v2 | P2 | Clicking author/reviewer identities navigates correctly to profiles | PAR-020 |
| AD-020 | Legacy chatbot server route supports frontend chat transport | v2 transport is unchanged but route missing | missing-route | Same resolution as AD-006, tracked separately for release gating | Prevents silent failure in cross-cutting assistant | null | frontend-v2 | P0 | Chatbot transport end-to-end verified in release gate | PAR-051 |

## 3. Backend Request Registry

### BR-001
- Trigger: `frontend-v2/lib/api/conferences.ts` stats TODO path.
- Request text:
  - `BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/stats; chair dashboard and conference analytics in frontend-v2 currently return synthetic zero metrics due missing endpoint; return stable aggregates (submission totals, review progress, acceptance metrics, track/time breakdowns) with explicit field schema and empty-state behavior for new conferences.>`
- Blocking level: blocking

### BR-002
- Trigger: `frontend-v2/lib/api/conferences.ts` tracks TODO path.
- Request text:
  - `BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/tracks (or provide equivalent in existing conference payload contract); frontend-v2 track UIs currently rely on placeholder empty arrays; return normalized track identifiers, names, description/limits, and ordering guarantees so forms and dashboards can bind deterministically.>`
- Blocking level: high

### BR-003
- Trigger: `frontend-v2/lib/api/papers.ts` camera-ready upload placeholder.
- Request text:
  - `BACKEND REQUEST: <Implement camera-ready upload contract for conference submissions; frontend-v2 papers API contains placeholder logic because backend upload endpoint is unavailable; provide authenticated multipart upload endpoint, validation/error schema, and final artifact metadata response compatible with current submission model.>`
- Blocking level: medium

### BR-004
- Trigger: chair decision submit TODO and reviewer rebuttal persistence TODO.
- Request text:
  - `BACKEND REQUEST: <Provide/confirm authoritative chair decision submission endpoint for per-submission final decision and notes, and related rebuttal status persistence write contract; frontend-v2 decision/rebuttal actions currently have TODO placeholders; expose idempotent write APIs with allowed enums, role permissions, and audit metadata so state remains consistent across chair/reviewer/author views.>`
- Blocking level: high

## 4. Delta Closure Rules
1. Any delta with `owner=frontend-v2` must map to concrete code changes in `frontend-v2/**`.
2. Any delta with `owner=backend` must keep frontend behavior safe and explicit (no silent mock fallback) and include linked `BR-*`.
3. A parity item cannot be marked resolved until its linked deltas satisfy acceptance criteria.
