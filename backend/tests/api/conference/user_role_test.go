package conference

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// assignPCRole updates a conference to add a PC member using the update endpoint.
func assignPCRole(ctx *testutils.TestContext, conferenceID int64, pcEmail string, chairToken string) error {
	client := NewClient(ctx)
	existing, err := client.GetSuccess(conferenceID, chairToken)
	if err != nil {
		return fmt.Errorf("failed to get conference: %w", err)
	}

	// Build current PC list plus new member
	pcSet := make(map[string]bool)
	for _, e := range existing.PCMembers {
		pcSet[e] = true
	}
	pcSet[pcEmail] = true

	pcMembers := make([]string, 0, len(pcSet))
	for e := range pcSet {
		pcMembers = append(pcMembers, e)
	}

	update := &dto.Conference{
		Title:     existing.Title,
		Acronym:   existing.Acronym,
		Chair:     existing.Chair,
		Domain:    existing.Domain,
		PCMembers: pcMembers,
	}
	resp, err := client.Update(conferenceID, update, chairToken)
	if err != nil {
		return fmt.Errorf("failed to update conference: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("update returned status %d", resp.StatusCode)
	}
	return nil
}

// TestGetConferenceUserRolePopulated verifies that GET /api/v1/conferences/:id
// returns the correct user_role field for each caller type.
// Regression test for the bug where user_role was always empty because GetByID
// never joined conference_user_roles.
func TestGetConferenceUserRolePopulated(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("ur-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	coChairToken, coChair, err := ctx.RegisterUniqueUser("ur-cochair", "password123", "CoChair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register co-chair: %v", err)
	}

	pcToken, pcUser, err := ctx.RegisterUniqueUser("ur-pc", "password123", "PC", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register PC member: %v", err)
	}

	otherToken, _, err := ctx.RegisterUniqueUser("ur-other", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conference with a co-chair
	conf := &dto.Conference{
		Title:    "User Role Test Conference",
		Acronym:  testutils.UniqueString("URTEST"),
		Chair:    chair.Email,
		CoChairs: []string{coChair.Email},
		Domain:   []string{"AI"},
	}
	confResp, err := client.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	confID := confResp.ID

	// Assign PC role
	if err := assignPCRole(ctx, confID, pcUser.Email, chairToken); err != nil {
		t.Fatalf("Failed to assign PC role: %v", err)
	}

	// Transition to open so non-privileged callers can access it
	_, err = ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", confID),
		map[string]interface{}{"new_status": "open"},
		chairToken,
	)
	if err != nil {
		t.Fatalf("Failed to transition conference status: %v", err)
	}

	tests := []struct {
		name         string
		token        string
		expectedRole string
	}{
		{"chair sees user_role=chair", chairToken, "chair"},
		{"co-chair sees user_role=co_chair", coChairToken, "co_chair"},
		{"pc member sees user_role=pc", pcToken, "pc"},
		{"unrelated user sees empty user_role", otherToken, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Get(confID, tt.token)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, http.StatusOK)

			var body struct {
				Data *dto.ConferenceResponse `json:"data"`
			}
			testutils.DecodeResponse(t, resp, &body)

			if body.Data.UserRole != tt.expectedRole {
				t.Errorf("user_role = %q, want %q", body.Data.UserRole, tt.expectedRole)
			}
		})
	}
}

// TestGetConferenceUserRoleUnrelatedUser verifies that authenticated users with no
// role in a conference receive an empty user_role field.
func TestGetConferenceUserRoleUnrelatedUser(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("ur-unauth-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	otherToken, _, err := ctx.RegisterUniqueUser("ur-unauth-other", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	conf := &dto.Conference{
		Title:   "Unauth Role Test Conference",
		Acronym: testutils.UniqueString("URUA"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	confResp, err := client.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	resp, err := client.Get(confResp.ID, otherToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data == nil {
		t.Fatalf("Expected conference data in response, got nil")
	}

	if body.Data.UserRole != "" {
		t.Errorf("user with no role should get empty user_role, got %q", body.Data.UserRole)
	}
}

// TestGetConferenceNonPrivilegedGetsPublicDates verifies that non-privileged users
// can still access public timeline fields while sensitive configuration stays hidden.
func TestGetConferenceNonPrivilegedGetsPublicDates(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pubcfg-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("pubcfg-author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author: %v", err)
	}

	now := time.Now().UTC()
	startDate := now.Add(40 * 24 * time.Hour)
	endDate := now.Add(43 * 24 * time.Hour)
	paperDeadline := now.Add(12 * 24 * time.Hour)
	reviewType := "double_blind"
	maxPages := 12

	conf := &dto.Conference{
		Title:   "Public Config Visibility Conference",
		Acronym: testutils.UniqueString("PUBCFG"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
		Configurations: &dto.ConferenceConfiguration{
			StartDate:                   &startDate,
			EndDate:                     &endDate,
			FullPaperSubmissionDeadline: &paperDeadline,
			ReviewType:                  &reviewType,
			MaximumPages:                &maxPages,
		},
	}
	confResp, err := client.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	chairView, err := client.GetSuccess(confResp.ID, chairToken)
	if err != nil {
		t.Fatalf("Failed to get conference as chair: %v", err)
	}
	if chairView.Configurations == nil || chairView.Configurations.StartDate == nil {
		t.Fatalf("Expected stored conference configuration in chair view")
	}

	resp, err := client.Get(confResp.ID, authorToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data == nil {
		t.Fatalf("Expected conference data in response")
	}
	if body.Data.Configurations == nil {
		t.Fatalf("Expected public configurations for non-privileged user")
	}

	if body.Data.Configurations.StartDate == nil || !body.Data.Configurations.StartDate.Equal(startDate) {
		t.Fatalf("expected start_date to be visible for non-privileged user")
	}
	if body.Data.Configurations.FullPaperSubmissionDeadline == nil ||
		!body.Data.Configurations.FullPaperSubmissionDeadline.Equal(paperDeadline) {
		t.Fatalf("expected full_paper_submission_deadline to be visible for non-privileged user")
	}

	if body.Data.Configurations.ReviewType != nil {
		t.Fatalf("expected review_type to be hidden for non-privileged user")
	}
	if body.Data.Configurations.MaximumPages != nil {
		t.Fatalf("expected maximum_pages to be hidden for non-privileged user")
	}
}
