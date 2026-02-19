# Prompt 04: Post-Parity Legacy Cleanup

You are cleaning migration leftovers after functional/API parity is already achieved for targeted items.

## Objective
Remove obsolete frontend-v2 migration scaffolding (unused mocks, dead adapters, temporary compatibility code) without breaking required parity, including dev/test parity commitments.

## Required Context
Load:
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`
- Latest execution/audit outputs

## Preconditions
Cleanup is allowed only when targeted parity IDs are not `missing` or `blocked-backend`.

## Cleanup Rules
1. Do not delete assets still required for:
   - active parity items
   - approved additive v2 behavior
   - required dev/test parity routes/utilities
2. Remove only if all are true:
   - replacement path is API-backed and verified
   - no unresolved parity item references the artifact
   - no prompt or docs workflow depends on it
3. For each deletion, provide explicit dependency check evidence.

## Candidate Cleanup Targets
- Mock data files no longer referenced by active parity items.
- Transitional route-mapping shims replaced by stable contracts.
- Temporary TODO adapters superseded by real API modules.

## Safety Verification
Run scenario checks for impacted domains after cleanup. If any fail, rollback cleanup candidate and record residual risk.

## Required Output Format
```yaml
changed_files:
  - <path>
parity_items_resolved:
  - <PAR-ID>
backend_requests_added: []
verification_results:
  - scenario_id: <SCN-ID>
    status: pass|fail|blocked
    evidence: <post-cleanup check>
residual_risks:
  - <risk>
cleanup_report:
  removed_artifacts:
    - path: <path>
      justification: <why safe>
      linked_parity_items: [PAR-###]
  retained_artifacts:
    - path: <path>
      reason: <why cannot remove yet>
```
