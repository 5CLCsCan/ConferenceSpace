package conference

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestConferenceBookmark(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	user1Token, user1, err := ctx.RegisterUniqueUser("user1", "password123", "User", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user1: %v", err)
	}

	user2Token, _, err := ctx.RegisterUniqueUser("user2", "password123", "User", "Two", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user2: %v", err)
	}

	// Create test conference
	conf := &dto.Conference{
		Title:   "Test Conference for Bookmarks",
		Acronym: testutils.UniqueString("TCFB2025"),
		Chair:   user1.Email,
		Domain:  []string{"AI", "ML"},
	}
	createResp, err := client.Create(conf, user1Token)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var createData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &createData)
	conferenceID := createData.Data.ID

	t.Run("add bookmark successfully", func(t *testing.T) {
		resp, err := client.ToggleBookmark(conferenceID, user2Token)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.ConferenceBookmarkResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if !respData.Data.IsBookmarked {
			t.Error("Expected IsBookmarked to be true")
		}
		if respData.Data.Message != "bookmark added successfully" {
			t.Errorf("Expected 'bookmark added successfully', got %s", respData.Data.Message)
		}
	})

	t.Run("remove bookmark successfully", func(t *testing.T) {
		resp, err := client.ToggleBookmark(conferenceID, user2Token)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.ConferenceBookmarkResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if respData.Data.IsBookmarked {
			t.Error("Expected IsBookmarked to be false")
		}
		if respData.Data.Message != "bookmark removed successfully" {
			t.Errorf("Expected 'bookmark removed successfully', got %s", respData.Data.Message)
		}
	})

	t.Run("add bookmark again after removal", func(t *testing.T) {
		resp, err := client.ToggleBookmark(conferenceID, user2Token)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.ConferenceBookmarkResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if !respData.Data.IsBookmarked {
			t.Error("Expected IsBookmarked to be true")
		}
	})

	t.Run("bookmark non-existent conference", func(t *testing.T) {
		resp, err := client.ToggleBookmark(99999, user2Token)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusNotFound)
	})

	t.Run("bookmark without authentication", func(t *testing.T) {
		resp, err := client.ToggleBookmark(conferenceID, "")
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusUnauthorized)
	})
}

func TestListConferencesWithBookmarkFilter(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	userToken, user, err := ctx.RegisterUniqueUser("bookmarkuser", "password123", "Bookmark", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register user: %v", err)
	}

	// Create multiple conferences
	conf1 := &dto.Conference{
		Title:   "Conference 1",
		Acronym: testutils.UniqueString("C1"),
		Chair:   user.Email,
		Domain:  []string{"AI"},
	}
	resp1, err := client.Create(conf1, userToken)
	if err != nil {
		t.Fatalf("Failed to create conference 1: %v", err)
	}
	var data1 struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &data1)
	conferenceID1 := data1.Data.ID

	conf2 := &dto.Conference{
		Title:   "Conference 2",
		Acronym: testutils.UniqueString("C2"),
		Chair:   user.Email,
		Domain:  []string{"ML"},
	}
	resp2, err := client.Create(conf2, userToken)
	if err != nil {
		t.Fatalf("Failed to create conference 2: %v", err)
	}
	var data2 struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &data2)
	conferenceID2 := data2.Data.ID

	conf3 := &dto.Conference{
		Title:   "Conference 3",
		Acronym: testutils.UniqueString("C3"),
		Chair:   user.Email,
		Domain:  []string{"NLP"},
	}
	_, err = client.Create(conf3, userToken)
	if err != nil {
		t.Fatalf("Failed to create conference 3: %v", err)
	}

	// Bookmark conference 1 and 2
	_, err = client.ToggleBookmark(conferenceID1, userToken)
	if err != nil {
		t.Fatalf("Failed to bookmark conference 1: %v", err)
	}

	_, err = client.ToggleBookmark(conferenceID2, userToken)
	if err != nil {
		t.Fatalf("Failed to bookmark conference 2: %v", err)
	}

	t.Run("list only bookmarked conferences", func(t *testing.T) {
		// Update client List to support MyBookmark parameter
		path := "/api/v1/conferences?myBookmark=true"
		resp, err := ctx.MakeRequest("GET", path, nil, userToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if len(respData.Data.Conferences) != 2 {
			t.Errorf("Expected 2 bookmarked conferences, got %d", len(respData.Data.Conferences))
		}

		// Check that we got the right conferences
		bookmarkedIDs := map[int64]bool{}
		for _, conf := range respData.Data.Conferences {
			bookmarkedIDs[conf.ID] = true
		}

		if !bookmarkedIDs[conferenceID1] {
			t.Error("Conference 1 should be in bookmarked list")
		}
		if !bookmarkedIDs[conferenceID2] {
			t.Error("Conference 2 should be in bookmarked list")
		}
	})

	t.Run("list all conferences without bookmark filter", func(t *testing.T) {
		resp, err := client.List(&dto.ConferenceListRequest{}, userToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var respData struct {
			Data *dto.UserConferenceListResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &respData)

		if len(respData.Data.Conferences) < 3 {
			t.Errorf("Expected at least 3 conferences, got %d", len(respData.Data.Conferences))
		}
	})
}
