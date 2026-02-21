# ConferenceSpace Focused Retest Plan (Post Trace-Debug-Fix)

Use this focused script for high-volatility areas only. It excludes stable checks that already passed and are unlikely to regress from this cycle.

## 1) Fresh Session Prep (Cleanup + Reseed)

Run this before every focused rerun:

```bash
python .tests/manage_test_data.py reseed \
  --base-url http://localhost:8080 \
  --state-file .tests/artifacts/e2e_seed_state.json \
  --prefix focused-rerun
```

Then validate backend state:

```bash
python .tests/observability.py report \
  --base-url http://localhost:8080 \
  --state-file .tests/artifacts/e2e_seed_state.json \
  --output .tests/artifacts/e2e_observability_report.json \
  --strict
```

## 2) Keep (Must Rerun)

1. `RV-P0-CRASH` Reviewer assignment `review` tab must render without client crash.
2. `RV-P0-SAVE` Reviewer review draft/submit must persist and reload.
3. `AU-P1-STATE-GATE` Author new submission entry must be blocked for non-open conferences with explicit reason.
4. `AU-P1-CREATE` Author new submission must succeed on seeded open conference.
5. `CH-P1-HISTORY` Chair history tab must show API-derived events (not static mock timeline).
6. `CH-P1-AUTH` Chair access must use deterministic `/test/login` route.
7. `BR-GUARDS` Backend-blocked capabilities remain explicitly guarded (no false success):
   - rebuttal writes disabled (`BR-004`)
   - chair advanced analytics fallback messaging visible (`BR-001`)
   - camera-ready persistence not presented as complete (`BR-003`)

## 3) Remove For Now (Stable)

1. Public landing/register shell checks.
2. Basic profile edit persistence checks.
3. Semantic Scholar link/unlink happy path checks.
4. Discussion happy-path checks across all roles.
5. General conference list rendering checks.
6. Chatbot transport smoke checks.

## 4) Detailed Execution Steps

### A. Deterministic Role Login Checks

- [ ] `AUTH-01` Open `/test/login?role=chair`; expect redirect to `/role/chair` with no credential prompt.
- [ ] `AUTH-02` Open `/test/login?role=reviewer`; expect redirect to `/role/reviewer`.
- [ ] `AUTH-03` Open `/test/login?role=author`; expect redirect to `/role/author`.
- [ ] `AUTH-04` Open `/test/login?role=profile&redirect=%2Fprofile%2Fme`; expect redirect to `/profile/me`.

### B. Reviewer Crash + Persistence (`RV-P0-CRASH`, `RV-P0-SAVE`)

- [ ] `RV-01` Read `reviewer_assignment_discussion` from state JSON and open that URL.
- [ ] `RV-02` Switch to `review` tab (`tab=review` if needed).
- [ ] `RV-03` Confirm page does not crash and scoring widgets render.
- [ ] `RV-04` Change criteria values, summary/strengths/weaknesses, save draft.
- [ ] `RV-05` Refresh page and confirm saved values reload.
- [ ] `RV-06` Optionally submit review and verify no client-side exception.

### C. Author Submission State Gating (`AU-P1-STATE-GATE`)

- [ ] `AU-01` Login author via `/test/login?role=author`.
- [ ] `AU-02` Open non-open conference from `conference_detail_author` in state.
- [ ] `AU-03` Verify `Submit Paper` entry is disabled with explicit closed-state message.
- [ ] `AU-04` Attempt direct route to non-open submission page:
  `/role/author/submissions/new?conferenceId=<conference_id>`.
- [ ] `AU-05` Verify blocked panel explains only `open` conferences accept new submissions.

### D. Author Create on Open Conference (`AU-P1-CREATE`)

- [ ] `AU-06` Open `author_new_submission_open` from state.
- [ ] `AU-07` Fill required metadata and upload `.tests/artifacts/uploads/seed_submission.pdf`.
- [ ] `AU-08` Submit and verify no `403` error.
- [ ] `AU-09` Confirm newly created item appears in `/role/author/submissions`.

### E. Chair History API Timeline (`CH-P1-HISTORY`)

- [ ] `CH-01` Login chair via `/test/login?role=chair`.
- [ ] `CH-02` Open `chair_submission_detail` from state.
- [ ] `CH-03` Switch to history tab (`tab=history` if needed).
- [ ] `CH-04` Verify entries reference real events (submission/review/discussion activity), not static mock text.
- [ ] `CH-05` Verify empty-state only appears when no activity exists.

### F. Blocker Guard Regression (`BR-GUARDS`)

- [ ] `BR-01` Author or reviewer rebuttal tab still read-only with explicit backend-missing explanation.
- [ ] `BR-02` Chair dashboard/detail still shows explicit analytics fallback messaging for missing stats contract.
- [ ] `BR-03` Camera-ready flow does not claim persisted success without backend support.

## 5) Pass Criteria

1. Reviewer `review` tab has no runtime crash.
2. Deterministic `/test/login` works for all roles.
3. Non-open submission path fails safely in UI.
4. Open conference submission path succeeds.
5. Chair history tab is API-derived.
6. Blocked backend contracts remain explicitly guarded.
