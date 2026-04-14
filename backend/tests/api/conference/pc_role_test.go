package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// assignPCRole assigns a PC role to a user in a conference by updating the conference with pc_members.
func assignPCRole(ctx *testutils.TestContext, confID int64, pcEmail string, chairToken string) error {
	req := map[string]interface{}{
		"conference": map[string]interface{}{
			"pc_members": []string{pcEmail},
		},
	}
	resp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d", confID), req, chairToken)
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to assign PC role: status %d", resp.StatusCode)
	}
	return nil
}

// TestPCRoleReadAccess tests that PC members can access all chair GET endpoints
func TestPCRoleReadAccess(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Setup: Create chair and PC users
	chairToken, chair, err := ctx.RegisterUniqueUser("pc-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	pcToken, pcUser, err := ctx.RegisterUniqueUser("pc-member", "password123", "PC", "Member", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register PC member: %v", err)
	}

	// Create a conference
	conf := &dto.Conference{
		Title:   "PC Test Conference",
		Acronym: testutils.UniqueString("PCTEST"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &confData)
	confID := confData.Data.ID

	// Assign PC role to user
	if err := assignPCRole(ctx, confID, pcUser.Email, chairToken); err != nil {
		t.Fatalf("Failed to assign PC role: %v", err)
	}

	// Create a submission for testing review endpoints
	authorToken, author, err := ctx.RegisterUniqueUser("pc-author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	sub := &dto.Submission{
		ConferenceID: confID,
		Author:       author.Email,
		Title:        "Test Paper for PC",
		Abstract:     "Abstract for testing PC access",
		Domain:       []string{"AI"},
		Status:       dto.StatusPublished,
	}
	subResp, err := submissionClient.Create(confID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	testutils.AssertStatusCode(t, subResp, http.StatusCreated)
	var subData struct {
		Data *dto.SubmissionResponse `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	subID := subData.Data.ID

	t.Logf("Conference ID: %d, Submission ID: %d, PC user: %s", confID, subID, pcUser.Email)

	// ========================================
	// Test: PC can access GET chair endpoints
	// ========================================

	readTests := []struct {
		name   string
		method string
		url    string
		status int
	}{
		{
			name:   "PC can list reviewers",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID),
			status: http.StatusOK,
		},
		{
			name:   "PC can list reviews for submission",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews", confID, subID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get review analytics",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews/analytics", confID, subID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get assignment suggestions",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get confirmed assignments",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", confID),
			status: http.StatusOK,
		},
		{
			name:   "PC can get rebuttal settings",
			method: "GET",
			url:    fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", confID),
			status: http.StatusOK,
		},
	}

	for _, tt := range readTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tt.method, tt.url, nil, pcToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, tt.status)
		})
	}

	// ========================================
	// Test: PC CANNOT access write endpoints
	// ========================================

	writeTests := []struct {
		name   string
		method string
		url    string
		body   interface{}
		status int
	}{
		{
			name:   "PC cannot invite reviewers",
			method: "POST",
			url:    fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID),
			body:   map[string]interface{}{"reviewers": []interface{}{}},
			status: http.StatusForbidden,
		},
		{
			name:   "PC cannot add assignment suggestions",
			method: "POST",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID),
			body:   map[string]interface{}{},
			status: http.StatusForbidden,
		},
		{
			name:   "PC cannot confirm suggestions",
			method: "POST",
			url:    fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", confID),
			body:   map[string]interface{}{},
			status: http.StatusForbidden,
		},
	}

	for _, tt := range writeTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tt.method, tt.url, tt.body, pcToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, tt.status)
		})
	}
}

// TestPCRoleNonMemberDenied tests that a regular user cannot access chair-only GET endpoints
func TestPCRoleNonMemberDenied(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pcdenied-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	otherToken, _, err := ctx.RegisterUniqueUser("pcdenied-other", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	conf := &dto.Conference{
		Title:   "PC Denied Test Conference",
		Acronym: testutils.UniqueString("PCDENY"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &confData)
	confID := confData.Data.ID

	// Non-member cannot access chair GET endpoints
	deniedTests := []struct {
		name string
		url  string
	}{
		{"cannot list reviewers", fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID)},
		{"cannot get suggestions", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID)},
		{"cannot get confirmed assignments", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", confID)},
	}

	for _, tt := range deniedTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest("GET", tt.url, nil, otherToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, http.StatusForbidden)
		})
	}
}
