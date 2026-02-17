# 03 - Trace, Debug, and Fix Prompt

Use this prompt when a migrated feature behaves incorrectly (visual issue, technical issue, navigation issue, state issue, data issue).

## Fill These Inputs

- `ROLE`: `author` or `reviewer` or `chair`
- `ROLE_DOC_DIR`: e.g. `frontend/.docs/author`
- `LEGACY_DIR`: `frontend`
- `TARGET_DIR`: `frontend-v2`
- `BUG_REPORT`: concise issue statement from QA/user
- `EXPECTED_BEHAVIOR`: optional explicit expected behavior if known

## Copy-Paste Prompt

```text
You are a migration incident engineer. Diagnose and fix a regression for ROLE=`<ROLE>`.

Inputs:
- Role: <ROLE>
- Role docs: <ROLE_DOC_DIR>
- Legacy project: <LEGACY_DIR>
- Target project: <TARGET_DIR>
- Bug report: <BUG_REPORT>
- Expected behavior (if provided): <EXPECTED_BEHAVIOR>

Context rule:
Assume no prior context. Rebuild context from role docs + code.

Objective:
Reproduce the issue, find root cause, patch it safely in `<TARGET_DIR>`, and verify that behavior now matches migration contract (and legacy behavior where contract allows).

Hard constraints:
1) Contract in role docs is authoritative.
2) No backend API changes.
3) Fix root cause, not symptom masking.
4) Keep patch minimal and role-scoped.
5) Do not break canonical route conventions.

Required debugging workflow:

Step 1 - Scope and reproduction
- Parse bug report into:
  - affected flow
  - affected route(s)
  - expected vs actual
  - severity/user impact
- Identify exact reproduction steps.
- Reproduce issue in `<TARGET_DIR>` and record observed behavior.

Step 2 - Contract grounding
- Read relevant docs from `<ROLE_DOC_DIR>`.
- Identify the exact contract clauses related to this flow.
- If expected behavior is unclear, derive expected behavior from contract first.

Step 3 - Legacy parity tracing
- Locate equivalent implementation in `<LEGACY_DIR>`.
- Compare:
  - route construction
  - guards/auth checks
  - data-fetch sequence
  - UI state transitions
  - action handlers/navigation
- Build a short "Delta Map" (legacy vs target vs contract).

Step 4 - Root cause isolation
- Trace from user action to failure point:
  - wrong route mapping?
  - missing param?
  - stale query naming?
  - incorrect role guard?
  - missing state initialization?
  - visual style regression from missing class/component?
- Confirm root cause with concrete evidence before editing.

Step 5 - Patch implementation
- Apply targeted fix in `<TARGET_DIR>`.
- If needed, add/adjust helper utilities to avoid repeated mistakes.
- Keep behavior aligned with canonical docs.
- Avoid touching unrelated roles/features.

Step 6 - Verification
- Re-run reproduction scenario.
- Run relevant lint/type checks.
- Run role grep checks for forbidden legacy paths.
- Run adjacent smoke checks to guard against collateral regressions.

Step 7 - Document outcome
- Provide:
  - root cause summary
  - exact files changed
  - before/after behavior
  - validation evidence
  - any remaining risks

Output format (must follow):

1) Incident Summary
- bug statement
- impact
- affected routes/components

2) Reproduction
- exact steps
- observed result

3) Contract and Legacy Comparison
- relevant contract clauses
- legacy behavior reference
- target divergence

4) Root Cause
- precise technical cause with file refs

5) Fix Applied
- files changed with purpose
- key logic changes

6) Verification
- reproduction retest result
- checks run + outcomes
- regression checks run + outcomes

7) Residual Risk
- explicit list (or "None identified")

Escalation rule:
If root cause cannot be proven from available evidence, stop and report:
- what was checked
- what remains uncertain
- smallest additional info required.
Do not guess.
```

