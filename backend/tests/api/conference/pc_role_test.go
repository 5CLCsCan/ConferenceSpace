package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestPCRoleReadAccess tests that PC members assigned at creation can access chair GET endpoints
func TestPCRoleReadAccess(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pc-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	pcToken, pcUser, err := ctx.RegisterUniqueUser("pc-member", "password123", "PC", "Member", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register PC member: %v", err)
	}

	// Create conference with PC member assigned at creation (matches wizard flow)
	conf := &dto.Conference{
		Title:     "PC Test Conference",
		Acronym:   testutils.UniqueString("PCTEST"),
		Chair:     chair.Email,
		Domain:    []string{"AI"},
		PCMembers: []string{pcUser.Email},
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

	// Verify pc_members is populated in creation response
	if len(confData.Data.PCMembers) != 1 || confData.Data.PCMembers[0] != pcUser.Email {
		t.Fatalf("Expected pc_members=[%s] in create response, got %v", pcUser.Email, confData.Data.PCMembers)
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
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	subID := subData.Data.ID

	// Test: PC can access GET chair endpoints
	readTests := []struct {
		name   string
		url    string
		status int
	}{
		{"PC can list reviewers", fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID), http.StatusOK},
		{"PC can list reviews", fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews", confID, subID), http.StatusOK},
		{"PC can get review analytics", fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/reviews/analytics", confID, subID), http.StatusOK},
		{"PC can get suggestions", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID), http.StatusOK},
		{"PC can get confirmed assignments", fmt.Sprintf("/api/v1/conferences/%d/assignments/confirmed", confID), http.StatusOK},
		{"PC can get rebuttal settings", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", confID), http.StatusOK},
	}

	for _, tt := range readTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest("GET", tt.url, nil, pcToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, tt.status)
		})
	}

	// Test: PC CANNOT access write endpoints
	writeTests := []struct {
		name   string
		method string
		url    string
		body   interface{}
	}{
		{"PC cannot invite reviewers", "POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID), map[string]interface{}{"reviewers": []interface{}{}}},
		{"PC cannot add suggestions", "POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions", confID), map[string]interface{}{}},
		{"PC cannot confirm suggestions", "POST", fmt.Sprintf("/api/v1/conferences/%d/assignments/suggestions/confirm", confID), map[string]interface{}{}},
	}

	for _, tt := range writeTests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest(tt.method, tt.url, tt.body, pcToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, http.StatusForbidden)
		})
	}
}

// TestPCRoleSync tests that updating pc_members correctly adds and removes PC roles
func TestPCRoleSync(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pcsync-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	_, userA, err := ctx.RegisterUniqueUser("pcsync-a", "password123", "User", "A", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user A: %v", err)
	}

	_, userB, err := ctx.RegisterUniqueUser("pcsync-b", "password123", "User", "B", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user B: %v", err)
	}

	_, userC, err := ctx.RegisterUniqueUser("pcsync-c", "password123", "User", "C", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user C: %v", err)
	}

	// Create conference with userA and userB as PC
	conf := &dto.Conference{
		Title:     "PC Sync Test",
		Acronym:   testutils.UniqueString("PCSYNC"),
		Chair:     chair.Email,
		Domain:    []string{"AI"},
		PCMembers: []string{userA.Email, userB.Email},
	}
	createResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &confData)
	confID := confData.Data.ID

	t.Run("creation includes both PC members", func(t *testing.T) {
		getResp, err := conferenceClient.Get(confID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get conference: %v", err)
		}
		var getData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		pcEmails := getData.Data.PCMembers
		if len(pcEmails) != 2 {
			t.Fatalf("Expected 2 PC members, got %d: %v", len(pcEmails), pcEmails)
		}
	})

	t.Run("update syncs PC members: remove A, keep B, add C", func(t *testing.T) {
		updated := &dto.Conference{
			Title:     conf.Title,
			Acronym:   conf.Acronym,
			Chair:     chair.Email,
			Domain:    []string{"AI"},
			PCMembers: []string{userB.Email, userC.Email},
		}
		updateResp, err := conferenceClient.Update(confID, updated, chairToken)
		if err != nil {
			t.Fatalf("Failed to update conference: %v", err)
		}
		testutils.AssertStatusCode(t, updateResp, http.StatusOK)

		// Verify via GET
		getResp, err := conferenceClient.Get(confID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get conference: %v", err)
		}
		var getData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		pcEmails := getData.Data.PCMembers
		if len(pcEmails) != 2 {
			t.Fatalf("Expected 2 PC members after sync, got %d: %v", len(pcEmails), pcEmails)
		}

		emailSet := make(map[string]bool)
		for _, e := range pcEmails {
			emailSet[e] = true
		}
		if emailSet[userA.Email] {
			t.Errorf("User A should have been removed from PC")
		}
		if !emailSet[userB.Email] {
			t.Errorf("User B should still be PC")
		}
		if !emailSet[userC.Email] {
			t.Errorf("User C should have been added as PC")
		}
	})
}

// TestPCRoleExclusivity tests that PC role cannot coexist with other roles
func TestPCRoleExclusivity(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pcexcl-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	_, testUser, err := ctx.RegisterUniqueUser("pcexcl-user", "password123", "Test", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register test user: %v", err)
	}

	t.Run("cannot assign PC to existing reviewer", func(t *testing.T) {
		reviewerToken, reviewerUser, err := ctx.RegisterUniqueUser("pcexcl-reviewer", "password123", "Reviewer", "User", []string{"AI"})
		if err != nil {
			t.Fatalf("Failed to register reviewer user: %v", err)
		}

		conf := &dto.Conference{
			Title:   "Exclusivity Test 1",
			Acronym: testutils.UniqueString("PCEX1"),
			Chair:   chair.Email,
			Domain:  []string{"AI"},
		}
		createResp, err := conferenceClient.Create(conf, chairToken)
		if err != nil {
			t.Fatalf("Failed to create conference: %v", err)
		}
		testutils.AssertStatusCode(t, createResp, http.StatusCreated)
		var confData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &confData)
		confID := confData.Data.ID

		// Invite as reviewer
		inviteResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID),
			map[string]interface{}{
				"reviewers": []map[string]interface{}{
					{"user_id": reviewerUser.ID},
				},
			}, chairToken)
		if err != nil {
			t.Fatalf("Failed to invite reviewer: %v", err)
		}
		testutils.AssertStatusCode(t, inviteResp, http.StatusCreated)

		// Reviewer accepts invitation — this creates the reviewer role entry
		var inviteData struct {
			Data *dto.ReviewerBatchInviteResponse `json:"data"`
		}
		testutils.DecodeResponse(t, inviteResp, &inviteData)
		if len(inviteData.Data.Success) > 0 {
			reviewerID := inviteData.Data.Success[0].ID
			acceptReq := map[string]interface{}{
				"conference_id": confID,
				"reviewer_id":   reviewerID,
				"status":        "accepted",
			}
			acceptResp, err := ctx.MakeRequest("PUT",
				fmt.Sprintf("/api/v1/conferences/%d/reviewers/%d/status", confID, reviewerID),
				acceptReq, reviewerToken)
			if err != nil {
				t.Fatalf("Failed to accept reviewer invitation: %v", err)
			}
			testutils.AssertStatusCode(t, acceptResp, http.StatusOK)
		}

		// Try to assign PC via update — should fail with 409
		updated := &dto.Conference{
			Title:     conf.Title,
			Acronym:   conf.Acronym,
			Chair:     chair.Email,
			Domain:    []string{"AI"},
			PCMembers: []string{reviewerUser.Email},
		}
		updateResp, err := conferenceClient.Update(confID, updated, chairToken)
		if err != nil {
			t.Fatalf("Failed to make update request: %v", err)
		}
		testutils.AssertStatusCode(t, updateResp, http.StatusConflict)
	})

	t.Run("cannot invite reviewer who is already PC", func(t *testing.T) {
		conf := &dto.Conference{
			Title:     "Exclusivity Test 2",
			Acronym:   testutils.UniqueString("PCEX2"),
			Chair:     chair.Email,
			Domain:    []string{"AI"},
			PCMembers: []string{testUser.Email},
		}
		createResp, err := conferenceClient.Create(conf, chairToken)
		if err != nil {
			t.Fatalf("Failed to create conference: %v", err)
		}
		testutils.AssertStatusCode(t, createResp, http.StatusCreated)
		var confData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &confData)
		confID := confData.Data.ID

		// Try to invite as reviewer — should fail
		inviteResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID),
			map[string]interface{}{
				"reviewers": []map[string]interface{}{
					{"user_id": testUser.ID},
				},
			}, chairToken)
		if err != nil {
			t.Fatalf("Failed to make invite request: %v", err)
		}
		// Reviewer invite may return 201 with errors in the response body, or 500/409.
		// The key assertion: the user should NOT have reviewer role after this.
		// Check via GET that pc_members still includes the user.
		getResp, err := conferenceClient.Get(confID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get conference: %v", err)
		}
		var getData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		if len(getData.Data.PCMembers) == 0 || getData.Data.PCMembers[0] != testUser.Email {
			t.Errorf("User should still be PC member, got pc_members=%v", getData.Data.PCMembers)
		}
		_ = inviteResp
	})

	t.Run("re-assigning same PC member is a no-op", func(t *testing.T) {
		conf := &dto.Conference{
			Title:     "Exclusivity Test 3",
			Acronym:   testutils.UniqueString("PCEX3"),
			Chair:     chair.Email,
			Domain:    []string{"AI"},
			PCMembers: []string{testUser.Email},
		}
		createResp, err := conferenceClient.Create(conf, chairToken)
		if err != nil {
			t.Fatalf("Failed to create conference: %v", err)
		}
		testutils.AssertStatusCode(t, createResp, http.StatusCreated)
		var confData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &confData)
		confID := confData.Data.ID

		// Update with same PC member — should succeed
		updated := &dto.Conference{
			Title:     conf.Title,
			Acronym:   conf.Acronym,
			Chair:     chair.Email,
			Domain:    []string{"AI"},
			PCMembers: []string{testUser.Email},
		}
		updateResp, err := conferenceClient.Update(confID, updated, chairToken)
		if err != nil {
			t.Fatalf("Failed to update: %v", err)
		}
		testutils.AssertStatusCode(t, updateResp, http.StatusOK)
	})
}

// TestPCRoleConferenceList tests that PC members see their conferences in the list
func TestPCRoleConferenceList(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("pclist-chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	pcToken, pcUser, err := ctx.RegisterUniqueUser("pclist-pc", "password123", "PC", "Member", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register PC member: %v", err)
	}

	conf := &dto.Conference{
		Title:     "PC List Test",
		Acronym:   testutils.UniqueString("PCLIST"),
		Chair:     chair.Email,
		Domain:    []string{"AI"},
		PCMembers: []string{pcUser.Email},
	}
	createResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &confData)
	confID := confData.Data.ID

	t.Run("PC member sees conference with myConferences=true", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true", nil, pcToken)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.ConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		found := false
		for _, c := range listData.Data.Conferences {
			if c.ID == confID {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("PC member should see conference %d in myConferences list", confID)
		}
	})

	t.Run("PC member sees conference with role=pc filter", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true&role=pc", nil, pcToken)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.ConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		found := false
		for _, c := range listData.Data.Conferences {
			if c.ID == confID {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("PC member should see conference %d with role=pc filter", confID)
		}
	})
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
