package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestConferenceListWithRoleFiltering tests the myConferences and role query parameters
func TestConferenceListWithRoleFiltering(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// ========================================
	// Setup: Create users with different roles
	// ========================================

	// User 1: Will be chair of conference 1
	chair1Token, chair1, err := ctx.RegisterUniqueUser("chair1", "password123", "Chair", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair1: %v", err)
	}

	// User 2: Will be chair of conference 2
	chair2Token, chair2, err := ctx.RegisterUniqueUser("chair2", "password123", "Chair", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register chair2: %v", err)
	}

	// User 3: Will be author in conference 1
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	// User 4: Will be reviewer in conference 1
	reviewerToken, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// User 5: Will be author AND reviewer in conference 2
	multiRoleToken, multiRole, err := ctx.RegisterUniqueUser("multirole", "password123", "Multi", "Role", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register multirole user: %v", err)
	}

	// User 6: No roles in any conference
	noRoleToken, _, err := ctx.RegisterUniqueUser("norole", "password123", "No", "Role", []string{"CS"})
	if err != nil {
		t.Fatalf("Failed to register norole user: %v", err)
	}

	// ========================================
	// Create Conference 1 (chair1 is chair)
	// ========================================
	conf1 := &dto.Conference{
		Title:          "AI Conference 2025",
		Acronym:        testutils.UniqueString("AI2025"),
		Chair:          chair1.Email,
		PrimaryContact: chair1.ID,
		AreaChair:      chair1.ID,
		Domain:         []string{"AI"},
	}
	resp1, err := conferenceClient.Create(conf1, chair1Token)
	if err != nil {
		t.Fatalf("Failed to create conference 1: %v", err)
	}
	testutils.AssertStatusCode(t, resp1, http.StatusCreated)
	var conf1Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &conf1Data)
	conference1ID := conf1Data.Data.ID

	// ========================================
	// Create Conference 2 (chair2 is chair)
	// ========================================
	conf2 := &dto.Conference{
		Title:          "ML Conference 2025",
		Acronym:        testutils.UniqueString("ML2025"),
		Chair:          chair2.Email,
		PrimaryContact: chair2.ID,
		AreaChair:      chair2.ID,
		Domain:         []string{"ML"},
	}
	resp2, err := conferenceClient.Create(conf2, chair2Token)
	if err != nil {
		t.Fatalf("Failed to create conference 2: %v", err)
	}
	testutils.AssertStatusCode(t, resp2, http.StatusCreated)
	var conf2Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &conf2Data)
	conference2ID := conf2Data.Data.ID

	// ========================================
	// Setup: Author submits to conference 1
	// ========================================
	authorSubmission := &dto.Submission{
		ConferenceID: conference1ID,
		Author:       author.Email,
		Title:        "AI Research Paper",
		Abstract:     "This is a paper about AI",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	subResp, err := submissionClient.Create(conference1ID, authorSubmission, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	// ========================================
	// Setup: MultiRole submits to conference 2
	// ========================================
	multiRoleSubmission := &dto.Submission{
		ConferenceID: conference2ID,
		Author:       multiRole.Email,
		Title:        "ML Research Paper",
		Abstract:     "This is a paper about ML",
		Domain:       []string{"ML"},
		Status:       dto.StatusPublished,
	}
	subResp2, err := submissionClient.Create(conference2ID, multiRoleSubmission, multiRoleToken)
	if err != nil {
		t.Fatalf("Failed to create submission for multirole: %v", err)
	}
	testutils.AssertStatusCode(t, subResp2, http.StatusCreated)

	// ========================================
	// Setup: Invite reviewers
	// ========================================
	// Invite reviewer to conference 1
	inviteReq1 := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conference1ID,
		Reviewers: []dto.Reviewer{
			{UserID: reviewer.ID, Domain: []string{"AI"}},
		},
	}
	inviteResp1, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conference1ID), inviteReq1, chair1Token)
	if err != nil {
		t.Fatalf("Failed to invite reviewer to conference 1: %v", err)
	}
	testutils.AssertStatusCode(t, inviteResp1, http.StatusCreated)

	// Reviewer accepts invitation
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

	// Invite multirole user as reviewer to conference 2
	inviteReq2 := &dto.ReviewerBatchInviteRequest{
		ConferenceID: conference2ID,
		Reviewers: []dto.Reviewer{
			{UserID: multiRole.ID, Domain: []string{"ML"}},
		},
	}
	inviteResp2, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conference2ID), inviteReq2, chair2Token)
	if err != nil {
		t.Fatalf("Failed to invite multirole to conference 2: %v", err)
	}
	testutils.AssertStatusCode(t, inviteResp2, http.StatusCreated)

	// MultiRole accepts reviewer invitation
	var inviteData2 struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, inviteResp2, &inviteData2)
	if len(inviteData2.Data.Success) > 0 {
		reviewerID := inviteData2.Data.Success[0].ID
		acceptReq := &dto.ReviewerUpdateStatusRequest{
			ConferenceID: conference2ID,
			ReviewerID:   reviewerID,
			Status:       "accepted",
		}
		acceptResp, _ := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conference2ID, reviewerID), acceptReq, multiRoleToken)
		testutils.AssertStatusCode(t, acceptResp, http.StatusOK)
	}

	t.Log("✓ Setup complete: 2 conferences with different roles")

	// ========================================
	// Test Cases
	// ========================================

	tests := []struct {
		name          string
		token         string
		queryParams   string
		expectedConfs []int64 // Expected conference IDs
		description   string
	}{
		{
			name:          "chair1_myConferences_true",
			token:         chair1Token,
			queryParams:   "myConferences=true",
			expectedConfs: []int64{conference1ID},
			description:   "Chair1 should only see conference 1 (where they are chair)",
		},
		{
			name:          "chair1_role_chair",
			token:         chair1Token,
			queryParams:   "role=chair",
			expectedConfs: []int64{conference1ID},
			description:   "Chair1 filtering by chair role should see conference 1",
		},
		{
			name:          "author_myConferences_true",
			token:         authorToken,
			queryParams:   "myConferences=true",
			expectedConfs: []int64{conference1ID},
			description:   "Author should see conference 1 (where they submitted)",
		},
		{
			name:          "author_role_author",
			token:         authorToken,
			queryParams:   "role=author",
			expectedConfs: []int64{conference1ID},
			description:   "Author filtering by author role should see conference 1",
		},
		{
			name:          "reviewer_myConferences_true",
			token:         reviewerToken,
			queryParams:   "myConferences=true",
			expectedConfs: []int64{conference1ID},
			description:   "Reviewer should see conference 1 (where they are reviewer)",
		},
		{
			name:          "reviewer_role_reviewer",
			token:         reviewerToken,
			queryParams:   "role=reviewer",
			expectedConfs: []int64{conference1ID},
			description:   "Reviewer filtering by reviewer role should see conference 1",
		},
		{
			name:          "multirole_myConferences_true",
			token:         multiRoleToken,
			queryParams:   "myConferences=true",
			expectedConfs: []int64{conference2ID},
			description:   "MultiRole user should see conference 2 (both author and reviewer)",
		},
		{
			name:          "multirole_role_author",
			token:         multiRoleToken,
			queryParams:   "role=author",
			expectedConfs: []int64{conference2ID},
			description:   "MultiRole filtering by author role should see conference 2",
		},
		{
			name:          "multirole_role_reviewer",
			token:         multiRoleToken,
			queryParams:   "role=reviewer",
			expectedConfs: []int64{conference2ID},
			description:   "MultiRole filtering by reviewer role should see conference 2",
		},
		{
			name:          "norole_myConferences_true",
			token:         noRoleToken,
			queryParams:   "myConferences=true",
			expectedConfs: []int64{},
			description:   "User with no roles should see no conferences",
		},
		{
			name:          "norole_role_chair",
			token:         noRoleToken,
			queryParams:   "role=chair",
			expectedConfs: []int64{},
			description:   "User with no chair role should see no conferences",
		},
		{
			name:          "chair1_no_filter",
			token:         chair1Token,
			queryParams:   "",
			expectedConfs: []int64{}, // Don't check specific IDs, just verify both test conferences are included
			description:   "Without myConferences filter, should see all conferences (including test conferences)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			url := "/api/v1/conferences"
			if tt.queryParams != "" {
				url = fmt.Sprintf("%s?%s", url, tt.queryParams)
			}

			resp, err := ctx.MakeRequest("GET", url, nil, tt.token)
			if err != nil {
				t.Fatalf("Failed to list conferences: %v", err)
			}
			testutils.AssertStatusCode(t, resp, http.StatusOK)

			var listData struct {
				Data *dto.UserConferenceListResponse `json:"data"`
			}
			testutils.DecodeResponse(t, resp, &listData)

			if listData.Data == nil {
				t.Fatalf("%s: Response data is nil", tt.description)
			}

			// Check if returned conferences match expected
			returnedIDs := make(map[int64]bool)
			for _, conf := range listData.Data.Conferences {
				returnedIDs[conf.ID] = true
			}

			// Special case: no filter test - just verify test conferences are included
			if tt.name == "chair1_no_filter" {
				if len(returnedIDs) < 2 {
					t.Errorf("%s: Expected at least 2 conferences, got %d", tt.description, len(returnedIDs))
				}
				if !returnedIDs[conference1ID] || !returnedIDs[conference2ID] {
					t.Errorf("%s: Test conferences not found in results", tt.description)
				}
			} else {
				// For all other tests, verify exact match
				// Verify expected conferences are present
				for _, expectedID := range tt.expectedConfs {
					if !returnedIDs[expectedID] {
						t.Errorf("%s: Expected conference ID %d not found in results", tt.description, expectedID)
					}
				}

				// Verify no unexpected conferences
				if len(returnedIDs) != len(tt.expectedConfs) {
					t.Errorf("%s: Expected %d conferences, got %d", tt.description, len(tt.expectedConfs), len(returnedIDs))
				}
			}

			t.Logf("✓ %s", tt.description)
		})
	}
}
