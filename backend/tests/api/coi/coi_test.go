package coi_test

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestCOIDashboardStats tests the GET /api/v1/coi/dashboard/stats/:conference_id endpoint
func TestCOIDashboardStats(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Create test users and conference
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference COI Stats",
		Acronym: testutils.UniqueString("TCSTATS"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Run("Get Dashboard Stats Successfully", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/coi/dashboard/stats/%d", conferenceID), nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data dto.COIDashboardStats `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		assert.Equal(t, conferenceID, response.Data.ConferenceID)
		assert.GreaterOrEqual(t, response.Data.TotalReviewers, 0)
		assert.GreaterOrEqual(t, response.Data.TotalPapers, 0)
	})

	t.Run("Get Dashboard Stats - Unauthorized", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/coi/dashboard/stats/%d", conferenceID), nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

// TestCOIRelationshipsList tests the GET /api/v1/coi/relationships endpoint
func TestCOIRelationshipsList(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Create test data
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference COI Relationships",
		Acronym: testutils.UniqueString("TCREL"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Run("Get All Relationships Successfully", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/coi/relationships?conference_id=%d&limit=100&page=1", conferenceID)
		resp, err := ctx.MakeRequest("GET", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data dto.COIRelationshipListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		assert.NotNil(t, response.Data.Relationships)
		assert.GreaterOrEqual(t, response.Data.Total, int64(0))
		assert.Equal(t, 1, response.Data.Page)
		assert.Equal(t, 100, response.Data.Limit)
	})

	t.Run("Filter by Severity", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/coi/relationships?conference_id=%d&severity=high&limit=50", conferenceID)
		resp, err := ctx.MakeRequest("GET", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data dto.COIRelationshipListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		// All returned relationships should have high severity
		for _, rel := range response.Data.Relationships {
			assert.Equal(t, "high", rel.Severity)
		}
	})

	t.Run("Missing Conference ID", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/coi/relationships", nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

// TestCOICheckReviewerAuthor tests the GET /api/v1/coi/check/reviewer/:reviewer_id/author/:author_email endpoint
func TestCOICheckReviewerAuthor(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Create test data
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	_, author1User, _ := ctx.RegisterUniqueUser("author1", "password123", "Author", "One", []string{"AI"})

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference COI Check",
		Acronym: testutils.UniqueString("TCCHECK"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	_ = confData.Data.ID // conferenceID not needed in this test

	t.Run("Missing Conference ID", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/coi/check/reviewer/1/author/%s", author1User.Email)
		resp, err := ctx.MakeRequest("GET", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

// TestCOIPaperSummaries tests the GET /api/v1/coi/papers endpoint with full COI scenario
func TestCOIPaperSummaries(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Setup: Create chair, conference, reviewer, and submission with COI
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	require.NoError(t, err, "Should register chair successfully")
	require.NotNil(t, chairUser, "Chair user should not be nil")
	require.NotEmpty(t, chairToken, "Chair token should not be empty")

	conference := &dto.Conference{
		Title:   "Test Conference COI Papers",
		Acronym: testutils.UniqueString("TCPAPERS"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create reviewer who will also be author (self-authorship COI)
	reviewerToken, reviewerUser, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Alice", "Researcher", []string{"AI"})

	// Invite reviewer
	inviteReq := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conferenceID,
		Reviewers: []dto.Reviewer{
			{UserID: reviewerUser.ID, Domain: []string{"AI"}, Status: "pending"},
		},
	}
	inviteResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), inviteReq, chairToken)

	var inviteData struct {
		Data dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	require.Greater(t, len(inviteData.Data.Success), 0, "Should successfully invite reviewer")
	reviewerID := inviteData.Data.Success[0].ID

	// Accept the invitation
	acceptReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	acceptResp, _ := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptReq, reviewerToken)
	require.Equal(t, http.StatusOK, acceptResp.StatusCode, "Reviewer should accept invitation")

	// Create submission by the same reviewer (self-authorship)
	submissionClient := submission.NewClient(ctx)
	submissionData := &dto.Submission{
		Title:    "Test Paper with COI",
		Abstract: "This paper has a self-authorship conflict",
		Domain:   []string{"AI"},
		Status:   dto.StatusDraft,
	}
	submissionResp, err := submissionClient.Create(conferenceID, submissionData, reviewerToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusCreated, submissionResp.StatusCode)

	// Trigger COI detection
	rebuildResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/coi/conferences/%d/rebuild", conferenceID), nil, chairToken)
	require.Equal(t, http.StatusOK, rebuildResp.StatusCode)

	// Now run subtests
	t.Run("Get Paper Summaries Successfully", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/coi/papers?conference_id=%d&limit=10&page=1", conferenceID)
		resp, err := ctx.MakeRequest("GET", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data dto.PaperCOIListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		assert.NotNil(t, response.Data.Papers)
		assert.GreaterOrEqual(t, response.Data.Total, int64(0))
		assert.Equal(t, 1, response.Data.Page)
		assert.Equal(t, 10, response.Data.Limit)
	})

	t.Run("Paper Summaries Include Conflicted Reviewers", func(t *testing.T) {
		// Test the papers endpoint
		url := fmt.Sprintf("/api/v1/coi/papers?conference_id=%d&limit=10&page=1", conferenceID)
		resp, err := ctx.MakeRequest("GET", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data dto.PaperCOIListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		// Should have at least one paper
		require.Greater(t, len(response.Data.Papers), 0, "Should have at least one paper")

		// Find the paper with conflicts
		var conflictedPaper *dto.PaperCOISummary
		for _, paper := range response.Data.Papers {
			if paper.TotalConflicts > 0 {
				conflictedPaper = paper
				break
			}
		}

		// Verify paper with conflicts exists
		require.NotNil(t, conflictedPaper, "Should have at least one paper with conflicts")

		// Verify conflict counts match
		assert.Equal(t, conflictedPaper.TotalConflicts,
			conflictedPaper.HighSeverityCount+conflictedPaper.MediumSeverityCount+conflictedPaper.LowSeverityCount,
			"Total conflicts should equal sum of severity counts")

		// Verify conflicted reviewers are populated
		require.Greater(t, len(conflictedPaper.ConflictedReviewers), 0, "Should have at least one conflicted reviewer")

		// Verify reviewer details are correct
		conflictedReviewer := conflictedPaper.ConflictedReviewers[0]
		assert.Equal(t, reviewerID, conflictedReviewer.ReviewerID, "Reviewer ID should match")
		assert.Equal(t, reviewerUser.Email, conflictedReviewer.ReviewerEmail, "Reviewer email should match")
		assert.NotEmpty(t, conflictedReviewer.ReviewerName, "Reviewer name should not be empty")
		assert.NotEmpty(t, conflictedReviewer.Severity, "Severity should not be empty")
		assert.Contains(t, []string{"high", "medium", "low"}, conflictedReviewer.Severity, "Severity should be valid")
		assert.Greater(t, len(conflictedReviewer.Reasons), 0, "Should have at least one reason")

		t.Logf("Paper: %s", conflictedPaper.PaperTitle)
		t.Logf("  Total Conflicts: %d (High: %d, Medium: %d, Low: %d)",
			conflictedPaper.TotalConflicts,
			conflictedPaper.HighSeverityCount,
			conflictedPaper.MediumSeverityCount,
			conflictedPaper.LowSeverityCount)
		t.Logf("  Conflicted Reviewer: %s (%s) - Severity: %s",
			conflictedReviewer.ReviewerName,
			conflictedReviewer.ReviewerEmail,
			conflictedReviewer.Severity)
		t.Logf("  Reasons: %v", conflictedReviewer.Reasons)
	})

	t.Run("Missing Conference ID", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/coi/papers", nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})
}

// TestCOIRebuild tests the POST /api/v1/coi/conferences/:conference_id/rebuild endpoint
func TestCOIRebuild(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Create test data
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference COI Rebuild",
		Acronym: testutils.UniqueString("TCREBUILD"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Run("Rebuild COI Successfully", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/coi/conferences/%d/rebuild", conferenceID)
		resp, err := ctx.MakeRequest("POST", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response struct {
			Data dto.COIRebuildResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &response)

		assert.Equal(t, conferenceID, response.Data.ConferenceID)
		assert.GreaterOrEqual(t, response.Data.RelationshipsFound, 0)
		assert.GreaterOrEqual(t, response.Data.RelationshipsStored, 0)
		assert.GreaterOrEqual(t, response.Data.DetectionTimeMs, int64(0))
	})

	t.Run("Rebuild COI - Multiple Times", func(t *testing.T) {
		// First rebuild
		url := fmt.Sprintf("/api/v1/coi/conferences/%d/rebuild", conferenceID)
		resp1, err := ctx.MakeRequest("POST", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp1.StatusCode)

		// Second rebuild (should clear old data and rebuild)
		resp2, err := ctx.MakeRequest("POST", url, nil, chairToken)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp2.StatusCode)

		var response struct {
			Data dto.COIRebuildResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp2, &response)

		// Should have same number of relationships
		assert.GreaterOrEqual(t, response.Data.RelationshipsStored, 0)
	})

	t.Run("Rebuild COI - Unauthorized", func(t *testing.T) {
		url := fmt.Sprintf("/api/v1/coi/conferences/%d/rebuild", conferenceID)
		resp, err := ctx.MakeRequest("POST", url, nil, "")
		require.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

// TestCOIWorkflow tests the complete COI detection workflow with self-authorship
func TestCOIWorkflow(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	// Step 1: Create conference
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	conference := &dto.Conference{
		Title:   "Test Conference COI Workflow",
		Acronym: testutils.UniqueString("TCWF"),
		Chair:   chairUser.Email,
		Domain:  []string{"AI"},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Step 2: Add a reviewer who is also an author (self-authorship conflict)
	selfAuthorToken, selfAuthorUser, _ := ctx.RegisterUniqueUser("selfauthor", "password123", "Self", "Author", []string{"AI"})

	// Invite as reviewer
	inviteReq := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conferenceID,
		Reviewers: []dto.Reviewer{
			{UserID: selfAuthorUser.ID, Domain: []string{"AI"}},
		},
	}
	inviteResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), inviteReq, chairToken)
	var inviteData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	require.NotNil(t, inviteData.Data, "Invite response data should not be nil")
	require.Greater(t, len(inviteData.Data.Success), 0, "Should have at least one successful invite")
	reviewerID := inviteData.Data.Success[0].ID

	// Accept the reviewer invitation (must be done by the reviewer themselves)
	acceptReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	acceptResp, _ := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptReq, selfAuthorToken)
	require.Equal(t, http.StatusOK, acceptResp.StatusCode, "Reviewer should accept invitation successfully")

	// Create submission as author (this person is both reviewer and author - self-authorship COI)
	submissionClient := submission.NewClient(ctx)
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       selfAuthorUser.Email,
		Title:        "Self Paper",
		Abstract:     "This is a self-authored paper",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	submissionResp, err := submissionClient.Create(conferenceID, sub, selfAuthorToken)
	require.NoError(t, err, "Should create submission successfully")
	require.Equal(t, http.StatusCreated, submissionResp.StatusCode, "Submission should be created successfully")

	// Step 3: Rebuild COI relationships (should detect self-authorship)
	rebuildResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/coi/conferences/%d/rebuild", conferenceID), nil, chairToken)
	require.NoError(t, err)
	require.Equal(t, http.StatusOK, rebuildResp.StatusCode, "COI rebuild should succeed")

	var rebuildData struct {
		Data dto.COIRebuildResponse `json:"data"`
	}
	testutils.DecodeResponse(t, rebuildResp, &rebuildData)
	t.Logf("Rebuild result: %d relationships stored", rebuildData.Data.RelationshipsStored)

	// Step 4: Verify dashboard stats show COI detected
	statsResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/coi/dashboard/stats/%d", conferenceID), nil, chairToken)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, statsResp.StatusCode)

	var statsResponse struct {
		Data dto.COIDashboardStats `json:"data"`
	}
	testutils.DecodeResponse(t, statsResp, &statsResponse)
	t.Logf("Dashboard stats: Reviewers=%d, Papers=%d, COIs=%d",
		statsResponse.Data.TotalReviewers, statsResponse.Data.TotalPapers,
		statsResponse.Data.COIDetected)
	assert.Greater(t, statsResponse.Data.TotalReviewers, 0)
	assert.Greater(t, statsResponse.Data.TotalPapers, 0)
	// Should have at least 1 COI detected (self-authorship)
	assert.GreaterOrEqual(t, statsResponse.Data.COIDetected, 1)

	// Step 5: Verify relationships list contains the self-authorship conflict
	relResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/coi/relationships?conference_id=%d&page=1&limit=10", conferenceID), nil, chairToken)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, relResp.StatusCode)

	var relResponse struct {
		Data dto.COIRelationshipListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, relResp, &relResponse)
	t.Logf("Found %d relationships, array length=%d", relResponse.Data.Total, len(relResponse.Data.Relationships))
	for i, rel := range relResponse.Data.Relationships {
		t.Logf("  Relationship[%d]: ReviewerEmail=%s, AuthorEmail=%s, Type=%s, Severity=%s",
			i, rel.ReviewerEmail, rel.AuthorEmail, rel.RelationshipType, rel.Severity)
	}
	if len(relResponse.Data.Relationships) == 0 && relResponse.Data.Total > 0 {
		t.Logf("WARNING: Total is %d but relationships array is empty!", relResponse.Data.Total)
	}
	assert.Greater(t, relResponse.Data.Total, int64(0))

	// Verify at least one relationship is self_author type with high severity
	foundSelfAuthor := false
	for _, rel := range relResponse.Data.Relationships {
		if rel.RelationshipType == "self_author" && rel.Severity == "high" {
			foundSelfAuthor = true
			break
		}
	}
	assert.True(t, foundSelfAuthor, "Should detect at least one self-author conflict")

	// Step 6: Verify paper COI summaries include conflicted reviewers
	paperResp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/coi/papers?conference_id=%d&page=1&limit=10", conferenceID), nil, chairToken)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, paperResp.StatusCode)

	var paperResponse struct {
		Data dto.PaperCOIListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, paperResp, &paperResponse)

	require.Greater(t, len(paperResponse.Data.Papers), 0, "Should have at least one paper")
	t.Logf("Found %d papers", len(paperResponse.Data.Papers))

	// Find paper with conflicts
	foundPaperWithConflict := false
	for _, paper := range paperResponse.Data.Papers {
		if paper.TotalConflicts > 0 {
			foundPaperWithConflict = true
			t.Logf("Paper '%s' has %d conflicts", paper.PaperTitle, paper.TotalConflicts)

			// Verify conflicted reviewers are populated
			assert.Greater(t, len(paper.ConflictedReviewers), 0, "Paper with conflicts should have conflicted reviewers listed")

			for _, reviewer := range paper.ConflictedReviewers {
				t.Logf("  Conflicted Reviewer: %s (%s) - Severity: %s, Reasons: %v",
					reviewer.ReviewerName, reviewer.ReviewerEmail, reviewer.Severity, reviewer.Reasons)

				// Verify reviewer data is complete
				assert.NotZero(t, reviewer.ReviewerID, "Reviewer ID should not be zero")
				assert.NotEmpty(t, reviewer.ReviewerEmail, "Reviewer email should not be empty")
				assert.Contains(t, []string{"high", "medium", "low"}, reviewer.Severity, "Severity should be valid")
				assert.Greater(t, len(reviewer.Reasons), 0, "Should have at least one reason")
			}
			break
		}
	}
	assert.True(t, foundPaperWithConflict, "Should have at least one paper with conflicts and populated conflicted_reviewers")
}
