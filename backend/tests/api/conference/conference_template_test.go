package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// createTemplate is a helper that POSTs a new template and returns its ID.
func createTemplate(t *testing.T, ctx *testutils.TestContext, token string) int64 {
	t.Helper()

	payload := &dto.ConferenceConfigTemplatePayload{}
	body := map[string]interface{}{
		"template": map[string]interface{}{
			"name":    testutils.UniqueString("tmpl"),
			"payload": payload,
		},
	}
	resp, err := ctx.MakeRequest("POST", "/api/v1/conference-config-templates", body, token)
	if err != nil {
		t.Fatalf("createTemplate: request failed: %v", err)
	}
	// Accept 200 or 201
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		t.Fatalf("createTemplate: expected 200/201, got %d", resp.StatusCode)
	}

	var data struct {
		Data *dto.ConferenceConfigTemplateResponse `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &data)
	if data.Data == nil {
		t.Fatal("createTemplate: response data is nil")
	}
	return data.Data.ID
}

// TestCreateTemplate_MalformedPayload verifies that a POST with a missing
// template body field returns 400.
func TestCreateTemplate_MalformedPayload(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	userToken, _, _ := ctx.RegisterUniqueUser("user", "password123", "User", "One", []string{"AI"})

	// Send an empty body — "template" field is missing.
	resp, err := ctx.MakeRequest("POST", "/api/v1/conference-config-templates", map[string]interface{}{}, userToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("Expected 400 for missing template field, got %d", resp.StatusCode)
	}
}

// TestUpdateTemplate_WrongOwner verifies that user B cannot update a template
// created by user A. The storage filters by owner email, so a mismatch returns 404.
func TestUpdateTemplate_WrongOwner(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	userAToken, _, _ := ctx.RegisterUniqueUser("userA", "password123", "User", "A", []string{"AI"})
	userBToken, _, _ := ctx.RegisterUniqueUser("userB", "password123", "User", "B", []string{"AI"})

	templateID := createTemplate(t, ctx, userAToken)

	payload := &dto.ConferenceConfigTemplatePayload{}
	updateBody := map[string]interface{}{
		"template": map[string]interface{}{
			"name":    "Modified by B",
			"payload": payload,
		},
	}
	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conference-config-templates/%d", templateID),
		updateBody, userBToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	// Storage filters by (id, userEmail) — mismatch returns "not found" → 404.
	if resp.StatusCode != http.StatusNotFound && resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 404 or 403, got %d", resp.StatusCode)
	}
}

// TestDeleteTemplate_WrongOwner verifies that user B cannot delete a template
// created by user A.
func TestDeleteTemplate_WrongOwner(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	userAToken, _, _ := ctx.RegisterUniqueUser("userA", "password123", "User", "A", []string{"AI"})
	userBToken, _, _ := ctx.RegisterUniqueUser("userB", "password123", "User", "B", []string{"AI"})

	templateID := createTemplate(t, ctx, userAToken)

	resp, err := ctx.MakeRequest("DELETE",
		fmt.Sprintf("/api/v1/conference-config-templates/%d", templateID),
		nil, userBToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusNotFound && resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 404 or 403, got %d", resp.StatusCode)
	}

	// Verify template still exists (user A can still fetch it).
	listResp, err := ctx.MakeRequest("GET", "/api/v1/conference-config-templates", nil, userAToken)
	if err != nil {
		t.Fatalf("List request failed: %v", err)
	}
	testutils.AssertStatusCode(t, listResp, http.StatusOK)

	var listData struct {
		Data *dto.ConferenceConfigTemplateListResponse `json:"data"`
	}
	testutils.DecodeResponse(t, listResp, &listData)

	found := false
	for _, tmpl := range listData.Data.Templates {
		if tmpl.ID == templateID {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Template %d should still exist after failed delete by wrong owner", templateID)
	}
}
