package negative

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestTC_NEG_01_AuthorCannotUpdateOtherAuthorSubmission verifies that an author
// cannot update another author's submission (authorization check)
func TestTC_NEG_01_AuthorCannotUpdateOtherAuthorSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := submission.NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create two author users
	author1Token, author1, err := ctx.RegisterUniqueUser("author1", "password123", "Author", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author1: %v", err)
	}

	author2Token, author2, err := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register author2: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Negative Test Conference",
		Acronym: testutils.UniqueString("NTC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "ML"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Author1 creates a submission
	submission1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "Author1's Paper",
		Abstract:     "This is author1's research",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	created1, err := submissionClient.CreateSuccess(conferenceID, submission1, author1Token)
	if err != nil {
		t.Fatalf("Failed to create submission for author1: %v", err)
	}
	submission1ID := created1.ID

	// Author2 creates their own submission
	submission2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email,
		Title:        "Author2's Paper",
		Abstract:     "This is author2's research",
		Domain:       []string{"ML"},
		Status:       dto.StatusDraft,
	}
	created2, err := submissionClient.CreateSuccess(conferenceID, submission2, author2Token)
	if err != nil {
		t.Fatalf("Failed to create submission for author2: %v", err)
	}
	submission2ID := created2.ID

	t.Run("author1 cannot update author2's submission", func(t *testing.T) {
		// Author1 tries to update Author2's submission
		maliciousUpdate := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author2.Email,
			Title:        "Hacked Title by Author1",
			Abstract:     "Original Abstract",
			Domain:       []string{"ML"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Update(conferenceID, submission2ID, maliciousUpdate, author1Token)
		if err != nil {
			t.Fatalf("Failed to make update request: %v", err)
		}

		// Should return 403 Forbidden
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		// Verify error message
		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if _, ok := respMap["error"]; !ok {
			t.Error("Expected error field in response")
		}

		t.Log("✓ Author1 correctly blocked from updating Author2's submission")
	})

	t.Run("author2 cannot update author1's submission", func(t *testing.T) {
		// Author2 tries to update Author1's submission
		maliciousUpdate := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author1.Email,
			Title:        "Hacked Title by Author2",
			Abstract:     "Original Abstract",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Update(conferenceID, submission1ID, maliciousUpdate, author2Token)
		if err != nil {
			t.Fatalf("Failed to make update request: %v", err)
		}

		// Should return 403 Forbidden
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		t.Log("✓ Author2 correctly blocked from updating Author1's submission")
	})

	t.Run("verify submissions remain unchanged", func(t *testing.T) {
		// Verify submission1 is unchanged
		sub1, err := submissionClient.GetSuccess(conferenceID, submission1ID, author1Token)
		if err != nil {
			t.Fatalf("Failed to get submission1: %v", err)
		}
		if sub1.Title != "Author1's Paper" {
			t.Errorf("Submission1 title was modified! Expected 'Author1's Paper', got '%s'", sub1.Title)
		}

		// Verify submission2 is unchanged
		sub2, err := submissionClient.GetSuccess(conferenceID, submission2ID, author2Token)
		if err != nil {
			t.Fatalf("Failed to get submission2: %v", err)
		}
		if sub2.Title != "Author2's Paper" {
			t.Errorf("Submission2 title was modified! Expected 'Author2's Paper', got '%s'", sub2.Title)
		}

		t.Log("✓ Both submissions remain unchanged after unauthorized update attempts")
	})
}

// TestTC_NEG_03_AutoAssignInsufficientReviewersDueToCOI verifies that auto-assign
// handles the case where there are insufficient reviewers due to COI conflicts
func TestTC_NEG_03_AutoAssignInsufficientReviewersDueToCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := submission.NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("coichair", "password123", "COI", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create 2 authors
	author1Token, author1, err := ctx.RegisterUniqueUser("coiauthor1", "password123", "COI", "Author1", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author1: %v", err)
	}

	author2Token, author2, err := ctx.RegisterUniqueUser("coiauthor2", "password123", "COI", "Author2", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register author2: %v", err)
	}

	// Create 2 reviewers
	_, reviewer1, err := ctx.RegisterUniqueUser("coireviewer1", "password123", "COI", "Reviewer1", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer1: %v", err)
	}

	_, reviewer2, err := ctx.RegisterUniqueUser("coireviewer2", "password123", "COI", "Reviewer2", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer2: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "COI Test Conference",
		Acronym: testutils.UniqueString("COITC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "ML"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Create 2 submissions with declared COI conflicts
	// Submission1: Author1, conflicts with Reviewer1
	submission1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "AI Research Paper",
		Abstract:     "This is AI research",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"AI", "Machine Learning"},
			DeclaredConflicts: []dto.ConflictDeclaration{
				{
					Email:  reviewer1.Email,
					Reason: "Former advisor",
				},
			},
		},
	}
	created1, err := submissionClient.CreateSuccess(conferenceID, submission1, author1Token)
	if err != nil {
		t.Fatalf("Failed to create submission1: %v", err)
	}

	// Submission2: Author2, conflicts with Reviewer2
	submission2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email,
		Title:        "ML Research Paper",
		Abstract:     "This is ML research",
		Domain:       []string{"ML"},
		Status:       dto.StatusPublished,
		Information: &dto.SubmissionInformation{
			Keywords: []string{"ML", "Deep Learning"},
			DeclaredConflicts: []dto.ConflictDeclaration{
				{
					Email:  reviewer2.Email,
					Reason: "Same institution",
				},
			},
		},
	}
	created2, err := submissionClient.CreateSuccess(conferenceID, submission2, author2Token)
	if err != nil {
		t.Fatalf("Failed to create submission2: %v", err)
	}

	t.Logf("Created 2 submissions with COI conflicts")

	// Add reviewers to conference
	addReviewerPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	reviewerRequest := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer1.ID, "domain": []string{"AI"}},
			{"user_id": reviewer2.ID, "domain": []string{"ML"}},
		},
	}
	addReviewerResp, err := ctx.MakeRequest("POST", addReviewerPath, reviewerRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewers: %v", err)
	}
	testutils.AssertStatusCode(t, addReviewerResp, http.StatusCreated)

	// Accept reviewer invitations
	var addReviewerResult struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &addReviewerResult)

	for _, reviewer := range addReviewerResult.Data.Success {
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

	t.Logf("Added and accepted 2 reviewers")

	t.Run("auto-assign with insufficient reviewers due to COI", func(t *testing.T) {
		// Trigger auto-assignment with min 2 reviewers per paper
		// Since each submission conflicts with one reviewer, and we only have 2 reviewers total,
		// each submission can only get 1 reviewer (not meeting the minimum of 2)
		autoAssignPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID)
		autoAssignRequest := map[string]interface{}{
			"min_reviewers_per_paper": 2,
			"max_reviewers_per_paper": 3,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}

		autoAssignResp, err := ctx.MakeRequest("POST", autoAssignPath, autoAssignRequest, chairToken)
		if err != nil {
			t.Fatalf("Failed to trigger auto-assignment: %v", err)
		}

		// Should return 200 OK (not crash)
		testutils.AssertStatusCode(t, autoAssignResp, http.StatusOK)

		var assignmentResult struct {
			Data *dto.AutoAssignResponse `json:"data"`
		}
		testutils.DecodeResponse(t, autoAssignResp, &assignmentResult)

		// Verify response contains unassigned papers
		if len(assignmentResult.Data.UnassignedPapers) == 0 {
			t.Error("Expected unassigned papers due to COI constraints, but got none")
		}

		t.Logf("✓ Auto-assign handled insufficient reviewers gracefully")
		t.Logf("  Total submissions: %d", assignmentResult.Data.TotalSubmissions)
		t.Logf("  Total reviewers: %d", assignmentResult.Data.TotalReviewers)
		t.Logf("  Total assignments: %d", assignmentResult.Data.TotalAssignments)
		t.Logf("  Unassigned papers: %d", len(assignmentResult.Data.UnassignedPapers))

		// Verify unassigned papers contain our submissions
		unassignedIDs := make(map[int64]bool)
		for _, paper := range assignmentResult.Data.UnassignedPapers {
			unassignedIDs[paper] = true
		}

		if !unassignedIDs[created1.ID] && !unassignedIDs[created2.ID] {
			t.Log("Note: Some papers may have been partially assigned despite COI constraints")
		}

		// Verify system didn't crash and returned valid response
		if assignmentResult.Data.TotalSubmissions != 2 {
			t.Errorf("Expected 2 total submissions, got %d", assignmentResult.Data.TotalSubmissions)
		}
		if assignmentResult.Data.TotalReviewers != 2 {
			t.Errorf("Expected 2 total reviewers, got %d", assignmentResult.Data.TotalReviewers)
		}
	})
}

// TestTC_SEC_06_NonChairCannotTriggerAutoAssignOrViewCOIDashboard verifies that
// non-chair users (authors, reviewers) cannot trigger auto-assign or view COI dashboard
func TestTC_SEC_06_NonChairCannotTriggerAutoAssignOrViewCOIDashboard(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := submission.NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("secchair", "password123", "Security", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author user
	authorToken, author, err := ctx.RegisterUniqueUser("secauthor", "password123", "Security", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create reviewer user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("secreviewer", "password123", "Security", "Reviewer", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Security Test Conference",
		Acronym: testutils.UniqueString("SECTC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Create a submission
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Security Test Paper",
		Abstract:     "Testing security",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	_, err = submissionClient.CreateSuccess(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}

	// Add reviewer to conference
	addReviewerPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	reviewerRequest := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI"}},
		},
	}
	addReviewerResp, err := ctx.MakeRequest("POST", addReviewerPath, reviewerRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addReviewerResp, http.StatusCreated)

	// Accept reviewer invitation so auto-assign can work for chair test
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
		testutils.AssertStatusCode(t, statusResp, http.StatusOK)
		t.Logf("Reviewer accepted invitation for setup")
	}

	t.Run("author cannot trigger auto-assign", func(t *testing.T) {
		autoAssignPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID)
		autoAssignRequest := map[string]interface{}{
			"min_reviewers_per_paper": 1,
			"max_reviewers_per_paper": 2,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}

		resp, err := ctx.MakeRequest("POST", autoAssignPath, autoAssignRequest, authorToken)
		if err != nil {
			t.Fatalf("Failed to make auto-assign request: %v", err)
		}

		// Should return 403 Forbidden
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if _, ok := respMap["error"]; !ok {
			t.Error("Expected error field in response")
		}

		t.Log("✓ Author correctly blocked from triggering auto-assign")
	})

	t.Run("reviewer cannot trigger auto-assign", func(t *testing.T) {
		autoAssignPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID)
		autoAssignRequest := map[string]interface{}{
			"min_reviewers_per_paper": 1,
			"max_reviewers_per_paper": 2,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}

		resp, err := ctx.MakeRequest("POST", autoAssignPath, autoAssignRequest, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make auto-assign request: %v", err)
		}

		// Should return 403 Forbidden
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		t.Log("✓ Reviewer correctly blocked from triggering auto-assign")
	})

	t.Run("author cannot view COI dashboard", func(t *testing.T) {
		coiDashboardPath := fmt.Sprintf("/api/v1/coi/dashboard/stats/%d", conferenceID)

		resp, err := ctx.MakeRequest("GET", coiDashboardPath, nil, authorToken)
		if err != nil {
			t.Fatalf("Failed to make COI dashboard request: %v", err)
		}

		// Should return 403 Forbidden
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if _, ok := respMap["error"]; !ok {
			t.Error("Expected error field in response")
		}

		t.Log("✓ Author correctly blocked from viewing COI dashboard")
	})

	t.Run("reviewer cannot view COI dashboard", func(t *testing.T) {
		coiDashboardPath := fmt.Sprintf("/api/v1/coi/dashboard/stats/%d", conferenceID)

		resp, err := ctx.MakeRequest("GET", coiDashboardPath, nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make COI dashboard request: %v", err)
		}

		// Should return 403 Forbidden
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		t.Log("✓ Reviewer correctly blocked from viewing COI dashboard")
	})

	t.Run("chair can trigger auto-assign", func(t *testing.T) {
		autoAssignPath := fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID)
		autoAssignRequest := map[string]interface{}{
			"min_reviewers_per_paper": 1,
			"max_reviewers_per_paper": 2,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}

		resp, err := ctx.MakeRequest("POST", autoAssignPath, autoAssignRequest, chairToken)
		if err != nil {
			t.Fatalf("Failed to make auto-assign request: %v", err)
		}

		// Should return 200 OK for chair
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Chair successfully triggered auto-assign")
	})

	t.Run("chair can view COI dashboard", func(t *testing.T) {
		coiDashboardPath := fmt.Sprintf("/api/v1/coi/dashboard/stats/%d", conferenceID)

		resp, err := ctx.MakeRequest("GET", coiDashboardPath, nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to make COI dashboard request: %v", err)
		}

		// Should return 200 OK for chair
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Chair successfully viewed COI dashboard")
	})
}

// TestTC_NEG_02_ReviewerCannotAccessUnassignedPaper verifies that a reviewer
// cannot access or submit review for a paper they are not assigned to
func TestTC_NEG_02_ReviewerCannotAccessUnassignedPaper(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := submission.NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("unassignchair", "password123", "Unassign", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create 2 authors (fix: need separate authors for each submission due to unique constraint)
	author1Token, author1, err := ctx.RegisterUniqueUser("unassignauthor1", "password123", "Unassign", "Author1", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author1: %v", err)
	}

	author2Token, author2, err := ctx.RegisterUniqueUser("unassignauthor2", "password123", "Unassign", "Author2", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author2: %v", err)
	}

	// Create 2 reviewers
	reviewer1Token, reviewer1, err := ctx.RegisterUniqueUser("unassignreviewer1", "password123", "Unassign", "Reviewer1", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer1: %v", err)
	}

	reviewer2Token, reviewer2, err := ctx.RegisterUniqueUser("unassignreviewer2", "password123", "Unassign", "Reviewer2", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer2: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Unassigned Access Test Conference",
		Acronym: testutils.UniqueString("UATC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Create 2 submissions with different authors
	submission1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author1.Email,
		Title:        "Paper 1 - Assigned to Reviewer1",
		Abstract:     "This paper will be assigned to reviewer1",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	created1, err := submissionClient.CreateSuccess(conferenceID, submission1, author1Token)
	if err != nil {
		t.Fatalf("Failed to create submission1: %v", err)
	}
	submission1ID := created1.ID

	submission2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author2.Email, // Fix: use author2 instead of author1
		Title:        "Paper 2 - NOT assigned to Reviewer1",
		Abstract:     "This paper will NOT be assigned to reviewer1",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	created2, err := submissionClient.CreateSuccess(conferenceID, submission2, author2Token)
	if err != nil {
		t.Fatalf("Failed to create submission2: %v", err)
	}
	submission2ID := created2.ID

	// Add reviewers to conference
	addReviewerPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	reviewerRequest := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer1.ID, "domain": []string{"AI"}},
			{"user_id": reviewer2.ID, "domain": []string{"AI"}},
		},
	}
	addReviewerResp, err := ctx.MakeRequest("POST", addReviewerPath, reviewerRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewers: %v", err)
	}
	testutils.AssertStatusCode(t, addReviewerResp, http.StatusCreated)

	// Accept reviewer invitations and get reviewer record IDs
	var addReviewerResult struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &addReviewerResult)

	var reviewerID int64
	for _, reviewer := range addReviewerResult.Data.Success {
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewer.ID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		testutils.AssertStatusCode(t, statusResp, http.StatusOK)

		// Save the first reviewer's record ID for assignment
		if reviewerID == 0 {
			reviewerID = reviewer.ID
		}
	}

	// Manually add suggestion for submission1 to reviewer1 (not submission2)
	addSuggestionPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID)
	addSuggestionReq := map[string]interface{}{
		"submission_id": submission1ID,
		"reviewer_id":   reviewerID, // Use reviewer record ID from batch invite
	}
	addSuggestionResp, err := ctx.MakeRequest("POST", addSuggestionPath, addSuggestionReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, addSuggestionResp, http.StatusCreated)

	var suggestionData struct {
		Data *dto.AddSuggestionResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addSuggestionResp, &suggestionData)
	assignment1ID := suggestionData.Data.Assignment.ID

	// Confirm the suggestion to make it a real assignment
	confirmPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID)
	confirmReq := map[string]interface{}{
		"assignment_ids": []int64{assignment1ID},
	}
	confirmResp, err := ctx.MakeRequest("POST", confirmPath, confirmReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	t.Logf("Setup complete: Reviewer1 assigned to submission1, NOT assigned to submission2")

	t.Run("reviewer1 can access assigned paper", func(t *testing.T) {
		// Verify reviewer1 can get their assignment via reviewer papers endpoint
		papersPath := fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer1.Email, conferenceID)
		resp, err := ctx.MakeRequest("GET", papersPath, nil, reviewer1Token)
		if err != nil {
			t.Fatalf("Failed to get reviewer papers: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data struct {
				Papers []*dto.AssignedPaperResponse `json:"papers"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		if len(papersData.Data.Papers) == 0 {
			t.Error("Reviewer1 should see their assigned paper")
		} else {
			t.Logf("✓ Reviewer1 can access their assigned paper (found %d papers)", len(papersData.Data.Papers))
		}
	})

	t.Run("reviewer1 cannot list assignments for unassigned paper", func(t *testing.T) {
		// Reviewer1 should only see submission1, not submission2
		papersPath := fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer1.Email, conferenceID)
		resp, err := ctx.MakeRequest("GET", papersPath, nil, reviewer1Token)
		if err != nil {
			t.Fatalf("Failed to get reviewer papers: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data struct {
				Papers []*dto.AssignedPaperResponse `json:"papers"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		// Verify reviewer1 only sees submission1, not submission2
		for _, paper := range papersData.Data.Papers {
			if paper.ID == submission2ID {
				t.Error("Reviewer1 should not see submission2 (unassigned paper)")
			}
		}

		t.Log("✓ Reviewer1 does not see unassigned paper in their papers list")
	})

	t.Run("reviewer1 cannot submit review for unassigned paper", func(t *testing.T) {
		// Try to submit review for a fake assignment ID (not assigned to reviewer1)
		fakeAssignmentID := int64(99999)
		reviewPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, fakeAssignmentID)
		reviewReq := map[string]interface{}{
			"assignment_id": fakeAssignmentID,
			"conference_id": conferenceID,
			"review_score":  8.5,
			"review_data": map[string]interface{}{
				"criteria": map[string]interface{}{
					"originality":       8,
					"technical_quality": 9,
					"clarity":           7,
					"significance":      8,
					"methodology":       8,
				},
				"feedback": map[string]interface{}{
					"strengths":  "Good paper",
					"weaknesses": "Minor issues",
				},
				"recommendation": "accept",
				"confidence":     "high",
			},
			"status": "submitted",
		}

		resp, err := ctx.MakeRequest("PUT", reviewPath, reviewReq, reviewer1Token)
		if err != nil {
			t.Fatalf("Failed to make review request: %v", err)
		}

		// Should return 403 Forbidden or 404 Not Found
		if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusNotFound {
			t.Errorf("Expected 403 or 404, got %d", resp.StatusCode)
		}

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if _, ok := respMap["error"]; !ok {
			t.Error("Expected error field in response")
		}

		t.Logf("✓ Reviewer1 correctly blocked from submitting review for unassigned paper (status: %d)", resp.StatusCode)
	})

	t.Run("reviewer2 cannot access reviewer1's assignment", func(t *testing.T) {
		// Reviewer2 should not see any papers (not assigned to anything)
		papersPath := fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewer2.Email, conferenceID)
		resp, err := ctx.MakeRequest("GET", papersPath, nil, reviewer2Token)
		if err != nil {
			t.Fatalf("Failed to get reviewer papers: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data struct {
				Papers []*dto.AssignedPaperResponse `json:"papers"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		if len(papersData.Data.Papers) > 0 {
			t.Error("Reviewer2 should not see any assigned papers")
		}

		t.Log("✓ Reviewer2 correctly cannot see Reviewer1's assignment")
	})
}

// TestTC_NEG_04_AuthorCannotSubmitAfterDeadline verifies that an author
// cannot submit (change status from draft to published) after the deadline has passed
func TestTC_NEG_04_AuthorCannotSubmitAfterDeadline(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := submission.NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("deadlinechair", "password123", "Deadline", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author
	authorToken, author, err := ctx.RegisterUniqueUser("deadlineauthor", "password123", "Deadline", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference with deadline in the past
	pastDeadline := time.Now().Add(-24 * time.Hour) // 1 day ago
	conf := &dto.Conference{
		Title:   "Deadline Test Conference",
		Acronym: testutils.UniqueString("DTC2025"),
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

	t.Logf("Conference created with deadline: %s (in the past)", pastDeadline.Format(time.RFC3339))

	// Create a draft submission
	draftSubmission := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Draft Paper After Deadline",
		Abstract:     "This is a draft paper",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	created, err := submissionClient.CreateSuccess(conferenceID, draftSubmission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create draft submission: %v", err)
	}
	submissionID := created.ID

	t.Run("author cannot change draft to published after deadline", func(t *testing.T) {
		// Try to update status from draft to published
		updateSubmission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Draft Paper After Deadline",
			Abstract:     "This is a draft paper",
			Domain:       []string{"AI"},
			Status:       dto.StatusPublished, // Try to publish after deadline
		}

		resp, err := submissionClient.Update(conferenceID, submissionID, updateSubmission, authorToken)
		if err != nil {
			t.Fatalf("Failed to make update request: %v", err)
		}

		// Should return 400 Bad Request or 403 Forbidden
		if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 400 or 403, got %d", resp.StatusCode)
		}

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if errMsg, ok := respMap["error"]; ok {
			t.Logf("Error message: %v", errMsg)
		} else {
			t.Error("Expected error field in response")
		}

		t.Logf("✓ Author correctly blocked from publishing after deadline (status: %d)", resp.StatusCode)
	})

	t.Run("verify submission remains in draft status", func(t *testing.T) {
		// Verify submission is still draft
		sub, err := submissionClient.GetSuccess(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get submission: %v", err)
		}

		if sub.Status != dto.StatusDraft {
			t.Errorf("Expected submission to remain 'draft', got '%s'", sub.Status)
		}

		t.Log("✓ Submission remains in draft status after failed publish attempt")
	})

	t.Run("author cannot withdraw after deadline", func(t *testing.T) {
		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID),
			map[string]interface{}{"status": dto.StatusWithdrawn},
			authorToken,
		)
		if err != nil {
			t.Fatalf("Failed to make withdraw request: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 400 or 403, got %d", resp.StatusCode)
		}

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if errMsg, ok := respMap["error"]; ok {
			t.Logf("Error message: %v", errMsg)
		} else {
			t.Error("Expected error field in response")
		}

		sub, err := submissionClient.GetSuccess(conferenceID, submissionID, authorToken)
		if err != nil {
			t.Fatalf("Failed to get submission after withdraw attempt: %v", err)
		}
		if sub.Status != dto.StatusDraft {
			t.Errorf("Expected submission to remain 'draft' after failed withdraw, got '%s'", sub.Status)
		}

		t.Logf("✓ Author correctly blocked from withdrawing after deadline (status: %d)", resp.StatusCode)
	})

	t.Run("author cannot create new published submission after deadline", func(t *testing.T) {
		// Create a new author for this sub-test to avoid unique constraint violation
		newAuthorToken, newAuthor, err := ctx.RegisterUniqueUser("deadlinenewauthor", "password123", "DeadlineNew", "Author", []string{"AI"})
		if err != nil {
			t.Fatalf("Failed to register new author: %v", err)
		}

		// Try to create a new submission with published status after deadline
		newSubmission := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       newAuthor.Email,
			Title:        "New Published Paper After Deadline",
			Abstract:     "Trying to submit after deadline",
			Domain:       []string{"AI"},
			Status:       dto.StatusPublished,
		}

		resp, err := submissionClient.Create(conferenceID, newSubmission, newAuthorToken)
		if err != nil {
			t.Fatalf("Failed to make create request: %v", err)
		}

		// Should return 400 Bad Request or 403 Forbidden
		if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 400 or 403, got %d", resp.StatusCode)
		}

		t.Logf("✓ Author correctly blocked from creating published submission after deadline (status: %d)", resp.StatusCode)
	})
}

// TestTC_NEG_05_ReviewerCannotSubmitInvalidScoring verifies that a reviewer
// cannot submit a review with invalid scoring (out of range values)
func TestTC_NEG_05_ReviewerCannotSubmitInvalidScoring(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := submission.NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create chair user
	chairToken, chair, err := ctx.RegisterUniqueUser("scoringchair", "password123", "Scoring", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create author
	authorToken, author, err := ctx.RegisterUniqueUser("scoringauthor", "password123", "Scoring", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create reviewer
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("scoringreviewer", "password123", "Scoring", "Reviewer", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "Scoring Validation Test Conference",
		Acronym: testutils.UniqueString("SVTC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID := confResp.ID

	// Create submission
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper for Scoring Validation",
		Abstract:     "Testing scoring validation",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	created, err := submissionClient.CreateSuccess(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID := created.ID

	// Add reviewer to conference
	addReviewerPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID)
	reviewerRequest := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewer.ID, "domain": []string{"AI"}},
		},
	}
	addReviewerResp, err := ctx.MakeRequest("POST", addReviewerPath, reviewerRequest, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addReviewerResp, http.StatusCreated)

	// Accept reviewer invitation
	var addReviewerResult struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addReviewerResp, &addReviewerResult)

	if len(addReviewerResult.Data.Success) > 0 {
		reviewerRecordID := addReviewerResult.Data.Success[0].ID
		updateStatusPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID)
		statusUpdate := map[string]interface{}{
			"status": "accepted",
		}
		statusResp, err := ctx.MakeRequest("PUT", updateStatusPath, statusUpdate, chairToken)
		if err != nil {
			t.Fatalf("Failed to update reviewer status: %v", err)
		}
		testutils.AssertStatusCode(t, statusResp, http.StatusOK)
	}

	// Create assignment using add suggestion + confirm workflow
	addSuggestionPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID)
	addSuggestionReq := map[string]interface{}{
		"submission_id": submissionID,
		"reviewer_id":   addReviewerResult.Data.Success[0].ID, // Use reviewer record ID
	}
	addSuggestionResp, err := ctx.MakeRequest("POST", addSuggestionPath, addSuggestionReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, addSuggestionResp, http.StatusCreated)

	var suggestionData struct {
		Data *dto.AddSuggestionResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addSuggestionResp, &suggestionData)
	assignmentID := suggestionData.Data.Assignment.ID

	// Confirm the suggestion to make it a real assignment
	confirmPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID)
	confirmReq := map[string]interface{}{
		"assignment_ids": []int64{assignmentID},
	}
	confirmResp, err := ctx.MakeRequest("POST", confirmPath, confirmReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestion: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	t.Logf("Setup complete: Reviewer assigned to submission")

	t.Run("reviewer cannot submit review with score out of range (too high)", func(t *testing.T) {
		reviewPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID)
		reviewReq := map[string]interface{}{
			"assignment_id": assignmentID,
			"conference_id": conferenceID,
			"review_score":  15.0, // Invalid: should be 0-10
			"review_data": map[string]interface{}{
				"criteria": map[string]interface{}{
					"originality":       11, // Invalid: should be 1-10
					"technical_quality": 9,
					"clarity":           7,
					"significance":      8,
					"methodology":       8,
				},
				"feedback": map[string]interface{}{
					"strengths": "Good paper",
				},
				"recommendation": "accept",
				"confidence":     "high",
			},
			"status": "submitted",
		}

		resp, err := ctx.MakeRequest("PUT", reviewPath, reviewReq, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make review request: %v", err)
		}

		// Should return 400 Bad Request
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if errMsg, ok := respMap["error"]; ok {
			t.Logf("Validation error: %v", errMsg)
		} else {
			t.Error("Expected error field in response")
		}

		t.Log("✓ Reviewer correctly blocked from submitting review with score too high")
	})

	t.Run("reviewer cannot submit review with negative score", func(t *testing.T) {
		reviewPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID)
		reviewReq := map[string]interface{}{
			"assignment_id": assignmentID,
			"conference_id": conferenceID,
			"review_score":  -1.0, // Invalid: negative score
			"review_data": map[string]interface{}{
				"criteria": map[string]interface{}{
					"originality":       0, // Invalid: should be 1-10
					"technical_quality": 9,
					"clarity":           7,
					"significance":      8,
					"methodology":       8,
				},
				"feedback": map[string]interface{}{
					"strengths": "Good paper",
				},
				"recommendation": "accept",
				"confidence":     "high",
			},
			"status": "submitted",
		}

		resp, err := ctx.MakeRequest("PUT", reviewPath, reviewReq, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make review request: %v", err)
		}

		// Should return 400 Bad Request
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)

		t.Log("✓ Reviewer correctly blocked from submitting review with negative score")
	})

	t.Run("reviewer cannot submit review with invalid criteria values", func(t *testing.T) {
		reviewPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID)
		reviewReq := map[string]interface{}{
			"assignment_id": assignmentID,
			"conference_id": conferenceID,
			"review_score":  8.0,
			"review_data": map[string]interface{}{
				"criteria": map[string]interface{}{
					"originality":       8,
					"technical_quality": 100, // Invalid: too high
					"clarity":           -5,  // Invalid: negative
					"significance":      0,   // Invalid: should be 1-10
					"methodology":       8,
				},
				"feedback": map[string]interface{}{
					"strengths": "Good paper",
				},
				"recommendation": "accept",
				"confidence":     "high",
			},
			"status": "submitted",
		}

		resp, err := ctx.MakeRequest("PUT", reviewPath, reviewReq, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make review request: %v", err)
		}

		// Should return 400 Bad Request
		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)

		var respMap map[string]interface{}
		testutils.DecodeResponse(t, resp, &respMap)
		if errMsg, ok := respMap["error"]; ok {
			t.Logf("Validation error: %v", errMsg)
		}

		t.Log("✓ Reviewer correctly blocked from submitting review with invalid criteria values")
	})

	t.Run("reviewer can submit review with valid scores", func(t *testing.T) {
		reviewPath := fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/review", conferenceID, assignmentID)
		reviewReq := map[string]interface{}{
			"assignment_id": assignmentID,
			"conference_id": conferenceID,
			"review_score":  8.5, // Valid: 0-10
			"review_data": map[string]interface{}{
				"criteria": map[string]interface{}{
					"originality":       8,  // Valid: 1-10
					"technical_quality": 9,  // Valid: 1-10
					"clarity":           7,  // Valid: 1-10
					"significance":      8,  // Valid: 1-10
					"methodology":       10, // Valid: 1-10
				},
				"feedback": map[string]interface{}{
					"summary":    "Well-written paper with strong contributions",
					"strengths":  "Excellent research",
					"weaknesses": "Minor presentation issues",
				},
				"recommendation": "accept",
				"confidence":     "high",
			},
			"status":                           "submitted",
			"audit_failure_override_confirmed": true,
		}

		resp, err := ctx.MakeRequest("PUT", reviewPath, reviewReq, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make review request: %v", err)
		}

		// Should return 200 OK for valid scores
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Reviewer successfully submitted review with valid scores (positive control)")
	})
}
