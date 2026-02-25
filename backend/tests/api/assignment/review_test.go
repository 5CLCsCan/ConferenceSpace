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
