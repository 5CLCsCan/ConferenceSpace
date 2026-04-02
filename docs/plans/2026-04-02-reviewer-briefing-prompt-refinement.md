# Reviewer Briefing Prompt Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the reviewer pre-read briefing prompt so the generated artifact is more evidence-anchored, less repetitive across fields, and more stable in readiness-signal behavior.

**Architecture:** Keep the runtime contract unchanged and refine only the system prompt plus prompt-focused tests. Encode the desired behavior in tests first, then rewrite the prompt around explicit section semantics, readiness-signal decision rules, and validation checks.

**Tech Stack:** Python, pytest, Pydantic structured output, LiteLLM/OpenRouter

---

### Task 1: Tighten Prompt Contract Tests

**Files:**
- Modify: `ai-service/tests/test_reviewer_briefing_prompts.py`
- Modify: `ai-service/app/workflows/reviewer_pre_read_briefing/prompts.py`

**Step 1: Write the failing test**

Add assertions that the prompt includes:
- canonical sections such as `ROLE`, `TASK`, `FRAMEWORK`, `CONSTRAINTS`, `OUTPUT`, `VALIDATION`
- field-separation guidance for `claimed_contributions`, `notable_elements`, `reviewer_attention_points`, and `stated_scope_and_limitations`
- readiness-signal status routing for `present`, `partial`, `not_found`, and `not_applicable`
- conservative evidence handling such as preferring `not_found` over speculation

**Step 2: Run test to verify it fails**

Run: `python -m pytest ai-service/tests/test_reviewer_briefing_prompts.py -q`
Expected: FAIL because the current prompt does not include the new structural and routing language.

**Step 3: Write minimal implementation**

Rewrite `REVIEWER_BRIEFING_SYSTEM_PROMPT` to:
- define the briefing role precisely
- separate artifact fields by job
- add a compact readiness-signal decision policy
- centralize prohibitions
- keep schema-handling light because code already validates it

**Step 4: Run test to verify it passes**

Run: `python -m pytest ai-service/tests/test_reviewer_briefing_prompts.py -q`
Expected: PASS

**Step 5: Commit**

```bash
git add ai-service/tests/test_reviewer_briefing_prompts.py ai-service/app/workflows/reviewer_pre_read_briefing/prompts.py docs/plans/2026-04-02-reviewer-briefing-prompt-refinement.md
git commit -m "refactor: tighten reviewer briefing prompt contract"
```

### Task 2: Verify Workflow-Level Safety

**Files:**
- Modify: `ai-service/app/workflows/reviewer_pre_read_briefing/prompts.py`
- Test: `ai-service/tests/test_reviewer_briefing_runner.py`

**Step 1: Write the failing test**

Only if needed, add or adjust a runner-level assertion when the prompt rewrite changes an observable contract that should stay stable.

**Step 2: Run test to verify it fails**

Run: `python -m pytest ai-service/tests/test_reviewer_briefing_runner.py -q`
Expected: Either PASS unchanged or expose an accidental prompt-related regression in the runtime request shape.

**Step 3: Write minimal implementation**

Do not change runner logic unless a real regression appears. Prefer keeping the implementation surface to the prompt constant.

**Step 4: Run test to verify it passes**

Run: `python -m pytest ai-service/tests/test_reviewer_briefing_runner.py -q`
Expected: PASS

**Step 5: Commit**

```bash
git add ai-service/app/workflows/reviewer_pre_read_briefing/prompts.py ai-service/tests/test_reviewer_briefing_runner.py
git commit -m "test: verify reviewer briefing prompt refinement"
```
