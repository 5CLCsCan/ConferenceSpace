# Submission Gating Stage Logging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add visible ai-service console logs for submission-gating workflow progress by logging the start and end of each stage.

**Architecture:** Emit centralized lifecycle logs from the submission-gating runner rather than logging inside each stage module. This keeps log shape consistent, covers skipped and failed stages, and avoids duplicating logging logic across the pipeline.

**Tech Stack:** Python, FastAPI, standard library `logging`, pytest

---

### Task 1: Add failing tests for stage lifecycle logs

**Files:**
- Modify: `E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\tests\test_submission_gating_runner.py`

**Step 1: Write the failing test**

Add a test that runs the workflow with a stub repo and LLM client, captures logs with `caplog`, and asserts:
- one `submission_gating.stage_started` record exists for each executed stage
- one `submission_gating.stage_finished` record exists for each executed stage
- skipped stages emit `submission_gating.stage_skipped`

**Step 2: Run test to verify it fails**

Run: `cd ai-service; .\.venv\Scripts\python -m pytest tests/test_submission_gating_runner.py -q`

Expected: FAIL because the runner does not emit those logs yet.

**Step 3: Commit**

Skip commit for this local task.

### Task 2: Implement centralized runner logging

**Files:**
- Modify: `E:\HCMUS\Graduate-Project\ConferenceSpace\ai-service\app\workflows\submission_gating\runner.py`

**Step 1: Write minimal implementation**

Add a module logger and emit:
- `submission_gating.run_started`
- `submission_gating.stage_started`
- `submission_gating.stage_finished`
- `submission_gating.stage_skipped`
- `submission_gating.stage_failed`
- `submission_gating.run_finished`

Each log should include `run_id`, `stage_name` where applicable, `conference_id`, `submission_id`, `mode`, `source`, `filename`, `duration_ms`, and `verdict` when available.

**Step 2: Run the runner test**

Run: `cd ai-service; .\.venv\Scripts\python -m pytest tests/test_submission_gating_runner.py -q`

Expected: PASS

### Task 3: Verify targeted workflow coverage

**Files:**
- No additional file changes required

**Step 1: Run targeted verification**

Run: `cd ai-service; .\.venv\Scripts\python -m pytest tests/test_submission_gating_runner.py tests/test_submission_gating_routes.py -q`

Expected: PASS

**Step 2: Manual smoke**

Restart `start_win.bat`, trigger a submission precheck, and confirm the ai-service console prints stage-by-stage progress.
