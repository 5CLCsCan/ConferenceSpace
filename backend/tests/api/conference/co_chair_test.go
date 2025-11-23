package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestCoChairPermissions tests that co-chairs have the same permissions as the chair
func TestCoChairPermissions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	coChair1Token, coChair1, err := ctx.RegisterUniqueUser("cochair1", "password123", "CoChair", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register cochair1: %v", err)
	}

	coChair2Token, coChair2, err := ctx.RegisterUniqueUser("cochair2", "password123", "CoChair", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register cochair2: %v", err)
	}

	_, reviewer, err := ctx.RegisterUniqueUser("reviewer", "password123", "Reviewer", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register reviewer: %v", err)
	}

	nonChairToken, _, err := ctx.RegisterUniqueUser("nonchair", "password123", "NonChair", "User", []string{"CS"})
	if err != nil {
		t.Fatalf("Failed to register nonchair: %v", err)
	}

	// Create conference with co-chairs
	conf := &dto.Conference{
		Title:       "Test Conference with Co-Chairs",
		Acronym:     testutils.UniqueString("TCC2025"),
		Description: "A conference to test co-chair permissions",
		Chair:       chair.Email,
		CoChairs:    []string{coChair1.Email, coChair2.Email},
		Domain:      []string{"AI", "ML"},
	}
	confResp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Logf("✓ Conference created with ID: %d", conferenceID)

	// Test 1: Co-chair can update conference
	t.Run("CoChair1_CanUpdateConference", func(t *testing.T) {
		updateReq := &dto.ConferenceUpdateRequest{
			ConferenceID: conferenceID,
			Conference: &dto.Conference{
				Title:       "Updated Conference Title by CoChair1",
				Acronym:     conf.Acronym,
				Description: "Updated by co-chair 1",
				Chair:       chair.Email,
				CoChairs:    []string{coChair1.Email, coChair2.Email},
				Domain:      []string{"AI", "ML"},
			},
		}
		resp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d", conferenceID), updateReq, coChair1Token)
		if err != nil {
			t.Fatalf("Failed to update conference: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var updateData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &updateData)

		if updateData.Data.Title != "Updated Conference Title by CoChair1" {
			t.Errorf("Expected updated title, got %s", updateData.Data.Title)
		}

		t.Log("✓ CoChair1 successfully updated conference")
	})

	// Test 2: Co-chair can invite reviewers
	t.Run("CoChair2_CanInviteReviewers", func(t *testing.T) {
		inviteReq := &dto.ReviewerBatchInviteRequest{
			ConferenceID: conferenceID,
			Reviewers: []dto.Reviewer{
				{UserID: reviewer.ID, Domain: []string{"AI"}},
			},
		}
		resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), inviteReq, coChair2Token)
		if err != nil {
			t.Fatalf("Failed to invite reviewer: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusCreated)

		var inviteData struct {
			Data *dto.ReviewerBatchInviteResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &inviteData)

		if len(inviteData.Data.Success) != 1 {
			t.Errorf("Expected 1 successful invitation, got %d", len(inviteData.Data.Success))
		}

		t.Log("✓ CoChair2 successfully invited reviewer")
	})

	// Test 3: Co-chair can list reviewers
	t.Run("CoChair1_CanListReviewers", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/reviewers", conferenceID), nil, coChair1Token)
		if err != nil {
			t.Fatalf("Failed to list reviewers: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ CoChair1 successfully listed reviewers")
	})

	// Test 4: Non-chair cannot update conference
	t.Run("NonChair_CannotUpdateConference", func(t *testing.T) {
		updateReq := &dto.ConferenceUpdateRequest{
			ConferenceID: conferenceID,
			Conference: &dto.Conference{
				Title:       "Unauthorized Update",
				Acronym:     conf.Acronym,
				Description: "Should fail",
				Chair:       chair.Email,
				Domain:      []string{"AI"},
			},
		}
		resp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d", conferenceID), updateReq, nonChairToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		t.Log("✓ Non-chair correctly denied permission to update conference")
	})

	// Test 5: Co-chair can delete conference
	t.Run("CoChair2_CanDeleteConference", func(t *testing.T) {
		// Create another conference for deletion test
		deleteConf := &dto.Conference{
			Title:    "Conference to Delete",
			Acronym:  testutils.UniqueString("CTD2025"),
			Chair:    chair.Email,
			CoChairs: []string{coChair2.Email},
			Domain:   []string{"AI"},
		}
		createResp, err := client.Create(deleteConf, chairToken)
		if err != nil {
			t.Fatalf("Failed to create conference for deletion: %v", err)
		}
		testutils.AssertStatusCode(t, createResp, http.StatusCreated)

		var createData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, createResp, &createData)
		deleteConfID := createData.Data.ID

		// CoChair2 deletes the conference
		resp, err := ctx.MakeRequest("DELETE", fmt.Sprintf("/api/v1/conferences/%d", deleteConfID), nil, coChair2Token)
		if err != nil {
			t.Fatalf("Failed to delete conference: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		t.Log("✓ CoChair2 successfully deleted conference")
	})
}

// TestCoChairRoleFiltering tests that co-chairs appear when listing conferences with role filter
func TestCoChairRoleFiltering(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	coChair1Token, coChair1, err := ctx.RegisterUniqueUser("cochair1", "password123", "CoChair", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register cochair1: %v", err)
	}

	coChair2Token, coChair2, err := ctx.RegisterUniqueUser("cochair2", "password123", "CoChair", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register cochair2: %v", err)
	}

	_, otherUser, err := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"CS"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create Conference 1: coChair1 is co-chair
	conf1 := &dto.Conference{
		Title:    "Conference 1",
		Acronym:  testutils.UniqueString("CONF1-2025"),
		Chair:    chair.Email,
		CoChairs: []string{coChair1.Email},
		Domain:   []string{"AI"},
	}
	conf1Resp, err := client.Create(conf1, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference 1: %v", err)
	}
	testutils.AssertStatusCode(t, conf1Resp, http.StatusCreated)
	var conf1Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, conf1Resp, &conf1Data)
	conference1ID := conf1Data.Data.ID

	// Create Conference 2: coChair2 is co-chair
	conf2 := &dto.Conference{
		Title:    "Conference 2",
		Acronym:  testutils.UniqueString("CONF2-2025"),
		Chair:    chair.Email,
		CoChairs: []string{coChair2.Email},
		Domain:   []string{"ML"},
	}
	conf2Resp, err := client.Create(conf2, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference 2: %v", err)
	}
	testutils.AssertStatusCode(t, conf2Resp, http.StatusCreated)
	var conf2Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, conf2Resp, &conf2Data)
	conference2ID := conf2Data.Data.ID

	// Create Conference 3: coChair1 is chair, coChair2 is co-chair
	conf3 := &dto.Conference{
		Title:    "Conference 3",
		Acronym:  testutils.UniqueString("CONF3-2025"),
		Chair:    coChair1.Email,
		CoChairs: []string{coChair2.Email},
		Domain:   []string{"AI", "ML"},
	}
	conf3Resp, err := client.Create(conf3, coChair1Token)
	if err != nil {
		t.Fatalf("Failed to create conference 3: %v", err)
	}
	testutils.AssertStatusCode(t, conf3Resp, http.StatusCreated)
	var conf3Data struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, conf3Resp, &conf3Data)
	conference3ID := conf3Data.Data.ID

	// Create Conference 4: otherUser is chair (no co-chairs)
	conf4 := &dto.Conference{
		Title:   "Conference 4",
		Acronym: testutils.UniqueString("CONF4-2025"),
		Chair:   otherUser.Email,
		Domain:  []string{"CS"},
	}
	otherToken, err := ctx.LoginAndGetToken(otherUser.Email, "password123")
	if err != nil {
		t.Fatalf("Failed to login as other user: %v", err)
	}
	conf4Resp, err := client.Create(conf4, otherToken)
	if err != nil {
		t.Fatalf("Failed to create conference 4: %v", err)
	}
	testutils.AssertStatusCode(t, conf4Resp, http.StatusCreated)

	t.Log("✓ Test setup complete: 4 conferences created")

	// Test 1: CoChair1 lists conferences with role=co_chair (should see conference 1)
	t.Run("CoChair1_ListsConferencesWithCoChairRole", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true&role=co_chair", nil, coChair1Token)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		if listData.Data == nil {
			t.Fatal("Response data is nil")
		}

		// CoChair1 should see conference 1 (where they are co-chair)
		foundConf1 := false
		for _, conf := range listData.Data.Conferences {
			if conf.ID == conference1ID {
				foundConf1 = true
			}
			// Should not see conference 3 (where they are chair, not co-chair)
			if conf.ID == conference3ID {
				t.Error("CoChair1 should not see conference 3 when filtering by co_chair role (they are chair there)")
			}
		}

		if !foundConf1 {
			t.Error("CoChair1 should see conference 1 where they are co-chair")
		}

		t.Logf("✓ CoChair1 correctly sees %d conference(s) as co-chair", len(listData.Data.Conferences))
	})

	// Test 2: CoChair2 lists conferences with role=co_chair (should see conferences 2 and 3)
	t.Run("CoChair2_ListsConferencesWithCoChairRole", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true&role=co_chair", nil, coChair2Token)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		if listData.Data == nil {
			t.Fatal("Response data is nil")
		}

		// CoChair2 should see conferences 2 and 3 (where they are co-chair)
		foundConf2 := false
		foundConf3 := false
		for _, conf := range listData.Data.Conferences {
			if conf.ID == conference2ID {
				foundConf2 = true
			}
			if conf.ID == conference3ID {
				foundConf3 = true
			}
		}

		if !foundConf2 {
			t.Error("CoChair2 should see conference 2 where they are co-chair")
		}
		if !foundConf3 {
			t.Error("CoChair2 should see conference 3 where they are co-chair")
		}

		t.Logf("✓ CoChair2 correctly sees %d conference(s) as co-chair", len(listData.Data.Conferences))
	})

	// Test 3: CoChair1 lists conferences with role=chair (should see conference 3)
	t.Run("CoChair1_ListsConferencesWithChairRole", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true&role=chair", nil, coChair1Token)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		if listData.Data == nil {
			t.Fatal("Response data is nil")
		}

		// CoChair1 should see conference 3 (where they are chair)
		foundConf3 := false
		for _, conf := range listData.Data.Conferences {
			if conf.ID == conference3ID {
				foundConf3 = true
			}
			// Should not see conference 1 (where they are co-chair, not chair)
			if conf.ID == conference1ID {
				t.Error("CoChair1 should not see conference 1 when filtering by chair role (they are co-chair there)")
			}
		}

		if !foundConf3 {
			t.Error("CoChair1 should see conference 3 where they are chair")
		}

		t.Logf("✓ CoChair1 correctly sees %d conference(s) as chair", len(listData.Data.Conferences))
	})

	// Test 4: CoChair1 lists all their conferences (no role filter)
	t.Run("CoChair1_ListsAllTheirConferences", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true", nil, coChair1Token)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		if listData.Data == nil {
			t.Fatal("Response data is nil")
		}

		// CoChair1 should see conferences 1 (co-chair) and 3 (chair)
		foundConf1 := false
		foundConf3 := false
		for _, conf := range listData.Data.Conferences {
			if conf.ID == conference1ID {
				foundConf1 = true
			}
			if conf.ID == conference3ID {
				foundConf3 = true
			}
		}

		if !foundConf1 {
			t.Error("CoChair1 should see conference 1 where they are co-chair")
		}
		if !foundConf3 {
			t.Error("CoChair1 should see conference 3 where they are chair")
		}

		t.Logf("✓ CoChair1 correctly sees %d total conference(s)", len(listData.Data.Conferences))
	})

	// Test 5: Chair lists conferences with role=co_chair (should see nothing)
	t.Run("Chair_ListsConferencesWithCoChairRole_Empty", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences?myConferences=true&role=co_chair", nil, chairToken)
		if err != nil {
			t.Fatalf("Failed to list conferences: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var listData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &listData)

		if listData.Data == nil {
			t.Fatal("Response data is nil")
		}

		// Chair is not a co-chair in any conference, should see no results
		if len(listData.Data.Conferences) > 0 {
			t.Errorf("Chair should not see any conferences when filtering by co_chair role, got %d", len(listData.Data.Conferences))
		}

		t.Log("✓ Chair correctly sees 0 conferences when filtering by co_chair role")
	})
}

// TestCoChairAddedToConferenceUserRoles tests that co-chairs are added to conference_user_roles table
func TestCoChairAddedToConferenceUserRoles(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	_, coChair, err := ctx.RegisterUniqueUser("cochair", "password123", "CoChair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register cochair: %v", err)
	}

	// Create conference with co-chair
	conf := &dto.Conference{
		Title:    "Test Conference",
		Acronym:  testutils.UniqueString("TC2025"),
		Chair:    chair.Email,
		CoChairs: []string{coChair.Email},
		Domain:   []string{"AI"},
	}
	confResp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Logf("✓ Conference created with ID: %d", conferenceID)

	// Verify co-chair can access the conference (implicitly verifies role in DB)
	t.Run("CoChair_HasAccessToConference", func(t *testing.T) {
		// Get the conference as co-chair
		coChairToken, err := ctx.LoginAndGetToken(coChair.Email, "password123")
		if err != nil {
			t.Fatalf("Failed to login as co-chair: %v", err)
		}

		resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d", conferenceID), nil, coChairToken)
		if err != nil {
			t.Fatalf("Failed to get conference: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)

		// Try to update it (should succeed if role is properly set)
		updateReq := &dto.ConferenceUpdateRequest{
			ConferenceID: conferenceID,
			Conference: &dto.Conference{
				Title:    "Updated by CoChair",
				Acronym:  conf.Acronym,
				Chair:    chair.Email,
				CoChairs: []string{coChair.Email},
				Domain:   []string{"AI"},
			},
		}
		updateResp, err := ctx.MakeRequest("PUT", fmt.Sprintf("/api/v1/conferences/%d", conferenceID), updateReq, coChairToken)
		if err != nil {
			t.Fatalf("Failed to update conference: %v", err)
		}
		testutils.AssertStatusCode(t, updateResp, http.StatusOK)

		t.Log("✓ CoChair successfully accessed and updated conference (role verified)")
	})
}

