package submission

import (
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestListSubmissions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:          "Test Conference",
		Acronym:        testutils.UniqueString("TC2025"),
		Chair:          chair.Email,
		PrimaryContact: chair.ID,
		AreaChair:      chair.ID,
		Domain:         []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create test submissions via API
	sub1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper 1",
		Abstract:     "Abstract 1",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	_, err = submissionClient.Create(conferenceID, sub1, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission 1: %v", err)
	}

	sub2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper 2",
		Abstract:     "Abstract 2",
		Domain:       []string{"ML"},
		Status:       dto.StatusPublished,
	}
	_, err = submissionClient.Create(conferenceID, sub2, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission 2: %v", err)
	}

	tests := []struct {
		name           string
		conferenceID   int64
		request        *dto.SubmissionListRequest
		expectedStatus int
		minCount       int
	}{
		{
			name:           "list all submissions",
			conferenceID:   conferenceID,
			request:        &dto.SubmissionListRequest{},
			expectedStatus: http.StatusOK,
			minCount:       2,
		},
		{
			name:         "filter by status",
			conferenceID: conferenceID,
			request: &dto.SubmissionListRequest{
				Status: dto.StatusDraft,
			},
			expectedStatus: http.StatusOK,
			minCount:       1,
		},
		{
			name:         "filter by author",
			conferenceID: conferenceID,
			request: &dto.SubmissionListRequest{
				Author: author.Email,
			},
			expectedStatus: http.StatusOK,
			minCount:       2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.List(tt.conferenceID, tt.request, chairToken)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			var respData struct {
				Data *dto.SubmissionListResponse `json:"data"`
			}
			testutils.DecodeResponse(t, resp, &respData)

			if len(respData.Data.Submissions) < tt.minCount {
				t.Errorf("Expected at least %d submissions, got %d", tt.minCount, len(respData.Data.Submissions))
			}
		})
	}
}

func TestCreateSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:          "Test Conference",
		Acronym:        testutils.UniqueString("TC2025"),
		Chair:          chair.Email,
		PrimaryContact: chair.ID,
		AreaChair:      chair.ID,
		Domain:         []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	tests := []struct {
		name           string
		conferenceID   int64
		token          string
		submission     *dto.Submission
		expectedStatus int
		expectError    bool
	}{
		{
			name:         "successfully create submission",
			conferenceID: conferenceID,
			token:        authorToken,
			submission: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "My Research Paper",
				Abstract:     "This is my research abstract",
				Domain:       []string{"Deep Learning", "AI"},
				Status:       dto.StatusDraft,
				Information: &dto.SubmissionInformation{
					Keywords: []string{"neural networks", "optimization"},
				},
			},
			expectedStatus: http.StatusCreated,
			expectError:    false,
		},
		{
			name:         "create without authentication",
			conferenceID: conferenceID,
			token:        "",
			submission: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "Unauthorized Paper",
				Abstract:     "Abstract",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusUnauthorized,
			expectError:    true,
		},
		{
			name:         "create with missing required fields",
			conferenceID: conferenceID,
			token:        authorToken,
			submission: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Abstract:     "Missing title",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusBadRequest,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.Create(tt.conferenceID, tt.submission, tt.token)
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
					Data *dto.Submission `json:"data"`
				}
				testutils.DecodeResponse(t, resp, &respData)

				if respData.Data.Title != tt.submission.Title {
					t.Errorf("Expected title %s, got %s", tt.submission.Title, respData.Data.Title)
				}
			}
		})
	}
}

func TestUpdateSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	otherToken, _, err := ctx.RegisterUniqueUser("other", "password123", "Other", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:          "Test Conference",
		Acronym:        testutils.UniqueString("TC2025"),
		Chair:          chair.Email,
		PrimaryContact: chair.ID,
		AreaChair:      chair.ID,
		Domain:         []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create submission via API
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Original Title",
		Abstract:     "Original Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	subResp, _ := submissionClient.Create(conferenceID, sub, authorToken)
	var subData struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, subResp, &subData)
	submissionID := subData.Data.ID

	tests := []struct {
		name           string
		conferenceID   int64
		submissionID   int64
		token          string
		updateData     *dto.Submission
		expectedStatus int
		expectError    bool
	}{
		{
			name:         "author successfully updates own submission",
			conferenceID: conferenceID,
			submissionID: submissionID,
			token:        authorToken,
			updateData: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "Updated Title",
				Abstract:     "Updated Abstract",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
		{
			name:         "other author cannot update submission",
			conferenceID: conferenceID,
			submissionID: submissionID,
			token:        otherToken,
			updateData: &dto.Submission{
				ConferenceID: conferenceID,
				Author:       author.Email,
				Title:        "Hacked Title",
				Abstract:     "Original Abstract",
				Status:       dto.StatusDraft,
			},
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.Update(tt.conferenceID, tt.submissionID, tt.updateData, tt.token)
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

func TestDeleteSubmission(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	submissionClient := NewClient(ctx)
	conferenceClient := conference.NewClient(ctx)

	// Create test users via API
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}
	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}
	otherToken, _, err := ctx.RegisterUniqueUser("other", "password123", "Other", "Author", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register other user: %v", err)
	}

	// Create conference via API
	conf := &dto.Conference{
		Title:          "Test Conference",
		Acronym:        testutils.UniqueString("TC2025"),
		Chair:          chair.Email,
		PrimaryContact: chair.ID,
		AreaChair:      chair.ID,
		Domain:         []string{"AI"},
	}
	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	// Create submissions via API
	sub1 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper 1",
		Abstract:     "Abstract 1",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	resp1, _ := submissionClient.Create(conferenceID, sub1, authorToken)
	var data1 struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp1, &data1)

	sub2 := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Paper 2",
		Abstract:     "Abstract 2",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	resp2, _ := submissionClient.Create(conferenceID, sub2, authorToken)
	var data2 struct {
		Data *dto.Submission `json:"data"`
	}
	testutils.DecodeResponse(t, resp2, &data2)

	tests := []struct {
		name           string
		conferenceID   int64
		submissionID   int64
		token          string
		expectedStatus int
		expectError    bool
	}{
		{
			name:           "other author cannot delete submission",
			conferenceID:   conferenceID,
			submissionID:   data2.Data.ID,
			token:          otherToken,
			expectedStatus: http.StatusForbidden,
			expectError:    true,
		},
		{
			name:           "author successfully deletes own submission",
			conferenceID:   conferenceID,
			submissionID:   data1.Data.ID,
			token:          authorToken,
			expectedStatus: http.StatusOK,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := submissionClient.Delete(tt.conferenceID, tt.submissionID, tt.token)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}

			testutils.AssertStatusCode(t, resp, tt.expectedStatus)

			if !tt.expectError {
				var respMap map[string]interface{}
				testutils.DecodeResponse(t, resp, &respMap)
				if respMap["message"] != "submission deleted successfully" {
					t.Error("Expected success message")
				}
			}
		})
	}
}
