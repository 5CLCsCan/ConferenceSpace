package submission

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
	conferenceTestClient "github.com/dcao/conferencespace/tests/api/conference"
	"github.com/dcao/conferencespace/tests/api/testutils"
)

// setupAcceptRejectScenario creates a conference, author submission, and returns
// a chair token and a non-chair (author) token with the relevant IDs.
func setupAcceptRejectScenario(t *testing.T, ctx *testutils.TestContext) (
	chairToken, authorToken string,
	conferenceID, submissionID int64,
) {
	t.Helper()

	chairToken, chair, _ := ctx.RegisterUniqueUser("chair", "password123", "Chair", "User", []string{"AI"})
	authorToken, author, _ := ctx.RegisterUniqueUser("author", "password123", "Author", "User", []string{"AI"})

	conferenceClient := conferenceTestClient.NewClient(ctx)
	conf := &dto.Conference{
		Title:   "Accept Reject Test Conference",
		Acronym: testutils.UniqueString("ARTC"),
		Chair:   chair.Email,
		Domain:  []string{"AI"},
	}
	createdConf, err := conferenceClient.CreateSuccess(conf, chairToken)
	if err != nil {
		t.Fatalf("Failed to create conference: %v", err)
	}
	conferenceID = createdConf.ID

	submissionClient := NewClient(ctx)
	sub := &dto.Submission{
		ConferenceID: conferenceID,
		Author:       author.Email,
		Title:        "Test Paper for Accept/Reject",
		Abstract:     "Abstract",
		Domain:       []string{"AI"},
		Status:       dto.StatusDraft,
	}
	createdSub, err := submissionClient.CreateSuccess(conferenceID, sub, authorToken)
	if err != nil {
		t.Fatalf("Failed to create submission: %v", err)
	}
	submissionID = createdSub.ID
	return
}

// TestAcceptSubmission_NonChairForbidden verifies that a non-chair user cannot
// set a submission status to "accepted".
func TestAcceptSubmission_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupAcceptRejectScenario(t, ctx)

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID),
		map[string]interface{}{"status": "accepted"},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}

// TestRejectSubmission_NonChairForbidden verifies that a non-chair user cannot
// set a submission status to "rejected".
func TestRejectSubmission_NonChairForbidden(t *testing.T) {
	ctx := testutils.NewTestContext(t)
	defer ctx.Close()

	_, authorToken, conferenceID, submissionID := setupAcceptRejectScenario(t, ctx)

	resp, err := ctx.MakeRequest("PUT",
		fmt.Sprintf("/api/v1/conferences/%d/submissions/%d/status", conferenceID, submissionID),
		map[string]interface{}{"status": "rejected"},
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", resp.StatusCode)
	}
}
