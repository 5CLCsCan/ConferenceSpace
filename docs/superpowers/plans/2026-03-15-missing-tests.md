# Missing Tests Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 16 backend API test cases and 2 frontend unit test files covering every gap identified in the backend scan report.

**Architecture:** All backend tests use the existing real-HTTP integration test harness (`testutils.TestContext`). Frontend tests use Vitest + React Testing Library, co-located in `__tests__/` directories next to the component/module under test.

**Tech Stack:** Go 1.24 (backend tests), Vitest + React Testing Library (frontend tests), Next.js 15 + TypeScript (frontend)

---

## Chunk 1: Camera-Ready, Accept/Reject, Review Form

### Task 1: Camera-ready upload on non-accepted status

**Files:**
- Modify: `backend/tests/api/submission/camera_ready_test.go`

- [ ] **Step 1: Add the test function**

Append to the end of `camera_ready_test.go`:

```go
// TestUploadCameraReady_NonAcceptedStatus verifies that uploading to a draft
// submission (not yet accepted) is rejected with 403.
// This tests the status guard added to UploadCameraReady().
func TestUploadCameraReady_NonAcceptedStatus(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// setupCameraReadyScenario creates a submission with Status=draft — no status transition needed.
	_, authorToken, conferenceID, submissionID := setupCameraReadyScenario(t, ctx)

	pdfContent := readTestPDF()
	resp, err := uploadCameraReady(ctx, conferenceID, submissionID, pdfContent, authorToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Expected 403, got %d. Body: %s", resp.StatusCode, string(body))
	}
}
```

- [ ] **Step 2: Run the test to verify it passes**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/submission/... -run TestUploadCameraReady_NonAcceptedStatus -v
```

Expected: `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/submission/camera_ready_test.go
git commit -m "test: camera-ready upload rejected for non-accepted submission"
```

---

### Task 2: Accept/Reject decisions — non-chair forbidden

**Files:**
- Create: `backend/tests/api/submission/accept_reject_test.go`

- [ ] **Step 1: Create the test file**

```go
package submission

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// setupAcceptRejectScenario creates a conference, author submission, and returns
// a chair token and a non-chair (author) token with the relevant IDs.
func setupAcceptRejectScenario(t *testing.T, ctx *testutils.TestContext) (
	chairToken, authorToken string,
	conferenceID, submissionID int64,
) {
	t.Helper()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Accept Reject Test Conference",
		Acronym: testutils.UniqueString("ARTC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID = createdConf.ID

	submissionClient := NewClient(ctx)
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper for Accept/Reject",
		Abstract:     "Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	createdSub, err := submissionClient.CreateSuccess(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID = createdSub.ID
	return
}

// TestAcceptSubmission_NonChairForbidden verifies that a non-chair user cannot
// set a submission status to "accepted".
func TestAcceptSubmission_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupAcceptRejectScenario(t, ctx)

	resp, err := ctx.MakeRequest("PATCH",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID),
		map[string]interface{}{"status": "accepted"},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestRejectSubmission_NonChairForbidden verifies that a non-chair user cannot
// set a submission status to "rejected".
func TestRejectSubmission_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupAcceptRejectScenario(t, ctx)

	resp, err := ctx.MakeRequest("PATCH",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID),
		map[string]interface{}{"status": "rejected"},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/submission/... -run "TestAcceptSubmission_NonChairForbidden|TestRejectSubmission_NonChairForbidden" -v
```

Expected: both `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/submission/accept_reject_test.go
git commit -m "test: non-chair cannot accept/reject submissions"
```

---

### Task 3: Review form — auth bypass, edit-after-submit, score out of range

**Files:**
- Modify: `backend/tests/api/assignment/review_test.go`

The new tests share the same lengthy setup as `TestSaveReviewAsDraft`. Extract it into a helper first, then add 3 new test functions.

- [ ] **Step 1: Add setup helper and 3 tests**

Append the following to `review_test.go` (after the closing brace of `TestSaveReviewAsDraft`):

```go
// setupReviewingScenario creates a full reviewing scenario and returns the
// assignment ID, conference ID, and all relevant tokens for use in review tests.
// reviewerToken is the token for the reviewer who owns the assignment.
// authorToken can be used as a "non-reviewer" token for auth tests.
func setupReviewingScenario(t *testing.T, ctx *testutils.TestContext) (
	assignmentID, conferenceID int64,
	chairToken, reviewerToken, authorToken string,
) {
	t.Helper()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	reviewerToken, reviewer, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Review Test Conference",
		Acronym: testutils.UniqueString("RTC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID = createdConf.ID

	addReviewerResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI"}},
		},
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	var reviewerData struct {
		Data struct {
			Success []dto.Reviewer `json:"success"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &reviewerData)
	reviewerRecordID := reviewerData.Data.Success[0].ID

	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), map[string]interface{}{
		"status": "accepted",
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer: %v", err)
	}

	submissionClient := submissionTestClient.NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Abstract for test paper about artificial intelligence",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information:  &dto.SubmissionInformation{Keywords: []string{"AI"}},
	}
	_, err = submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	transitionReq := dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusReviewing,
	}
	transitionResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID), transitionReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to transition status: %v", err)
	}
	testutils.AssertStatusCode(t, transitionResp, http.StatusOK)

	confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	papersResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer.Email, conferenceID), nil, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get reviewer's papers: %v", err)
	}
	testutils.AssertStatusCode(t, papersResp, http.StatusOK)

	var papersData struct {
		Data struct {
			Papers []*dto.AssignedPaperResponse `json:"papers"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, papersResp, &papersData)
	if len(papersData.Data.Papers) == 0 {
		t.Fatalf("No assignments created — check domains match")
	}
	assignmentID = papersData.Data.Papers[0].AssignmentID
	return
}

// TestGetReview_NonReviewerForbidden verifies that a user who is not the assigned
// reviewer cannot retrieve that assignment's review (tests the auth bypass fix).
func TestGetReview_NonReviewerForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	assignmentID, conferenceID, _, _, authorToken := setupReviewingScenario(t, ctx)

	// Author (not the assigned reviewer) attempts to GET the review.
	resp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID),
		nil, authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestSaveReview_AfterSubmitted verifies that once a review is submitted,
// a subsequent PUT returns 400 ("cannot edit a submitted review").
func TestSaveReview_AfterSubmitted(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	assignmentID, conferenceID, _, reviewerToken, _ := setupReviewingScenario(t, ctx)

	score := float64(8)
	reviewReq := dto.ReviewSaveRequest{
		AssignmentID: assignmentID,
		ConferenceID: conferenceID,
		ReviewScore:  &score,
		ReviewData: &dto.ReviewData{
			Criteria: dto.ReviewCriteria{
				Originality: 8, TechnicalQuality: 7, Clarity: 8, Significance: 7, Methodology: 7,
			},
			Feedback:       dto.ReviewFeedback{Summary: "Good paper", Strengths: "Clear writing"},
			Recommendation: "accept",
			Confidence:     "high",
		},
		Status: model.ReviewStatusSubmitted,
	}

	// First submit — must succeed.
	resp1, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID),
		reviewReq, reviewerToken,
	)
	if err != nil {
		t.Fatalf("First PUT failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp1, http.StatusOK)

	// Second PUT on already-submitted review — must return 400.
	resp2, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID),
		reviewReq, reviewerToken,
	)
	if err != nil {
		t.Fatalf("Second PUT failed: %v", err)
	}
	if resp2.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d", resp2.StatusCode)
	}
}

// TestSaveReview_ScoreOutOfRange verifies that submitting a review with a score
// greater than 10 returns 400. The check only fires when status = "submitted".
func TestSaveReview_ScoreOutOfRange(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	assignmentID, conferenceID, _, reviewerToken, _ := setupReviewingScenario(t, ctx)

	outOfRangeScore := float64(11)
	reviewReq := dto.ReviewSaveRequest{
		AssignmentID: assignmentID,
		ConferenceID: conferenceID,
		ReviewScore:  &outOfRangeScore,
		ReviewData: &dto.ReviewData{
			Criteria: dto.ReviewCriteria{
				Originality: 8, TechnicalQuality: 7, Clarity: 8, Significance: 7, Methodology: 7,
			},
			Feedback:       dto.ReviewFeedback{Summary: "Good", Strengths: "Nice"},
			Recommendation: "accept",
			Confidence:     "high",
		},
		Status: model.ReviewStatusSubmitted, // Score validation only runs on submit.
	}

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID),
		reviewReq, reviewerToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d", resp.StatusCode)
	}
}
```

> **Note:** `setupReviewingScenario` registers one reviewer who gets the assignment. The `authorToken` is used as a "non-owner" caller in `TestGetReview_NonReviewerForbidden`. If auto-assign doesn't produce an assignment, verify the reviewer's domain matches the submission's domain (`"AI"` in both).

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/assignment/... -run "TestGetReview_NonReviewerForbidden|TestSaveReview_AfterSubmitted|TestSaveReview_ScoreOutOfRange" -v
```

Expected: all 3 `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/assignment/review_test.go
git commit -m "test: review auth bypass, edit-after-submitted, score out of range"
```

---

## Chunk 2: Discussion, COI, Conference Template, Reviewer Dashboard

### Task 4: Discussion threads — non-reviewer forbidden, large attachment

**Files:**
- Modify: `backend/tests/api/discussion/discussion_test.go`

- [ ] **Step 1: Add 2 test functions**

Append after the last test in `discussion_test.go`. Reuse `setupReviewingConference` which is already defined in that file.

```go
// TestCreateThread_NonReviewerForbidden_Standalone is a standalone top-level test
// that verifies an author cannot create a discussion thread.
// Note: the existing TestCreateThread sub-test already covers this case; this
// function ensures it's also visible as a named top-level test.
func TestCreateThread_NonReviewerForbidden_Standalone(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, _, _, authorToken, _, _, _ := setupReviewingConference(t, ctx)

	resp, err := ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/threads", conferenceID, submissionID),
		map[string]interface{}{"title": "My Thread", "content": "Hello"},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestAddMessage_LargeAttachment verifies that posting a message with an
// attachment exceeding the server's size limit is rejected.
// The server enforces a 20 MB limit. If the limit is not enforced at the HTTP
// layer this test logs the actual status code for documentation purposes.
func TestAddMessage_LargeAttachment(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceID, submissionID, _, reviewerToken, _, _, reviewerEmail, _ := setupReviewingConference(t, ctx)

	// First, create a thread as the reviewer.
	createResp, err := ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/threads", conferenceID, submissionID),
		map[string]interface{}{"title": "Large Attach Thread", "content": "Thread body"},
		reviewerToken,
	)
	if err != nil {
		t.Fatalf("Create thread failed: %v", err)
	}
	if createResp.StatusCode != http.StatusCreated && createResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200/201 creating thread, got %d", createResp.StatusCode)
	}
	var threadData struct {
		Data struct {
			ID int64 `json:"id"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &threadData)
	threadID := threadData.Data.ID

	_ = reviewerEmail

	// Build a >20 MB multipart body.
	largeContent := make([]byte, 21*1024*1024) // 21 MB
	for i := range largeContent {
		largeContent[i] = 'A'
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	_ = writer.WriteField("content", "Message with large attachment")
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", `form-data; name="attachment"; filename="large.pdf"`)
	h.Set("Content-Type", "application/pdf")
	part, _ := writer.CreatePart(h)
	_, _ = io.Copy(part, bytes.NewReader(largeContent))
	writer.Close()

	req, _ := http.NewRequest("POST",
		ctx.BaseURL+fmt.Sprintf("/api/v1/threads/%d/messages", threadID),
		&body,
	)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+reviewerToken)

	resp, err := ctx.Client.Do(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	// Document observed behavior. Expect 400 if server enforces the 20 MB limit.
	t.Logf("Large attachment response status: %d", resp.StatusCode)
	if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusRequestEntityTooLarge {
		t.Errorf("Expected 400 or 413 for >20 MB attachment, got %d", resp.StatusCode)
	}
}
```

Add missing imports to the `discussion_test.go` import block:
```go
import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"testing"
	// existing imports ...
)
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/discussion/... -run "TestCreateThread_NonReviewerForbidden_Standalone|TestAddMessage_LargeAttachment" -v
```

Expected: both `PASS` (large attachment test may log a status code with a note if limit isn't enforced)

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/discussion/discussion_test.go
git commit -m "test: non-reviewer thread creation forbidden, large attachment limit"
```

---

### Task 5: COI declaration — invalid emails

**Files:**
- Modify: `backend/tests/api/submission/coi_declared_conflicts_test.go`

- [ ] **Step 1: Add the test**

Read the existing file to find the correct endpoint and DTO shape, then append:

```go
// TestDeclareConflicts_InvalidEmails verifies that a COI declaration containing
// malformed email addresses is rejected with 400.
func TestDeclareConflicts_InvalidEmails(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conf := &dto.Conference{
		Title:   "COI Invalid Email Test",
		Acronym: testutils.UniqueString("CIET"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create submission including malformed emails in DeclaredConflicts.
	// declared_conflicts lives inside submission.information — mirroring the pattern
	// in the existing TestCreateSubmissionWithDeclaredConflicts test.
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "COI Test Paper",
		Abstract:     "Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			DeclaredConflicts: []dto.ConflictDeclaration{
				{Email: "not-an-email", Reason: "conflict"},
				{Email: "also bad@@@@", Reason: "conflict"},
			},
		},
	}
	resp, err := submissionClient.Create(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	// If the backend validates email format in DeclaredConflicts, it returns 400.
	// A 201 here documents that email validation is missing and should be added.
	if resp.StatusCode != http.StatusBadRequest {
		t.Logf("NOTE: Backend accepted invalid emails in declared_conflicts (status %d). "+
			"Email format validation is missing.", resp.StatusCode)
		t.Fatalf("Expected 400 for invalid emails, got %d", resp.StatusCode)
	}
}
```

- [ ] **Step 2: Run the test**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/submission/... -run TestDeclareConflicts_InvalidEmails -v
```

Expected: `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/submission/coi_declared_conflicts_test.go
git commit -m "test: COI declaration rejects malformed email addresses"
```

---

### Task 6: Conference template — wrong owner, malformed payload

**Files:**
- Create: `backend/tests/api/conference/conference_template_test.go`

- [ ] **Step 1: Create the test file**

```go
package conference

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// createTemplate is a helper that POSTs a new template and returns its ID.
func createTemplate(t *testing.T, ctx *testutils.TestContext, token string) int64 {
	t.Helper()

	payload := &dto.ConferenceConfigTemplatePayload{}
	body := map[string]interface{}{
		"template": map[string]interface{}{
			"name":    testutils.UniqueString("tmpl"),
			"payload": payload,
		},
	}
	resp, err := ctx.MakeRequest("POST", "/api/v1/conference-config-templates", body, token)
	if err != nil {
		t.Fatalf("createTemplate: request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusCreated)

	var data struct {
		Data *dto.ConferenceConfigTemplateResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &data)
	if data.Data == nil {
		t.Fatal("createTemplate: response data is nil")
	}
	return data.Data.ID
}

// TestCreateTemplate_MalformedPayload verifies that a POST with a missing
// template body field returns 400.
func TestCreateTemplate_MalformedPayload(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	userToken, _, _ := ctx.RegisterUniqueUser("user", "password123", "User", "One", []string{"AI"})

	// Send an empty body — "template" field is missing.
	resp, err := ctx.MakeRequest("POST", "/api/v1/conference-config-templates", map[string]interface{}{}, userToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400 for missing template field, got %d", resp.StatusCode)
	}
}

// TestUpdateTemplate_WrongOwner verifies that user B cannot update a template
// created by user A. The storage filters by owner email, so a mismatch returns 404.
func TestUpdateTemplate_WrongOwner(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	userAToken, _, _ := ctx.RegisterUniqueUser("userA", "password123", "User", "A", []string{"AI"})
	userBToken, _, _ := ctx.RegisterUniqueUser("userB", "password123", "User", "B", []string{"AI"})

	templateID := createTemplate(t, ctx, userAToken)

	payload := &dto.ConferenceConfigTemplatePayload{}
	updateBody := map[string]interface{}{
		"template": map[string]interface{}{
			"name":    "Modified by B",
			"payload": payload,
		},
	}
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conference-config-templates/%d", templateID),
		updateBody, userBToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	// Storage filters by (id, userEmail) — mismatch returns "not found" → 404.
	if resp.StatusCode != http.StatusNotFound && resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 404 or 403, got %d", resp.StatusCode)
	}
}

// TestDeleteTemplate_WrongOwner verifies that user B cannot delete a template
// created by user A.
func TestDeleteTemplate_WrongOwner(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	userAToken, _, _ := ctx.RegisterUniqueUser("userA", "password123", "User", "A", []string{"AI"})
	userBToken, _, _ := ctx.RegisterUniqueUser("userB", "password123", "User", "B", []string{"AI"})

	templateID := createTemplate(t, ctx, userAToken)

	resp, err := ctx.MakeRequest("DELETE",
		fmt.Sprintf("/api/v1/conference-config-templates/%d", templateID),
		nil, userBToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusNotFound && resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 404 or 403, got %d", resp.StatusCode)
	}

	// Verify template still exists (user A can still fetch it).
	listResp, err := ctx.MakeRequest("GET", "/api/v1/conference-config-templates", nil, userAToken)
	if err != nil {
		t.Fatalf("List request failed: %v", err)
	}
	testutils.AssertStatusCode(t, listResp, http.StatusOK)

	var listData struct {
		Data *dto.ConferenceConfigTemplateListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listResp, &listData)

	found := false
	for _, tmpl := range listData.Data.Templates {
		if tmpl.ID == templateID {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Template %d should still exist after failed delete by wrong owner", templateID)
	}
}

// Ensure json import is used (for any future JSON marshaling needs).
var _ = json.Marshal
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/conference/... -run "TestCreateTemplate_MalformedPayload|TestUpdateTemplate_WrongOwner|TestDeleteTemplate_WrongOwner" -v
```

Expected: all 3 `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/conference/conference_template_test.go
git commit -m "test: template ownership enforcement and malformed payload validation"
```

---

### Task 7: Reviewer dashboard — offset beyond total, limit=0

**Files:**
- Modify: `backend/tests/api/reviewer/reviewer_dashboard_test.go`

- [ ] **Step 1: Append 2 tests at the end of the file**

```go
// TestReviewerDashboard_OffsetBeyondTotal verifies that requesting a page far
// beyond the total result count returns 200 with empty (non-nil) slices.
func TestReviewerDashboard_OffsetBeyondTotal(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	reviewerClient := NewClient(ctx)
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	params := &DashboardParams{
		ConferenceOffset: 9999,
		ConferenceLimit:  10,
		InvitationOffset: 9999,
		InvitationLimit:  10,
	}
	resp, err := reviewerClient.GetDashboard(reviewer.Email, params, reviewerToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var data struct {
		Data *dto.ReviewerDashboardResponseWithPagination `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &data)

	if data.Data == nil {
		t.Fatal("Response data is nil")
	}
	// Empty slices, not nil — callers must not need nil checks.
	if data.Data.Conferences.Data == nil {
		t.Error("Conferences.Data should be an empty slice, not nil")
	}
	if len(data.Data.Conferences.Data) != 0 {
		t.Errorf("Expected 0 conferences at offset 9999, got %d", len(data.Data.Conferences.Data))
	}
	if data.Data.Invitations.Data == nil {
		t.Error("Invitations.Data should be an empty slice, not nil")
	}
	if len(data.Data.Invitations.Data) != 0 {
		t.Errorf("Expected 0 invitations at offset 9999, got %d", len(data.Data.Invitations.Data))
	}
}

// TestReviewerDashboard_LimitZero verifies that limit=0 query params do not
// cause a server error. The server should treat it as the default limit or
// return an empty result — but must return 200.
func TestReviewerDashboard_LimitZero(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// The reviewer client omits limit=0 (treats 0 as "unset"), so we call
	// MakeRequest directly with explicit zero-limit query params.
	path := fmt.Sprintf(
		"/api/v1/reviewer/%s/dashboard?conference_limit=0&invitation_limit=0",
		reviewer.Email,
	)
	resp, err := ctx.MakeRequest("GET", path, nil, reviewerToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200, got %d", resp.StatusCode)
	}

	var data struct {
		Data *dto.ReviewerDashboardResponseWithPagination `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &data)
	if data.Data == nil {
		t.Fatal("Response data should not be nil")
	}
	t.Logf("limit=0 returned %d conferences, %d invitations",
		len(data.Data.Conferences.Data),
		len(data.Data.Invitations.Data),
	)
}
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
go test ./tests/api/reviewer/... -run "TestReviewerDashboard_OffsetBeyondTotal|TestReviewerDashboard_LimitZero" -v
```

Expected: both `PASS`

- [ ] **Step 3: Commit**

```bash
git add backend/tests/api/reviewer/reviewer_dashboard_test.go
git commit -m "test: reviewer dashboard pagination boundary and limit=0"
```

---

## Chunk 3: Frontend Tests

### Task 8: OverviewTab — CameraReadySection conditional rendering

**Files:**
- Create: `frontend/components/author/submission-detail/__tests__/camera-ready-section.test.tsx`

`CameraReadySection` is not exported; we test it via `OverviewTab`, which only renders the section when `submission.status === "accepted"`.

- [ ] **Step 1: Create the test file**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"
import { OverviewTab } from "../overview-tab"
import type { Submission } from "@/lib/api/submissions"

// Mock translation context (required by all overview-tab sub-components).
vi.mock("@/lib/i18n/translation-context", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Mock the papers API module used by CameraReadySection (dynamic import).
vi.mock("@/lib/api/papers", () => ({
  submitCameraReady: vi.fn(),
}))

const BASE_SUBMISSION: Submission = {
  id: 1,
  conference_id: 1,
  author: "author@test.com",
  title: "Test Paper",
  abstract: "Abstract",
  domain: ["AI"],
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function makeSubmission(overrides: Partial<Submission>): Submission {
  return { ...BASE_SUBMISSION, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CameraReadySection (via OverviewTab)", () => {
  it("does NOT render for status=draft", () => {
    render(<OverviewTab submission={makeSubmission({ status: "draft" })} conferenceId="1" />)
    expect(screen.queryByText("Camera-Ready Version")).toBeNull()
  })

  it("does NOT render for status=reviewing", () => {
    render(<OverviewTab submission={makeSubmission({ status: "reviewing" })} conferenceId="1" />)
    expect(screen.queryByText("Camera-Ready Version")).toBeNull()
  })

  it("does NOT render for status=rejected", () => {
    render(<OverviewTab submission={makeSubmission({ status: "rejected" })} conferenceId="1" />)
    expect(screen.queryByText("Camera-Ready Version")).toBeNull()
  })

  it("renders upload button when status=accepted and no file uploaded", () => {
    render(
      <OverviewTab
        submission={makeSubmission({ status: "accepted", camera_ready: undefined })}
        conferenceId="1"
      />,
    )
    expect(screen.getByText("Camera-Ready Version")).toBeTruthy()
    expect(screen.getByText("Upload PDF")).toBeTruthy()
    expect(screen.queryByText("Replace File")).toBeNull()
  })

  it("renders file info and replace button when camera_ready metadata exists", () => {
    const submission = makeSubmission({
      status: "accepted",
      camera_ready: {
        filename: "final-paper.pdf",
        original_name: "final-paper.pdf",
        size: 2 * 1024 * 1024, // 2 MB
        mime_type: "application/pdf",
        path: "/uploads/camera-ready/final-paper.pdf",
      },
    })
    render(<OverviewTab submission={submission} conferenceId="1" />)
    expect(screen.getByText("final-paper.pdf")).toBeTruthy()
    expect(screen.getByText("Replace File")).toBeTruthy()
    expect(screen.queryByText("Upload PDF")).toBeNull()
  })

  it("shows error message when submitCameraReady returns an error", async () => {
    const { submitCameraReady } = await import("@/lib/api/papers")
    const mockSubmit = submitCameraReady as ReturnType<typeof vi.fn>
    mockSubmit.mockResolvedValue({ data: null, error: "Server error during upload" })

    render(
      <OverviewTab
        submission={makeSubmission({ status: "accepted", camera_ready: undefined })}
        conferenceId="1"
      />,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(["content"], "test.pdf", { type: "application/pdf" })
    Object.defineProperty(fileInput, "files", { value: [file] })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText("Server error during upload")).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/frontend
npm run test:run -- components/author/submission-detail/__tests__/camera-ready-section.test.tsx
```

Expected: all 6 tests `PASS`

- [ ] **Step 3: Commit**

```bash
git add frontend/components/author/submission-detail/__tests__/camera-ready-section.test.tsx
git commit -m "test: CameraReadySection only renders for accepted submissions, error display"
```

---

### Task 9: getAssignmentReview — 403 error propagation

**Files:**
- Create: `frontend/lib/api/__tests__/reviews.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { getAssignmentReview } from "../reviews"

vi.mock("@/lib/api/client", () => ({
  apiFetch: vi.fn(),
  API_BASE_URL: "http://localhost:8080",
}))

import { apiFetch } from "@/lib/api/client"
const mockApiFetch = apiFetch as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe("getAssignmentReview", () => {
  it("returns data on success", async () => {
    const reviewData = { assignment_id: 42, review_status: "submitted", review_score: 8 }
    mockApiFetch.mockResolvedValue({
      data: { data: reviewData },
      response: { status: 200 },
    })

    const result = await getAssignmentReview("1", "42")

    expect(result.error).toBeNull()
    expect(result.data).toEqual(reviewData)
    expect(result.status).toBe(200)
  })

  it("surfaces 403 status and error when caller is not the assigned reviewer", async () => {
    // apiFetch throws on non-2xx responses.
    const err = Object.assign(new Error("Forbidden"), { status: 403 })
    mockApiFetch.mockRejectedValue(err)

    const result = await getAssignmentReview("1", "42")

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.status).toBe(403)
  })

  it("returns a generic 500 status when error has no status field", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"))

    const result = await getAssignmentReview("1", "42")

    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.status).toBe(500)
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/frontend
npm run test:run -- lib/api/__tests__/reviews.test.ts
```

Expected: all 3 tests `PASS`

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/api/__tests__/reviews.test.ts
git commit -m "test: getAssignmentReview propagates 403 error and status code"
```

---

## Final Verification

- [ ] **Run all backend API tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/backend
make test-api
```

Expected: all tests pass (no regressions)

- [ ] **Run all frontend tests**

```bash
cd /Users/dcao/Documents/code/ConferenceSpace/frontend
npm run test:run
```

Expected: all tests pass (no regressions)
