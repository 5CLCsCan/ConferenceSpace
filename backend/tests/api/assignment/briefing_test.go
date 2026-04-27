package assignment

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/dcao/conferencespace/tests/api/testutils"
)

func TestGetReviewerBriefing_IdleBeforeGeneration(t *testing.T) {
	ctx := testContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	assignmentID, conferenceID, _, reviewerToken, _ := setupReviewingScenario(t, ctx)

	resp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/briefing", conferenceID, assignmentID),
		nil,
		reviewerToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestGenerateReviewerBriefing_ForbiddenForNonOwner(t *testing.T) {
	ctx := testContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	assignmentID, conferenceID, _, _, authorToken := setupReviewingScenario(t, ctx)

	resp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/briefing/generate", conferenceID, assignmentID),
		nil,
		authorToken,
	)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", resp.StatusCode)
	}
}

func testContext(t *testing.T) *testutils.TestContext {
	t.Helper()
	return testutils.NewTestContext(t)
}
