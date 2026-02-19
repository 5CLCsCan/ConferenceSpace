# Functional/API Migration Evaluation

Generated: 2026-02-19
Compared projects: `frontend` (legacy baseline) vs `frontend-v2` (target UI)
Scope rule: frontend only. No backend code modifications are permitted in this operation.

## 1. Objective
Replace the completed route-migration steering set with a functional/API migration steering set that can drive fresh agents with no prior context.

## 2. Audit Method
1. Inventoried all route files in `frontend/app` and `frontend-v2/app`.
2. Inventoried all API modules in `frontend/lib/api` and `frontend-v2/lib/api`.
3. Inventoried all app API route handlers in `frontend/app/api` and `frontend-v2/app/api`.
4. Audited mock usage and TODO hotspots in `frontend-v2/app`, `frontend-v2/components`, and `frontend-v2/lib`.
5. Classified parity by fixed status values:
   - `implemented-api-backed`
   - `implemented-mock-backed`
   - `partial`
   - `missing`
   - `blocked-backend`

## 3. Canonical Interfaces Used Across Docs

### 3.1 `ParityItem`
```ts
ParityItem {
  id: string
  domain: "shared" | "author" | "reviewer" | "chair" | "cross-cutting"
  role: "public" | "author" | "reviewer" | "chair" | "multi"
  legacy_path: string
  v2_path: string
  status:
    | "implemented-api-backed"
    | "implemented-mock-backed"
    | "partial"
    | "missing"
    | "blocked-backend"
  legacy_behavior: string
  v2_behavior: string
  api_contracts: string[]
  mocks_used: string[]
  backend_request_ids: string[]
  test_scenarios: string[]
  priority: "P0" | "P1" | "P2" | "P3"
  phase: "shared" | "author" | "reviewer" | "chair" | "cross-cutting"
}
```

### 3.2 `ApiDelta`
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

### 3.3 `BackendRequest`
```ts
BackendRequest {
  id: string
  title: string
  trigger: string
  request_text: string
  reason: string
  expected_contract: string
  compatibility_notes: string
  blocking_level: "blocking" | "high" | "medium" | "low"
}
```

## 4. Inventory Snapshot

| Area | Legacy | V2 | Assessment |
| --- | --- | --- | --- |
| App routes/pages (`app/**/page.tsx`) | 24 | 25 | Route families are mapped, but functional/API parity is incomplete |
| App API handlers (`app/api/**/route.ts`) | 6 | 3 | Missing critical helper routes in v2 |
| API modules (`lib/api/*.ts`) | 12 | 7 | 5 legacy modules are missing in v2 |

### 4.1 Missing v2 API Modules (must be represented in matrix/deltas)
- `frontend/lib/api/coi.ts` -> missing in `frontend-v2/lib/api`
- `frontend/lib/api/coi-mock.ts` -> missing in `frontend-v2/lib/api`
- `frontend/lib/api/discussions.ts` -> missing in `frontend-v2/lib/api`
- `frontend/lib/api/semantic-scholar.ts` -> missing in `frontend-v2/lib/api`
- `frontend/lib/api/user.ts` -> missing in `frontend-v2/lib/api`

### 4.2 Missing v2 App API Routes (must be represented in matrix/deltas)
- `frontend/app/api/chat/route.ts` -> missing in v2
- `frontend/app/api/test/discussion-setup/route.ts` -> missing in v2
- `frontend/app/api/v1/auth/test-login/route.ts` -> missing in v2

## 5. Current Functional Findings by Phase

### 5.1 Shared
- Auth proxy (`/api/v1/auth/login`, `/api/v1/auth/logout`) is present in both projects.
- V2 role guards (`useRoleRouteGuard`) are stronger structurally than legacy dashboard gating.
- Notification page UI in v2 is mock-backed (`MOCK_NOTIFICATIONS`) while legacy behavior was API-backed end-to-end.

### 5.2 Author
- Submission creation/edit/list/detail routes exist in v2 with redesigned UI.
- Discussion and rebuttal tabs in v2 author submission detail are mock-backed via shared mock discussion/rebuttal datasets.
- Author conference detail sets submission presence with a TODO (`setHasSubmission(false)`), so parity is partial.

### 5.3 Reviewer
- Reviewer assignment/review routes exist and major review API calls are present.
- Reviewer discussion/rebuttal tabs are mock-backed wrappers over shared mock data.
- Rebuttal status persistence is TODO-only in v2 (not yet contract-bound).

### 5.4 Chair
- Chair conference creation path is API-backed.
- Chair dashboard metrics and multiple conference-detail tabs rely on mock datasets.
- Chair submission decision submit is TODO-only in v2 (UI action not wired to API).

### 5.5 Cross-Cutting
- Chatbot component in v2 calls `/api/chat`, but v2 has no `/api/chat/route.ts`.
- Legacy test/dev accelerators (`/api/test/discussion-setup`, `/test/discussion`, `/test/profile-link`, `/api/v1/auth/test-login`) are absent in v2 and must be restored for full parity policy.
- Legacy profile supports academic-profile link/unlink flows (`user.ts`, `semantic-scholar.ts`); v2 profile currently supports base user profile only.

## 6. Mock Dependency Map (Production-Critical First)

| Priority | Area | V2 path(s) | Current state |
| --- | --- | --- | --- |
| P0 | Notifications | `frontend-v2/app/notifications/page.tsx`, `frontend-v2/lib/mock/notifications.tsx` | Entire list/filter UX is mock-fed |
| P0 | Discussion (author/reviewer/chair) | `frontend-v2/components/shared/discussion/*`, role wrappers in author/reviewer/chair submission detail | Threads/messages are local mock state, not backend threads |
| P0 | Rebuttal flows | `frontend-v2/components/shared/rebuttal/*`, role wrappers in author/reviewer | Rebuttal content/status uses mock payloads and local state |
| P1 | Chair conference detail | `frontend-v2/components/chair/conference-detail/*` | Dashboard/committee/coi/submission tabs heavily mock-backed |
| P1 | Reviewer assignment detail enrichments | `frontend-v2/components/reviewer/submission-review.tsx` | API data merged with `MOCK_SUBMISSION` |
| P2 | Author conference browsing/detail fallbacks | `frontend-v2/components/author/author-conferences.tsx`, `frontend-v2/components/author/author-conference-detail.tsx` | API fallback to mock content persists |

## 7. Backend Dependency Map
Only include when frontend migration cannot close parity alone.

- `BR-001`
  - `BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/stats; chair dashboard and conference analytics in frontend-v2 currently return synthetic zero metrics due missing endpoint; return stable aggregates (submission totals, review progress, acceptance metrics, track/time breakdowns) with explicit field schema and empty-state behavior for new conferences.>`

- `BR-002`
  - `BACKEND REQUEST: <Implement GET /api/v1/conferences/:conference_id/tracks (or provide equivalent in existing conference payload contract); frontend-v2 track UIs currently rely on placeholder empty arrays; return normalized track identifiers, names, description/limits, and ordering guarantees so forms and dashboards can bind deterministically.>`

- `BR-003`
  - `BACKEND REQUEST: <Implement camera-ready upload contract for conference submissions; frontend-v2 papers API contains placeholder logic because backend upload endpoint is unavailable; provide authenticated multipart upload endpoint, validation/error schema, and final artifact metadata response compatible with current submission model.>`

- `BR-004`
  - `BACKEND REQUEST: <Provide/confirm authoritative chair decision submission endpoint for per-submission final decision and notes; frontend-v2 chair review tab has submit-decision TODO with no bound contract; expose idempotent decision write API with allowed decision enum, audit metadata, and permission checks for chair role.>`

## 8. Prioritized Risk List
- P0: Missing discussion API migration (`discussions.ts`) while discussion/rebuttal tabs are presented as functional.
- P0: Missing app API routes in v2 (`/api/chat`, `/api/test/discussion-setup`, `/api/v1/auth/test-login`) can break key flows and parity validation.
- P1: Missing `user.ts` and `semantic-scholar.ts` in v2 removes legacy academic-profile capabilities.
- P1: Chair role appears feature-rich in UI but is largely mock-backed, increasing regression risk.
- P2: Legacy dev/test utilities are absent, slowing parity verification cycles.

## 9. Evaluation Outcome
Proceed with full functional/API migration steering rewrite and execution using:
1. Strict legacy semantic parity as baseline.
2. Keep additive v2 behaviors only if they do not change legacy outcomes.
3. Frontend-first resolution for all gaps unless blocked by explicit backend contract needs (`BR-*`).
