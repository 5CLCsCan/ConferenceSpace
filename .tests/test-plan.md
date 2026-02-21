# ConferenceSpace Frontend-v2 E2E Test Script

## 1) Objective

Run end-to-end UI + API validation across shared, author, reviewer, chair, and cross-cutting flows with deterministic auth and repeatable data lifecycle.

## 2) Preconditions

- Backend running at `http://localhost:8080` (or your target URL).
- Frontend-v2 running (example: `http://localhost:3000`).
- Backend test-login enabled.
- Python 3.10+.

Install tooling dependencies:

```bash
python -m pip install -r .tests/requirements.txt
```

## 3) Fresh Data Lifecycle (Mandatory)

Before each E2E cycle, run cleanup + reseed:

```bash
python .tests/manage_test_data.py reseed \
  --base-url http://localhost:8080 \
  --state-file .tests/artifacts/e2e_seed_state.json \
  --prefix migration-e2e
```

Available lifecycle commands:

```bash
# Cleanup only (idempotent; 404 treated as already-cleaned)
python .tests/manage_test_data.py cleanup \
  --base-url http://localhost:8080 \
  --state-file .tests/artifacts/e2e_seed_state.json \
  --prefix migration-e2e
```

Artifacts:
- `.tests/artifacts/e2e_seed_state.json`
- `.tests/artifacts/e2e_cleanup_report.json`
- `.tests/artifacts/uploads/seed_submission.pdf`

## 4) Deterministic Test Login Routes

Use these routes for role setup:

- `/test/login?role=author`
- `/test/login?role=reviewer`
- `/test/login?role=chair`
- `/test/login?role=profile&redirect=%2Fprofile%2Fme`

Supported params:
- `role=author|reviewer|chair|profile`
- optional `redirect=<url-encoded-relative-path>`

## 5) Full UI Test Checklist

Set test-agent vars:
- `FRONTEND_BASE_URL` (for example `http://localhost:3000`)
- `STATE_FILE=.tests/artifacts/e2e_seed_state.json`
- `UPLOAD_FILE=.tests/artifacts/uploads/seed_submission.pdf`

### Phase A: Shared (`SCN-SH-*`)

- [ ] Open landing `/` and `/login`; verify load/hydration is stable on desktop/mobile.
- [ ] Login through `/test/login?role=profile&redirect=%2Fprofile%2Fme`.
- [ ] In `/profile/me`, edit first/last name, save, refresh, verify persistence.
- [ ] In profile onboarding modal, link Semantic Scholar profile, verify publication rendering.
- [ ] Unlink academic profile and verify state returns to unlinked.
- [ ] Open `/notifications`, verify list loads from API and `mark read` / `mark all` updates unread state.

### Phase B: Author (`SCN-AU-*`)

- [ ] Login via `/test/login?role=author`.
- [ ] Open `/role/author`, verify conference data loads.
- [ ] Open `/role/author/submissions`, verify seeded submission visibility.
- [ ] Open non-open conference detail (`frontend_urls.conference_detail_author`) and verify submit CTA is blocked with explicit reason.
- [ ] Open open-conference create route (`frontend_urls.author_new_submission_open`) and submit a new paper using `UPLOAD_FILE`.
- [ ] Verify successful redirect and new row appears in submissions list.
- [ ] Open seeded submission discussion route (`frontend_urls.author_submission_discussion`) and post one message; refresh to verify persistence.
- [ ] Open rebuttal tab and verify write actions remain explicitly disabled (`BR-004`).

### Phase C: Reviewer (`SCN-RV-*`)

- [ ] Login via `/test/login?role=reviewer`.
- [ ] Open `/role/reviewer` and `/role/reviewer/completed`; verify stable list/empty states.
- [ ] Open `frontend_urls.reviewer_assignment_discussion`, switch to `review` tab.
- [ ] Verify no runtime crash in review tab.
- [ ] Edit scoring/feedback, save draft, refresh, verify persisted reload.
- [ ] Submit review (optional in this run), verify no client-side crash.
- [ ] Open discussion tab, post thread/message, refresh and verify persistence.
- [ ] Open rebuttal tab and verify write controls remain disabled with backend-blocked explanation.

### Phase D: Chair (`SCN-CH-*`)

- [ ] Login via `/test/login?role=chair`.
- [ ] Open `/role/chair`; verify dashboard and fallback messaging for unavailable stats (`BR-001`).
- [ ] Open seeded conference detail (`frontend_urls.conference_detail_chair`) and verify overview/cfp/dates/committee/submissions tabs.
- [ ] Open seeded submission detail (`frontend_urls.chair_submission_detail`).
- [ ] Verify review summary + discussion tabs load from API.
- [ ] In history tab, verify API-derived timeline events render (no static mock timeline dependency).
- [ ] In decision tab, verify supported statuses (`accepted`/`rejected`) persist and reload.
- [ ] Verify unsupported revision decisions are disabled with explicit reason.

### Phase E: Cross-Cutting (`SCN-CR-*`)

- [ ] Open `/test/discussion?author=true`; verify seeded redirect includes `conferenceId` and `tab=discussion`.
- [ ] Open `/test/discussion?reviewer=true`; verify seeded redirect includes `conferenceId` and `tab=discussion`.
- [ ] Open `/test/profile-link`; verify it routes through deterministic test login to `/profile/me`.
- [ ] Verify chatbot transport (where available) calls `/api/chat`.
- [ ] Switch roles through `/role` and confirm session + guard behavior remains consistent.

## 6) Post-UI Observability (Backend State Assertions)

Run strict observability report:

```bash
python .tests/observability.py report \
  --base-url http://localhost:8080 \
  --state-file .tests/artifacts/e2e_seed_state.json \
  --output .tests/artifacts/e2e_observability_report.json \
  --strict
```

Optional ad-hoc checks:

```bash
python .tests/observability.py query --role chair --path /api/v1/conferences/<conference_id>
python .tests/observability.py query --role reviewer --path /api/v1/conferences/<conference_id>/assignments/<assignment_id>/review
python .tests/observability.py query --role author --path /api/v1/notifications --param limit=10
```

## 7) Sign-off Checklist

- [ ] Cleanup + reseed executed before UI run.
- [ ] All shared flows completed.
- [ ] All author flows completed.
- [ ] All reviewer flows completed.
- [ ] All chair flows completed.
- [ ] All cross-cutting flows completed.
- [ ] Observability strict report passed.
- [ ] Any failures mapped to explicit defects or known backend blockers (`BR-001`, `BR-003`, `BR-004`).
