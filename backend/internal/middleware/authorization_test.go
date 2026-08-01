package middleware

import "testing"

func TestCanReviewerAccessSubmission_RequiresAcceptedAssignment(t *testing.T) {
	for _, status := range []string{"accepted", "completed"} {
		if !canReviewerAccessSubmission(status) {
			t.Fatalf("expected status %q to access submission", status)
		}
	}

	for _, status := range []string{"pending", "declined", "suggested", ""} {
		if canReviewerAccessSubmission(status) {
			t.Fatalf("expected status %q to be blocked from submission", status)
		}
	}
}
