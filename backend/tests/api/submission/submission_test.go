package submission

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestListSubmissions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	author2Token, author2, err := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register author2 user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	// Create test submissions via API
	sub1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper 1",
		Abstract:     "Abstract 1",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	_, err = submissionClient.Create(conferenceID, sub1, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission 1: %v", err)
	}

	sub2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email,
		Title:        "Paper 2",
		Abstract:     "Abstract 2",
		Domain:       []string{"ML"},
		Status:       dto.StatusPublished,
	}
	_, err = submissionClient.Create(conferenceID, sub2, author2Token)
	if err != nil {
		t.Fatalf("Failed to create submission 2: %v", err)
	}

	tests := []struct {
		name           string
		conferenceID   int64
		request        *dto.SubmissionListRequest
		expectedStatus int
		minCount       int
	}{
		{
			name:           "list all submissions",
			conferenceID:   conferenceID,
			request:        &dto.SubmissionListRequest{},
			expectedStatus: http.StatusOK,
			minCount:       2,
		},
		{
			name:         "filter by status",
			conferenceID: conferenceID,
			request: &dto.SubmissionListRequest{
				Status: dto.StatusDraft,
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
		{
			name:         "filter by author",
			conferenceID: conferenceID,
			request: &dto.SubmissionListRequest{
				Author: author.Email,
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.List(tt.conferenceID, tt.request, chairToken)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			var respData struct {
				Data *dto.SubmissionListResponse `json:"data"`
			}
			testutils.DecodeResponse(t, resp, &respData)

			if len(respData.Data.Submissions) < tt.minCount {
				t.Errorf("Expected at least %d submissions, got %d", tt.minCount, len(respData.Data.Submissions))
			}
		})
	}
}

func TestAuthorCanEditWithdrawnSubmissionBeforeDeadline(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("withdrawchair", "password123", "Withdraw", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("withdrawauthor", "password123", "Withdraw", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	futureDeadline := time.Now().Add(24 * time.Hour)
	conf := &dto.Conference{
		Title:   "Withdraw Edit Test Conference",
		Acronym: testutils.UniqueString("WETC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
		Configurations: &dto.ConferenceConfiguration{
			FullPaperSubmissionDeadline: &futureDeadline,
		},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	submission := &dto.Submission{
		ConferenceID: confResp.ID,
		Author:       author.Email,
		Title:        "Original Withdrawn Paper",
		Abstract:     "Original abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	created, err := submissionClient.CreateSuccess(confResp.ID, submission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	withdrawResp, err := ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", confResp.ID, created.ID),
		map[string]interface{}{"status": dto.StatusWithdrawn},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Failed to make withdraw request: %v", err)
	}
	testutils.AssertStatusCode(t, withdrawResp, http.StatusOK)

	updatedSubmission := &dto.Submission{
		ConferenceID: confResp.ID,
		Author:       author.Email,
		Title:        "Edited After Withdraw",
		Abstract:     "Edited abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusWithdrawn,
	}
	updateResp, err := submissionClient.Update(confResp.ID, created.ID, updatedSubmission, authorToken)
	if err != nil {
		t.Fatalf("Failed to make update request: %v", err)
	}
	testutils.AssertStatusCode(t, updateResp, http.StatusOK)

	refetched, err := submissionClient.GetSuccess(confResp.ID, created.ID, authorToken)
	if err != nil {
		t.Fatalf("Failed to fetch updated submission: %v", err)
	}

	if refetched.Title != updatedSubmission.Title {
		t.Fatalf("Expected title to be updated to %q, got %q", updatedSubmission.Title, refetched.Title)
	}
	if refetched.Status != dto.StatusWithdrawn {
		t.Fatalf("Expected submission to remain withdrawn, got %q", refetched.Status)
	}
}

func TestCreateSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	author2Token, author2, err := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author2 user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	tests := []struct {
		name           string
		conferenceID   int64
		token          string
		submission     *dto.Submission
		expectedStatus int
		expectError    bool
	}{
		{
			name:         "successfully create submission",
			conferenceID: conferenceID,
			token:        authorToken,
			submission: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "My Research Paper",
				Abstract:     "This is my research abstract",
				Domain:       []string{"Deep Learning", "AI"},
				Status:       dto.StatusDraft,
				Information: &dto.SubmissionInformation{
					Keywords: []string{"neural networks", "optimization"},
				},
			},
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name:         "create without authentication",
			conferenceID: conferenceID,
			token:        "",
			submission: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "Unauthorized Paper",
				Abstract:     "Abstract",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		{
			name:         "create with missing required fields",
			conferenceID: conferenceID,
			token:        author2Token,
			submission: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author2.Email,
				Abstract:     "Missing title",
				Status:       dto.StatusDraft, // Drafts allow incomplete data
			},
			expectedStatus: http.StatusCreated, // Should succeed for draft
			expectError:    false,              // Drafts can be incomplete
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.Create(tt.conferenceID, tt.submission, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if _, ok := respMap["error"]; !ok {
					t.Error("Expected error field in response")
				}
			} else {
				var respData struct {
					Data *dto.Submission `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data.Title != tt.submission.Title {
					t.Errorf("Expected title %s, got %s", tt.submission.Title, respData.Data.Title)
				}
			}
		})
	}
}

func TestUpdateSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	otherToken, _, err := ctx.RegisterUniqueUser("other", "password123", "Other", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	// Create submission via API
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Original Title",
		Abstract:     "Original Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	subResp, _ := submissionClient.Create(conferenceID, sub, authorToken)
	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	tests := []struct {
		name           string
		conferenceID   int64
		submissionID   int64
		token          string
		updateData     *dto.Submission
		expectedStatus int
		expectError    bool
	}{
		{
			name:         "author successfully updates own submission",
			conferenceID: conferenceID,
			submissionID: submissionID,
			token:        authorToken,
			updateData: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "Updated Title",
				Abstract:     "Updated Abstract",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:         "other author cannot update submission",
			conferenceID: conferenceID,
			submissionID: submissionID,
			token:        otherToken,
			updateData: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "Hacked Title",
				Abstract:     "Original Abstract",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.Update(tt.conferenceID, tt.submissionID, tt.updateData, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if _, ok := respMap["error"]; !ok {
					t.Error("Expected error field in response")
				}
			}
		})
	}
}

func TestUpdateSubmissionAfterDeadline(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("deadlinechair", "password123", "Deadline", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("deadlineauthor", "password123", "Deadline", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	pastDeadline := time.Now().Add(-24 * time.Hour)
	conf := &dto.Conference{
		Title:   "Past Deadline Conference",
		Acronym: testutils.UniqueString("PDC2026"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
		Configurations: &dto.ConferenceConfiguration{
			FullPaperSubmissionDeadline: &pastDeadline,
		},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	draftSubmission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Draft Before Closed Gate",
		Abstract:     "A draft created before publication is attempted.",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	createdDraft, err := submissionClient.CreateSuccess(conferenceID, draftSubmission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create draft submission: %v", err)
	}

	t.Run("allows editing existing non-final submission after deadline", func(t *testing.T) {
		update := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Updated After Deadline",
			Abstract:     "Existing non-final edits remain available.",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Update(conferenceID, createdDraft.ID, update, authorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		updated, err := submissionClient.GetSuccess(conferenceID, createdDraft.ID, authorToken)
		if err != nil {
			t.Fatalf("Failed to reload updated submission: %v", err)
		}
		if updated.Title != "Updated After Deadline" {
			t.Fatalf("Expected title to be updated after deadline, got %q", updated.Title)
		}
		if updated.Status != dto.StatusDraft {
			t.Fatalf("Expected status to remain draft, got %q", updated.Status)
		}
	})

	t.Run("blocks draft publish bypass through update after deadline", func(t *testing.T) {
		update := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Draft Before Closed Gate",
			Abstract:     "A draft created before publication is attempted.",
			Domain:       []string{"AI"},
			Status:       dto.StatusPublished,
		}

		resp, err := submissionClient.Update(conferenceID, createdDraft.ID, update, authorToken)
		if err != nil {
			t.Fatalf("Failed to update submission: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})
}

func TestDeleteSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	otherToken, other, err := ctx.RegisterUniqueUser("other", "password123", "Other", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	// Create submissions via API
	sub1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper 1",
		Abstract:     "Abstract 1",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	resp1, _ := submissionClient.Create(conferenceID, sub1, authorToken)
	var data1 struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &data1)

	sub2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       other.Email,
		Title:        "Paper 2",
		Abstract:     "Abstract 2",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	resp2, err := submissionClient.Create(conferenceID, sub2, otherToken)
	if err != nil {
		t.Fatalf("Failed to create submission 2: %v", err)
	}
	testutils.AssertStatusCode(t, resp2, http.StatusCreated)
	var data2 struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &data2)

	tests := []struct {
		name           string
		conferenceID   int64
		submissionID   int64
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "other author cannot delete submission",
			conferenceID:   conferenceID,
			submissionID:   data1.Data.ID,
			token:          otherToken,
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
		{
			name:           "author successfully deletes own submission",
			conferenceID:   conferenceID,
			submissionID:   data1.Data.ID,
			token:          authorToken,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.Delete(tt.conferenceID, tt.submissionID, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if respMap["message"] != "submission deleted successfully" {
					t.Error("Expected success message")
				}
			}
		})
	}
}

func TestGetSubmissionWithReviewers(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	_, reviewer1, err := ctx.RegisterUniqueUser("reviewer1", "password123", "Reviewer", "One", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer1: %v", err)
	}
	_, reviewer2, err := ctx.RegisterUniqueUser("reviewer2", "password123", "Reviewer", "Two", []string{"AI", "NLP"})
	if err != nil {
		t.Fatalf("Failed to register reviewer2: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
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

	// Create submission via API
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper for Reviewers",
		Abstract:     "Abstract for testing includeReviewers parameter",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	created, err := submissionClient.CreateSuccess(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID := created.ID

	// Add reviewers to the conference
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer1.ID, "domain": []string{"AI", "ML"}},
			{"user_id": reviewer2.ID, "domain": []string{"AI", "NLP"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewers: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var addRevData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &addRevData)

	// Accept reviewer invitations
	for _, reviewer := range addRevData.Data.Success {
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewer.ID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		testutils.AssertStatusCode(t, statusResp, http.StatusOK)
	}

	// Trigger auto-assignment to assign reviewers to the submission
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 2,
		"max_reviewers_per_paper": 2,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	assignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to trigger auto-assignment: %v", err)
	}
	testutils.AssertStatusCode(t, assignResp, http.StatusOK)

	t.Run("get submission without reviewers (includeReviewers=false)", func(t *testing.T) {
		submission, err := submissionClient.GetWithReviewersSuccess(conferenceID, submissionID, false, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		if submission.ID != submissionID {
			t.Errorf("Expected submission ID %d, got %d", submissionID, submission.ID)
		}

		if len(submission.Reviewers) > 0 {
			t.Errorf("Expected no reviewers when includeReviewers=false, got %d reviewers", len(submission.Reviewers))
		}
	})

	t.Run("get submission with reviewers (includeReviewers=true)", func(t *testing.T) {
		submission, err := submissionClient.GetWithReviewersSuccess(conferenceID, submissionID, true, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		if submission.ID != submissionID {
			t.Errorf("Expected submission ID %d, got %d", submissionID, submission.ID)
		}

		if len(submission.Reviewers) != 2 {
			t.Errorf("Expected 2 reviewers when includeReviewers=true, got %d reviewers", len(submission.Reviewers))
		}

		// Verify reviewer data contains expected fields
		for i, reviewer := range submission.Reviewers {
			if reviewer.ID == 0 {
				t.Errorf("Reviewer %d has no ID", i)
			}
			if reviewer.Email == "" {
				t.Errorf("Reviewer %d has no email", i)
			}
			if reviewer.UserID == 0 {
				t.Errorf("Reviewer %d has no user ID", i)
			}
			t.Logf("Reviewer %d: ID=%d, UserID=%d, Email=%s, Status=%s", i, reviewer.ID, reviewer.UserID, reviewer.Email, reviewer.Status)
		}

		// Verify reviewers match the expected reviewers
		reviewerEmails := make(map[string]bool)
		for _, reviewer := range submission.Reviewers {
			reviewerEmails[reviewer.Email] = true
		}

		if !reviewerEmails[reviewer1.Email] && !reviewerEmails[reviewer2.Email] {
			t.Error("Expected reviewers to include reviewer1 or reviewer2")
		}
	})

	t.Run("default behavior (no includeReviewers param) should not include reviewers", func(t *testing.T) {
		resp, err := submissionClient.Get(conferenceID, submissionID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.Submission `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if len(respData.Data.Reviewers) > 0 {
			t.Errorf("Expected no reviewers in default response, got %d reviewers", len(respData.Data.Reviewers))
		}
	})
}
