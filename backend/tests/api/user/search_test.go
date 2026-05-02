package user

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// TestSearchUsers_WithoutConferenceID_NoAnnotation confirms that the existing
// search endpoint shape is preserved when no conference_id is supplied: the
// response must NOT contain "matched_fields" or "score" keys for any row.
func TestSearchUsers_WithoutConferenceID_NoAnnotation(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, err := ctx.RegisterUniqueUser(
		"search-no-annot-chair", "password123", "Chair", "User", []string{"AI"},
	)
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	resp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/users/search?q=%s", chair.Email),
		nil,
		chairToken,
	)
	if err != nil {
		t.Fatalf("search request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	body, _ := io.ReadAll(resp.Body)
	if strings.Contains(string(body), `"matched_fields"`) {
		t.Errorf("expected no 'matched_fields' field without conference_id; body: %s", string(body))
	}
	if strings.Contains(string(body), `"score"`) {
		t.Errorf("expected no 'score' field without conference_id; body: %s", string(body))
	}
}

// TestSearchUsers_WithConferenceID_AnnotatesMatch verifies that supplying
// ?conference_id= populates matched_fields and score on each returned user
// using the same scoring as /reviewer-suggestions.
func TestSearchUsers_WithConferenceID_AnnotatesMatch(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, err := ctx.RegisterUniqueUser(
		"search-annot-chair", "password123", "Chair", "User",
		[]string{"AI", "Machine Learning", "NLP"},
	)
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	// Register a candidate user whose email is unique enough to find via search,
	// with one overlapping domain (AI) and one non-overlapping (Robotics).
	uniqueTag := testutils.UniqueString("annotcand")
	candidateEmail := fmt.Sprintf("%s@example.com", uniqueTag)
	if _, err := ctx.RegisterUser(
		candidateEmail, "password123", "Anna", "Notater",
		[]string{"AI", "Robotics"},
	); err != nil {
		t.Fatalf("Failed to register candidate: %v", err)
	}

	confClient := conference.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Annotated Search Conf",
		Acronym: testutils.UniqueString("ANNOT"),
		Chair:   chair.Email,
		Domain:  []string{"AI", "Machine Learning", "NLP"},
	}
	createResp, err := confClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("create conference failed: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)

	var createdEnv struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &createdEnv)
	confID := createdEnv.Data.ID

	// Search with conference_id present.
	searchResp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/users/search?q=%s&conference_id=%d", uniqueTag, confID),
		nil,
		chairToken,
	)
	if err != nil {
		t.Fatalf("annotated search request failed: %v", err)
	}
	testutils.AssertStatusCode(t, searchResp, http.StatusOK)

	var body struct {
		Data *dto.UserSearchResponse `json:"data"`
	}
	testutils.DecodeResponse(t, searchResp, &body)

	if body.Data == nil || len(body.Data.Users) == 0 {
		t.Fatalf("expected at least one user back, got %+v", body.Data)
	}

	// Find the candidate by email.
	var found *dto.UserResponse
	for _, u := range body.Data.Users {
		if u.Email == candidateEmail {
			found = u
			break
		}
	}
	if found == nil {
		t.Fatalf("candidate %s not in search results", candidateEmail)
	}

	if found.Score == nil {
		t.Fatalf("expected non-nil Score on annotated row, got nil")
	}
	if *found.Score == 0 {
		t.Errorf("expected non-zero match score (1 of {ai,ml,nlp,robotics} = 25%%); got 0")
	}

	if len(found.MatchedFields) != 1 || strings.ToLower(found.MatchedFields[0]) != "ai" {
		t.Errorf("expected matched_fields=[ai], got %v", found.MatchedFields)
	}
}

// TestSearchUsers_WithConferenceID_NoOverlap_StillAnnotates confirms that a
// user with no domain overlap still gets annotation (matched_fields=[], score=0)
// so the FE can distinguish "annotated, no overlap" from "not annotated".
func TestSearchUsers_WithConferenceID_NoOverlap_StillAnnotates(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	chairToken, chair, err := ctx.RegisterUniqueUser(
		"search-no-overlap-chair", "password123", "Chair", "User", []string{"AI"},
	)
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	uniqueTag := testutils.UniqueString("nooverlap")
	candidateEmail := fmt.Sprintf("%s@example.com", uniqueTag)
	if _, err := ctx.RegisterUser(
		candidateEmail, "password123", "Norm", "Overlap",
		[]string{"Quantum Computing", "Cryptography"},
	); err != nil {
		t.Fatalf("Failed to register candidate: %v", err)
	}

	confClient := conference.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "No-Overlap Conf",
		Acronym: testutils.UniqueString("NOOVL"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createResp, err := confClient.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("create conference failed: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)

	var createdEnv struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &createdEnv)

	searchResp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/users/search?q=%s&conference_id=%d", uniqueTag, createdEnv.Data.ID),
		nil,
		chairToken,
	)
	if err != nil {
		t.Fatalf("search request failed: %v", err)
	}
	testutils.AssertStatusCode(t, searchResp, http.StatusOK)

	rawBody, _ := io.ReadAll(searchResp.Body)
	var body struct {
		Data *dto.UserSearchResponse `json:"data"`
	}
	if err := json.Unmarshal(rawBody, &body); err != nil {
		t.Fatalf("decode failed: %v", err)
	}

	var found *dto.UserResponse
	for _, u := range body.Data.Users {
		if u.Email == candidateEmail {
			found = u
			break
		}
	}
	if found == nil {
		t.Fatalf("candidate %s not in search results; raw=%s", candidateEmail, string(rawBody))
	}

	if found.Score == nil {
		t.Errorf("expected non-nil Score (annotated as 0), got nil; raw=%s", string(rawBody))
	}
	if found.Score != nil && *found.Score != 0 {
		t.Errorf("expected score=0 for no overlap, got %d", *found.Score)
	}
	if len(found.MatchedFields) != 0 {
		t.Errorf("expected empty matched_fields for no overlap, got %v", found.MatchedFields)
	}
}
