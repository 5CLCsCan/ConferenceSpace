package conference

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// setupConferenceForRebuttal creates a conference with chair token
func setupConferenceForRebuttal(t *testing.T, ctx *testutils.TestContext) (chairToken string, conferenceID int64) {
	t.Helper()
	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	conf, err := NewClient(ctx).CreateSuccess(&dto.Conference{
		Title:   "Rebuttal Test",
		Acronym: testutils.UniqueString("RT"),
		Chair:   chair.Email,
	}, chairToken)
	if err != nil {
		t.Fatalf("create conference: %v", err)
	}
	return chairToken, conf.ID
}

func TestGetRebuttalSettings_DefaultValues(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", confID), nil, chairToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data struct {
			Settings struct {
				Phase             string `json:"phase"`
				CharLimitGeneral  int    `json:"char_limit_general"`
				CharLimitPerPoint int    `json:"char_limit_per_point"`
				Enabled           bool   `json:"enabled"`
			} `json:"settings"`
			Submissions []interface{} `json:"submissions"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data.Settings.Phase != "not_started" {
		t.Errorf("expected not_started, got %s", body.Data.Settings.Phase)
	}
	if body.Data.Settings.CharLimitGeneral != 3000 {
		t.Errorf("expected default 3000, got %d", body.Data.Settings.CharLimitGeneral)
	}
	if body.Data.Settings.CharLimitPerPoint != 1000 {
		t.Errorf("expected default 1000, got %d", body.Data.Settings.CharLimitPerPoint)
	}
}

func TestGetRebuttalSettings_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	_, confID := setupConferenceForRebuttal(t, ctx)
	otherToken, _, _ := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})

	resp, err := ctx.MakeRequest("GET", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", confID), nil, otherToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusForbidden)
}

func TestSaveRebuttalSettings(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	resp, err := ctx.MakeRequest("PATCH", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", confID),
		map[string]interface{}{
			"enabled":              true,
			"char_limit_general":   2000,
			"char_limit_per_point": 500,
			"allow_discussion":     true,
		}, chairToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data struct {
			Enabled          bool `json:"enabled"`
			CharLimitGeneral int  `json:"char_limit_general"`
			AllowDiscussion  bool `json:"allow_discussion"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if !body.Data.Enabled {
		t.Error("expected enabled=true")
	}
	if body.Data.CharLimitGeneral != 2000 {
		t.Errorf("expected 2000, got %d", body.Data.CharLimitGeneral)
	}
	if !body.Data.AllowDiscussion {
		t.Error("expected allow_discussion=true")
	}
}

func TestOpenRebuttal_Success(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, chairToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data struct {
			Phase string `json:"phase"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data.Phase != "awaiting" {
		t.Errorf("expected awaiting, got %s", body.Data.Phase)
	}
}

func TestOpenRebuttal_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	_, confID := setupConferenceForRebuttal(t, ctx)
	otherToken, _, _ := ctx.RegisterUniqueUser("other", "password123", "Other", "User", []string{"AI"})

	resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, otherToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusForbidden)
}

func TestOpenRebuttal_CannotOpenTwice(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	// Open first time — should succeed
	resp, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, chairToken)
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	// Open second time — should fail (already awaiting, not not_started)
	resp2, _ := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, chairToken)
	testutils.AssertStatusCode(t, resp2, http.StatusBadRequest)
}

func TestFinalizeRebuttal_Success(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	// Open first
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, chairToken)

	// Then finalize
	resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/finalize", confID), nil, chairToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data struct {
			Phase string `json:"phase"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data.Phase != "finalized" {
		t.Errorf("expected finalized, got %s", body.Data.Phase)
	}
}

func TestOpenDiscussion_RequiresAllowDiscussion(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	// Open rebuttal (allow_discussion is false by default)
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, chairToken)

	// Try to open discussion — should fail since allow_discussion=false
	resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open-discussion", confID), nil, chairToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusBadRequest)
}

func TestOpenDiscussion_SuccessWhenEnabled(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()
	chairToken, confID := setupConferenceForRebuttal(t, ctx)

	// Enable discussion and open rebuttal
	ctx.MakeRequest("PATCH", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/settings", confID),
		map[string]interface{}{"enabled": true, "allow_discussion": true, "char_limit_general": 3000, "char_limit_per_point": 1000}, chairToken)
	ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open", confID), nil, chairToken)

	resp, err := ctx.MakeRequest("POST", fmt.Sprintf("/api/v1/conferences/%d/rebuttal/open-discussion", confID), nil, chairToken)
	if err != nil {
		t.Fatal(err)
	}
	testutils.AssertStatusCode(t, resp, http.StatusOK)

	var body struct {
		Data struct {
			Phase string `json:"phase"`
		} `json:"data"`
	}
	testutils.DecodeResponse(t, resp, &body)
	if body.Data.Phase != "discussion" {
		t.Errorf("expected discussion, got %s", body.Data.Phase)
	}
}
