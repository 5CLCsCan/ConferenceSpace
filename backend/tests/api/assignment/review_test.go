package assignment

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	submissionTestClient "github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestSaveReviewAsDraft tests saving a review as a draft
func TestSaveReviewAsDraft(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create conference, author, reviewer, submission, and assignment
	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	reviewerToken, reviewer, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	// Create conference
	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := createdConf.ID

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

	// Create submission with keywords for matching
	submissionClient := submissionTestClient.NewClient(ctx)
	submission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper",
		Abstract:     "Abstract for test paper about artificial intelligence",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI"}, // This is used by auto-assign for matching
		},
	}
	_, err = submissionClient.CreateSuccess(conferenceID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	// Transition conference to "reviewing" status - this triggers auto-assign automatically
	transitionReq := dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusReviewing,
	}
	transitionResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID), transitionReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to transition status: %v", err)
	}
	testutils.AssertStatusCode(t, transitionResp, http.StatusOK)

	var transitionData struct {
		Data *dto.ConferenceTransitionStatusResponse `json:"data"`
	}
	testutils.DecodeResponse(t, transitionResp, &transitionData)
	t.Logf("Status transition: %s", transitionData.Data.Message)

	// Confirm all suggestions (auto-assign creates suggestions, not confirmed assignments)
	confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	// Get the assignment ID by calling the reviewer's papers endpoint (proper API flow)
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
		t.Fatalf("No assignments created for reviewer (auto-assign may not have worked - check domains match)")
	}

	assignmentID := papersData.Data.Papers[0].AssignmentID
	t.Logf("Got assignment ID: %d for reviewer: %s", assignmentID, reviewer.Email)

	// Accept the assignment invitation before writing the review
	acceptResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/respond", reviewer.Email, assignmentID), map[string]interface{}{
		"action": "accept",
	}, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept assignment invitation: %v", err)
	}
	testutils.AssertStatusCode(t, acceptResp, http.StatusOK)

	// Test: Save draft review
	t.Run("save incomplete draft review", func(t *testing.T) {
		t.Logf("Saving review for assignment %d with reviewer token", assignmentID)
		reviewData := &dto.ReviewData{
			Criteria: dto.ReviewCriteria{
				Originality:      8,
				TechnicalQuality: 7,
				Clarity:          9,
				Significance:     8,
				Methodology:      7,
			},
			Feedback: dto.ReviewFeedback{
				Strengths: "Good theoretical foundation",
			},
			Recommendation: "accept",
			Confidence:     "high",
		}

		reviewReq := dto.ReviewSaveRequest{
			AssignmentID: assignmentID,
			ConferenceID: conferenceID,
			ReviewScore:  nil, // No score yet - it's a draft
			ReviewData:   reviewData,
			Status:       model.ReviewStatusDraft,
		}

		resp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID), reviewReq, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to save draft review: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var reviewResp struct {
			Data *dto.Assignment `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &reviewResp)

		if reviewResp.Data.ReviewStatus == nil || *reviewResp.Data.ReviewStatus != model.ReviewStatusDraft {
			t.Errorf("Expected review status to be 'draft', got '%v'", reviewResp.Data.ReviewStatus)
		}
		if reviewResp.Data.ReviewData == nil {
			t.Error("Expected review data to be saved")
		}
	})
}

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

	// Accept the assignment invitation so the reviewer can submit reviews
	acceptResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/respond", reviewer.Email, assignmentID), map[string]interface{}{
		"action": "accept",
	}, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept assignment invitation: %v", err)
	}
	testutils.AssertStatusCode(t, acceptResp, http.StatusOK)

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
			Feedback:       dto.ReviewFeedback{Summary: "Good paper", Strengths: "Clear writing", Weaknesses: "Evaluation can be broader"},
			Recommendation: "accept",
			Confidence:     "high",
		},
		Status:                        model.ReviewStatusSubmitted,
		AuditFailureOverrideConfirmed: true,
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

func TestSaveReview_SubmitRequiresAuditFailureOverrideWhenAuditWorkflowUnavailable(t *testing.T) {
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
				Originality: 8, TechnicalQuality: 8, Clarity: 8, Significance: 8, Methodology: 8,
			},
			Feedback: dto.ReviewFeedback{
				Summary:    "This is a complete review summary for the submission.",
				Strengths:  "Strong motivation and a coherent workflow design.",
				Weaknesses: "Evaluation breadth could still be stronger.",
			},
			Recommendation: "accept",
			Confidence:     "high",
		},
		Status: model.ReviewStatusSubmitted,
	}

	resp, err := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID),
		reviewReq,
		reviewerToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("Expected 409, got %d", resp.StatusCode)
	}
}

func TestRunReviewAudit_UsesPathScopeWithoutBodyIDs(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	assignmentID, conferenceID, _, reviewerToken, _ := setupReviewingScenario(t, ctx)

	resp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review-audit", conferenceID, assignmentID),
		map[string]interface{}{
			"mode": "draft_save",
			"review_data": map[string]interface{}{
				"criteria": map[string]interface{}{
					"originality":       8,
					"technical_quality": 8,
					"clarity":           8,
					"significance":      8,
					"methodology":       8,
				},
				"feedback": map[string]interface{}{
					"summary":    "The review contains enough text to reach the audit layer.",
					"strengths":  "Clear motivation and workable framing.",
					"weaknesses": "Evaluation breadth could improve.",
				},
				"recommendation": "accept",
				"confidence":     "high",
			},
		},
		reviewerToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	// Audit service may return 503 (not configured) or 502 (workflow failed) depending on environment
	if resp.StatusCode != http.StatusServiceUnavailable && resp.StatusCode != http.StatusBadGateway {
		t.Fatalf("Expected 502 or 503 from audit service after successful path binding, got %d", resp.StatusCode)
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

func TestSaveReview_SubmitRejectsMissingSummaryBeforeAudit(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	assignmentID, conferenceID, _, reviewerToken, _ := setupReviewingScenario(t, ctx)

	score := float64(8)
	reviewReq := dto.ReviewSaveRequest{
		ReviewScore: &score,
		ReviewData: &dto.ReviewData{
			Criteria: dto.ReviewCriteria{
				Originality: 8, TechnicalQuality: 8, Clarity: 8, Significance: 8, Methodology: 8,
			},
			Feedback: dto.ReviewFeedback{
				Strengths:  "Strong problem framing and a coherent workflow.",
				Weaknesses: "The evaluation breadth could be stronger.",
			},
			Recommendation: "accept",
			Confidence:     "medium",
		},
		Status: model.ReviewStatusSubmitted,
	}

	resp, err := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID),
		reviewReq,
		reviewerToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d", resp.StatusCode)
	}
}
