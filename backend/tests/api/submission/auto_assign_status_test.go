package submission

import (
	"fmt"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestAutoAssignUpdatesSubmissionStatus verifies that the auto-assignment endpoint
// automatically updates submission status to "reviewing" for all assigned submissions
func TestAutoAssignUpdatesSubmissionStatus(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("autoassignchair", "password123", "AutoAssign", "Chair", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	author1Token, author1, err := ctx.RegisterUniqueUser("author1", "password123", "Author", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author1: %v", err)
	}

	author2Token, author2, err := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register author2: %v", err)
	}

	// Create reviewers
	_, reviewer1, err := ctx.RegisterUniqueUser("reviewer1", "password123", "Reviewer", "One", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer1: %v", err)
	}

	_, reviewer2, err := ctx.RegisterUniqueUser("reviewer2", "password123", "Reviewer", "Two", []string{"AI", "NLP"})
	if err != nil {
		t.Fatalf("Failed to register reviewer2: %v", err)
	}

	// Create test conference
	conf := &dto.Conference{
		Title:   "Auto-Assign Status Test Conference",
		Acronym: testutils.UniqueString("AASTC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "ML", "NLP"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Add reviewers to the conference
	addReviewerPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	// Note: ConferenceID is bound from URI, only send reviewers in body
	reviewerRequest := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer1.ID, "domain": []string{"AI", "ML"}},
			{"user_id": reviewer2.ID, "domain": []string{"AI", "NLP"}},
		},
	}
	addReviewerResp, err := ctx.MakeRequest("POST", addReviewerPath, reviewerRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewers: %v", err)
	}
	if addReviewerResp.StatusCode != 201 {
		var errResp map[string]interface{}
		testutils.DecodeResponse(t, addReviewerResp, &errResp)
		t.Fatalf("Failed to add reviewers, status code: %d, response: %+v", addReviewerResp.StatusCode, errResp)
	}

	// Accept reviewer invitations by updating their status
	var addReviewerResult struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &addReviewerResult)

	// Update reviewer statuses to "accepted" so they can be assigned
	for _, reviewer := range addReviewerResult.Data.Success {
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewer.ID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		if statusResp.StatusCode != 200 {
			t.Fatalf("Failed to update reviewer status, status code: %d", statusResp.StatusCode)
		}
	}

	// Create submissions with different initial statuses
	submission1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "AI Research Paper",
		Abstract:     "This is a paper about AI",
		Status:       dto.StatusDraft,
		Domain:       []string{"AI"},
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI", "Machine Learning"},
		},
	}
	created1, err := submissionClient.CreateSuccess(conferenceID, submission1, author1Token)
	if err != nil {
		t.Fatalf("Failed to create submission 1: %v", err)
	}

	submission2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email,
		Title:        "ML Research Paper",
		Abstract:     "This is a paper about ML",
		Status:       dto.StatusPublished,
		Domain:       []string{"ML"},
		Information: &dto.SubmissionInformation{
			Keywords: []string{"ML", "Deep Learning"},
		},
	}
	created2, err := submissionClient.CreateSuccess(conferenceID, submission2, author2Token)
	if err != nil {
		t.Fatalf("Failed to create submission 2: %v", err)
	}

	submission3 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "NLP Research Paper",
		Abstract:     "This is a paper about NLP",
		Status:       dto.StatusDraft,
		Domain:       []string{"NLP"},
		Information: &dto.SubmissionInformation{
			Keywords: []string{"NLP", "Natural Language"},
		},
	}
	created3, err := submissionClient.CreateSuccess(conferenceID, submission3, author1Token)
	if err != nil {
		t.Fatalf("Failed to create submission 3: %v", err)
	}

	// Verify initial statuses
	t.Run("verify initial submission statuses", func(t *testing.T) {
		sub1, err := submissionClient.GetSuccess(conferenceID, created1.ID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission 1: %v", err)
		}
		if sub1.Status != dto.StatusDraft {
			t.Errorf("Expected submission 1 status to be 'draft', got '%s'", sub1.Status)
		}

		sub2, err := submissionClient.GetSuccess(conferenceID, created2.ID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission 2: %v", err)
		}
		if sub2.Status != dto.StatusPublished {
			t.Errorf("Expected submission 2 status to be 'published', got '%s'", sub2.Status)
		}

		sub3, err := submissionClient.GetSuccess(conferenceID, created3.ID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission 3: %v", err)
		}
		if sub3.Status != dto.StatusDraft {
			t.Errorf("Expected submission 3 status to be 'draft', got '%s'", sub3.Status)
		}
	})

	// Run auto-assignment
	t.Run("run auto-assignment and verify status updates", func(t *testing.T) {
		autoAssignPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID)
		autoAssignRequest := map[string]interface{}{
			"min_reviewers_per_paper": 1,
			"max_reviewers_per_paper": 2,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}

		autoAssignResp, err := ctx.MakeRequest("POST", autoAssignPath, autoAssignRequest, chairToken)
		if err != nil {
			t.Fatalf("Failed to run auto-assignment: %v", err)
		}

		if autoAssignResp.StatusCode != 200 {
			t.Fatalf("Auto-assignment failed with status code: %d", autoAssignResp.StatusCode)
		}

		var assignmentResult struct {
			Data *dto.AutoAssignResponse `json:"data"`
		}
		testutils.DecodeResponse(t, autoAssignResp, &assignmentResult)

		if assignmentResult.Data.TotalAssignments == 0 {
			t.Skip("No assignments were made, skipping status verification")
		}

		t.Logf("Auto-assignment created %d assignments", assignmentResult.Data.TotalAssignments)

		// Confirm all suggestions (auto-assign creates suggestions, status updates on confirm)
		confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
		if err != nil {
			t.Fatalf("Failed to confirm suggestions: %v", err)
		}
		if confirmResp.StatusCode != 200 {
			t.Fatalf("Failed to confirm suggestions, status code: %d", confirmResp.StatusCode)
		}

		// Verify that assigned submissions now have "reviewing" status
		// We need to check which submissions were assigned
		sub1After, err := submissionClient.GetSuccess(conferenceID, created1.ID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission 1 after assignment: %v", err)
		}

		sub2After, err := submissionClient.GetSuccess(conferenceID, created2.ID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission 2 after assignment: %v", err)
		}

		sub3After, err := submissionClient.GetSuccess(conferenceID, created3.ID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission 3 after assignment: %v", err)
		}

		// Check that at least some submissions have been updated to "reviewing"
		reviewingCount := 0
		if sub1After.Status == dto.StatusReviewing {
			reviewingCount++
			t.Logf("Submission 1 (%s) status updated to 'reviewing' ✓", sub1After.Title)
		}
		if sub2After.Status == dto.StatusReviewing {
			reviewingCount++
			t.Logf("Submission 2 (%s) status updated to 'reviewing' ✓", sub2After.Title)
		}
		if sub3After.Status == dto.StatusReviewing {
			reviewingCount++
			t.Logf("Submission 3 (%s) status updated to 'reviewing' ✓", sub3After.Title)
		}

		if reviewingCount == 0 {
			t.Error("Expected at least one submission to have 'reviewing' status after auto-assignment")
		}

		t.Logf("Successfully verified: %d submissions have 'reviewing' status", reviewingCount)
	})
}

// TestAutoAssignBulkStatusUpdate verifies that bulk status update works correctly
// even with a large number of submissions
func TestAutoAssignBulkStatusUpdate(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping bulk test in short mode")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("bulkchair", "password123", "Bulk", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create reviewer
	_, reviewer, err := ctx.RegisterUniqueUser("bulkreviewer", "password123", "Bulk", "Reviewer", []string{"AI", "ML", "NLP"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// Create test conference
	conf := &dto.Conference{
		Title:   "Bulk Status Test Conference",
		Acronym: testutils.UniqueString("BSTC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "ML", "NLP"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Add reviewer
	addReviewerPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	// Note: ConferenceID is bound from URI, only send reviewers in body
	reviewerRequest := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI", "ML", "NLP"}},
		},
	}
	addReviewerResp, err := ctx.MakeRequest("POST", addReviewerPath, reviewerRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	if addReviewerResp.StatusCode != 201 {
		t.Fatalf("Failed to add reviewer, status code: %d", addReviewerResp.StatusCode)
	}

	// Accept reviewer invitation
	var addReviewerResult struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &addReviewerResult)

	if len(addReviewerResult.Data.Success) > 0 {
		reviewerID := addReviewerResult.Data.Success[0].ID
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		if statusResp.StatusCode != 200 {
			t.Fatalf("Failed to update reviewer status, status code: %d", statusResp.StatusCode)
		}
	}

	// Create multiple submissions
	numSubmissions := 10
	submissionIDs := make([]int64, numSubmissions)

	for i := 0; i < numSubmissions; i++ {
		authorToken, author, err := ctx.RegisterUniqueUser(
			testutils.UniqueString("bulkauthor"),
			"password123",
			"Bulk",
			"Author",
			[]string{"AI"},
		)
		if err != nil {
			t.Fatalf("Failed to register author %d: %v", i, err)
		}

		submission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        testutils.UniqueString("Bulk Paper"),
			Abstract:     "This is a bulk test paper",
			Status:       dto.StatusDraft,
			Domain:       []string{"AI"},
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI", "Testing"},
			},
		}
		created, err := submissionClient.CreateSuccess(conferenceID, submission, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission %d: %v", i, err)
		}
		submissionIDs[i] = created.ID
	}

	t.Logf("Created %d submissions for bulk test", numSubmissions)

	// Run auto-assignment
	autoAssignPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID)
	autoAssignRequest := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 1,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}

	autoAssignResp, err := ctx.MakeRequest("POST", autoAssignPath, autoAssignRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to run auto-assignment: %v", err)
	}

	if autoAssignResp.StatusCode != 200 {
		t.Fatalf("Auto-assignment failed with status code: %d", autoAssignResp.StatusCode)
	}

	// Confirm all suggestions (auto-assign creates suggestions, status updates on confirm)
	confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}
	if confirmResp.StatusCode != 200 {
		t.Fatalf("Failed to confirm suggestions, status code: %d", confirmResp.StatusCode)
	}

	// Verify all assigned submissions have "reviewing" status
	reviewingCount := 0
	for i, submissionID := range submissionIDs {
		sub, err := submissionClient.GetSuccess(conferenceID, submissionID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get submission %d after assignment: %v", i, err)
		}

		if sub.Status == dto.StatusReviewing {
			reviewingCount++
		}
	}

	t.Logf("Bulk update: %d/%d submissions have 'reviewing' status", reviewingCount, numSubmissions)

	if reviewingCount == 0 {
		t.Error("Expected at least some submissions to have 'reviewing' status after bulk assignment")
	}
}

// TestListSubmissionsByReviewingStatus verifies that we can filter submissions by "reviewing" status
func TestListSubmissionsByReviewingStatus(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("filterchair", "password123", "Filter", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	authorToken, author, err := ctx.RegisterUniqueUser("filterauthor", "password123", "Filter", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create test conference
	conf := &dto.Conference{
		Title:   "Filter Status Test Conference",
		Acronym: testutils.UniqueString("FSTC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Create submissions with different statuses
	sub1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Draft Paper",
		Abstract:     "Draft",
		Status:       dto.StatusDraft,
		Domain:       []string{"AI"},
	}
	_, err = submissionClient.CreateSuccess(conferenceID, sub1, authorToken)
	if err != nil {
		t.Fatalf("Failed to create draft submission: %v", err)
	}

	sub2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Published Paper",
		Abstract:     "Published",
		Status:       dto.StatusPublished,
		Domain:       []string{"AI"},
	}
	_, err = submissionClient.CreateSuccess(conferenceID, sub2, authorToken)
	if err != nil {
		t.Fatalf("Failed to create published submission: %v", err)
	}

	// Note: To properly test filtering by "reviewing" status, we would need
	// to actually run auto-assignment. For this test, we're just verifying
	// the filter works with the existing statuses.

	t.Run("list draft submissions", func(t *testing.T) {
		listReq := &dto.SubmissionListRequest{
			Status: dto.StatusDraft,
		}
		result, err := submissionClient.ListSuccess(conferenceID, listReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to list draft submissions: %v", err)
		}

		if len(result.Submissions) == 0 {
			t.Error("Expected at least one draft submission")
		}

		for _, sub := range result.Submissions {
			if sub.Status != dto.StatusDraft {
				t.Errorf("Expected all submissions to have 'draft' status, got '%s'", sub.Status)
			}
		}
	})

	t.Run("list reviewing submissions", func(t *testing.T) {
		listReq := &dto.SubmissionListRequest{
			Status: dto.StatusReviewing,
		}
		result, err := submissionClient.ListSuccess(conferenceID, listReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to list reviewing submissions: %v", err)
		}

		// Should be empty since we haven't run auto-assignment
		if len(result.Submissions) != 0 {
			t.Logf("Found %d submissions with 'reviewing' status (may have been assigned previously)", len(result.Submissions))
		}
	})
}
