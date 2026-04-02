# AI-010 Prompt Contract Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the AI-010 review-quality-auditor prompt so semantic audit guidance stays in the prompt while severity enforcement and schema policy stay in code.

**Architecture:** Keep the runtime shape unchanged: one static system prompt, one structured JSON payload, one Pydantic response model. Tighten the contract by moving prompt text toward domain judgment only, verifying that with explicit prompt-contract tests, and limiting code edits to the smallest schema wording changes needed to make the boundary inspectable.

**Tech Stack:** Python 3.12, pytest, Pydantic v2

---

### Task 1: Add prompt-contract coverage

**Files:**
- Create: `ai-service/tests/test_review_quality_audit_prompts.py`
- Reference: `ai-service/app/workflows/review_quality_auditor/prompts.py`
- Reference: `ai-service/tests/test_reviewer_briefing_prompts.py`

**Step 1: Write the failing test**

Add prompt assertions that require:
- semantic-audit scope is explicit
- recommendation/score steering remains prohibited
- AI-003 context remains optional and non-authoritative
- runtime-owned severity enforcement language is absent from the prompt

**Step 2: Run test to verify it fails**

Run: `python -m pytest ai-service/tests/test_review_quality_audit_prompts.py -q`

Expected: FAIL because the current prompt still contains mode-specific blocking policy.

**Step 3: Write minimal implementation**

Update the prompt constant to remove platform-enforcement wording and replace it with a cleaner semantic decision framework.

**Step 4: Run test to verify it passes**

Run: `python -m pytest ai-service/tests/test_review_quality_audit_prompts.py -q`

Expected: PASS.

### Task 2: Tighten schema wording

**Files:**
- Modify: `ai-service/app/workflows/review_quality_auditor/schemas.py`
- Test: `ai-service/tests/test_review_quality_audit_prompts.py`

**Step 1: Write the failing test**

Add schema assertions that require the model-facing field descriptions to describe semantic severity and narrow field targeting without referencing submit-mode enforcement.

**Step 2: Run test to verify it fails**

Run: `python -m pytest ai-service/tests/test_review_quality_audit_prompts.py -q`

Expected: FAIL if the descriptions still blur semantic severity with platform enforcement.

**Step 3: Write minimal implementation**

Adjust only the relevant `Field(description=...)` text in `ReviewQualityAuditModelFinding`.

**Step 4: Run test to verify it passes**

Run: `python -m pytest ai-service/tests/test_review_quality_audit_prompts.py -q`

Expected: PASS.

### Task 3: Verify runner compatibility

**Files:**
- Reference: `ai-service/app/workflows/review_quality_auditor/runner.py`
- Test: `ai-service/tests/test_review_quality_audit_runner.py`

**Step 1: Run focused regression tests**

Run: `python -m pytest ai-service/tests/test_review_quality_audit_prompts.py ai-service/tests/test_review_quality_audit_runner.py -q`

Expected: PASS with prompt-contract and runner-behavior coverage both green.

**Step 2: Review scope**

Run: `git diff -- ai-service/app/workflows/review_quality_auditor ai-service/tests/test_review_quality_audit_prompts.py docs/plans/2026-04-02-ai-010-prompt-contract-cleanup.md`

Expected: only prompt, schema wording, new test, and plan doc changes appear.
