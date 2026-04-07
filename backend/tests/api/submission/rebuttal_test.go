package submission

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// setupRebuttalScenario creates a conference, submission, reviewer assignment, and saved review —
// returning all tokens and IDs needed for rebuttal tests.
func setupRebuttalScenario(t *testing.T, ctx *testutils.TestContext) (
	chairToken, authorToken, reviewerToken string,
	conferenceID, submissionID, assignmentID int64,
) {
	t.Helper()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	reviewerToken, reviewer, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	// Create conference
	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Rebuttal Test Conference",
		Acronym: testutils.UniqueString("RTC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID = createdConf.ID

	// Add reviewer
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

	// Accept reviewer invitation
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), map[string]interface{}{
		"status": "accepted",
	}, chairToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer: %v", err)
	}

	// Create submission (with matching domain so auto-assign picks it up)
	submissionClient := NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Rebuttal Test Paper",
		Abstract:     "Abstract for rebuttal test paper about artificial intelligence",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information:  &dto.SubmissionInformation{Keywords: []string{"AI"}},
	}
	createdSub, err := submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID = createdSub.ID

	// Transition to reviewing — triggers auto-assign
	transitionResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
		dto.ConferenceTransitionStatusRequest{ConferenceID: conferenceID, NewStatus: model.ConferenceStatusReviewing},
		chairToken)
	if err != nil {
		t.Fatalf("Failed to transition conference: %v", err)
	}
	testutils.AssertStatusCode(t, transitionResp, http.StatusOK)

	// Confirm all suggestions
	_, err = ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID),
		map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}

	// Get assignment ID via reviewer papers endpoint
	papersResp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer.Email, conferenceID),
		nil, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to get reviewer papers: %v", err)
	}
	testutils.AssertStatusCode(t, papersResp, http.StatusOK)

	var papersData struct {
		Data struct {
			Papers []*dto.AssignedPaperResponse `json:"papers"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, papersResp, &papersData)
	if len(papersData.Data.Papers) == 0 {
		t.Fatalf("No assignments found for reviewer (check domains match)")
	}
	assignmentID = papersData.Data.Papers[0].AssignmentID

	// Enable rebuttal settings before opening
	_, err = ctx.MakeRequest("PATCH",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", conferenceID),
		map[string]interface{}{
			"enabled": true,
		}, chairToken)
	if err != nil {
		t.Fatalf("Failed to enable rebuttal: %v", err)
	}

	// Open rebuttal period so tests can submit rebuttals
	openResp, err := ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", conferenceID),
		nil, chairToken)
	if err != nil {
		t.Fatalf("Failed to open rebuttal: %v", err)
	}
	testutils.AssertStatusCode(t, openResp, http.StatusOK)

	return
}

// TestSubmitRebuttal_AuthorCanSubmit verifies the author can submit a rebuttal.
func TestSubmitRebuttal_AuthorCanSubmit(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, _, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	body := map[string]interface{}{
		"general_response": "We thank the reviewers for their feedback.",
		"per_reviewer": map[string]interface{}{
			fmt.Sprintf("%d", assignmentID): map[string]interface{}{
				"points": []map[string]interface{}{
					{"point_id": "p1", "author_response": "We addressed this in section 3."},
				},
			},
		},
	}

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		body, authorToken)
	if err != nil {
		t.Fatalf("Failed to submit rebuttal: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		testutils.DecodeResponse(t, resp, &errBody)
		t.Fatalf("Expected 200, got %d: %v", resp.StatusCode, errBody)
	}

	var result struct {
		Data *dto.RebuttalStatusResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &result)

	if result.Data == nil {
		t.Fatal("Expected rebuttal status response, got nil")
	}
	if result.Data.RebuttalPhase != model.RebuttalPhaseSubmitted {
		t.Errorf("Expected phase=%q, got %q", model.RebuttalPhaseSubmitted, result.Data.RebuttalPhase)
	}
	if result.Data.RebuttalSubmittedAt == nil {
		t.Error("Expected rebuttal_submitted_at to be set")
	}
}

// TestSubmitRebuttal_NonAuthorForbidden verifies a non-author cannot submit a rebuttal.
func TestSubmitRebuttal_NonAuthorForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, _, _, conferenceID, submissionID, _ := setupRebuttalScenario(t, ctx)

	body := map[string]interface{}{
		"general_response": "Unauthorized rebuttal attempt.",
		"per_reviewer":     map[string]interface{}{},
	}

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		body, chairToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestAcknowledgeRebuttal_ReviewerCanAcknowledge verifies reviewer acknowledgment is idempotent and returns correct state.
func TestAcknowledgeRebuttal_ReviewerCanAcknowledge(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, reviewerToken, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	// Author submits rebuttal first
	rebuttalBody := map[string]interface{}{
		"general_response": "Thank you for the thorough review.",
		"per_reviewer":     map[string]interface{}{},
	}
	_, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		rebuttalBody, authorToken)
	if err != nil {
		t.Fatalf("Failed to submit rebuttal: %v", err)
	}

	// Reviewer acknowledges
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/rebuttal/acknowledge", conferenceID, assignmentID),
		nil, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to acknowledge rebuttal: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		testutils.DecodeResponse(t, resp, &errBody)
		t.Fatalf("Expected 200, got %d: %v", resp.StatusCode, errBody)
	}

	var result struct {
		Data *dto.RebuttalStatusResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &result)

	if result.Data == nil {
		t.Fatal("Expected rebuttal status response, got nil")
	}
	if result.Data.RebuttalStatus != model.RebuttalStatusAcknowledged {
		t.Errorf("Expected status=%q, got %q", model.RebuttalStatusAcknowledged, result.Data.RebuttalStatus)
	}
	if result.Data.RebuttalAcknowledgedAt == nil {
		t.Error("Expected rebuttal_acknowledged_at to be set")
	}

	// Second acknowledge should be idempotent (same timestamp)
	resp2, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/rebuttal/acknowledge", conferenceID, assignmentID),
		nil, reviewerToken)
	if err != nil {
		t.Fatalf("Second acknowledge failed: %v", err)
	}
	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 on idempotent acknowledge, got %d", resp2.StatusCode)
	}

	var result2 struct {
		Data *dto.RebuttalStatusResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &result2)

	if result2.Data.RebuttalAcknowledgedAt == nil {
		t.Error("Expected acknowledged_at to remain set after second call")
	}
	// Timestamps should be identical (COALESCE preserves original)
	if result.Data.RebuttalAcknowledgedAt != nil && result2.Data.RebuttalAcknowledgedAt != nil {
		if !result.Data.RebuttalAcknowledgedAt.Equal(*result2.Data.RebuttalAcknowledgedAt) {
			t.Errorf("Idempotent: acknowledged_at changed from %v to %v",
				result.Data.RebuttalAcknowledgedAt, result2.Data.RebuttalAcknowledgedAt)
		}
	}
}

// TestSubmitRebuttal_Unauthenticated verifies unauthenticated requests are rejected.
func TestSubmitRebuttal_Unauthenticated(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, _, _, conferenceID, submissionID, _ := setupRebuttalScenario(t, ctx)

	body := map[string]interface{}{
		"general_response": "Should fail.",
		"per_reviewer":     map[string]interface{}{},
	}
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		body, "")
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d", resp.StatusCode)
	}
}

// TestSubmitRebuttalWithPoints verifies that per-point data is persisted via the rebuttal endpoint.
func TestSubmitRebuttalWithPoints(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, _, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	body := map[string]interface{}{
		"general_response": "We thank the reviewers for their detailed feedback.",
		"points": []map[string]interface{}{
			{
				"point_id":         "p1",
				"assignment_id":    assignmentID,
				"category":         "weakness",
				"section":          "Weaknesses",
				"original_comment": "The ablation study is insufficient.",
				"author_response":  "We added a full ablation in Table 5.",
			},
			{
				"point_id":         "p2",
				"assignment_id":    assignmentID,
				"category":         "question",
				"section":          "Questions",
				"original_comment": "How was alpha chosen?",
				"author_response":  "Via grid search on validation set.",
			},
		},
	}

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		body, authorToken)
	if err != nil {
		t.Fatalf("Submit rebuttal failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		testutils.DecodeResponse(t, resp, &errBody)
		t.Fatalf("Expected 200, got %d: %v", resp.StatusCode, errBody)
	}

	// GET rebuttal and verify points are persisted
	getResp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		nil, authorToken)
	if err != nil {
		t.Fatalf("GET rebuttal failed: %v", err)
	}
	if getResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 on GET, got %d", getResp.StatusCode)
	}

	var getResult struct {
		Data *dto.GetRebuttalResponse `json:"data"`
	}
	testutils.DecodeResponse(t, getResp, &getResult)

	if getResult.Data == nil {
		t.Fatal("Expected GET rebuttal data, got nil")
	}
	if getResult.Data.Phase != model.RebuttalPhaseSubmitted {
		t.Errorf("Expected phase=%q, got %q", model.RebuttalPhaseSubmitted, getResult.Data.Phase)
	}
	if len(getResult.Data.Points) != 2 {
		t.Errorf("Expected 2 points, got %d", len(getResult.Data.Points))
	}
	t.Logf("GET rebuttal returned %d points, phase=%s", len(getResult.Data.Points), getResult.Data.Phase)
}

// TestAcknowledgePerPoint verifies a reviewer can acknowledge a specific rebuttal point.
func TestAcknowledgePerPoint(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, reviewerToken, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	// Author submits rebuttal with a point
	submitBody := map[string]interface{}{
		"general_response": "Thank you for the review.",
		"points": []map[string]interface{}{
			{
				"point_id":         "pt1",
				"assignment_id":    assignmentID,
				"category":         "weakness",
				"section":          "Weaknesses",
				"original_comment": "Missing experiments.",
				"author_response":  "We added experiments in appendix.",
			},
		},
	}
	submitResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		submitBody, authorToken)
	if err != nil || submitResp.StatusCode != http.StatusOK {
		t.Fatalf("Setup: submit rebuttal failed, status=%d, err=%v", submitResp.StatusCode, err)
	}

	// Reviewer acknowledges the point
	ackResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/rebuttal/points/pt1/acknowledge",
			conferenceID, assignmentID),
		map[string]interface{}{"status": "addressed", "note": "Good response."},
		reviewerToken)
	if err != nil {
		t.Fatalf("Acknowledge point failed: %v", err)
	}
	if ackResp.StatusCode != http.StatusOK {
		var errBody map[string]interface{}
		testutils.DecodeResponse(t, ackResp, &errBody)
		t.Fatalf("Expected 200 on acknowledge, got %d: %v", ackResp.StatusCode, errBody)
	}

	// Verify via GET that the point is now acknowledged
	getResp, _ := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		nil, authorToken)
	var getResult struct {
		Data *dto.GetRebuttalResponse `json:"data"`
	}
	testutils.DecodeResponse(t, getResp, &getResult)

	if len(getResult.Data.Points) == 0 {
		t.Fatal("Expected at least 1 point in GET response")
	}
	pt := getResult.Data.Points[0]
	if !pt.ReviewerAcknowledged {
		t.Error("Expected reviewer_acknowledged=true")
	}
	if pt.Status != "addressed" {
		t.Errorf("Expected status=addressed, got %q", pt.Status)
	}
	t.Logf("Point pt1: acknowledged=%v, status=%s, note=%s", pt.ReviewerAcknowledged, pt.Status, pt.ReviewerNote)
}

// TestGetRebuttal_ReturnsCorrectStructure verifies GET rebuttal returns correct shape after submission.
func TestGetRebuttal_ReturnsCorrectStructure(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, _, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	// PUT rebuttal with 2 points first
	body := map[string]interface{}{
		"general_response": "We thank the reviewers for their detailed feedback.",
		"points": []map[string]interface{}{
			{
				"point_id":         "rcs-p1",
				"assignment_id":    assignmentID,
				"category":         "weakness",
				"section":          "Weaknesses",
				"original_comment": "The ablation study is insufficient.",
				"author_response":  "We added a full ablation in Table 5.",
			},
			{
				"point_id":         "rcs-p2",
				"assignment_id":    assignmentID,
				"category":         "question",
				"section":          "Questions",
				"original_comment": "How was alpha chosen?",
				"author_response":  "Via grid search on validation set.",
			},
		},
	}
	putResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		body, authorToken)
	if err != nil || putResp.StatusCode != http.StatusOK {
		t.Fatalf("PUT rebuttal failed: status=%d, err=%v", putResp.StatusCode, err)
	}

	// GET rebuttal and verify structure
	getResp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		nil, authorToken)
	if err != nil {
		t.Fatalf("GET rebuttal failed: %v", err)
	}
	if getResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200, got %d", getResp.StatusCode)
	}

	var result struct {
		Data *dto.GetRebuttalResponse `json:"data"`
	}
	testutils.DecodeResponse(t, getResp, &result)

	if result.Data == nil {
		t.Fatal("Expected data, got nil")
	}
	if result.Data.Phase != "submitted" {
		t.Errorf("Expected phase=submitted, got %q", result.Data.Phase)
	}
	if result.Data.GeneralResponse == "" {
		t.Error("Expected general_response to be set")
	}
	if len(result.Data.Points) != 2 {
		t.Errorf("Expected 2 points, got %d", len(result.Data.Points))
	}

	// Verify point fields
	for _, pt := range result.Data.Points {
		if pt.PointID == "" {
			t.Error("Expected point_id to be set")
		}
		if pt.AssignmentID == 0 {
			t.Error("Expected assignment_id to be set")
		}
		if pt.Category == "" {
			t.Error("Expected category to be set")
		}
		if pt.Section == "" {
			t.Error("Expected section to be set")
		}
		if pt.OriginalComment == "" {
			t.Error("Expected original_comment to be set")
		}
		if pt.AuthorResponse == "" {
			t.Error("Expected author_response to be set")
		}
		// Status and ReviewerAcknowledged are expected fields (zero values are valid)
		_ = pt.Status
		_ = pt.ReviewerAcknowledged
	}
	t.Logf("GET rebuttal: phase=%s, points=%d, general_response=%q",
		result.Data.Phase, len(result.Data.Points), result.Data.GeneralResponse)
}

// TestGetRebuttal_AwaitingWhenNothingSubmitted verifies GET returns awaiting phase with empty points.
func TestGetRebuttal_AwaitingWhenNothingSubmitted(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Awaiting Rebuttal Test",
		Acronym: testutils.UniqueString("ART"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	submissionClient := NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: createdConf.ID,
		Author:       author.Email,
		Title:        "Awaiting Test Paper",
		Abstract:     "Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information:  &dto.SubmissionInformation{Keywords: []string{"AI"}},
	}
	createdSub, err := submissionClient.CreateSuccess(createdConf.ID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	getResp, err := ctx.MakeRequest("GET",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", createdConf.ID, createdSub.ID),
		nil, authorToken)
	if err != nil {
		t.Fatalf("GET rebuttal failed: %v", err)
	}
	if getResp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200, got %d", getResp.StatusCode)
	}

	var result struct {
		Data *dto.GetRebuttalResponse `json:"data"`
	}
	testutils.DecodeResponse(t, getResp, &result)

	if result.Data == nil {
		t.Fatal("Expected data, got nil")
	}
	if result.Data.Phase != "awaiting" {
		t.Errorf("Expected phase=awaiting, got %q", result.Data.Phase)
	}
	if len(result.Data.Points) != 0 {
		t.Errorf("Expected 0 points, got %d", len(result.Data.Points))
	}
	if result.Data.GeneralResponse != "" {
		t.Errorf("Expected empty general_response, got %q", result.Data.GeneralResponse)
	}
}

// TestSubmitRebuttal_MissingGeneralResponse verifies PUT without general_response returns 400.
func TestSubmitRebuttal_MissingGeneralResponse(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, _, conferenceID, submissionID, _ := setupRebuttalScenario(t, ctx)

	// Send body without general_response field
	body := map[string]interface{}{
		"points": []map[string]interface{}{},
	}
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		body, authorToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d", resp.StatusCode)
	}
}

// TestAcknowledgePoint_InvalidStatus verifies PUT with invalid status enum returns 400.
func TestAcknowledgePoint_InvalidStatus(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, reviewerToken, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	// Author submits rebuttal with a point
	submitBody := map[string]interface{}{
		"general_response": "Thank you for reviewing.",
		"points": []map[string]interface{}{
			{
				"point_id":         "inv-pt1",
				"assignment_id":    assignmentID,
				"category":         "weakness",
				"section":          "Weaknesses",
				"original_comment": "Missing experiments.",
				"author_response":  "We added experiments.",
			},
		},
	}
	submitResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		submitBody, authorToken)
	if err != nil || submitResp.StatusCode != http.StatusOK {
		t.Fatalf("Setup: submit rebuttal failed, status=%d, err=%v", submitResp.StatusCode, err)
	}

	// Reviewer sends acknowledge with invalid status
	ackResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/rebuttal/points/inv-pt1/acknowledge",
			conferenceID, assignmentID),
		map[string]interface{}{"status": "invalid_value", "note": ""},
		reviewerToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if ackResp.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400 for invalid status, got %d", ackResp.StatusCode)
	}
}

// TestAcknowledgePoint_PointNotFound verifies acknowledging a non-existent point_id returns 500.
func TestAcknowledgePoint_PointNotFound(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, _, reviewerToken, conferenceID, _, assignmentID := setupRebuttalScenario(t, ctx)

	// Try to acknowledge a point that doesn't exist
	ackResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/rebuttal/points/nonexistent_point_id/acknowledge",
			conferenceID, assignmentID),
		map[string]interface{}{"status": "addressed", "note": ""},
		reviewerToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if ackResp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("Expected 500 for point not found, got %d", ackResp.StatusCode)
	}
}

// TestSubmitRebuttal_BlockedWhenNotAwaiting verifies that submitting a rebuttal
// when the conference rebuttal phase is not 'awaiting' returns 400.
func TestSubmitRebuttal_BlockedWhenNotAwaiting(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Phase Guard Test",
		Acronym: testutils.UniqueString("PGT"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("create conference: %v", err)
	}
	conferenceID := createdConf.ID

	submissionClient := NewClient(ctx)
	sub, err := submissionClient.CreateSuccess(conferenceID, &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Phase Guard Paper",
		Abstract:     "Testing phase guard for rebuttal submission",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}, authorToken)
	if err != nil {
		t.Fatalf("create submission: %v", err)
	}

	// Rebuttal phase is 'not_started' — submit should be rejected
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, sub.ID),
		map[string]interface{}{"general_response": "hello", "points": []interface{}{}},
		authorToken)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 when rebuttal not open, got %d", resp.StatusCode)
	}
}

// TestSubmitRebuttal_BlockedWhenExceedsCharLimit verifies that exceeding the
// configured character limit returns 400.
func TestSubmitRebuttal_BlockedWhenExceedsCharLimit(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, authorToken, _, conferenceID, submissionID, _ := setupRebuttalScenario(t, ctx)

	// Lower the char limit (rebuttal is already open from setupRebuttalScenario)
	_, err := ctx.MakeRequest("PATCH",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", conferenceID),
		map[string]interface{}{
			"enabled":              true,
			"char_limit_general":   10,
			"char_limit_per_point": 1000,
		}, chairToken)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		map[string]interface{}{
			"general_response": "this response is way too long and exceeds the 10 char limit",
			"points":           []interface{}{},
		}, authorToken)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 for char limit exceeded, got %d", resp.StatusCode)
	}
}

// TestAcknowledgeRebuttal_BlockedWhenFinalized verifies that acknowledging after
// finalization returns 400.
func TestAcknowledgeRebuttal_BlockedWhenFinalized(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, authorToken, reviewerToken, conferenceID, submissionID, assignmentID := setupRebuttalScenario(t, ctx)

	// Author submits rebuttal
	submitResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/rebuttal", conferenceID, submissionID),
		map[string]interface{}{"general_response": "My response.", "points": []interface{}{}},
		authorToken)
	if err != nil || submitResp.StatusCode != http.StatusOK {
		t.Fatalf("submit rebuttal failed: status=%d err=%v", submitResp.StatusCode, err)
	}

	// Chair finalizes
	finalResp, err := ctx.MakeRequest("POST",
		fmt.Sprintf("/api/v1/conferences/%d/rebuttal/finalize", conferenceID),
		nil, chairToken)
	if err != nil || finalResp.StatusCode != http.StatusOK {
		t.Fatalf("finalize failed: status=%d err=%v", finalResp.StatusCode, err)
	}

	// Reviewer tries to acknowledge — should be blocked
	ackResp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/rebuttal/acknowledge", conferenceID, assignmentID),
		nil, reviewerToken)
	if err != nil {
		t.Fatal(err)
	}
	if ackResp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 after finalization, got %d", ackResp.StatusCode)
	}
}
