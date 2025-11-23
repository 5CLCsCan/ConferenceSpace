package conference

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestListConferences(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test user via API
	token, user, err := ctx.RegisterUniqueUser("chair", "password123", "Conference", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create test conferences via API
	conf1 := &dto.Conference{
		Title:   "AI Conference 2025",
		Acronym: testutils.UniqueString("AIC2025"),
		Chair:   user.Email,
		Domain:  []string{"AI", "ML"},
	}
	_, err = client.Create(conf1, token)
	if err != nil {
		t.Fatalf("Failed to create conference 1: %v", err)
	}

	conf2 := &dto.Conference{
		Title:   "ML Conference 2025",
		Acronym: testutils.UniqueString("MLC2025"),
		Chair:   user.Email,
		Domain:  []string{"ML"},
	}
	_, err = client.Create(conf2, token)
	if err != nil {
		t.Fatalf("Failed to create conference 2: %v", err)
	}

	tests := []struct {
		name           string
		request        *dto.ConferenceListRequest
		expectedStatus int
		minCount       int
	}{
		{
			name:           "list all conferences",
			request:        &dto.ConferenceListRequest{},
			expectedStatus: http.StatusOK,
			minCount:       2,
		},
		{
			name: "list with limit",
			request: &dto.ConferenceListRequest{
				Limit: 1,
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
		{
			name: "filter by title",
			request: &dto.ConferenceListRequest{
				Title: "AI",
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
		{
			name: "filter by acronym",
			request: &dto.ConferenceListRequest{
				Acronym: "AIC2025",
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.List(tt.request, token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			var respData struct {
				Data *dto.ConferenceListResponse `json:"data"`
			}
			testutils.DecodeResponse(t, resp, &respData)

			if len(respData.Data.Conferences) < tt.minCount {
				t.Errorf("Expected at least %d conferences, got %d", tt.minCount, len(respData.Data.Conferences))
			}
		})
	}
}

func TestCreateConference(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test user via API
	token, user, err := ctx.RegisterUniqueUser("chair", "password123", "Conference", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create co-chair users for testing
	_, coChair1, err := ctx.RegisterUniqueUser("cochair1", "password123", "CoChair", "One", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register cochair1 user: %v", err)
	}

	_, coChair2, err := ctx.RegisterUniqueUser("cochair2", "password123", "CoChair", "Two", []string{"ML"})
	if err != nil {
		t.Fatalf("Failed to register cochair2 user: %v", err)
	}

	tests := []struct {
		name           string
		conference     *dto.Conference
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name: "successfully create conference",
			conference: &dto.Conference{
				Title:       "New Conference 2025",
				Acronym:     testutils.UniqueString("NC2025"),
				Description: "A test conference",
				Chair:       user.Email,
				Domain:      []string{"Computer Science", "AI"},
			},
			token:          token,
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name: "successfully create conference with multiple co-chairs",
			conference: &dto.Conference{
				Title:       "Conference with Co-Chairs",
				Acronym:     testutils.UniqueString("CWC2025"),
				Description: "A conference with multiple co-chairs",
				Chair:       user.Email,
				CoChairs:    []string{coChair1.Email, coChair2.Email},
				Domain:      []string{"AI", "ML"},
			},
			token:          token,
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name: "successfully create conference with tracks",
			conference: &dto.Conference{
				Title:       "Conference with Tracks",
				Acronym:     testutils.UniqueString("CWT2025"),
				Description: "A conference with multiple tracks",
				Chair:       user.Email,
				Domain:      []string{"AI", "ML", "NLP"},
				Tracks:      []string{"Machine Learning", "Natural Language Processing", "Computer Vision"},
			},
			token:          token,
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name: "create without authentication",
			conference: &dto.Conference{
				Title:   "Unauthorized Conference",
				Acronym: testutils.UniqueString("UC2025"),
			},
			token:          "",
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		{
			name: "create with missing required fields",
			conference: &dto.Conference{
				Description: "Missing title and acronym",
			},
			token:          token,
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Create(tt.conference, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if _, ok := respMap["error"]; !ok {
					t.Error("Expected error field in response")
				}
			} else {
				var respData struct {
					Data *dto.ConferenceResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data.Title != tt.conference.Title {
					t.Errorf("Expected title %s, got %s", tt.conference.Title, respData.Data.Title)
				}

				// Verify tracks if they were provided
				if len(tt.conference.Tracks) > 0 {
					if len(respData.Data.Tracks) != len(tt.conference.Tracks) {
						t.Errorf("Expected %d tracks, got %d", len(tt.conference.Tracks), len(respData.Data.Tracks))
					}
					for i, track := range tt.conference.Tracks {
						if i < len(respData.Data.Tracks) && respData.Data.Tracks[i] != track {
							t.Errorf("Expected track[%d] %s, got %s", i, track, respData.Data.Tracks[i])
						}
					}
				}
			}
		})
	}
}

func TestGetConference(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test user and conference via API
	token, user, err := ctx.RegisterUniqueUser("chair", "password123", "Conference", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	confReq := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   user.Email,
		Domain:  []string{"AI"},
	}
	createResp, err := client.Create(confReq, token)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var createData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &createData)
	conferenceID := createData.Data.ID

	tests := []struct {
		name           string
		conferenceID   int64
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "successfully get conference",
			conferenceID:   conferenceID,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:           "get non-existent conference",
			conferenceID:   99999,
			expectedStatus: http.StatusNotFound,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Get(tt.conferenceID, token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respData struct {
					Data *dto.ConferenceResponse `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data.Title != "Test Conference" {
					t.Errorf("Expected title 'Test Conference', got %s", respData.Data.Title)
				}
			}
		})
	}
}

func TestUpdateConference(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Conference", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	otherToken, _, err := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conference via API
	confReq := &dto.Conference{
		Title:   "Test Conference",
		Acronym: testutils.UniqueString("TC2025"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createResp, err := client.Create(confReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var createData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &createData)
	conferenceID := createData.Data.ID

	tests := []struct {
		name           string
		conferenceID   int64
		token          string
		updateData     *dto.Conference
		expectedStatus int
		expectError    bool
	}{
		{
			name:         "chair successfully updates conference",
			conferenceID: conferenceID,
			token:        chairToken,
			updateData: &dto.Conference{
				Title:       "Updated Conference Title",
				Acronym:     confReq.Acronym, // Keep original acronym
				Description: "Updated description",
				Chair:       chair.Email,
				Domain:      []string{"AI", "Updated"},
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:         "non-chair cannot update conference",
			conferenceID: conferenceID,
			token:        otherToken,
			updateData: &dto.Conference{
				Title:   "Hacked Title",
				Acronym: confReq.Acronym,
				Chair:   chair.Email,
			},
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Update(tt.conferenceID, tt.updateData, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if _, ok := respMap["error"]; !ok {
					t.Error("Expected error field in response")
				}
			}
		})
	}
}

func TestDeleteConference(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Conference", "Chair", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	otherToken, _, err := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conferences via API
	conf1 := &dto.Conference{
		Title:   "Conference 1",
		Acronym: testutils.UniqueString("C1"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp1, err := client.Create(conf1, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference 1: %v", err)
	}
	var data1 struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &data1)

	conf2 := &dto.Conference{
		Title:   "Conference 2",
		Acronym: testutils.UniqueString("C2"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	resp2, err := client.Create(conf2, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference 2: %v", err)
	}
	var data2 struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &data2)

	tests := []struct {
		name           string
		conferenceID   int64
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "non-chair cannot delete conference",
			conferenceID:   data2.Data.ID,
			token:          otherToken,
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
		{
			name:           "chair successfully deletes conference",
			conferenceID:   data1.Data.ID,
			token:          chairToken,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := client.Delete(tt.conferenceID, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if respMap["message"] != "conference deleted successfully" {
					t.Error("Expected success message")
				}
			}
		})
	}
}
