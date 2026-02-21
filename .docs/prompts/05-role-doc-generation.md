# Prompt 05: Role-Focused Migration Documentation Generation

You are generating role-focused migration status docs from canonical parity and delta sources.

## Objective
Produce deterministic role-by-role status summaries that can be consumed by engineers, QA, and product stakeholders.

## Required Context
Load:
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`
- `.docs/.legacy/route-contract.md`
- Most recent execution/audit outputs

## Required Role Buckets
- Shared
- Author
- Reviewer
- Chair
- Cross-cutting

## Generation Rules
1. Use `PAR-*` and `AD-*` IDs as canonical references.
2. Do not invent status; use only documented parity/delta states.
3. For each role bucket include:
   - completed items
   - in-progress items
   - blocked-backend items
   - highest risks
   - next actions
4. Include all linked `BR-*` requests where applicable.

## Document Structure
For each role bucket, emit:
1. Scope summary
2. Parity status table
3. Open API deltas
4. Verification scenario outcomes
5. Residual risks and owners

## Required Output Format
```yaml
changed_files:
  - <generated-doc-path>
parity_items_resolved: []
backend_requests_added: []
verification_results:
  - scenario_id: <SCN-ID>
    status: pass|fail|blocked
    evidence: <source evidence>
residual_risks:
  - <risk>
role_docs_generated:
  - role: shared|author|reviewer|chair|cross-cutting
    parity_summary:
      implemented_api_backed: <count>
      implemented_mock_backed: <count>
      partial: <count>
      missing: <count>
      blocked_backend: <count>
    top_open_items: [PAR-###]
    linked_deltas: [AD-###]
    linked_backend_requests: [BR-###]
```
