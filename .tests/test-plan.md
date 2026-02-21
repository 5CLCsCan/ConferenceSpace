# ConferenceSpace Frontend-v2 E2E Test Script

## 1) Migration Evaluation (Current Snapshot)

### Verdict
- Status: `go-with-risks`
- Reason: high-priority parity items from this iteration are mostly API-backed and verified (`PAR-008`, `PAR-016`, `PAR-018`, `PAR-021` to `PAR-024`, `PAR-032` to `PAR-036`, `PAR-040` to `PAR-043`, `PAR-046`, `PAR-048` to `PAR-052`), but known backend and frontend residuals remain.

### Confirmed blocked/partial scope to keep visible during E2E
- `BR-001`: missing authoritative conference stats endpoint (`/api/v1/conferences/:conference_id/stats`).
- `BR-003`: missing camera-ready upload contract.
- `BR-004`: rebuttal write persistence is unavailable (author/reviewer rebuttal actions must stay disabled/read-only).
- `PAR-015`: reviewer shell still has `MOCK_SUBMISSION` blending.
- `PAR-020`: chair history timeline remains mock-backed.

### E2E objective
- Validate full role workflow behavior in frontend-v2 with real API state where available.
- Confirm blocked items fail safely (disabled controls, explicit user messaging, no fake success).
- Confirm backend state transitions after UI actions through observability scripts.

## 2) Test Scope Matrix

| Domain | Scenario IDs | Must cover |
| --- | --- | --- |
| Shared | `SCN-SH-001..007` | public routes, login/register/logout, role entry/guards, notifications, profile + academic linking |
| Author | `SCN-AU-001..006` | conference discovery, submission list/create/detail, discussion, rebuttal read-only behavior |
| Reviewer | `SCN-RV-001..005` | dashboard/completed/assignment detail, review save, discussion, rebuttal blocked writes |
| Chair | `SCN-CH-001..007` | chair dashboard, conference creation/detail tabs, COI tab, submission decision |
| Cross-cutting | `SCN-CR-001..005` | test harness pages/routes, chatbot transport, regression gate (`lint/tsc/build` already passed) |

## 3) Preconditions

- Backend is running (default assumed: `http://localhost:8080`).
- Frontend-v2 is running (example: `http://localhost:3000`).
- `test-login` is enabled in backend environment.
- Python 3.10+ installed.
- Install script dependencies:

```bash
python -m pip install -r .tests/requirements.txt
```

## 4) Seed + Upload Operations (API-side)

Run this before UI testing. It creates a conference, invites reviewer, uploads submission (multipart), publishes it, moves conference to reviewing, seeds discussion and draft review.

```bash
python .tests/upload_mock_data.py \
  --base-url http://localhost:8080 \
  --output .tests/artifacts/e2e_seed_state.json \
  --prefix migration-e2e
```

Expected artifacts:
- `.tests/artifacts/e2e_seed_state.json`
- `.tests/artifacts/uploads/seed_submission.pdf`

Use IDs/URLs from the state file during UI checks.

## 5) Detailed Agent Script (UI-first)

Set runtime variables in the test agent:
- `FRONTEND_BASE_URL` (example `http://localhost:3000`)
- `STATE_FILE` = `.tests/artifacts/e2e_seed_state.json`
- `UPLOAD_FILE` = `.tests/artifacts/uploads/seed_submission.pdf`

### Phase A: Shared flows (`SCN-SH-*`)

- [ ] `SH-01` Open `${FRONTEND_BASE_URL}/` and verify landing renders without layout breakpoints on desktop and mobile.
- [ ] `SH-02` Navigate to `/login`, validate form rendering, and perform test login through `/test/profile-link` (or direct login UI if credentials available).
- [ ] `SH-03` Verify authenticated redirect to `/role` and no role guard leakage (cannot stay on public-only pages unexpectedly).
- [ ] `SH-04` From header notifications bell, open notification list panel and confirm list loads without mock placeholders.
- [ ] `SH-05` In `/notifications`, execute `mark read` on one item and `mark all as read`; ensure unread badge updates.
- [ ] `SH-06` Open `/profile/me`, edit first/last name and domain list, save, refresh, and confirm persisted values remain.
- [ ] `SH-07` In profile page, open academic profile onboarding modal, search author, select result, confirm link, and verify publication cards appear if backend sync exists.
- [ ] `SH-08` Unlink academic profile and verify UI returns to unlinked state (if linked in previous step).

### Phase B: Author flows (`SCN-AU-*`)

- [ ] `AU-01` Open `/role/author` and verify conference cards/lists render from API data.
- [ ] `AU-02` Open `/role/author/submissions` and verify seeded submission appears with expected status.
- [ ] `AU-03` Create a new submission via `/role/author/submissions/new`:
- [ ] `AU-03.1` Fill metadata fields.
- [ ] `AU-03.2` Upload `${UPLOAD_FILE}` through UI file input.
- [ ] `AU-03.3` Submit and confirm redirection + created row visibility in submission list.
- [ ] `AU-04` Open seeded submission detail route from state file (`author_submission_discussion` URL).
- [ ] `AU-05` In `Overview` tab, verify download links/buttons render correctly for available paper assets.
- [ ] `AU-06` In `Discussion` tab, verify existing thread loads; post one new author message; refresh and confirm message persists.
- [ ] `AU-07` In `Rebuttal` tab, verify write actions are disabled and explanatory backend-blocked message is visible (`BR-004` expected).
- [ ] `AU-08` Open `/role/author/conferences/{conferenceId}` and verify submission state CTA matches real ownership status.

### Phase C: Reviewer flows (`SCN-RV-*`)

- [ ] `RV-01` Open `/role/reviewer` and verify dashboard metrics/cards load.
- [ ] `RV-02` Open `/role/reviewer/completed` and verify list rendering and empty-state behavior are stable.
- [ ] `RV-03` Open reviewer assignment detail from state file (`reviewer_assignment_discussion` URL).
- [ ] `RV-04` In `Review` tab, edit review fields, save draft/update, refresh page, confirm saved values reload.
- [ ] `RV-05` In `Discussion` tab, create one reviewer thread (if allowed) or message, refresh, verify persistence.
- [ ] `RV-06` In `Rebuttal` tab, verify acknowledgement/write controls are disabled with explicit `BR-004` messaging.
- [ ] `RV-07` Use profile links in reviewer surfaces (author/reviewer identities) and confirm navigation to `/profile/[user_id]`.

### Phase D: Chair flows (`SCN-CH-*`)

- [ ] `CH-01` Open `/role/chair` and verify dashboard renders; analytics fallback messaging is explicit where backend stats are unavailable (`BR-001`).
- [ ] `CH-02` Create a conference via `/role/chair/conferences/new` and confirm successful creation redirect.
- [ ] `CH-03` Open seeded conference detail `/role/chair/conferences/{conferenceId}`.
- [ ] `CH-03.1` Check Overview/Dashboard tabs for data load and no obvious layout or hydration faults.
- [ ] `CH-03.2` Check CFP, Dates, Committee tabs for API-backed values and save operations (where enabled).
- [ ] `CH-03.3` Check COI tab calls and data rendering from `/api/v1/coi/*`; verify unsupported moderation actions remain explicitly disabled if shown.
- [ ] `CH-03.4` Check Submissions tab lists seeded submission.
- [ ] `CH-04` Open chair submission detail `/role/chair/conferences/{conferenceId}/submissions/{submissionId}`.
- [ ] `CH-04.1` Verify review summary and discussion tabs load.
- [ ] `CH-04.2` In discussion tab, confirm thread/message visibility (chair read/moderation behavior only, no invalid write affordance).
- [ ] `CH-04.3` In review decision tab, set decision to `accepted` or `rejected`, save, refresh, confirm persisted status.
- [ ] `CH-04.4` Attempt `Minor Revision` / `Major Revision` decision; confirm disabled state with explicit reason text.
- [ ] `CH-05` In history tab, verify known mock-backed behavior is visible as risk (`PAR-020`) and does not block critical decision flow.

### Phase E: Cross-cutting flows (`SCN-CR-*`)

- [ ] `CR-01` Open `/test/discussion?author=true`; confirm redirect to author submission discussion with `conferenceId` and `tab=discussion`.
- [ ] `CR-02` Open `/test/discussion?reviewer=true`; confirm redirect to reviewer assignment discussion with `conferenceId` and `tab=discussion`.
- [ ] `CR-03` Open `/test/profile-link`; confirm redirect/login to `/profile/me` with test profile account.
- [ ] `CR-04` Trigger chatbot UI flow where available; verify network call uses `/api/chat` and receives response without transport errors.
- [ ] `CR-05` Perform one full smoke pass across role switches (`/role`) to confirm session continuity and route-guard correctness.

## 6) Post-UI Observability Checks

Run full report:

```bash
python .tests/observability.py report \
  --base-url http://localhost:8080 \
  --state-file .tests/artifacts/e2e_seed_state.json \
  --output .tests/artifacts/e2e_observability_report.json \
  --strict
```

Expected outcome:
- All `OBS-*` checks pass, except failures tied to known blockers or intentionally unimplemented behavior.

Useful ad-hoc queries:

```bash
# Chair: check conference
python .tests/observability.py query \
  --role chair \
  --path /api/v1/conferences/<conference_id>

# Reviewer: inspect assignment review
python .tests/observability.py query \
  --role reviewer \
  --path /api/v1/conferences/<conference_id>/assignments/<assignment_id>/review

# Author: list notifications
python .tests/observability.py query \
  --role author \
  --path /api/v1/notifications \
  --param limit=10
```

## 7) Final Checklist for Sign-off

- [ ] Seed script ran successfully and produced state artifact.
- [ ] All Shared scenarios completed.
- [ ] All Author scenarios completed.
- [ ] All Reviewer scenarios completed.
- [ ] All Chair scenarios completed.
- [ ] All Cross-cutting scenarios completed.
- [ ] Observability report generated and attached.
- [ ] Failures are mapped to either new defects or known blockers (`BR-001`, `BR-003`, `BR-004`, `PAR-015`, `PAR-020`).
- [ ] Final decision recorded: `go` / `go-with-risks` / `no-go`.
