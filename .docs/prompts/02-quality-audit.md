# Prompt 02: Functional/API Quality Audit

You are auditing migration quality and parity integrity after execution changes.

## Objective
Find unresolved parity gaps, behavioral regressions, contract mismatches, and undocumented backend dependencies.

## Required Context
Load:
- `.docs/.legacy/evaluation.md`
- `.docs/.legacy/route-contract.md`
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`
- Most recent execution output from Prompt 01

## Audit Checklist
1. Coverage integrity:
   - Every legacy route appears in parity matrix.
   - Every legacy API module appears in parity matrix.
   - Every legacy app API route appears in parity matrix.
2. Status integrity:
   - No item marked resolved without evidence.
   - `implemented-api-backed` items have no active mock dependency.
3. Delta integrity:
   - Every `missing`/`partial`/`blocked-backend` parity item links to at least one `ApiDelta`.
   - Every open `ApiDelta` links back to parity items.
4. Backend request integrity:
   - Each backend dependency has a linked `BR-*` entry.
   - `BACKEND REQUEST` format is exact.
5. Runtime-risk audit:
   - Notifications, discussions, rebuttals, chair decisions, chatbot, and profile-linking are explicitly verified.

## Severity Rules
- `critical`: breaks core role flow or causes runtime failure.
- `high`: parity behavior differs from legacy in user-visible way.
- `medium`: incomplete contract linkage, missing tests, or stale mock usage.
- `low`: documentation or cleanup debt.

## Output Requirements
1. Findings first, ordered by severity.
2. Each finding must include:
   - ID
   - severity
   - affected parity IDs
   - affected files
   - evidence
   - required fix
3. If no findings, state that explicitly and list residual risks.

## Required Output Format
```yaml
changed_files: []
parity_items_resolved: []
backend_requests_added:
  - <BR-ID if newly required>
verification_results:
  - scenario_id: <SCN-ID>
    status: pass|fail|blocked
    evidence: <audit evidence>
residual_risks:
  - <open risk>
audit_findings:
  - id: AQ-001
    severity: critical|high|medium|low
    parity_items: [PAR-###]
    files: [<path>]
    evidence: <short evidence>
    required_fix: <action>
```
