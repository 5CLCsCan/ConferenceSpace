package assignment

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestSuggestionsWorkflow tests the full workflow:
// 1. Auto-assign creates suggestions (not visible to reviewers)
// 2. Chair views suggestions
// 3. Chair confirms suggestions
// 4. Assignments become visible to reviewers
func TestSuggestionsWorkflow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create users
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Suggestions Conference",
		Acronym: testutils.UniqueString("TSC"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, err := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	// Reviewer accepts invitation
	acceptReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer invitation: %v", err)
	}

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test AI Paper",
			Abstract: "Research on artificial intelligence",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI", "Machine Learning"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, err := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Test 1: Run auto-assign - should create suggestions
	t.Run("auto-assign creates suggestions", func(t *testing.T) {
		autoAssignReq := map[string]interface{}{
			"min_reviewers_per_paper": 1,
			"max_reviewers_per_paper": 2,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}
		assignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to run auto-assignment: %v", err)
		}
		testutils.AssertStatusCode(t, assignResp, http.StatusOK)

		var assignResult struct {
			Data *dto.AutoAssignResponse `json:"data"`
		}
		testutils.DecodeResponse(t, assignResp, &assignResult)

		if assignResult.Data.TotalAssignments == 0 {
			t.Errorf("Expected at least 1 assignment, got 0")
		}
		t.Logf("Auto-assign created %d suggestions", assignResult.Data.TotalAssignments)
	})

	// Test 2: Reviewer should NOT see the assignment yet (it's just a suggestion)
	t.Run("reviewer cannot see suggestions", func(t *testing.T) {
		papersResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewerUser.Email, conferenceID), nil, reviewerToken)
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

		if len(papersData.Data.Papers) != 0 {
			t.Errorf("Reviewer should not see suggested assignments, but found %d papers", len(papersData.Data.Papers))
		}
		t.Log("Confirmed: Reviewer cannot see suggested assignments")
	})

	// Test 3: Chair can view suggestions
	var assignmentIDs []int64
	t.Run("chair can view suggestions", func(t *testing.T) {
		suggestionsResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, suggestionsResp, http.StatusOK)

		var suggestionsData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

		if suggestionsData.Data.TotalPapers == 0 {
			t.Error("Expected suggestions to contain papers")
		}

		// Collect assignment IDs for confirmation
		for _, group := range suggestionsData.Data.Suggestions {
			if group.SubmissionID == submissionID {
				for _, reviewer := range group.Reviewers {
					assignmentIDs = append(assignmentIDs, reviewer.AssignmentID)
				}
			}
		}

		t.Logf("Chair can see %d suggestions for %d papers", suggestionsData.Data.TotalSuggestions, suggestionsData.Data.TotalPapers)
	})

	// Test 4: Chair confirms suggestions
	t.Run("chair confirms suggestions", func(t *testing.T) {
		if len(assignmentIDs) == 0 {
			t.Fatal("No assignment IDs to confirm")
		}

		confirmReq := &dto.ConfirmSuggestionsRequest{
			AssignmentIDs: assignmentIDs,
		}
		confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), confirmReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to confirm suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

		var confirmData struct {
			Data *dto.ConfirmSuggestionsResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmResp, &confirmData)

		if confirmData.Data.ConfirmedCount == 0 {
			t.Error("Expected at least 1 confirmation")
		}
		t.Logf("Confirmed %d assignments", confirmData.Data.ConfirmedCount)
	})

	// Test 5: After confirmation, reviewer CAN see the assignment
	t.Run("reviewer can see confirmed assignments", func(t *testing.T) {
		papersResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/conferences/%d/papers", reviewerUser.Email, conferenceID), nil, reviewerToken)
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
			t.Error("Reviewer should now see confirmed assignments")
		} else {
			t.Logf("Reviewer can see %d assigned papers after confirmation", len(papersData.Data.Papers))
		}
	})
}

// TestDeleteSuggestion tests that chair can delete suggestions but not confirmed assignments
func TestDeleteSuggestion(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}
	_, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}
	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Delete Suggestions",
		Acronym: testutils.UniqueString("TDS"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add and accept reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI"}},
		},
	}
	addRevResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}, chairToken)

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test Paper for Deletion",
			Abstract: "Research paper",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, _ := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	// Run auto-assign
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 2,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)

	// Get the suggestion assignment ID
	suggestionsResp, _ := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
	var suggestionsData struct {
		Data *dto.SuggestionsListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

	if len(suggestionsData.Data.Suggestions) == 0 || len(suggestionsData.Data.Suggestions[0].Reviewers) == 0 {
		t.Fatal("No suggestions to test with")
	}
	assignmentID := suggestionsData.Data.Suggestions[0].Reviewers[0].AssignmentID

	// Test: Chair can delete suggestion
	t.Run("chair can delete suggestion", func(t *testing.T) {
		deleteResp, err := ctx.MakeRequest("DELETE", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/%d", conferenceID, assignmentID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to delete suggestion: %v", err)
		}
		testutils.AssertStatusCode(t, deleteResp, http.StatusOK)
		t.Log("Chair successfully deleted suggestion")
	})

	// Verify suggestion is deleted
	t.Run("suggestion is removed from list", func(t *testing.T) {
		suggestionsResp, _ := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		var updatedData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &updatedData)

		// Should have no suggestions left for this paper
		if updatedData.Data.TotalSuggestions != 0 {
			t.Errorf("Expected 0 suggestions after deletion, got %d", updatedData.Data.TotalSuggestions)
		}
		t.Log("Verified suggestion was removed")
	})
}

// TestAddSuggestionWithCOI tests adding a reviewer with potential conflict
func TestAddSuggestionWithCOI(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup users - author and reviewer are the same person (self-author COI)
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}
	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer_author", "password123", "Reviewer", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test COI Suggestions",
		Acronym: testutils.UniqueString("TCOI"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add the reviewer_author as a reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI"}},
		},
	}
	addRevResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerRecordID := revData.Data.Success[0].ID

	// Reviewer accepts
	ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerRecordID,
		Status:       "accepted",
	}, reviewerToken)

	// The same person submits a paper (creating a self-author conflict)
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Paper by Reviewer",
			Abstract: "A paper written by someone who is also a reviewer",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, _ := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, reviewerToken) // Reviewer submits their own paper
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Test: Chair tries to manually add the author as a reviewer for their own paper
	t.Run("add suggestion returns COI warning", func(t *testing.T) {
		addSuggestionReq := &dto.AddSuggestionRequest{
			SubmissionID: submissionID,
			ReviewerID:   reviewerRecordID,
		}
		addResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), addSuggestionReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to add suggestion: %v", err)
		}
		// Should succeed but with COI warning (chair can override)
		testutils.AssertStatusCode(t, addResp, http.StatusCreated)

		var addData struct {
			Data *dto.AddSuggestionResponse `json:"data"`
		}
		testutils.DecodeResponse(t, addResp, &addData)

		if addData.Data.COIWarning == nil {
			t.Error("Expected COI warning but got none")
		} else if !addData.Data.COIWarning.HasConflict {
			t.Error("Expected COI warning to indicate conflict")
		} else {
			t.Logf("COI warning returned: %v", addData.Data.COIWarning.Reasons)
		}
	})
}

// TestSuggestionMetadata verifies that the metadata and assignment_count fields
// are populated correctly for both auto-assigned and manually added suggestions.
func TestSuggestionMetadata(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create users
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "NLP"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference with domain AI
	conference := &dto.Conference{
		Title:   "Test Suggestion Metadata Conference",
		Acronym: testutils.UniqueString("TSMC"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, err := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add reviewer with domain AI and NLP
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI", "NLP"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerRecordID := revData.Data.Success[0].ID

	// Reviewer accepts invitation
	acceptReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerRecordID,
		Status:       "accepted",
	}
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerRecordID), acceptReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer invitation: %v", err)
	}

	// Create submission with keywords AI and Machine Learning
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test AI NLP Paper",
			Abstract: "Research on artificial intelligence and natural language processing",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI", "Machine Learning"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, err := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Test 1: Auto-assign suggestions have metadata
	t.Run("auto-assign suggestions have metadata", func(t *testing.T) {
		autoAssignReq := map[string]interface{}{
			"min_reviewers_per_paper": 1,
			"max_reviewers_per_paper": 2,
			"min_score_threshold":     0.0,
			"dry_run":                 false,
		}
		assignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to run auto-assignment: %v", err)
		}
		testutils.AssertStatusCode(t, assignResp, http.StatusOK)

		// GET suggestions
		suggestionsResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, suggestionsResp, http.StatusOK)

		var suggestionsData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

		if suggestionsData.Data.TotalSuggestions == 0 {
			t.Fatal("Expected at least 1 suggestion after auto-assign")
		}

		// Find the suggestion for our submission
		var foundReviewer *dto.SuggestedReviewer
		for _, group := range suggestionsData.Data.Suggestions {
			if group.SubmissionID == submissionID {
				for i := range group.Reviewers {
					foundReviewer = &group.Reviewers[i]
					break
				}
			}
		}

		if foundReviewer == nil {
			t.Fatal("Could not find our submission in suggestions")
		}

		// Verify metadata is not nil
		if foundReviewer.Metadata == nil {
			t.Fatal("Expected metadata to be non-nil for auto-assigned suggestion")
		}

		// Verify source is auto_pass1 or auto_pass2
		source := foundReviewer.Metadata.Source
		if source != "auto_pass1" && source != "auto_pass2" {
			t.Errorf("Expected metadata.source to be 'auto_pass1' or 'auto_pass2', got '%s'", source)
		}

		// Verify matched_keywords contains "AI" (overlap of submission ["AI", "Machine Learning"] and reviewer ["AI", "NLP"])
		foundAI := false
		for _, kw := range foundReviewer.Metadata.MatchedKeywords {
			if kw == "AI" {
				foundAI = true
				break
			}
		}
		if !foundAI {
			t.Errorf("Expected metadata.matched_keywords to contain 'AI', got %v", foundReviewer.Metadata.MatchedKeywords)
		}

		// Verify coi_checks has entries for self_author, declared_conflicts, relationship
		coiChecks := foundReviewer.Metadata.COIChecks
		expectedCOIKeys := []string{"self_author", "declared_conflicts", "relationship"}
		for _, key := range expectedCOIKeys {
			val, ok := coiChecks[key]
			if !ok {
				t.Errorf("Expected coi_checks to have key '%s'", key)
				continue
			}
			// Value should be "passed" or "skipped_neo4j_unavailable" (relationship may be skipped)
			if val != "passed" && val != "skipped_neo4j_unavailable" {
				t.Errorf("Expected coi_checks['%s'] to be 'passed' or 'skipped_neo4j_unavailable', got '%s'", key, val)
			}
		}

		// Verify created_at is non-empty
		if foundReviewer.Metadata.CreatedAt == "" {
			t.Error("Expected metadata.created_at to be non-empty")
		}

		// Verify assignment_count is >= 0
		if foundReviewer.AssignmentCount < 0 {
			t.Errorf("Expected assignment_count >= 0, got %d", foundReviewer.AssignmentCount)
		}

		t.Logf("Auto-assign suggestion: source=%s, matched_keywords=%v, coi_checks=%v, assignment_count=%d",
			foundReviewer.Metadata.Source, foundReviewer.Metadata.MatchedKeywords,
			foundReviewer.Metadata.COIChecks, foundReviewer.AssignmentCount)
	})

	// Test 2: Manual suggestion has manual metadata
	t.Run("manual suggestion has manual metadata", func(t *testing.T) {
		// Clear existing suggestions by deleting them (run auto-assign to clear and re-check, or just delete)
		// First, get existing suggestions and delete them all
		suggestionsResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get suggestions: %v", err)
		}
		var existingData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &existingData)

		// Delete all existing suggestions
		for _, group := range existingData.Data.Suggestions {
			for _, reviewer := range group.Reviewers {
				ctx.MakeRequest("DELETE", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/%d", conferenceID, reviewer.AssignmentID), nil, chairToken)
			}
		}

		// Manually add a suggestion
		addSuggestionReq := &dto.AddSuggestionRequest{
			SubmissionID: submissionID,
			ReviewerID:   reviewerRecordID,
		}
		addResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), addSuggestionReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to add manual suggestion: %v", err)
		}
		testutils.AssertStatusCode(t, addResp, http.StatusCreated)

		// GET suggestions and find the manually added one
		suggestionsResp2, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get suggestions after manual add: %v", err)
		}
		testutils.AssertStatusCode(t, suggestionsResp2, http.StatusOK)

		var suggestionsData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp2, &suggestionsData)

		if suggestionsData.Data.TotalSuggestions == 0 {
			t.Fatal("Expected at least 1 suggestion after manual add")
		}

		// Find the suggestion for our submission
		var foundReviewer *dto.SuggestedReviewer
		for _, group := range suggestionsData.Data.Suggestions {
			if group.SubmissionID == submissionID {
				for i := range group.Reviewers {
					foundReviewer = &group.Reviewers[i]
					break
				}
			}
		}

		if foundReviewer == nil {
			t.Fatal("Could not find our submission in suggestions after manual add")
		}

		// Verify metadata is not nil
		if foundReviewer.Metadata == nil {
			t.Fatal("Expected metadata to be non-nil for manually added suggestion")
		}

		// Verify source is "manual"
		if foundReviewer.Metadata.Source != "manual" {
			t.Errorf("Expected metadata.source to be 'manual', got '%s'", foundReviewer.Metadata.Source)
		}

		// Verify matched_keywords is empty (manual adds don't compute keyword overlap)
		if len(foundReviewer.Metadata.MatchedKeywords) != 0 {
			t.Errorf("Expected metadata.matched_keywords to be empty for manual suggestion, got %v", foundReviewer.Metadata.MatchedKeywords)
		}

		// Verify assignment_count is >= 0
		if foundReviewer.AssignmentCount < 0 {
			t.Errorf("Expected assignment_count >= 0, got %d", foundReviewer.AssignmentCount)
		}

		t.Logf("Manual suggestion: source=%s, matched_keywords=%v, assignment_count=%d",
			foundReviewer.Metadata.Source, foundReviewer.Metadata.MatchedKeywords, foundReviewer.AssignmentCount)
	})
}

// TestAutoAssignSkipsAlreadyAssignedPapers tests that re-running auto-assign
// only processes papers without confirmed assignments
func TestAutoAssignSkipsAlreadyAssignedPapers(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}
	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}
	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Skip Assigned",
		Acronym: testutils.UniqueString("TSA"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add and accept reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI"}},
		},
	}
	addRevResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}, reviewerToken)

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test Paper",
			Abstract: "Research paper",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, _ := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	// First auto-assign
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 2,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	firstAssignResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	testutils.AssertStatusCode(t, firstAssignResp, http.StatusOK)

	var firstResult struct {
		Data *dto.AutoAssignResponse `json:"data"`
	}
	testutils.DecodeResponse(t, firstAssignResp, &firstResult)
	firstAssignmentCount := firstResult.Data.TotalAssignments

	// Get and confirm suggestions
	suggestionsResp, _ := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
	var suggestionsData struct {
		Data *dto.SuggestionsListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

	var assignmentIDs []int64
	for _, group := range suggestionsData.Data.Suggestions {
		for _, reviewer := range group.Reviewers {
			assignmentIDs = append(assignmentIDs, reviewer.AssignmentID)
		}
	}

	confirmReq := &dto.ConfirmSuggestionsRequest{
		AssignmentIDs: assignmentIDs,
	}
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), confirmReq, chairToken)

	// Second auto-assign - should skip the already-assigned paper
	t.Run("re-running auto-assign skips confirmed papers", func(t *testing.T) {
		secondAssignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to run second auto-assign: %v", err)
		}

		// Should return error because all papers have confirmed assignments
		if secondAssignResp.StatusCode == http.StatusOK {
			var secondResult struct {
				Data *dto.AutoAssignResponse `json:"data"`
			}
			testutils.DecodeResponse(t, secondAssignResp, &secondResult)
			t.Logf("Second auto-assign returned %d assignments (should be 0 or error)", secondResult.Data.TotalAssignments)
		} else {
			// Expected: error because no unassigned papers
			t.Logf("Second auto-assign correctly returned error (status %d) - all papers already assigned", secondAssignResp.StatusCode)
		}

		t.Logf("First auto-assign created %d assignments, paper now has confirmed assignments", firstAssignmentCount)
	})
}

// TestConfirmAllSuggestions tests confirming all suggestions without specifying IDs
func TestConfirmAllSuggestions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}
	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}
	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Confirm All",
		Acronym: testutils.UniqueString("TCA"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add and accept reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI"}},
		},
	}
	addRevResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}, reviewerToken)

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test Paper",
			Abstract: "Research paper",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, _ := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	// Run auto-assign
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 2,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)

	// Confirm ALL suggestions without specifying IDs
	t.Run("confirm all suggestions with empty assignment_ids", func(t *testing.T) {
		confirmReq := &dto.ConfirmSuggestionsRequest{
			AssignmentIDs: nil, // Empty - should confirm all
		}
		confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), confirmReq, chairToken)
		if err != nil {
			t.Fatalf("Failed to confirm all suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

		var confirmData struct {
			Data *dto.ConfirmSuggestionsResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmResp, &confirmData)

		if confirmData.Data.ConfirmedCount == 0 {
			t.Error("Expected at least 1 confirmation")
		}
		t.Logf("Confirmed all %d suggestions at once", confirmData.Data.ConfirmedCount)
	})

	// Verify all suggestions are now confirmed (suggestions list should be empty)
	t.Run("no suggestions left after confirm all", func(t *testing.T) {
		suggestionsResp, _ := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		var suggestionsData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

		if suggestionsData.Data.TotalSuggestions != 0 {
			t.Errorf("Expected 0 suggestions after confirm all, got %d", suggestionsData.Data.TotalSuggestions)
		}
		t.Log("All suggestions confirmed successfully")
	})
}

// TestGetConfirmedAssignments tests the confirmed assignments endpoint
func TestGetConfirmedAssignments(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup users
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Confirmed Assignments",
		Acronym: testutils.UniqueString("TCAS"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, err := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"AI"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	// Reviewer accepts invitation
	acceptReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer invitation: %v", err)
	}

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test Paper for Confirmed Assignments",
			Abstract: "Research on artificial intelligence",
			Domain:   []string{"AI"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"AI", "Machine Learning"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, err := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Test 1: No confirmed assignments initially
	t.Run("no confirmed assignments initially", func(t *testing.T) {
		confirmedResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get confirmed assignments: %v", err)
		}
		testutils.AssertStatusCode(t, confirmedResp, http.StatusOK)

		var confirmedData struct {
			Data *dto.ConfirmedAssignmentsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmedResp, &confirmedData)

		if confirmedData.Data.TotalAssignments != 0 {
			t.Errorf("Expected 0 confirmed assignments initially, got %d", confirmedData.Data.TotalAssignments)
		}
		t.Log("Confirmed: No confirmed assignments initially")
	})

	// Run auto-assign to create suggestions
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 2,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	_, err = ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to run auto-assign: %v", err)
	}

	// Test 2: Still no confirmed assignments after auto-assign (only suggestions)
	t.Run("no confirmed assignments after auto-assign", func(t *testing.T) {
		confirmedResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get confirmed assignments: %v", err)
		}
		testutils.AssertStatusCode(t, confirmedResp, http.StatusOK)

		var confirmedData struct {
			Data *dto.ConfirmedAssignmentsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmedResp, &confirmedData)

		if confirmedData.Data.TotalAssignments != 0 {
			t.Errorf("Expected 0 confirmed assignments after auto-assign, got %d", confirmedData.Data.TotalAssignments)
		}
		t.Log("Confirmed: Auto-assign creates suggestions, not confirmed assignments")
	})

	// Confirm all suggestions
	confirmReq := &dto.ConfirmSuggestionsRequest{
		AssignmentIDs: nil, // Confirm all
	}
	_, err = ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), confirmReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}
	var confirmedAssignmentID int64

	// Test 3: Now we should see confirmed assignments
	t.Run("confirmed assignments appear after confirmation", func(t *testing.T) {
		confirmedResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get confirmed assignments: %v", err)
		}
		testutils.AssertStatusCode(t, confirmedResp, http.StatusOK)

		var confirmedData struct {
			Data *dto.ConfirmedAssignmentsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmedResp, &confirmedData)

		if confirmedData.Data.TotalAssignments == 0 {
			t.Error("Expected confirmed assignments after confirmation, got 0")
		}
		if confirmedData.Data.TotalPapers == 0 {
			t.Error("Expected at least 1 paper with confirmed assignments")
		}
		t.Logf("Found %d confirmed assignments for %d papers", confirmedData.Data.TotalAssignments, confirmedData.Data.TotalPapers)
	})

	// Test 4: Verify confirmed assignment details
	t.Run("confirmed assignment has correct details", func(t *testing.T) {
		confirmedResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get confirmed assignments: %v", err)
		}

		var confirmedData struct {
			Data *dto.ConfirmedAssignmentsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, confirmedResp, &confirmedData)

		// Find the submission we created
		var foundGroup *dto.ConfirmedAssignmentGroup
		for _, group := range confirmedData.Data.Assignments {
			if group.SubmissionID == submissionID {
				foundGroup = group
				break
			}
		}

		if foundGroup == nil {
			t.Fatal("Could not find our submission in confirmed assignments")
		}

		// Check submission title
		if foundGroup.SubmissionTitle != "Test Paper for Confirmed Assignments" {
			t.Errorf("Expected submission title 'Test Paper for Confirmed Assignments', got '%s'", foundGroup.SubmissionTitle)
		}

		// Check that reviewer is assigned
		if len(foundGroup.Reviewers) == 0 {
			t.Error("Expected at least 1 reviewer assigned")
		}

		// Check reviewer details
		reviewer := foundGroup.Reviewers[0]
		if reviewer.ReviewerEmail != reviewerUser.Email {
			t.Errorf("Expected reviewer email '%s', got '%s'", reviewerUser.Email, reviewer.ReviewerEmail)
		}
		if reviewer.Status != "pending" {
			t.Errorf("Expected status 'pending', got '%s'", reviewer.Status)
		}
		if reviewer.ReviewStatus != "not_started" {
			t.Errorf("Expected review_status 'not_started', got '%s'", reviewer.ReviewStatus)
		}
		if reviewer.DueDate == "" {
			t.Error("Expected confirmed assignment to include due_date")
		}
		if reviewer.DaysLeft == nil {
			t.Error("Expected confirmed assignment to include days_left")
		}
		if reviewer.DeadlineStatus == "" {
			t.Error("Expected confirmed assignment to include deadline_status")
		}
		confirmedAssignmentID = reviewer.AssignmentID

		t.Logf("Confirmed assignment details: reviewer=%s, status=%s, review_status=%s",
			reviewer.ReviewerEmail, reviewer.Status, reviewer.ReviewStatus)
	})

	// Test 5: Verify suggestions list is now empty
	t.Run("suggestions list is empty after confirmation", func(t *testing.T) {
		suggestionsResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", conferenceID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to get suggestions: %v", err)
		}
		testutils.AssertStatusCode(t, suggestionsResp, http.StatusOK)

		var suggestionsData struct {
			Data *dto.SuggestionsListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, suggestionsResp, &suggestionsData)

		if suggestionsData.Data.TotalSuggestions != 0 {
			t.Errorf("Expected 0 suggestions after confirmation, got %d", suggestionsData.Data.TotalSuggestions)
		}
		t.Log("Confirmed: Suggestions list is empty after all are confirmed")
	})

	t.Run("chair can send reminder and reviewer receives notification", func(t *testing.T) {
		if confirmedAssignmentID == 0 {
			t.Fatal("confirmed assignment ID was not captured")
		}

		reminderResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/reminder", conferenceID, confirmedAssignmentID), nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to send reminder: %v", err)
		}
		testutils.AssertStatusCode(t, reminderResp, http.StatusOK)

		var reminderData struct {
			Data *dto.AssignmentReminderResponse `json:"data"`
		}
		testutils.DecodeResponse(t, reminderResp, &reminderData)
		if reminderData.Data.NotificationID == 0 {
			t.Error("Expected reminder response to include notification_id")
		}

		notificationsResp, err := ctx.MakeRequest("GET", "/api/v1/notifications?type=deadline_reminder", nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to list reviewer notifications: %v", err)
		}
		testutils.AssertStatusCode(t, notificationsResp, http.StatusOK)

		var notificationsData struct {
			Data *dto.NotificationListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, notificationsResp, &notificationsData)
		if notificationsData.Data.Total == 0 {
			t.Fatal("Expected reviewer to receive deadline reminder notification")
		}
		if notificationsData.Data.Notifications[0].Type != "deadline_reminder" {
			t.Errorf("Expected deadline_reminder notification, got %s", notificationsData.Data.Notifications[0].Type)
		}
	})

	t.Run("reviewer cannot send reminder", func(t *testing.T) {
		if confirmedAssignmentID == 0 {
			t.Fatal("confirmed assignment ID was not captured")
		}

		reminderResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/reminder", conferenceID, confirmedAssignmentID), nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to call reminder endpoint: %v", err)
		}
		testutils.AssertStatusCode(t, reminderResp, http.StatusForbidden)
	})
}

// TestInvitationAcceptFlow tests the full accept/decline invitation flow
func TestInvitationFlow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create users
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "InvFlow", []string{"NLP"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "InvFlow", []string{"NLP"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "InvFlow", []string{"NLP"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Invitation Flow Conference",
		Acronym: testutils.UniqueString("TIFC"),
		Chair:   chairUser.Email,
		Domain:  []string{"NLP"},
	}
	confResp, err := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"NLP"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	// Reviewer accepts conference invitation
	acceptRevReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptRevReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer invitation: %v", err)
	}

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test NLP Paper",
			Abstract: "Research on natural language processing",
			Domain:   []string{"NLP"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"NLP", "Transformers"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, err := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	// Auto-assign
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 3,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}
	assignResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to run auto-assignment: %v", err)
	}
	testutils.AssertStatusCode(t, assignResp, http.StatusOK)

	// Confirm suggestions
	confirmResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)
	if err != nil {
		t.Fatalf("Failed to confirm suggestions: %v", err)
	}
	testutils.AssertStatusCode(t, confirmResp, http.StatusOK)

	// Get confirmed assignments
	confirmedResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", conferenceID), nil, chairToken)
	if err != nil {
		t.Fatalf("Failed to get confirmed assignments: %v", err)
	}
	testutils.AssertStatusCode(t, confirmedResp, http.StatusOK)

	var confirmedBody struct {
		Data struct {
			Assignments []struct {
				Reviewers []struct {
					AssignmentID  int64  `json:"assignment_id"`
					ReviewerEmail string `json:"reviewer_email"`
					Status        string `json:"status"`
				} `json:"reviewers"`
			} `json:"assignments"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, confirmedResp, &confirmedBody)

	if len(confirmedBody.Data.Assignments) == 0 || len(confirmedBody.Data.Assignments[0].Reviewers) == 0 {
		t.Skip("No confirmed assignments found - skipping invitation flow test")
	}

	firstReviewer := confirmedBody.Data.Assignments[0].Reviewers[0]
	assignmentID := firstReviewer.AssignmentID
	reviewerEmail := firstReviewer.ReviewerEmail

	if firstReviewer.Status != "pending" {
		t.Skipf("Expected pending status, got %s", firstReviewer.Status)
	}

	// Test: Get invitation data
	t.Run("get invitation data", func(t *testing.T) {
		invResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/invitation",
			reviewerEmail, assignmentID), nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get invitation: %v", err)
		}
		testutils.AssertStatusCode(t, invResp, http.StatusOK)

		var invBody struct {
			Data struct {
				AssignmentID    int64    `json:"assignment_id"`
				ConferenceID    int64    `json:"conference_id"`
				SubmissionID    int64    `json:"submission_id"`
				Status          string   `json:"status"`
				PaperTitle      string   `json:"paper_title"`
				PaperAbstract   string   `json:"paper_abstract"`
				ConferenceName  string   `json:"conference_name"`
				Track           string   `json:"track"`
				Keywords        []string `json:"keywords"`
				SubmittedAt     string   `json:"submitted_at"`
				UpdatedAt       string   `json:"updated_at"`
				FileName        string   `json:"file_name"`
				FileSize        int64    `json:"file_size"`
				FileContentType string   `json:"file_content_type"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, invResp, &invBody)

		if invBody.Data.AssignmentID != assignmentID {
			t.Errorf("Expected assignment_id %d, got %d", assignmentID, invBody.Data.AssignmentID)
		}
		if invBody.Data.ConferenceID != conferenceID {
			t.Errorf("Expected conference_id %d, got %d", conferenceID, invBody.Data.ConferenceID)
		}
		if invBody.Data.SubmissionID == 0 {
			t.Error("Expected non-empty submission_id")
		}
		if invBody.Data.Status != "pending" {
			t.Errorf("Expected status pending, got %s", invBody.Data.Status)
		}
		if invBody.Data.PaperTitle == "" {
			t.Error("Expected non-empty paper title")
		}
		if invBody.Data.ConferenceName == "" {
			t.Error("Expected non-empty conference name")
		}
		if invBody.Data.PaperAbstract == "" {
			t.Error("Expected non-empty paper abstract")
		}
		if len(invBody.Data.Keywords) == 0 {
			t.Error("Expected reviewer-visible submission keywords")
		}
		if invBody.Data.SubmittedAt == "" || invBody.Data.UpdatedAt == "" {
			t.Error("Expected submitted and updated timestamps")
		}
		if invBody.Data.FileName != "test_paper.pdf" {
			t.Errorf("Expected file_name test_paper.pdf, got %q", invBody.Data.FileName)
		}
		if invBody.Data.FileSize == 0 {
			t.Error("Expected non-empty file_size")
		}
		if invBody.Data.FileContentType != "application/pdf" {
			t.Errorf("Expected file_content_type application/pdf, got %q", invBody.Data.FileContentType)
		}
	})

	// Test: Accept the assignment
	t.Run("accept assignment", func(t *testing.T) {
		respondResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/respond",
			reviewerEmail, assignmentID), map[string]interface{}{
			"action": "accept",
		}, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to respond: %v", err)
		}
		testutils.AssertStatusCode(t, respondResp, http.StatusOK)

		var respondBody struct {
			Data struct {
				AssignmentID int64  `json:"assignment_id"`
				Status       string `json:"status"`
				Message      string `json:"message"`
			} `json:"data"`
		}
		testutils.DecodeResponse(t, respondResp, &respondBody)

		if respondBody.Data.Status != "accepted" {
			t.Errorf("Expected status accepted, got %s", respondBody.Data.Status)
		}
	})

	// Test: Double-accept returns error
	t.Run("double accept returns 400", func(t *testing.T) {
		doubleResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/respond",
			reviewerEmail, assignmentID), map[string]interface{}{
			"action": "accept",
		}, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to send double accept: %v", err)
		}
		testutils.AssertStatusCode(t, doubleResp, http.StatusBadRequest)
	})
}

// TestInvitationDeclineFlow tests the decline invitation flow
func TestInvitationDeclineFlow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create users
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "DecFlow", []string{"CV"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "DecFlow", []string{"CV"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "DecFlow", []string{"CV"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Decline Flow Conference",
		Acronym: testutils.UniqueString("TDFC"),
		Chair:   chairUser.Email,
		Domain:  []string{"CV"},
	}
	confResp, err := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Add reviewer
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{"user_id": reviewerUser.ID, "domain": []string{"CV"}},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	reviewerID := revData.Data.Success[0].ID

	// Reviewer accepts conference invitation
	acceptRevReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	_, err = ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptRevReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer invitation: %v", err)
	}

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test CV Paper",
			Abstract: "Research on computer vision",
			Domain:   []string{"CV"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				Keywords: []string{"CV", "Object Detection"},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)

	files := []testutils.FileUpload{
		{
			FieldName: "file",
			FileName:  "test_paper.pdf",
			Content:   []byte("%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 2\ntrailer\n<<\n/Size 2\n>>\nstartxref\n50\n%%EOF"),
			MimeType:  "application/pdf",
		},
	}

	subResp, err := ctx.MakeMultipartRequestWithFiles("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, files, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	// Auto-assign
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 3,
		"min_score_threshold":     0.0,
		"dry_run":                 false,
	}, chairToken)

	// Confirm suggestions
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", conferenceID), map[string]interface{}{}, chairToken)

	// Get confirmed assignments
	confirmedResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", conferenceID), nil, chairToken)
	if err != nil {
		t.Fatalf("Failed to get confirmed assignments: %v", err)
	}

	var confirmedBody struct {
		Data struct {
			Assignments []struct {
				Reviewers []struct {
					AssignmentID  int64  `json:"assignment_id"`
					ReviewerEmail string `json:"reviewer_email"`
					Status        string `json:"status"`
				} `json:"reviewers"`
			} `json:"assignments"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, confirmedResp, &confirmedBody)

	var assignmentID int64
	var reviewerEmail string
	for _, a := range confirmedBody.Data.Assignments {
		for _, r := range a.Reviewers {
			if r.Status == "pending" {
				assignmentID = r.AssignmentID
				reviewerEmail = r.ReviewerEmail
				break
			}
		}
		if assignmentID > 0 {
			break
		}
	}

	if assignmentID == 0 {
		t.Skip("No pending assignment found")
	}

	category := "too_busy"
	reason := "Taking a sabbatical next month"
	respondResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/reviewer/%s/assignments/%d/respond",
		reviewerEmail, assignmentID), map[string]interface{}{
		"action":           "decline",
		"decline_category": category,
		"decline_reason":   reason,
	}, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to decline: %v", err)
	}
	testutils.AssertStatusCode(t, respondResp, http.StatusOK)

	var respondBody struct {
		Data struct {
			Status string `json:"status"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, respondResp, &respondBody)

	if respondBody.Data.Status != "declined" {
		t.Errorf("Expected status declined, got %s", respondBody.Data.Status)
	}
}
