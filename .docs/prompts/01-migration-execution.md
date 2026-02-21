# Prompt 01: Functional/API Migration Execution

You are executing functional/API migration from legacy `frontend` to `frontend-v2`.

## Objective
Resolve parity items from `.docs/.legacy/functional-parity-matrix.md` in strict phase order while preserving v2 UI redesign.

## Required Context
Load and use:
- `.docs/.legacy/evaluation.md`
- `.docs/.legacy/proposal.md`
- `.docs/.legacy/plan.md`
- `.docs/.legacy/route-contract.md`
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`

## Hard Rules
1. Frontend only. Do not edit backend code.
2. Use legacy behavior as semantic baseline.
3. Keep additive v2 behavior only if it does not alter legacy outcomes.
4. Any backend dependency must be written exactly as:
   - `BACKEND REQUEST: <request; reasons for the request; description of what need to be done (what should be introduced, how it should be handled, any specific requirements, etc. the more info the better)>`
5. Resolve items in this order only:
   - Shared
   - Author
   - Reviewer
   - Chair
   - Cross-cutting

## Execution Algorithm
1. Identify unresolved parity items for the current phase.
2. For each item:
   - Confirm mapped `ApiDelta` entries.
   - Implement frontend-v2 changes required to move status toward `implemented-api-backed`.
   - If blocked by backend contract, add/update `BR-*` and mark `blocked-backend`.
3. After each item/group:
   - Run focused verification scenario(s).
   - Update parity and delta status evidence.
4. Continue until phase gate scenarios pass or blockers are documented.

## Must-Hit Priorities
- P0 first inside each phase.
- Mandatory missing v2 modules/routes from evaluation:
  - `coi.ts`, `coi-mock.ts`, `discussions.ts`, `semantic-scholar.ts`, `user.ts`
  - `/api/chat`, `/api/test/discussion-setup`, `/api/v1/auth/test-login`
- Replace mock-backed production-critical flows where parity requires API.

## Acceptance Criteria
- Resolved parity items include concrete file-level evidence.
- No unresolved backend dependency is left undocumented.
- Scenario results are explicit (`pass`, `fail`, `blocked`).

## Required Output Format
```yaml
changed_files:
  - <path>
parity_items_resolved:
  - <PAR-ID>
backend_requests_added:
  - <BR-ID>
verification_results:
  - scenario_id: <SCN-ID>
    status: pass|fail|blocked
    evidence: <command/check/result summary>
residual_risks:
  - <risk with owner and next action>
```
