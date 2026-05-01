package conference

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// suggestionResponse mirrors dto.ReviewerSuggestionResponse for decoding.
// Defined locally so the test file does not have to import internal types beyond what tests usually do.
type suggestionResponse struct {
	Data *dto.ReviewerSuggestionResponse `json:"data"`
}

// TestReviewerSuggestions_AuthGuards verifies the route's authentication and authorization behavior.
func TestReviewerSuggestions_AuthGuards(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("rs-chair-auth", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	coChairToken, coChair, err := ctx.RegisterUniqueUser("rs-cochair-auth", "password123", "CoChair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register co-chair: %v", err)
	}

	otherToken, _, err := ctx.RegisterUniqueUser("rs-other-auth", "password123", "Other", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register non-chair user: %v", err)
	}

	conf := &dto.Conference{
		Title:    "Reviewer Suggestion Auth Test",
		Acronym:  testutils.UniqueString("RSAUTH"),
		Chair:    chair.Email,
		CoChairs: []string{coChair.Email},
		Domain:   []string{"AI", "ML"},
	}
	createResp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)

	var created struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &created)
	confID := created.Data.ID

	path := fmt.Sprintf("/api/v1/conferences/%d/reviewer-suggestions", confID)

	t.Run("unauthenticated_returns_401", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", path, nil, "")
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusUnauthorized)
	})

	t.Run("non_chair_user_returns_403", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", path, nil, otherToken)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusForbidden)
	})

	t.Run("chair_returns_200", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", path, nil, chairToken)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)
	})

	t.Run("co_chair_returns_200", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", path, nil, coChairToken)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		testutils.AssertStatusCode(t, resp, http.StatusOK)
	})

	t.Run("invalid_conference_id_returns_404_or_403", func(t *testing.T) {
		resp, err := ctx.MakeRequest("GET", "/api/v1/conferences/999999999/reviewer-suggestions", nil, chairToken)
		if err != nil {
			t.Fatalf("Request failed: %v", err)
		}
		// requireChair middleware looks up the role; missing conference returns 403 (not chair).
		if resp.StatusCode != http.StatusForbidden && resp.StatusCode != http.StatusNotFound {
			body := testutils.ReadResponseBody(t, resp)
			t.Errorf("Expected 403 or 404 for nonexistent conference, got %d. Body: %s", resp.StatusCode, body)
		}
	})
}

// TestReviewerSuggestions_BodyShape verifies that the response payload has the expected
// shape and conference_topics are populated from the conference's declared domains.
func TestReviewerSuggestions_BodyShape(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("rs-chair-shape", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	conf := &dto.Conference{
		Title:   "Reviewer Suggestion Shape Test",
		Acronym: testutils.UniqueString("RSSHAPE"),
		Chair:   chair.Email,
		// Use a long, distinctive domain so we can identify it in the response without
		// colliding with topics seeded by other tests in this shared DB.
		Domain: []string{"reviewer-suggestion-shape-domain-x"},
	}
	createResp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)

	var created struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &created)
	confID := created.Data.ID

	resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/reviewer-suggestions", confID), nil, chairToken)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body suggestionResponse
	testutils.DecodeResponse(t, resp, &body)

	if body.Data == nil {
		t.Fatal("Expected non-nil response data")
	}
	if body.Data.Suggestions == nil {
		t.Error("Expected non-nil suggestions slice (empty allowed, but not nil)")
	}
	if body.Data.ConferenceTopics == nil {
		t.Error("Expected non-nil conference_topics slice (empty allowed, but not nil)")
	}

	// The conference's lowercased domain must be present in conference_topics.
	found := false
	for _, topic := range body.Data.ConferenceTopics {
		if topic == "reviewer-suggestion-shape-domain-x" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Expected conference domain in conference_topics, got %v", body.Data.ConferenceTopics)
	}
}

// TestReviewerSuggestions_InternalSuggestionsHappyPath verifies that platform users
// whose declared domains overlap with the conference domain are surfaced as suggestions,
// while existing reviewers and the chair/co-chair are excluded.
func TestReviewerSuggestions_InternalSuggestionsHappyPath(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	// Use a unique domain so we don't get noise from users seeded by other tests.
	uniqueDomain := strings.ToLower(testutils.UniqueString("rs-domain"))

	chairToken, chair, err := ctx.RegisterUniqueUser("rs-chair-happy", "password123", "Chair", "User", []string{uniqueDomain})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	_, coChair, err := ctx.RegisterUniqueUser("rs-cochair-happy", "password123", "CoChair", "User", []string{uniqueDomain})
	if err != nil {
		t.Fatalf("Failed to register co-chair: %v", err)
	}

	// Candidate that matches the domain — should be suggested.
	_, candidate, err := ctx.RegisterUniqueUser("rs-cand-happy", "password123", "Cand", "Idate", []string{uniqueDomain})
	if err != nil {
		t.Fatalf("Failed to register candidate: %v", err)
	}

	// Existing reviewer — must be excluded from suggestions.
	_, existingReviewer, err := ctx.RegisterUniqueUser("rs-rev-happy", "password123", "Existing", "Reviewer", []string{uniqueDomain})
	if err != nil {
		t.Fatalf("Failed to register existing reviewer: %v", err)
	}

	// Unrelated user — should NOT appear (different domain).
	_, unrelated, err := ctx.RegisterUniqueUser("rs-unrel-happy", "password123", "Unrel", "Ated", []string{"some-other-unrelated-domain"})
	if err != nil {
		t.Fatalf("Failed to register unrelated user: %v", err)
	}

	conf := &dto.Conference{
		Title:    "Reviewer Suggestion Happy Path",
		Acronym:  testutils.UniqueString("RSHAPPY"),
		Chair:    chair.Email,
		CoChairs: []string{coChair.Email},
		Domain:   []string{uniqueDomain},
	}
	createResp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)

	var created struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &created)
	confID := created.Data.ID

	// Invite the existing reviewer so the service should now exclude them from suggestions.
	inviteReq := &dto.ReviewerBatchInviteRequest{
		ConferenceID: confID,
		Reviewers:    []dto.Reviewer{{UserID: existingReviewer.ID, Domain: []string{uniqueDomain}}},
	}
	invResp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/reviewers", confID), inviteReq, chairToken)
	if err != nil {
		t.Fatalf("Failed to invite existing reviewer: %v", err)
	}
	testutils.AssertStatusCode(t, invResp, http.StatusCreated)

	// Now ask for suggestions.
	resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/reviewer-suggestions?limit=50", confID), nil, chairToken)
	if err != nil {
		t.Fatalf("Suggestion request failed: %v", err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body suggestionResponse
	testutils.DecodeResponse(t, resp, &body)

	if body.Data == nil {
		t.Fatal("Expected non-nil response data")
	}

	// Index suggestions by email for assertions.
	emails := make(map[string]*dto.ReviewerSuggestion, len(body.Data.Suggestions))
	for _, s := range body.Data.Suggestions {
		emails[strings.ToLower(s.Email)] = s
	}

	if _, ok := emails[strings.ToLower(candidate.Email)]; !ok {
		t.Errorf("Candidate %s should be suggested but was not. Got %d suggestions: %v",
			candidate.Email, len(body.Data.Suggestions), emails)
	}

	if _, ok := emails[strings.ToLower(chair.Email)]; ok {
		t.Errorf("Chair %s should NOT appear in suggestions", chair.Email)
	}
	if _, ok := emails[strings.ToLower(coChair.Email)]; ok {
		t.Errorf("Co-chair %s should NOT appear in suggestions", coChair.Email)
	}
	if _, ok := emails[strings.ToLower(existingReviewer.Email)]; ok {
		t.Errorf("Existing reviewer %s should NOT appear in suggestions", existingReviewer.Email)
	}
	if _, ok := emails[strings.ToLower(unrelated.Email)]; ok {
		t.Errorf("Unrelated user %s should NOT appear in suggestions (no domain overlap)", unrelated.Email)
	}

	// Validate per-suggestion fields for the candidate.
	c := emails[strings.ToLower(candidate.Email)]
	if c == nil {
		// Already errored above.
		return
	}
	if c.Source != "internal" {
		t.Errorf("Expected candidate source=internal, got %q", c.Source)
	}
	if !c.OnPlatform {
		t.Error("Expected candidate.OnPlatform=true")
	}
	if c.PlatformUserID == nil || *c.PlatformUserID != candidate.ID {
		t.Errorf("Expected platform_user_id=%d, got %v", candidate.ID, c.PlatformUserID)
	}
	if c.Score <= 0 || c.Score > 100 {
		t.Errorf("Expected score in (0, 100], got %d", c.Score)
	}

	matched := false
	for _, m := range c.MatchedFields {
		if m == uniqueDomain {
			matched = true
			break
		}
	}
	if !matched {
		t.Errorf("Expected matched_fields to include %q, got %v", uniqueDomain, c.MatchedFields)
	}

	// Suggestions must be sorted by score descending.
	for i := 1; i < len(body.Data.Suggestions); i++ {
		if body.Data.Suggestions[i].Score > body.Data.Suggestions[i-1].Score {
			t.Errorf("Suggestions not sorted by score desc: idx %d (%d) > idx %d (%d)",
				i, body.Data.Suggestions[i].Score, i-1, body.Data.Suggestions[i-1].Score)
			break
		}
	}
}

// TestReviewerSuggestions_LimitClamping verifies the limit query parameter is
// honored. There is intentionally no server-side maximum: the FE controls the
// page size and the server returns up to that many results.
func TestReviewerSuggestions_LimitClamping(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	client := NewClient(ctx)

	chairToken, chair, err := ctx.RegisterUniqueUser("rs-chair-limit", "password123", "Chair", "User", []string{"AI"})
	if err != nil {
		t.Fatalf("Failed to register chair: %v", err)
	}

	conf := &dto.Conference{
		Title:   "Reviewer Suggestion Limit Test",
		Acronym: testutils.UniqueString("RSLIMIT"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createResp, err := client.Create(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	testutils.AssertStatusCode(t, createResp, http.StatusCreated)

	var created struct {
		Data *dto.ConferenceResponse `json:"data"`
	}
	testutils.DecodeResponse(t, createResp, &created)
	confID := created.Data.ID

	cases := []struct {
		name     string
		query    string
		maxAllow int
	}{
		{"explicit_small_limit", "?limit=3", 3},
		{"explicit_large_limit_no_cap", "?limit=999", 999},
		{"missing_limit_uses_default_20", "", 20},
		{"zero_limit_uses_default_20", "?limit=0", 20},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			resp, err := ctx.MakeRequest("GET",
				fmt.Sprintf("/api/v1/conferences/%d/reviewer-suggestions%s", confID, tc.query),
				nil, chairToken)
			if err != nil {
				t.Fatalf("Request failed: %v", err)
			}
			testutils.AssertStatusCode(t, resp, http.StatusOK)

			var body suggestionResponse
			testutils.DecodeResponse(t, resp, &body)

			if body.Data == nil {
				t.Fatal("Expected non-nil response data")
			}
			if len(body.Data.Suggestions) > tc.maxAllow {
				t.Errorf("Expected at most %d suggestions, got %d", tc.maxAllow, len(body.Data.Suggestions))
			}
			if body.Data.Total != len(body.Data.Suggestions) {
				t.Errorf("Total mismatch: total=%d, len(suggestions)=%d",
					body.Data.Total, len(body.Data.Suggestions))
			}
		})
	}
}
