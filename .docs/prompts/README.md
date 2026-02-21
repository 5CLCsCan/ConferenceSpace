# Functional/API Migration Prompt Pack

This prompt pack is for migrating functionality and API behavior from `frontend` (legacy) to `frontend-v2` (target UI redesign).

## 1. Purpose
Use these prompts in fresh agent sessions to execute, audit, debug, and close functional/API parity.

## 2. Required Inputs
Every prompt run must load these files first:
- `.docs/.legacy/evaluation.md`
- `.docs/.legacy/proposal.md`
- `.docs/.legacy/plan.md`
- `.docs/.legacy/route-contract.md`
- `.docs/.legacy/functional-parity-matrix.md`
- `.docs/.legacy/api-contract-deltas.md`

## 3. Global Non-Negotiables
1. Do not modify backend code.
2. Work only in frontend scope:
   - `frontend/**` (read/reference)
   - `frontend-v2/**` (implementation target)
   - `.docs/**` (steering updates when requested)
3. Any backend dependency must be documented exactly as:
   - `BACKEND REQUEST: <request; reasons for the request; description of what need to be done (what should be introduced, how it should be handled, any specific requirements, etc. the more info the better)>`
4. Preserve v2 additive behavior only when legacy semantics are unchanged.
5. Respect fixed phase order: Shared -> Author -> Reviewer -> Chair -> Cross-cutting.

## 4. Deterministic Output Contract
Every prompt response must include all fields below.

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
    evidence: <short evidence>
residual_risks:
  - <risk with owner and next action>
```

If no item exists for a field, return an explicit empty list.

## 5. Prompt Sequence
1. `01-migration-execution.md`
2. `02-quality-audit.md`
3. `03-trace-debug-fix.md` (as needed)
4. `04-legacy-cleanup.md` (after parity closure)
5. `05-role-doc-generation.md`
6. `06-backend-request-curation.md`
7. `07-release-readiness.md`

## 6. Failure Mode Rules
- If a required contract is missing, do not guess silently.
- Mark related parity items as `blocked-backend` or `partial` with reasons.
- Emit linked `BACKEND REQUEST` text and keep unresolved risk visible.
