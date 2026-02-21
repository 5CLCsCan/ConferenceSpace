# Prompt 06: Backend Request Curation

You are curating backend dependency requests discovered during frontend-only migration.

## Objective
Consolidate, deduplicate, and prioritize `BACKEND REQUEST` entries, with explicit links to parity and API deltas.

## Required Context
Load:
- `.docs/.legacy/evaluation.md`
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`
- Recent execution/audit outputs

## Curation Rules
1. Only include requests that block or materially degrade parity closure.
2. Merge duplicates by contract intent, not just endpoint path.
3. Preserve exact request format in final text:
   - `BACKEND REQUEST: <request; reasons for the request; description of what need to be done (what should be introduced, how it should be handled, any specific requirements, etc. the more info the better)>`
4. For each curated request include:
   - `BR-ID`
   - linked `PAR-*`
   - linked `AD-*`
   - blocking level
   - expected contract schema notes
   - compatibility expectations

## Prioritization Heuristic
Order by:
1. Number of blocked P0/P1 parity items
2. User-visible impact breadth across roles
3. Availability of frontend fallback

## Required Output Format
```yaml
changed_files:
  - .docs/.legacy/api-contract-deltas.md
parity_items_resolved: []
backend_requests_added:
  - <BR-ID>
verification_results:
  - scenario_id: <SCN-ID>
    status: blocked
    evidence: <why backend dependency remains>
residual_risks:
  - <risk>
backend_request_catalog:
  - id: BR-###
    blocking_level: blocking|high|medium|low
    linked_parity_items: [PAR-###]
    linked_api_deltas: [AD-###]
    request_text: "BACKEND REQUEST: <...>"
    expected_contract: <schema/behavior summary>
    compatibility_notes: <notes>
```
