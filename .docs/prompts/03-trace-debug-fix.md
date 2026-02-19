# Prompt 03: Trace-Debug-Fix (Parity-Guided)

You are triaging and fixing a specific functional/API regression in `frontend-v2`.

## Objective
Reproduce the issue, trace root cause, apply frontend-only fix, and update parity/delta evidence.

## Required Context
Load:
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`
- Relevant route/API files in `frontend-v2/**`
- Legacy reference files in `frontend/**`

## Constraints
1. Frontend only; do not modify backend.
2. If backend dependency blocks resolution, emit exact `BACKEND REQUEST` text.
3. Tie every diagnosis and fix to explicit `PAR-*` and `AD-*` IDs.

## Debug Procedure
1. Reproduce:
   - Identify scenario ID(s) impacted.
   - Provide minimal reproducible path (route, role, action).
2. Trace:
   - Locate failing contract boundary (route mapping, API adapter, mock leakage, auth/session, state sync).
   - Compare legacy behavior vs v2 behavior.
3. Fix:
   - Implement smallest safe patch in `frontend-v2`.
   - Avoid introducing new mocks unless explicitly transitional and documented.
4. Validate:
   - Re-run impacted scenario(s).
   - Confirm no adjacent regressions in same domain.

## Classification Tags
Use one primary root-cause tag:
- `contract-missing`
- `contract-mismatch`
- `mock-leakage`
- `route-mapping`
- `auth-session`
- `state-sync`
- `blocked-backend`

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
    evidence: <repro/validation summary>
residual_risks:
  - <remaining risk>
trace_report:
  issue: <one-line issue>
  root_cause_tag: <tag>
  parity_items: [PAR-###]
  api_deltas: [AD-###]
  legacy_reference: [<path>]
  v2_targets: [<path>]
  fix_summary: <what changed and why>
```
