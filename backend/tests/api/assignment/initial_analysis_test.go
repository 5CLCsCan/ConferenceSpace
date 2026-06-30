package assignment

import (
	"fmt"
	"net/http"
	"testing"
)

func TestGetReviewerInitialAnalysis_IdleBeforeGeneration(t *testing.T) {
	ctx := testContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	assignmentID, conferenceID, _, reviewerToken, _ := setupReviewingScenario(t, ctx)

	resp, err := ctx.MakeRequest(
		"GET",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/initial-analysis", conferenceID, assignmentID),
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

func TestGenerateReviewerInitialAnalysis_ForbiddenForNonOwner(t *testing.T) {
	ctx := testContext(t)
	defer ctx.Close()
	if err := ctx.WaitForServer(); err != nil {
		t.Skipf("server not available: %v", err)
	}

	assignmentID, conferenceID, _, _, authorToken := setupReviewingScenario(t, ctx)

	resp, err := ctx.MakeRequest(
		"POST",
		fmt.Sprintf("/api/v1/conferences/%d/assignments/%d/initial-analysis/generate", conferenceID, assignmentID),
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
