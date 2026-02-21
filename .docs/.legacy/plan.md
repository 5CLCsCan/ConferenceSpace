# Functional/API Migration Execution Plan

## 1. Plan Summary
This plan operationalizes the functional/API migration from `frontend` to `frontend-v2` using the parity matrix and API delta log as source of truth.

Fixed execution order:
1. Shared
2. Author
3. Reviewer
4. Chair
5. Cross-cutting

## 2. Inputs and Outputs

### Inputs
- `.docs/.legacy/evaluation.md`
- `.docs/.legacy/proposal.md`
- `.docs/.legacy/route-contract.md`
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`

### Required Outputs Per Execution Iteration
- Updated code changes in `frontend-v2/**` only (plus docs updates)
- Parity items resolved list
- API delta updates
- Any new `BACKEND REQUEST` entries
- Verification results with scenario IDs

## 3. Phase Graph

### Phase 1: Shared
Objective: stabilize global auth/session/navigation/profile/notification/chat/test utility contracts.

Tasks:
1. Restore missing app API routes required by shared and test flows:
   - `/api/chat`
   - `/api/test/discussion-setup`
   - `/api/v1/auth/test-login`
2. Replace mock-backed notifications page behavior with `notifications.ts` API bindings.
3. Port missing profile API helpers (`user.ts`) and ensure parity with legacy profile flows.
4. Ensure route and role entry behavior parity (`/dashboard` -> `/role`, role guards, redirects).

Exit gate:
- Shared scenarios SCN-SH-001 through SCN-SH-006 pass.

### Phase 2: Author
Objective: API-backed author submission and conference detail behavior with legacy-equivalent outcomes.

Tasks:
1. Ensure author conference list/detail are API-first with controlled fallback only where approved.
2. Resolve submission presence detection in conference detail.
3. Migrate discussion API usage for author submission detail discussion tab.
4. Validate rebuttal behavior parity and classify any additive behavior separately.

Exit gate:
- Author scenarios SCN-AU-001 through SCN-AU-006 pass.

### Phase 3: Reviewer
Objective: API-backed reviewer assignment, review, and discussion/rebuttal flows.

Tasks:
1. Complete mapping from legacy reviewer paper flows to v2 assignment detail flows.
2. Replace discussion tab mock state with backend thread/message contracts.
3. Resolve reviewer rebuttal status persistence path (frontend-only if possible; else backend request).
4. Validate completed reviews, invitations, and conference listing parity behaviors.

Exit gate:
- Reviewer scenarios SCN-RV-001 through SCN-RV-006 pass.

### Phase 4: Chair
Objective: converge chair conference management and decision flows to production API contracts.

Tasks:
1. Prioritize chair dashboard and conference-detail tabs with highest functional impact.
2. Replace mock-backed submission/review/discussion surfaces with API-backed data.
3. Bind final decision submit flow to backend contract or issue `BACKEND REQUEST`.
4. Retain v2 additive surfaces only when they do not break legacy semantics.

Exit gate:
- Chair scenarios SCN-CH-001 through SCN-CH-007 pass.

### Phase 5: Cross-Cutting
Objective: close parity debt and certify release readiness.

Tasks:
1. Reconcile API module parity (`coi.ts`, `coi-mock.ts`, `semantic-scholar.ts`, `discussions.ts`, `user.ts`).
2. Reconcile test/dev parity (`/test/discussion`, `/test/profile-link`, discussion setup utilities).
3. Close or formally defer all remaining `partial`, `missing`, `blocked-backend` items.
4. Produce final readiness report with residual risk and owner assignment.

Exit gate:
- Cross-cutting scenarios SCN-CR-001 through SCN-CR-005 pass.

## 4. Dependencies and Critical Path

### Hard Dependencies
1. Shared phase must complete before role phases.
2. Discussion API migration must complete before author/reviewer/chair discussion parity can close.
3. Backend contract availability for stats/tracks/decision endpoints controls closure of blocked chair items.

### Critical Path Items
1. `PAR-037` Notifications API parity.
2. `PAR-031` Discussion API module parity.
3. `PAR-038` and `PAR-039` test helper route restoration.
4. `PAR-043` and `PAR-044` backend-blocked conference analytics/track contracts.

## 5. Blocker Handling

### Frontend-Resolvable
- Implement directly in `frontend-v2` and update parity status.

### Backend-Blocked
- Do not edit backend.
- Add or update a linked `BackendRequest` entry using strict format.
- Mark parity item status as `blocked-backend`.
- Record impact and mitigation in residual risk log.

## 6. Verification Gates

### Gate A: Coverage
- Every legacy route, API module, and app API route is mapped to at least one parity item.

### Gate B: Delta Closure
- Every `missing`/`partial`/`blocked-backend` item links to an `ApiDelta` and owner.

### Gate C: Runtime Behavior
- Core role workflows execute without fallback to stale mock behavior where parity requires API.

### Gate D: Request Hygiene
- Every backend dependency has structured `BACKEND REQUEST` text and linked IDs.

### Gate E: Prompt Determinism
- Prompt pack outputs include required fields:
  - `changed_files`
  - `parity_items_resolved`
  - `backend_requests_added`
  - `verification_results`
  - `residual_risks`

## 7. Final Completion Checklist
1. All target docs in `.docs/.legacy` and `.docs/prompts` are updated to functional/API migration purpose.
2. Parity matrix is complete and up to date with current repository state.
3. API delta log has no orphan deltas and no orphan parity references.
4. Unresolved backend dependencies are represented as `BR-*` entries.
5. Final readiness decision is recorded as `go`, `go-with-risks`, or `no-go` with rationale.
