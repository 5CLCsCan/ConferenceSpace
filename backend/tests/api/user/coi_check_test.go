package user

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/clients/neo4j"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestUserCOICheck_WithConflicts tests COI check with actual conflicts
func TestUserCOICheck_WithConflicts(t *testing.T) {
	if !isNeo4jAvailable() {
		t.Skip("Skipping: Neo4j not available")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	neo4jClient := setupNeo4jClient(t)
	defer neo4jClient.Close(context.Background())
	clearNeo4jTestData(t, neo4jClient)
	defer clearNeo4jTestData(t, neo4jClient)

	// Create users
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	author1Token, author1User, _ := ctx.RegisterUniqueUser("author1", "password123", "Author", "One", []string{"ML"})
	author2Token, author2User, _ := ctx.RegisterUniqueUser("author2", "password123", "Author", "Two", []string{"ML"})
	_, potentialReviewerUser, _ := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"ML"})

	// Setup collaborations in Neo4j
	authorSvc := neo4j.NewAuthorService(neo4jClient)
	currentYear := time.Now().Year()

	// Create authors in Neo4j
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: author1User.Email})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: author2User.Email})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: potentialReviewerUser.Email})

	// Potential reviewer collaborated with author1 (2 years ago)
	authorSvc.CreateCoauthorship(context.Background(), potentialReviewerUser.Email, author1User.Email, neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 2,
		PaperLink:       "https://example.com/paper1",
	})

	// No collaboration with author2

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference COI Check",
		Acronym: testutils.UniqueString("COICHECK"),
		Chair:   chairUser.Email,
		Domain:  []string{"ML"},
		Configurations: &dto.ConferenceConfiguration{
			HaveCOI:        boolPtr(true),
			COIWindowYears: intPtr(4), // 4-year window
		},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create submissions from authors
	submissionReq1 := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Paper from Author 1",
			Abstract: "Abstract 1",
			Domain:   []string{"ML"},
			Status:   "submitted",
		},
	}
	submissionJSON1, _ := json.Marshal(submissionReq1)
	ctx.MakeMultipartRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON1),
	}, author1Token)

	submissionReq2 := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Paper from Author 2",
			Abstract: "Abstract 2",
			Domain:   []string{"ML"},
			Status:   "submitted",
		},
	}
	submissionJSON2, _ := json.Marshal(submissionReq2)
	ctx.MakeMultipartRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON2),
	}, author2Token)

	// Check COI for potential reviewer
	coiCheckPath := fmt.Sprintf("/api/v1/users/%s/coi-check?conference_id=%d", url.PathEscape(potentialReviewerUser.Email), conferenceID)
	coiResp, err := ctx.MakeRequest("GET", coiCheckPath, nil, chairToken)
	if err != nil {
		t.Fatalf("Failed to check COI: %v", err)
	}

	if coiResp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(t, coiResp)
		t.Fatalf("Expected status 200, got %d. Body: %s", coiResp.StatusCode, body)
	}

	var coiData struct {
		Data *dto.UserCOICheckResponse `json:"data"`
	}
	testutils.DecodeResponse(t, coiResp, &coiData)

	if coiData.Data == nil {
		t.Fatal("Expected data in response, got nil")
	}

	// Verify results
	if coiData.Data.UserID != potentialReviewerUser.ID {
		t.Errorf("Expected user_id %d, got %d", potentialReviewerUser.ID, coiData.Data.UserID)
	}

	if coiData.Data.TotalAuthors != 2 {
		t.Errorf("Expected 2 total authors, got %d", coiData.Data.TotalAuthors)
	}

	if coiData.Data.ConflictingCount != 1 {
		t.Errorf("Expected 1 conflicting author, got %d", coiData.Data.ConflictingCount)
	}

	// Check that author1 is in the conflicting list
	foundAuthor1 := false
	for _, conflicting := range coiData.Data.ConflictingAuthors {
		if conflicting.Email == author1User.Email {
			foundAuthor1 = true
			if conflicting.Reason == "" {
				t.Error("Expected reason to be provided")
			}
		}
		if conflicting.Email == author2User.Email {
			t.Error("Author2 should not be in conflicting list")
		}
	}

	if !foundAuthor1 {
		t.Error("Expected author1 to be in conflicting list")
	}

	t.Logf("✅ COI check correctly identified 1 conflict out of 2 authors")
}

// TestUserCOICheck_NoConflicts tests COI check when there are no conflicts
func TestUserCOICheck_NoConflicts(t *testing.T) {
	if !isNeo4jAvailable() {
		t.Skip("Skipping: Neo4j not available")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	neo4jClient := setupNeo4jClient(t)
	defer neo4jClient.Close(context.Background())
	clearNeo4jTestData(t, neo4jClient)
	defer clearNeo4jTestData(t, neo4jClient)

	// Create users
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair2", "password123", "Chair", "Two", []string{"AI"})
	authorToken, authorUser, _ := ctx.RegisterUniqueUser("author3", "password123", "Author", "Three", []string{"ML"})
	_, reviewerUser, _ := ctx.RegisterUniqueUser("reviewer2", "password123", "Reviewer", "Two", []string{"ML"})

	// Setup Neo4j (no collaborations)
	authorSvc := neo4j.NewAuthorService(neo4jClient)
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: authorUser.Email})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: reviewerUser.Email})

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference No COI",
		Acronym: testutils.UniqueString("NOCOI"),
		Chair:   chairUser.Email,
		Domain:  []string{"ML"},
		Configurations: &dto.ConferenceConfiguration{
			HaveCOI:        boolPtr(true),
			COIWindowYears: intPtr(4),
		},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create submission
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Paper with no conflicts",
			Abstract: "Abstract",
			Domain:   []string{"ML"},
			Status:   "submitted",
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)
	ctx.MakeMultipartRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, authorToken)

	// Check COI
	coiCheckPath := fmt.Sprintf("/api/v1/users/%s/coi-check?conference_id=%d", url.PathEscape(reviewerUser.Email), conferenceID)
	coiResp, _ := ctx.MakeRequest("GET", coiCheckPath, nil, chairToken)

	if coiResp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(t, coiResp)
		t.Fatalf("Expected status 200, got %d. Body: %s", coiResp.StatusCode, body)
	}

	var coiData struct {
		Data *dto.UserCOICheckResponse `json:"data"`
	}
	testutils.DecodeResponse(t, coiResp, &coiData)

	if coiData.Data == nil {
		t.Fatal("Expected data in response, got nil")
	}

	// Verify no conflicts
	if coiData.Data.ConflictingCount != 0 {
		t.Errorf("Expected 0 conflicts, got %d", coiData.Data.ConflictingCount)
	}

	if len(coiData.Data.ConflictingAuthors) != 0 {
		t.Errorf("Expected empty conflicting authors list, got %d", len(coiData.Data.ConflictingAuthors))
	}

	t.Logf("✅ COI check correctly found no conflicts")
}

// TestUserCOICheck_WithCoAuthors tests COI check including co-authors
func TestUserCOICheck_WithCoAuthors(t *testing.T) {
	if !isNeo4jAvailable() {
		t.Skip("Skipping: Neo4j not available")
	}

	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	neo4jClient := setupNeo4jClient(t)
	defer neo4jClient.Close(context.Background())
	clearNeo4jTestData(t, neo4jClient)
	defer clearNeo4jTestData(t, neo4jClient)

	// Create users
	chairToken, chairUser, _ := ctx.RegisterUniqueUser("chair3", "password123", "Chair", "Three", []string{"AI"})
	authorToken, authorUser, _ := ctx.RegisterUniqueUser("author4", "password123", "Author", "Four", []string{"ML"})
	_, coAuthorUser, _ := ctx.RegisterUniqueUser("coauthor", "password123", "CoAuthor", "User", []string{"ML"})
	_, reviewerUser, _ := ctx.RegisterUniqueUser("reviewer3", "password123", "Reviewer", "Three", []string{"ML"})

	// Setup collaboration: reviewer collaborated with co-author
	authorSvc := neo4j.NewAuthorService(neo4jClient)
	currentYear := time.Now().Year()

	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: authorUser.Email})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: coAuthorUser.Email})
	authorSvc.CreateAuthor(context.Background(), neo4j.Author{Email: reviewerUser.Email})

	authorSvc.CreateCoauthorship(context.Background(), reviewerUser.Email, coAuthorUser.Email, neo4j.CoauthorRelationship{
		EstablishedDate: currentYear - 1,
	})

	// Create conference
	conference := &dto.Conference{
		Title:   "Test Conference CoAuthor COI",
		Acronym: testutils.UniqueString("COAUTHORCOI"),
		Chair:   chairUser.Email,
		Domain:  []string{"ML"},
		Configurations: &dto.ConferenceConfiguration{
			HaveCOI:        boolPtr(true),
			COIWindowYears: intPtr(4),
		},
	}

	confResp, _ := ctx.MakeRequest("POST", "/api/v1/conferences", map[string]interface{}{"conference": conference}, chairToken)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create submission with co-author
	submissionReq := &dto.SubmissionCreateRequest{
		ConferenceID: conferenceID,
		Submission: &dto.Submission{
			Title:    "Paper with co-author",
			Abstract: "Abstract",
			Domain:   []string{"ML"},
			Status:   "submitted",
			Information: &dto.SubmissionInformation{
				CoAuthors: []string{coAuthorUser.Email},
			},
		},
	}
	submissionJSON, _ := json.Marshal(submissionReq)
	ctx.MakeMultipartRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/submissions", conferenceID), map[string]string{
		"submission": string(submissionJSON),
	}, authorToken)

	// Check COI
	coiCheckPath := fmt.Sprintf("/api/v1/users/%s/coi-check?conference_id=%d", url.PathEscape(reviewerUser.Email), conferenceID)
	coiResp, _ := ctx.MakeRequest("GET", coiCheckPath, nil, chairToken)

	if coiResp.StatusCode != http.StatusOK {
		body := testutils.ReadResponseBody(t, coiResp)
		t.Fatalf("Expected status 200, got %d. Body: %s", coiResp.StatusCode, body)
	}

	var coiData struct {
		Data *dto.UserCOICheckResponse `json:"data"`
	}
	testutils.DecodeResponse(t, coiResp, &coiData)

	if coiData.Data == nil {
		t.Fatal("Expected data in response, got nil")
	}

	// Verify conflict detected with co-author
	if coiData.Data.ConflictingCount == 0 {
		t.Error("Expected conflict with co-author")
	}

	foundCoAuthor := false
	for _, conflicting := range coiData.Data.ConflictingAuthors {
		if conflicting.Email == coAuthorUser.Email {
			foundCoAuthor = true
		}
	}

	if !foundCoAuthor {
		t.Error("Expected co-author to be in conflicting list")
	}

	t.Logf("✅ COI check correctly detected conflict with co-author")
}

// TestUserCOICheck_InvalidInputs tests error handling
func TestUserCOICheck_InvalidInputs(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, _, _ := ctx.RegisterUniqueUser("chair4", "password123", "Chair", "Four", []string{"AI"})

	tests := []struct {
		name           string
		path           string
		expectedStatus int
	}{
		{
			name:           "Non-existent user with non-chair caller returns forbidden",
			path:           fmt.Sprintf("/api/v1/users/%s/coi-check?conference_id=1", url.PathEscape("nonexistent@example.com")),
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "Missing conference_id",
			path:           fmt.Sprintf("/api/v1/users/%s/coi-check", url.PathEscape("test@example.com")),
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Non-existent conference with non-chair caller returns forbidden",
			path:           fmt.Sprintf("/api/v1/users/%s/coi-check?conference_id=999999", url.PathEscape("test@example.com")),
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest("GET", tt.path, nil, chairToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			if resp.StatusCode != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, resp.StatusCode)
			}
		})
	}
}

// Helper functions

func isNeo4jAvailable() bool {
	client, err := neo4j.NewClient(neo4j.Config{
		URI:      getNeo4jURI(),
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
	return "bolt://localhost:7687"
}

func getNeo4jUsername() string {
	return "neo4j"
}

func getNeo4jPassword() string {
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
