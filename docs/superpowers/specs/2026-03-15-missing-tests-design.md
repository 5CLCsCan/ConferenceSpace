# Missing Tests Design — Backend API & Frontend Unit Tests

**Date:** 2026-03-15
**Branch:** Fix-Hardcode-FE-Issue
**Context:** Two bugs were fixed (GetReview auth bypass, camera-ready status guard). This spec covers adding the full set of missing tests identified in the backend scan report.

---

## Scope

16 backend API test cases across 8 feature areas, plus 2 frontend unit test files.

---

## Backend API Tests

### 1. Camera-ready upload — `backend/tests/api/submission/camera_ready_test.go`

**New test:**
- `TestUploadCameraReady_NonAcceptedStatus` — author uploads to a submission with status `draft` (the default from `setupCameraReadyScenario` — no status transition needed). Must return **403**. Directly verifies the status guard fix.

### 2. Accept/Reject decisions — `backend/tests/api/submission/accept_reject_test.go` (new file)

Setup helper creates: conference → author → submission → chair token + non-chair (author) token.

- `TestAcceptSubmission_NonChairForbidden` — non-chair PATCH status → `accepted` → **403**
- `TestRejectSubmission_NonChairForbidden` — non-chair PATCH status → `rejected` → **403**

Note: No server-side state-machine guard exists (e.g. accepted → draft is permitted by the backend). Invalid transition tests are deferred until that guard is implemented.

Endpoint: `PATCH /api/v1/conferences/{id}/submissions/{id}/status`

### 3. Review form — `backend/tests/api/assignment/review_test.go`

Reuse the existing setup pattern (conference → reviewer → submission → auto-assign).

- `TestGetReview_NonReviewerForbidden` — a second reviewer calls `GET /api/v1/conferences/{id}/assignments/{id}/review` on assignment belonging to reviewer #1 → **403**. Directly verifies the GetReview auth bypass fix.
- `TestSaveReview_AfterSubmitted` — PUT review with `status: "submitted"`, then PUT again → **400** (controller returns `http.StatusBadRequest`: "cannot edit a submitted review")
- `TestSaveReview_ScoreOutOfRange` — PUT review with `review_score: 11` and `status: "submitted"` → **400** (score validation only runs on submit, not draft)

### 4. Discussion threads — `backend/tests/api/discussion/discussion_test.go`

Add to existing file:

- `TestCreateThread_NonReviewerForbidden` — author token creates a discussion thread → **403**
- `TestAddMessage_LargeAttachment` — POST message with a >20 MB attachment body. Expected **400** if server-side limit is enforced; test should log actual status if 200 is returned (documents behavior either way).

### 5. COI declaration — `backend/tests/api/submission/coi_declared_conflicts_test.go`

Add to existing file:

- `TestDeclareConflicts_InvalidEmails` — POST COI declaration with `["not-an-email", "also bad"]` in the emails field → **400**

### 6. Conference template — `backend/tests/api/conference/conference_template_test.go` (new file)

Base path: `/api/v1/conference-config-templates`

Setup: register user A and user B. User A creates a template.

- `TestCreateTemplate_MalformedPayload` — POST with empty body → **400**
- `TestUpdateTemplate_WrongOwner` — user B PUTs user A's template ID → **403 or 404**
- `TestDeleteTemplate_WrongOwner` — user B DELETEs user A's template ID → **403 or 404**

### 7. Reviewer dashboard — `backend/tests/api/reviewer/reviewer_dashboard_test.go` (existing file, add tests)

- `TestReviewerDashboard_OffsetBeyondTotal` — GET dashboard with `offset=9999&limit=10` → **200**, `data` is empty slice (not null)
- `TestReviewerDashboard_LimitZero` — GET dashboard with `limit=0` → **200**, must not error

---

## Frontend Unit Tests

### A. CameraReadySection — `frontend/components/author/submission-detail/__tests__/camera-ready-section.test.tsx` (new file)

The `CameraReadySection` component lives in `overview-tab.tsx` and is only rendered when `submission.status === "accepted"`. The parent (`OverviewTab`) conditionally renders it.

Test cases:
- **Does not render** for `status: "draft"`, `"reviewing"`, `"rejected"` — the camera-ready section heading is absent
- **Renders upload button** when `status: "accepted"` and `camera_ready` is null/undefined
- **Renders file info + replace button** when `status: "accepted"` and `camera_ready` has metadata (name, size)
- **Shows error message** when `submitCameraReady` resolves with `{ error: "Upload failed" }` and user triggers upload

Mocks needed: `@/lib/api/papers` (mock `submitCameraReady`), translation context.

### B. Review API error propagation — `frontend/lib/api/__tests__/papers.test.ts` (existing file, add test)

- `getReview returns 403 error correctly` — mock `apiFetch` to return `{ response: { status: 403 }, data: null }`, assert returned value surfaces the error rather than silently returning null data

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `backend/tests/api/submission/camera_ready_test.go` | Add 1 test |
| `backend/tests/api/submission/accept_reject_test.go` | Create with 2 tests |
| `backend/tests/api/assignment/review_test.go` | Add 3 tests |
| `backend/tests/api/discussion/discussion_test.go` | Add 2 tests |
| `backend/tests/api/submission/coi_declared_conflicts_test.go` | Add 1 test |
| `backend/tests/api/conference/conference_template_test.go` | Create with 3 tests |
| `backend/tests/api/reviewer/reviewer_dashboard_test.go` | Add 2 tests to existing file |
| `frontend/components/author/submission-detail/__tests__/camera-ready-section.test.tsx` | Create with 4 tests |
| `frontend/lib/api/__tests__/papers.test.ts` | Add 1 test |
