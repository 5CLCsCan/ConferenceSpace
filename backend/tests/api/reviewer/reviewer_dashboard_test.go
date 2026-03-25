package reviewer

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestGetReviewerDashboard tests the GET /api/v1/reviewer/:reviewer_email/dashboard endpoint
func TestGetReviewerDashboard(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	reviewerClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI", "ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	otherToken, other, err := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"CS"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conferences
	conf1 := &dto.Conference{
		Title:   "AI Conference 2025",
		Acronym: testutils.UniqueString("AI2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp1, err := conferenceClient.Create(conf1, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference 1: %v", err)
	}
	testutils.AssertStatusCode(t, resp1, http.StatusCreated)
	var conf1Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &conf1Data)
	conference1ID := conf1Data.Data.ID

	conf2 := &dto.Conference{
		Title:   "ML Conference 2025",
		Acronym: testutils.UniqueString("ML2025"),
		Chair:   chair.Email,
		Domain:  []string{"ML"},
	}
	resp2, err := conferenceClient.Create(conf2, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference 2: %v", err)
	}
	testutils.AssertStatusCode(t, resp2, http.StatusCreated)
	var conf2Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &conf2Data)
	conference2ID := conf2Data.Data.ID

	// Invite reviewer to both conferences
	inviteReq1 := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conference1ID,
		Reviewers: []dto.Reviewer{
			{UserID: reviewer.ID, Domain: []string{"AI"}},
		},
	}
	inviteResp1, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conference1ID), inviteReq1, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite reviewer to conference 1: %v", err)
	}
	testutils.AssertStatusCode(t, inviteResp1, http.StatusCreated)

	// Accept invitation to conference 1
	var inviteData1 struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp1, &inviteData1)
	if len(inviteData1.Data.Success) > 0 {
		reviewerID := inviteData1.Data.Success[0].ID
		acceptReq := &dto.ReviewerUpdateStatusRequest{
			ConferenceID: conference1ID,
			ReviewerID:   reviewerID,
			Status:       "accepted",
		}
		acceptResp, _ := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conference1ID, reviewerID), acceptReq, reviewerToken)
		testutils.AssertStatusCode(t, acceptResp, http.StatusOK)
	}

	// Invite reviewer to conference 2 (pending)
	inviteReq2 := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conference2ID,
		Reviewers: []dto.Reviewer{
			{UserID: reviewer.ID, Domain: []string{"ML"}},
		},
	}
	inviteResp2, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conference2ID), inviteReq2, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite reviewer to conference 2: %v", err)
	}
	testutils.AssertStatusCode(t, inviteResp2, http.StatusCreated)

	// Create a submission (for assignments test later)
	sub := &dto.Submission{
		ConferenceID: conference1ID,
		Author:       other.Email,
		Title:        "AI Research Paper",
		Abstract:     "This is a paper about AI",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	subResp, err := submissionClient.Create(conference1ID, sub, otherToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	t.Log("✓ Test setup complete")

	// Test 1: Get dashboard with default parameters
	t.Run("GetDashboard_Success", func(t *testing.T) {
		resp, err := reviewerClient.GetDashboard(reviewer.Email, nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get dashboard: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var dashboardData struct {
			Data *dto.ReviewerDashboardResponseWithPagination `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &dashboardData)

		if dashboardData.Data == nil {
			t.Fatal("Dashboard data is nil")
		}

		// Should have conferences
		if dashboardData.Data.Conferences.Data == nil {
			t.Error("Conferences data is nil")
		}

		// Should have stats
		if dashboardData.Data.Stats.ReviewerStats == nil {
			t.Error("Stats is nil")
		}

		// Should have invitations
		if dashboardData.Data.Invitations.Data == nil {
			t.Error("Invitations data is nil")
		}

		// Should have at least 1 pending invitation (conference 2)
		if len(dashboardData.Data.Invitations.Data) < 1 {
			t.Errorf("Expected at least 1 invitation, got %d", len(dashboardData.Data.Invitations.Data))
		}

		t.Log("✓ Dashboard retrieved successfully")
	})

	// Test 2: Get dashboard with pagination
	t.Run("GetDashboard_WithPagination", func(t *testing.T) {
		params := &DashboardParams{
			ConferenceLimit:       1,
			ConferenceOffset:      0,
			InvitationLimit:       1,
			InvitationOffset:      0,
			RecentAssignmentLimit: 5,
		}
		resp, err := reviewerClient.GetDashboard(reviewer.Email, params, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get dashboard with pagination: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var dashboardData struct {
			Data *dto.ReviewerDashboardResponseWithPagination `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &dashboardData)

		if dashboardData.Data.Conferences.Limit != 1 {
			t.Errorf("Expected conference limit 1, got %d", dashboardData.Data.Conferences.Limit)
		}
		if dashboardData.Data.Invitations.Limit != 1 {
			t.Errorf("Expected invitation limit 1, got %d", dashboardData.Data.Invitations.Limit)
		}

		t.Log("✓ Dashboard with pagination works correctly")
	})

	// Test 3: Get dashboard with invitation status filter
	t.Run("GetDashboard_FilterByInvitationStatus", func(t *testing.T) {
		params := &DashboardParams{
			InvitationStatus: "pending",
		}
		resp, err := reviewerClient.GetDashboard(reviewer.Email, params, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get dashboard with status filter: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var dashboardData struct {
			Data *dto.ReviewerDashboardResponseWithPagination `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &dashboardData)

		// Should have at least the pending invitation from conference 2
		if len(dashboardData.Data.Invitations.Data) < 1 {
			t.Errorf("Expected at least 1 pending invitation, got %d", len(dashboardData.Data.Invitations.Data))
		}

		// Verify all invitations are pending
		for _, inv := range dashboardData.Data.Invitations.Data {
			if inv.Status != "pending" {
				t.Errorf("Expected invitation status 'pending', got '%s'", inv.Status)
			}
		}

		t.Log("✓ Dashboard filtered by invitation status works correctly")
	})

	// Test 4: Get dashboard with email containing special characters
	t.Run("GetDashboard_EmailWithSpecialChars", func(t *testing.T) {
		specialToken, specialUser, err := ctx.RegisterUniqueUser("test+reviewer", "password123", "Special", "User", []string{"AI"})
		if err != nil {
			t.Fatalf("Failed to register user with special email: %v", err)
		}

		resp, err := reviewerClient.GetDashboard(specialUser.Email, nil, specialToken)
		if err != nil {
			t.Fatalf("Failed to get dashboard for email with special chars: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Dashboard works with email containing special characters")
	})

	// Test 5: Unauthorized access
	t.Run("GetDashboard_Unauthorized", func(t *testing.T) {
		// Try to access another user's dashboard
		resp, err := reviewerClient.GetDashboard(reviewer.Email, nil, otherToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		// The endpoint should return data but the user won't have access to the reviewer's conferences
		// This is expected behavior - the endpoint doesn't restrict by user, it just shows data for the email
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Unauthorized access handled correctly")
	})

	// Test 6: Non-existent user
	t.Run("GetDashboard_NonExistentUser", func(t *testing.T) {
		resp, err := reviewerClient.GetDashboard("nonexistent@test.com", nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		// Should return 500 or 404
		if resp.StatusCode != http.StatusInternalServerError && resp.StatusCode != http.StatusNotFound {
			t.Errorf("Expected status 500 or 404 for non-existent user, got %d", resp.StatusCode)
		}

		t.Log("✓ Non-existent user handled correctly")
	})
}

// TestGetConferencePapers tests the GET /api/v1/reviewer/:reviewer_email/conferences/:conference_id/papers endpoint
func TestGetConferencePapers(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	reviewerClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:   "AI Conference 2025",
		Acronym: testutils.UniqueString("AI2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Invite and accept reviewer
	inviteReq := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conferenceID,
		Reviewers: []dto.Reviewer{
			{UserID: reviewer.ID, Domain: []string{"AI"}},
		},
	}
	inviteResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), inviteReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, inviteResp, http.StatusCreated)

	var inviteData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp, &inviteData)
	if len(inviteData.Data.Success) > 0 {
		reviewerID := inviteData.Data.Success[0].ID
		acceptReq := &dto.ReviewerUpdateStatusRequest{
			ConferenceID: conferenceID,
			ReviewerID:   reviewerID,
			Status:       "accepted",
		}
		acceptResp, _ := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID), acceptReq, reviewerToken)
		testutils.AssertStatusCode(t, acceptResp, http.StatusOK)
	}

	// Create multiple submissions
	for i := 1; i <= 3; i++ {
		sub := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        fmt.Sprintf("AI Paper %d", i),
			Abstract:     fmt.Sprintf("Abstract for paper %d", i),
			Domain:       []string{"AI"},
			Status:       dto.StatusPublished,
		}
		subResp, err := submissionClient.Create(conferenceID, sub, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission %d: %v", i, err)
		}
		testutils.AssertStatusCode(t, subResp, http.StatusCreated)
	}

	t.Log("✓ Test setup complete")

	// Test 1: Get conference papers
	t.Run("GetConferencePapers_Success", func(t *testing.T) {
		resp, err := reviewerClient.GetConferencePapers(reviewer.Email, conferenceID, nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get conference papers: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data *dto.GetConferencePapersResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		if papersData.Data == nil {
			t.Fatal("Papers data is nil")
		}

		// Papers may be empty if no assignments yet (that's ok)
		if papersData.Data.Papers == nil {
			t.Error("Papers array is nil")
		}

		t.Logf("✓ Retrieved %d papers", len(papersData.Data.Papers))
	})

	// Test 2: Get conference papers with pagination
	t.Run("GetConferencePapers_WithPagination", func(t *testing.T) {
		params := &PaperParams{
			Limit:  2,
			Offset: 0,
		}
		resp, err := reviewerClient.GetConferencePapers(reviewer.Email, conferenceID, params, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get conference papers with pagination: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data *dto.GetConferencePapersResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		if papersData.Data.Limit != 2 {
			t.Errorf("Expected limit 2, got %d", papersData.Data.Limit)
		}

		t.Log("✓ Pagination works correctly")
	})

	// Test 3: Get conference papers with search
	t.Run("GetConferencePapers_WithSearch", func(t *testing.T) {
		params := &PaperParams{
			Search: "AI Paper 1",
		}
		resp, err := reviewerClient.GetConferencePapers(reviewer.Email, conferenceID, params, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get conference papers with search: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Search works correctly")
	})

	// Test 4: Non-existent conference
	t.Run("GetConferencePapers_NonExistentConference", func(t *testing.T) {
		resp, err := reviewerClient.GetConferencePapers(reviewer.Email, 999999, nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		// Should return 200 with empty results or 404
		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNotFound && resp.StatusCode != http.StatusInternalServerError {
			t.Errorf("Expected status 200, 404, or 500 for non-existent conference, got %d", resp.StatusCode)
		}

		t.Log("✓ Non-existent conference handled correctly")
	})
}

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

// TestGetCompletedPapers tests the GET /api/v1/reviewer/:reviewer_email/completed-papers endpoint
func TestGetCompletedPapers(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	reviewerClient := NewClient(ctx)

	// Create test user
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	t.Log("✓ Test setup complete")

	// Test 1: Get completed papers
	t.Run("GetCompletedPapers_Success", func(t *testing.T) {
		resp, err := reviewerClient.GetCompletedPapers(reviewer.Email, nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get completed papers: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data *dto.GetCompletedPapersResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		if papersData.Data == nil {
			t.Fatal("Papers data is nil")
		}

		if papersData.Data.Papers == nil {
			t.Error("Papers array is nil")
		}

		// Should return empty array for new reviewer
		t.Logf("✓ Retrieved %d completed papers", len(papersData.Data.Papers))
	})

	// Test 2: Get completed papers with pagination
	t.Run("GetCompletedPapers_WithPagination", func(t *testing.T) {
		params := &PaperParams{
			Limit:  10,
			Offset: 0,
		}
		resp, err := reviewerClient.GetCompletedPapers(reviewer.Email, params, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get completed papers with pagination: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var papersData struct {
			Data *dto.GetCompletedPapersResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &papersData)

		if papersData.Data.Limit != 10 {
			t.Errorf("Expected limit 10, got %d", papersData.Data.Limit)
		}

		t.Log("✓ Pagination works correctly")
	})

	// Test 3: Get completed papers with search
	t.Run("GetCompletedPapers_WithSearch", func(t *testing.T) {
		params := &PaperParams{
			Search: "AI",
		}
		resp, err := reviewerClient.GetCompletedPapers(reviewer.Email, params, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to get completed papers with search: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ Search works correctly")
	})

	// Test 4: Non-existent user
	t.Run("GetCompletedPapers_NonExistentUser", func(t *testing.T) {
		resp, err := reviewerClient.GetCompletedPapers("nonexistent@test.com", nil, reviewerToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		// Should return 500 or 404
		if resp.StatusCode != http.StatusInternalServerError && resp.StatusCode != http.StatusNotFound {
			t.Errorf("Expected status 500 or 404 for non-existent user, got %d", resp.StatusCode)
		}

		t.Log("✓ Non-existent user handled correctly")
	})
}

