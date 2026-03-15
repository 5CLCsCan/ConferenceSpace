package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	"github.com/dcao/conferencespace/tests/api/submission"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestConferenceStatusDefaultValue(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:       "Test Conference",
		Acronym:     testutils.UniqueString("TC2025"),
		Chair:       chair.Email,
		Domain:      []string{"AI"},
		Description: "Test conference for status validation",
	}

	resp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}

	testutils.AssertStatusCode(t, resp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &confData)

	// Verify default status is "open"
	if confData.Data.Status != model.ConferenceStatusOpen {
		t.Errorf("Expected default status to be '%s', got '%s'", model.ConferenceStatusOpen, confData.Data.Status)
	}
}

func TestConferenceStatusTransitions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create conference
	conf := &dto.Conference{
		Title:       "Status Transition Test Conference",
		Acronym:     testutils.UniqueString("STTC2025"),
		Chair:       chair.Email,
		Domain:      []string{"AI"},
		Description: "Test conference for status transitions",
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

	t.Run("transition from open to reviewing", func(t *testing.T) {
		// Only send JSON body fields (conference_id comes from URI)
		requestBody := map[string]interface{}{
			"conference_id": conferenceID, // Include this too for binding
			"new_status":    model.ConferenceStatusReviewing,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to transition status: %v", err)
		}

		if resp.StatusCode != http.StatusOK {
			body := testutils.ReadResponseBody(t, resp)
			t.Fatalf("Expected status 200, got %d. Body: %s", resp.StatusCode, body)
		}

		var transitionData struct {
			Data *dto.ConferenceTransitionStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &transitionData)

		if transitionData.Data == nil {
			t.Fatal("Expected transition data, got nil")
		}

		if transitionData.Data.PreviousStatus != model.ConferenceStatusOpen {
			t.Errorf("Expected previous status to be '%s', got '%s'", model.ConferenceStatusOpen, transitionData.Data.PreviousStatus)
		}
		if transitionData.Data.NewStatus != model.ConferenceStatusReviewing {
			t.Errorf("Expected new status to be '%s', got '%s'", model.ConferenceStatusReviewing, transitionData.Data.NewStatus)
		}

		// Verify status was actually updated
		getResp, err := client.Get(conferenceID, chairToken)
		if err != nil {
			t.Fatalf("Failed to get conference: %v", err)
		}
		testutils.AssertStatusCode(t, getResp, http.StatusOK)

		var getData struct {
			Data *dto.ConferenceResponse `json:"data"`
		}
		testutils.DecodeResponse(t, getResp, &getData)

		if getData.Data.Status != model.ConferenceStatusReviewing {
			t.Errorf("Conference status not updated. Expected '%s', got '%s'", model.ConferenceStatusReviewing, getData.Data.Status)
		}
	})

	t.Run("transition from reviewing to completed", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusCompleted,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to transition status: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var transitionData struct {
			Data *dto.ConferenceTransitionStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &transitionData)

		if transitionData.Data == nil {
			t.Fatal("Expected transition data, got nil")
		}

		if transitionData.Data.PreviousStatus != model.ConferenceStatusReviewing {
			t.Errorf("Expected previous status to be '%s', got '%s'", model.ConferenceStatusReviewing, transitionData.Data.PreviousStatus)
		}
		if transitionData.Data.NewStatus != model.ConferenceStatusCompleted {
			t.Errorf("Expected new status to be '%s', got '%s'", model.ConferenceStatusCompleted, transitionData.Data.NewStatus)
		}
	})
}

func TestConferenceArchiveTransitions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	conf := &dto.Conference{
		Title:       "Archive Transition Test Conference",
		Acronym:     testutils.UniqueString("ATTC2025"),
		Chair:       chair.Email,
		Domain:      []string{"AI"},
		Description: "Test conference for archive transitions",
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

	t.Run("transition from open to archived", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusArchived,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to transition status: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var transitionData struct {
			Data *dto.ConferenceTransitionStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &transitionData)

		if transitionData.Data == nil {
			t.Fatal("Expected transition data, got nil")
		}

		if transitionData.Data.PreviousStatus != model.ConferenceStatusOpen {
			t.Errorf("Expected previous status to be '%s', got '%s'", model.ConferenceStatusOpen, transitionData.Data.PreviousStatus)
		}
		if transitionData.Data.NewStatus != model.ConferenceStatusArchived {
			t.Errorf("Expected new status to be '%s', got '%s'", model.ConferenceStatusArchived, transitionData.Data.NewStatus)
		}
	})

	t.Run("transition from archived to completed", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusCompleted,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to transition status: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)

		var transitionData struct {
			Data *dto.ConferenceTransitionStatusResponse `json:"data"`
		}
		testutils.DecodeResponse(t, resp, &transitionData)

		if transitionData.Data == nil {
			t.Fatal("Expected transition data, got nil")
		}

		if transitionData.Data.PreviousStatus != model.ConferenceStatusArchived {
			t.Errorf("Expected previous status to be '%s', got '%s'", model.ConferenceStatusArchived, transitionData.Data.PreviousStatus)
		}
		if transitionData.Data.NewStatus != model.ConferenceStatusCompleted {
			t.Errorf("Expected new status to be '%s', got '%s'", model.ConferenceStatusCompleted, transitionData.Data.NewStatus)
		}
	})
}

func TestConferenceStatusInvalidTransitions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test user
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	// Create conference (status = open)
	conf := &dto.Conference{
		Title:       "Invalid Transition Test Conference",
		Acronym:     testutils.UniqueString("ITTC2025"),
		Chair:       chair.Email,
		Domain:      []string{"AI"},
		Description: "Test conference for invalid transitions",
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

	t.Run("cannot skip from open to completed", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusCompleted,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)

		var errorData struct {
			Error string `json:"error"`
		}
		testutils.DecodeResponse(t, resp, &errorData)
		if errorData.Error == "" {
			t.Error("Expected error message for invalid transition")
		}
	})

	// Transition to reviewing for next test
	requestBody := &dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusReviewing,
	}
	ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
		requestBody,
		chairToken,
	)

	t.Run("cannot revert from reviewing to open", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusOpen,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})

	// Transition to completed for next test
	requestBody = &dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusCompleted,
	}
	ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
		requestBody,
		chairToken,
	)

	t.Run("cannot transition from completed status", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusOpen,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
	})
}

func TestConferenceStatusPermissions(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	coChairToken, coChair, err := ctx.RegisterUniqueUser("cochair", "password123", "CoChair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register co-chair user: %v", err)
	}

	authorToken, _, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference with co-chair
	conf := &dto.Conference{
		Title:       "Permission Test Conference",
		Acronym:     testutils.UniqueString("PTC2025"),
		Chair:       chair.Email,
		CoChairs:    []string{coChair.Email},
		Domain:      []string{"AI"},
		Description: "Test conference for permission checks",
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

	t.Run("chair can transition status", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusReviewing,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			chairToken,
		)
		if err != nil {
			t.Fatalf("Failed to transition status: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)
	})

	// Revert back to open for co-chair test (create new conference instead)
	conf2 := &dto.Conference{
		Title:       "CoChair Permission Test Conference",
		Acronym:     testutils.UniqueString("CPTC2025"),
		Chair:       chair.Email,
		CoChairs:    []string{coChair.Email},
		Domain:      []string{"AI"},
		Description: "Test conference for co-chair permission checks",
	}

	confResp2, err := client.Create(conf2, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp2, http.StatusCreated)

	var confData2 struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp2, &confData2)
	conferenceID2 := confData2.Data.ID

	t.Run("co-chair can transition status", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID2,
			NewStatus:    model.ConferenceStatusReviewing,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID2),
			requestBody,
			coChairToken,
		)
		if err != nil {
			t.Fatalf("Failed to transition status: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusOK)
	})

	t.Run("non-chair cannot transition status", func(t *testing.T) {
		requestBody := &dto.ConferenceTransitionStatusRequest{
			ConferenceID: conferenceID,
			NewStatus:    model.ConferenceStatusCompleted,
		}

		resp, err := ctx.MakeRequest(
			"PUT",
			fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
			requestBody,
			authorToken,
		)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})
}

func TestSubmissionOnlyAllowedWhenConferenceOpen(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	conferenceClient := NewClient(ctx)
	submissionClient := submission.NewClient(ctx)

	// Create test users
	chairToken, chair, err := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair user: %v", err)
	}

	authorToken, author, err := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register author user: %v", err)
	}

	// Create conference (status = open by default)
	conf := &dto.Conference{
		Title:       "Submission Status Test Conference",
		Acronym:     testutils.UniqueString("SSTC2025"),
		Chair:       chair.Email,
		Domain:      []string{"AI"},
		Description: "Test conference for submission status validation",
	}

	confResp, err := conferenceClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, confResp, http.StatusCreated)

	var confData struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, confResp, &confData)
	conferenceID := confData.Data.ID

	t.Run("can submit when conference is open", func(t *testing.T) {
		sub := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Test Paper",
			Abstract:     "Test abstract",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Create(conferenceID, sub, authorToken)
		if err != nil {
			t.Fatalf("Failed to create submission: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusCreated)
	})

	// Transition conference to reviewing
	requestBody := &dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusReviewing,
	}
	ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
		requestBody,
		chairToken,
	)

	t.Run("cannot submit when conference is reviewing", func(t *testing.T) {
		sub := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Another Test Paper",
			Abstract:     "Another test abstract",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Create(conferenceID, sub, authorToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)

		var errorData struct {
			Error string `json:"error"`
		}
		testutils.DecodeResponse(t, resp, &errorData)
		if errorData.Error == "" {
			t.Error("Expected error message for submission when conference is reviewing")
		}
	})

	// Transition conference to completed
	requestBody = &dto.ConferenceTransitionStatusRequest{
		ConferenceID: conferenceID,
		NewStatus:    model.ConferenceStatusCompleted,
	}
	ctx.MakeRequest(
		"PUT",
		fmt.Sprintf("/api/v1/conferences/%d/status", conferenceID),
		requestBody,
		chairToken,
	)

	t.Run("cannot submit when conference is completed", func(t *testing.T) {
		sub := &dto.Submission{
			ConferenceID: conferenceID,
			Author:       author.Email,
			Title:        "Yet Another Test Paper",
			Abstract:     "Yet another test abstract",
			Domain:       []string{"AI"},
			Status:       dto.StatusDraft,
		}

		resp, err := submissionClient.Create(conferenceID, sub, authorToken)
		if err != nil {
			t.Fatalf("Failed to make request: %v", err)
		}

		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})
}

