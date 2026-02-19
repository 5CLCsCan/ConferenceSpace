# 02 - Quality Audit Prompt

Use this prompt after migration implementation to verify quality and contract compliance.

## Fill These Inputs

- `ROLE`: `author` or `reviewer` or `chair`
- `ROLE_DOC_DIR`: e.g. `frontend/.docs/author`
- `LEGACY_DIR`: `frontend`
- `TARGET_DIR`: `frontend-v2`

## Copy-Paste Prompt

```text
You are performing a strict migration quality audit for ROLE=`<ROLE>`.

You have no prior context. Ground all judgments in:
1) role steering docs in `<ROLE_DOC_DIR>`
2) current implementation in `<TARGET_DIR>`
3) legacy implementation in `<LEGACY_DIR>` when parity checks are required

Objective:
Determine whether the migration is release-ready for `<ROLE>` scope. Focus on defects, regressions, contract violations, missing validations, and cleanup gaps.

Audit mode rules:
1) Start read-only. Do not edit code until findings are complete.
2) Use the role docs as normative contract.
3) Severity-first reporting: Critical -> High -> Medium -> Low.
4) Every finding must include exact file path + line reference and violated contract clause.
5) If no findings, state that explicitly and list residual risks/testing gaps.

Required audit workflow:

Step 1 - Contract extraction
- Read all files in `<ROLE_DOC_DIR>`.
- Extract a checklist:
  - canonical routes
  - route param naming
  - source-of-truth pages/components
  - auth/session rules
  - validation/smoke requirements
  - legacy cleanup requirements

Step 2 - Static compliance checks
- In `<TARGET_DIR>`, verify:
  - no forbidden legacy route strings in migrated scope
  - expected canonical route strings exist
  - role flows match contract
  - no obvious dead references to removed pages/components

Step 3 - Behavior parity checks
- Compare role-critical flows between `<LEGACY_DIR>` and `<TARGET_DIR>`:
  - login -> role selection behavior
  - role root behavior for `<ROLE>`
  - key list/detail/action flows for `<ROLE>`
  - notifications/profile/shared nav behavior in migrated scope
- Ensure differences are intentional and contract-aligned.

Step 4 - Validation runbook execution
- Execute checks defined by role docs:
  - lint/typecheck/tests (if defined)
  - grep checks
  - smoke scenarios
- Record pass/fail with evidence.

Step 5 - Cleanup audit
- Verify whether legacy deletions were done per deletion gates.
- Identify:
  - files that should be deleted but still remain
  - files deleted too early
  - references in target to now-removed legacy paths

Required deliverables:

A) Findings (primary section)
For each finding include:
- Severity: Critical/High/Medium/Low
- Title
- Evidence:
  - contract requirement (quote clause briefly)
  - observed behavior
  - impacted files (`path:line`)
- Risk if not fixed
- Recommended fix

B) Compliance Matrix
- Table with each major contract area:
  - auth/session
  - routes
  - role flows
  - shared flows
  - cleanup
  - validation coverage
- Mark: Pass / Partial / Fail

C) Release Readiness Decision
- `Ready` or `Not Ready`
- If not ready:
  - must-fix blockers
  - nice-to-have improvements

D) Optional Patch Plan (no edits yet)
- ordered list of minimal patch groups to close findings
- each group includes files and expected impact

If you find zero issues:
- explicitly state "No findings discovered."
- still list residual risks (for example: missing E2E coverage, untested edge-case routes, env assumptions).

Do not provide vague statements. Keep all conclusions evidence-backed.
```

