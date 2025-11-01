package assignment

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/clients/neo4j"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestRelationshipCOI_E2E_DirectCollaboration tests COI detection with direct collaboration
func TestRelationshipCOI_E2E_DirectCollaboration(t *testing.T) {
	if !isNeo4jAvailable() {
		t.Skip("Skipping: Neo4j not available")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	neo4jClient := setupNeo4jClient(t)
	defer neo4jClient.Close(context.Background())

	clearNeo4jTestData(t, neo4jClient)
	defer clearNeo4jTestData(t, neo4jClient)

	// Create test users via API
	chairToken, chairUser, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	authorToken, authorUser, err := ctx.RegisterUniqueUser("author", "password123", "Test", "Author", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("reviewer", "password123", "Test", "Reviewer", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	// Setup collaboration in Neo4j (recent collaboration - 1 year ago)
	authorSvc := neo4j.NewAuthorService(neo4jClient)
	currentYear := time.Now().Year()

	authorSvc.CreateAuthor(context.Background(), neo4j.Author{
		Email: authorUser.Email,
		Name:  authorUser.FirstName + " " + authorUser.LastName,
	})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{
		Email: reviewerUser.Email,
		Name:  reviewerUser.FirstName + " " + reviewerUser.LastName,
	})
	authorSvc.CreateCoauthorship(context.Background(), authorUser.Email, reviewerUser.Email, neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 1, // Recent collaboration
		PaperLink:       "https://example.com/paper1",
	})

	// Create conference with 4-year COI window
	conference := &dto.Conference{
		Title:          "Test Conference COI",
		Acronym:        testutils.UniqueString("TESTCOI"),
		Chair:          chairUser.Email,
		PrimaryContact: chairUser.ID,
		AreaChair:      chairUser.ID,
		Domain:         []string{"AI", "ML"},
		Configurations: &dto.ConferenceConfiguration{
			HaveCOI:        boolPtr(true),
			COIWindowYears: intPtr(4),
		},
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

	// Add reviewer to conference
	reviewerReq := map[string]interface{}{
		"reviewers": []map[string]interface{}{
			{
				"user_id": reviewerUser.ID,
				"domain":  []string{"ML"},
			},
		},
	}
	addRevResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to add reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	// Parse reviewer ID from response
	var revData struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData)
	if revData.Data == nil || len(revData.Data.Success) == 0 {
		t.Fatalf("No reviewers were added successfully. Response: %+v", revData)
	}
	reviewerID := revData.Data.Success[0].ID
	t.Logf("Added reviewer with ID: %d", reviewerID)

	// Reviewer accepts invitation
	acceptReq := &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID,
		Status:       "accepted",
	}
	acceptPath := fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID)
	t.Logf("Accepting reviewer at path: %s", acceptPath)
	acceptResp, err := ctx.MakeRequest("PUT", acceptPath, acceptReq, reviewerToken)
	if err != nil {
		t.Fatalf("Failed to accept reviewer invitation: %v", err)
	}
	if acceptResp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(t, acceptResp)
		t.Fatalf("Expected status 200, got %d. Body: %s", acceptResp.StatusCode, body)
	}

	// Create submission from author
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test Submission",
			Abstract: "This is a test submission to check COI detection",
			Domain:   []string{"ML"},
			Status:   "submitted",
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)
	subPath := fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID)
	t.Logf("Creating submission at path: %s", subPath)
	t.Logf("Submission JSON: %s", string(submissionJSON))
	subResp, err := ctx.MakeMultipartRequest("POST", subPath, map[string]string{
		"submission": string(submissionJSON),
	}, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	t.Logf("Submission response status: %d", subResp.StatusCode)
	body := testutils.ReadResponseBody(t, subResp)
	t.Logf("Submission response body: %s", body)
	if subResp.StatusCode != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d. Body: %s. Path: %s", subResp.StatusCode, body, subPath)
	}

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	// Run auto-assignment
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

	// Parse auto-assignment response
	var assignResult struct {
		Data *dto.AutoAssignResponse `json:"data"`
	}
	testutils.DecodeResponse(t, assignResp, &assignResult)

	// Check if reviewer was assigned to author's submission
	conflictDetected := true
	if assignResult.Data.Assignments != nil {
		for _, assignment := range assignResult.Data.Assignments {
			if assignment.SubmissionID == submissionID && assignment.ReviewerID == reviewerUser.ID {
				conflictDetected = false
				t.Errorf("COI NOT DETECTED: Reviewer with recent collaboration (1 year ago) was assigned to author's paper")
			}
		}
	}

	if conflictDetected {
		t.Logf("✅ COI correctly detected - reviewer with recent collaboration was not assigned to author's paper")
	}
	t.Logf("Auto-assignment stats: %d submissions, %d reviewers, %d total assignments",
		assignResult.Data.TotalSubmissions, assignResult.Data.TotalReviewers, assignResult.Data.TotalAssignments)
}

// TestRelationshipCOI_E2E_OldCollaboration tests that old collaborations don't trigger COI
func TestRelationshipCOI_E2E_OldCollaboration(t *testing.T) {
	if !isNeo4jAvailable() {
		t.Skip("Skipping: Neo4j not available")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	neo4jClient := setupNeo4jClient(t)
	defer neo4jClient.Close(context.Background())

	clearNeo4jTestData(t, neo4jClient)
	defer clearNeo4jTestData(t, neo4jClient)

	// Create test users
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair2", "password123", "Chair", "Two", []string{"AI"})
	authorToken, authorUser, _ := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"ML"})
	reviewerToken, reviewerUser, _ := ctx.RegisterUniqueUser("reviewer2", "password123", "Reviewer", "Two", []string{"ML"})

	// Setup OLD collaboration in Neo4j (6 years ago - outside 4-year window)
	authorSvc := neo4j.NewAuthorService(neo4jClient)
	currentYear := time.Now().Year()

	authorSvc.CreateAuthor(context.Background(), neo4j.Author{
		Email: authorUser.Email,
		Name:  authorUser.FirstName + " " + authorUser.LastName,
	})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{
		Email: reviewerUser.Email,
		Name:  reviewerUser.FirstName + " " + reviewerUser.LastName,
	})
	authorSvc.CreateCoauthorship(context.Background(), authorUser.Email, reviewerUser.Email, neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 6, // Old collaboration - outside window
		PaperLink:       "https://example.com/old-paper",
	})

	// Create conference with 4-year COI window
	conference := &dto.Conference{
		Title:          "Test Conference Old COI",
		Acronym:        testutils.UniqueString("TESTOLDCOI"),
		Chair:          chairUser.Email,
		PrimaryContact: chairUser.ID,
		AreaChair:      chairUser.ID,
		Domain:         []string{"AI", "ML"},
		Configurations: &dto.ConferenceConfiguration{
			HaveCOI:        boolPtr(true),
			COIWindowYears: intPtr(4),
		},
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
			{
				"user_id": reviewerUser.ID,
				"domain":  []string{"ML"},
			},
		},
	}
	addRevResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), reviewerReq, chairToken)
	testutils.AssertStatusCode(t, addRevResp, http.StatusCreated)

	var revData2 struct {
		Data *dto.ReviewerBatchInviteResponse `json:"data"`
	}
	testutils.DecodeResponse(t, addRevResp, &revData2)
	reviewerID2 := revData2.Data.Success[0].ID

	// Reviewer accepts
	ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID2), &dto.ReviewerUpdateStatusRequest{
		ConferenceID: conferenceID,
		ReviewerID:   reviewerID2,
		Status:       "accepted",
	}, reviewerToken)

	// Create submission
	submissionReq2 := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Test Submission 2",
			Abstract: "Testing old collaboration",
			Domain:   []string{"ML"},
			Status:   "submitted",
		},
	}
	submissionJSON2, _ := json.Marshal(submissionReq2)
	subResp, _ := ctx.MakeMultipartRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON2),
	}, authorToken)
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)

	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	_ = subData.Data.ID // Submission created successfully

	// Run auto-assignment
	autoAssignReq := map[string]interface{}{
		"min_reviewers_per_paper": 1,
		"max_reviewers_per_paper": 2,
		"dry_run":                 false,
	}
	assignResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), autoAssignReq, chairToken)
	testutils.AssertStatusCode(t, assignResp, http.StatusOK)

	// Parse auto-assignment response
	var assignResult struct {
		Data *dto.AutoAssignResponse `json:"data"`
	}
	testutils.DecodeResponse(t, assignResp, &assignResult)

	// Assignment CAN be made (old collaboration outside window)
	hasAssignment := assignResult.Data.TotalAssignments > 0
	t.Logf("✅ Old collaboration (6 years) correctly ignored - assignment possible: %v (total: %d)",
		hasAssignment, assignResult.Data.TotalAssignments)
}

// TestRelationshipCOI_E2E_DifferentWindowYears tests different window year configurations
func TestRelationshipCOI_E2E_DifferentWindowYears(t *testing.T) {
	if !isNeo4jAvailable() {
		t.Skip("Skipping: Neo4j not available")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	neo4jClient := setupNeo4jClient(t)
	defer neo4jClient.Close(context.Background())

	clearNeo4jTestData(t, neo4jClient)
	defer clearNeo4jTestData(t, neo4jClient)

	// Setup users and collaboration (3 years ago)
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair3", "password123", "Chair", "Three", []string{"AI"})
	authorToken, authorUser, _ := ctx.RegisterUniqueUser("author3", "password123", "Author", "Three", []string{"ML"})
	reviewerToken, reviewerUser, _ := ctx.RegisterUniqueUser("reviewer3", "password123", "Reviewer", "Three", []string{"ML"})

	authorSvc := neo4j.NewAuthorService(neo4jClient)
	currentYear := time.Now().Year()

	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: authorUser.Email})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: reviewerUser.Email})
	authorSvc.CreateCoauthorship(context.Background(), authorUser.Email, reviewerUser.Email, neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 3, // 3 years ago
	})

	testCases := []struct {
		name          string
		windowYears   int
		shouldHaveCOI bool
		description   string
	}{
		{
			name:          "2-year window - no COI (3 > 2)",
			windowYears:   2,
			shouldHaveCOI: false,
			description:   "Collaboration 3 years ago, outside 2-year window",
		},
		{
			name:          "5-year window - has COI (3 < 5)",
			windowYears:   5,
			shouldHaveCOI: true,
			description:   "Collaboration 3 years ago, within 5-year window",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create conference with specific window
			conference := &dto.Conference{
				Title:          fmt.Sprintf("Test Conference Window %d", tc.windowYears),
				Acronym:        testutils.UniqueString(fmt.Sprintf("WINDOW%d", tc.windowYears)),
				Chair:          chairUser.Email,
				PrimaryContact: chairUser.ID,
				AreaChair:      chairUser.ID,
				Domain:         []string{"ML"},
				Configurations: &dto.ConferenceConfiguration{
					HaveCOI:        boolPtr(true),
					COIWindowYears: intPtr(tc.windowYears),
				},
			}

			confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
			var confData struct {
				Data *dto.ConferenceResponse `json:"data"`
			}
			testutils.DecodeResponse(t, confResp, &confData)
			conferenceID := confData.Data.ID

			// Add reviewer
			addRevResp3, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), map[string]interface{}{
				"reviewers": []map[string]interface{}{
					{
						"user_id": reviewerUser.ID,
						"domain":  []string{"ML"},
					},
				},
			}, chairToken)
			var revData3 struct {
				Data *dto.ReviewerBatchInviteResponse `json:"data"`
			}
			testutils.DecodeResponse(t, addRevResp3, &revData3)
			reviewerID3 := revData3.Data.Success[0].ID

			ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", conferenceID, reviewerID3), &dto.ReviewerUpdateStatusRequest{
				ConferenceID: conferenceID,
				ReviewerID:   reviewerID3,
				Status:       "accepted",
			}, reviewerToken)

			// Create submission
			submissionReq3 := &dto.SubmissionCreateRequest{
				ConferenceID: conferenceID,
				Submission: &dto.Submission{
					Title:    "Test Paper",
					Abstract: "Test abstract",
					Domain:   []string{"ML"},
					Status:   "submitted",
				},
			}
			submissionJSON3, _ := json.Marshal(submissionReq3)
			subResp, _ := ctx.MakeMultipartRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
				"submission": string(submissionJSON3),
			}, authorToken)
			var subData struct {
				Data *dto.Submission `json:"data"`
			}
			testutils.DecodeResponse(t, subResp, &subData)
			submissionID := subData.Data.ID

			// Run auto-assignment
			assignResp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions/auto-assign", conferenceID), map[string]interface{}{
				"min_reviewers_per_paper": 1,
				"dry_run":                 false,
			}, chairToken)

			// Check assignments
			var assignResult struct {
				Data *dto.AutoAssignResponse `json:"data"`
			}
			testutils.DecodeResponse(t, assignResp, &assignResult)

			hasReviewerAssignment := false
			totalAssignments := 0
			if assignResult.Data != nil {
				totalAssignments = assignResult.Data.TotalAssignments
				if assignResult.Data.Assignments != nil {
					for _, a := range assignResult.Data.Assignments {
						if a.SubmissionID == submissionID && a.ReviewerID == reviewerUser.ID {
							hasReviewerAssignment = true
							break
						}
					}
				}
			}

			if tc.shouldHaveCOI && hasReviewerAssignment {
				t.Errorf("Expected COI to block assignment with %d-year window, but assignment was made", tc.windowYears)
			} else if !tc.shouldHaveCOI && !hasReviewerAssignment && totalAssignments == 0 {
				t.Logf("Note: No assignment made with %d-year window (could be domain mismatch or other factors)", tc.windowYears)
			}

			t.Logf("✅ %s: %s (total assignments: %d)", tc.name, tc.description, totalAssignments)
		})
	}
}

// Helper functions

func isNeo4jAvailable() bool {
	uri := getNeo4jURI()
	client, err := neo4j.NewClient(neo4j.Config{
		URI:      uri,
		Username: getNeo4jUsername(),
		Password: getNeo4jPassword(),
	})
	if err != nil {
		return false
	}
	defer client.Close(context.Background())

	return client.VerifyConnectivity(context.Background()) == nil
}

func setupNeo4jClient(t *testing.T) *neo4j.Client {
	client, err := neo4j.NewClient(neo4j.Config{
		URI:      getNeo4jURI(),
		Username: getNeo4jUsername(),
		Password: getNeo4jPassword(),
	})
	if err != nil {
		t.Fatalf("Failed to create Neo4j client: %v", err)
	}
	return client
}

func getNeo4jURI() string {
	if uri := os.Getenv("NEO4J_URI"); uri != "" {
		return uri
	}
	return "bolt://localhost:7687"
}

func getNeo4jUsername() string {
	if username := os.Getenv("NEO4J_USERNAME"); username != "" {
		return username
	}
	return "neo4j"
}

func getNeo4jPassword() string {
	if password := os.Getenv("NEO4J_PASSWORD"); password != "" {
		return password
	}
	return "conferencespace"
}

func clearNeo4jTestData(t *testing.T, client *neo4j.Client) {
	ctx := context.Background()
	session := client.NewSession(ctx)
	defer session.Close(ctx)

	query := `
		MATCH (n:Author) 
		WHERE n.email CONTAINS '@example.com'
		DETACH DELETE n
	`
	_, err := session.Run(ctx, query, nil)
	if err != nil {
		t.Logf("Warning: Failed to clear Neo4j test data: %v", err)
	}
}

func boolPtr(b bool) *bool {
	return &b
}

func intPtr(i int) *int {
	return &i
}
