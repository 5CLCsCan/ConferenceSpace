# Functional/API Migration Proposal

## 1. Proposal Goal
Migrate functional behavior and API integration from `frontend` (legacy) into `frontend-v2` while preserving the redesigned v2 UI.

Success means users can complete the same core workflows with API-backed behavior parity, and any unresolved backend dependency is explicitly captured via `BACKEND REQUEST` entries.

## 2. Scope Boundaries
- In scope:
  - `frontend/**` as reference baseline
  - `frontend-v2/**` as implementation target
  - `.docs/.legacy/**` and `.docs/prompts/**` as migration steering system
- Out of scope:
  - `backend/**` modifications
  - Any backend schema change without explicit request record

## 3. Core Principles
1. Legacy semantics are source of truth.
2. V2 additive behavior can remain only when legacy outcomes are unchanged.
3. Prefer API-backed implementation over mock-backed implementation.
4. Frontend-first resolution: solve in v2 when possible before requesting backend changes.
5. Every unresolved backend dependency must be documented with exact format:
   - `BACKEND REQUEST: <request; reasons for the request; description of what need to be done (what should be introduced, how it should be handled, any specific requirements, etc. the more info the better)>`

## 4. Domain Strategy and Work Order
Execution order is fixed:
1. Shared
2. Author
3. Reviewer
4. Chair
5. Cross-cutting

Rationale:
- Shared APIs/routes/auth determine all role flows.
- Author and reviewer depend on shared submission/discussion primitives.
- Chair depends on shared/reviewer outcomes and conference analytics contracts.
- Cross-cutting finalization handles chatbot, test utilities, and release gating.

## 5. Functional/API Migration Rules

### 5.1 Module Parity Rule
For every legacy API module, v2 must be in one of two states:
- Equivalent module exists and is used by corresponding v2 flows.
- Gap is recorded as `ApiDelta` with migration task and acceptance criteria.

Immediate mandatory parity targets:
- `coi.ts`
- `coi-mock.ts`
- `discussions.ts`
- `semantic-scholar.ts`
- `user.ts`

### 5.2 App API Route Parity Rule
Legacy app API helper routes must be restored or replaced with equivalent v2 contract:
- `/api/chat`
- `/api/test/discussion-setup`
- `/api/v1/auth/test-login`

### 5.3 Mock Retirement Rule
Mock data can exist only when one of these holds:
- Temporary migration bridge with linked parity item and removal criteria.
- Explicitly approved additive v2-only UX preview.

If mock is used for legacy-critical behavior, status cannot be `implemented-api-backed`.

### 5.4 TODO Conversion Rule
Each TODO that impacts behavior/API contracts must become:
- A concrete frontend migration task, or
- A concrete `BACKEND REQUEST` item.

## 6. API Contract and Type Governance
All migration docs/prompts use these normalized records:
- `ParityItem`
- `ApiDelta`
- `BackendRequest`

Prompt outputs must always include:
- `changed_files`
- `parity_items_resolved`
- `backend_requests_added`
- `verification_results`
- `residual_risks`

## 7. Backend Escalation Policy
A backend escalation is valid only if:
1. Legacy-compatible frontend behavior cannot be completed with existing backend contract.
2. The gap is reproducible with code evidence.
3. The request includes endpoint/schema/auth/error-handling expectations.
4. The request is linked to `ParityItem` and `ApiDelta` IDs.

Required ownership fields for each backend request:
- Triggering feature
- Blocking level
- Required response schema
- Backward compatibility notes

## 8. Definition of Done
Migration is done only when all are true:
1. Every legacy route/feature/API is represented in `functional-parity-matrix.md`.
2. Every non-green parity item (`missing`, `partial`, `blocked-backend`, `implemented-mock-backed`) has a tracked resolution path.
3. Missing v2 modules/routes listed in evaluation are addressed or explicitly accepted with risk and owner.
4. Critical user flows (auth, submissions, reviews, discussions, chair decisions, notifications, profile) pass verification scenarios.
5. Backend dependencies are visible through structured `BACKEND REQUEST` entries.

## 9. Non-Goals
- Reworking backend architecture.
- Visual redesign rework in v2.
- Feature invention beyond legacy parity plus already existing v2 additive features.

## 10. Decision Defaults
When a prompt run or implementation step is ambiguous:
1. Choose parity-preserving behavior.
2. Choose API-backed over mock-backed.
3. Keep additive v2 UX only if legacy semantics remain unchanged.
4. Escalate backend only through `BACKEND REQUEST` format and linked IDs.
