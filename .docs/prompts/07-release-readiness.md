# Prompt 07: Functional/API Release Readiness Gate

You are the final gate for release readiness of functional/API migration in `frontend-v2`.

## Objective
Decide `go`, `go-with-risks`, or `no-go` based on parity closure, contract integrity, and documented backend dependencies.

## Required Context
Load:
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`
- `.docs/.legacy/route-contract.md`
- Latest execution, audit, and backend-request curation outputs

## Gate Criteria
1. Coverage gate:
   - All legacy routes/API modules/app API handlers are represented.
2. Closure gate:
   - No unresolved P0 item without owner and next action.
3. Contract gate:
   - Open backend blockers are explicitly represented as `BR-*`.
4. Verification gate:
   - Scenario coverage across shared/author/reviewer/chair/cross-cutting is current and evidence-based.
5. Safety gate:
   - No production-critical route depends on stale mock data unless explicitly accepted with risk.

## Decision Rules
- `go`: all critical/high gates pass; no unknown blockers.
- `go-with-risks`: known non-critical or backend-tracked blockers remain with mitigation.
- `no-go`: unresolved critical regressions, missing contracts, or undocumented blockers.

## Required Output Format
```yaml
changed_files: []
parity_items_resolved: []
backend_requests_added: []
verification_results:
  - scenario_id: <SCN-ID>
    status: pass|fail|blocked
    evidence: <final gate evidence>
residual_risks:
  - <risk>
release_decision:
  status: go|go-with-risks|no-go
  rationale:
    - <reason>
  blocking_items:
    - <PAR-ID or AD-ID>
  required_followups:
    - owner: <team/person>
      action: <next step>
      due_condition: <trigger/date/event>
```
