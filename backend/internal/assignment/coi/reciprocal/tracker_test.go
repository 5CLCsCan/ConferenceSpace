package reciprocal

import (
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestTracker_BlocksReciprocalCrossReview(t *testing.T) {
	submissions := []*dto.Submission{
		{ID: 1, Author: "alice@example.com"},
		{ID: 2, Author: "bob@example.com"},
	}
	reviewers := []*dto.Reviewer{
		{ID: 10, Email: "alice@example.com"},
		{ID: 20, Email: "bob@example.com"},
	}

	tracker := NewTracker(submissions, reviewers, []AssignmentEdge{
		{SubmissionID: 1, ReviewerID: 20},
	})

	if !tracker.HasConflict(2, 10) {
		t.Fatal("expected reciprocal conflict when alice reviews bob after bob reviews alice")
	}
	if tracker.HasConflict(1, 20) {
		t.Fatal("existing assignment should not conflict with itself")
	}
}

func TestTracker_AllowsNonReciprocalAssignments(t *testing.T) {
	submissions := []*dto.Submission{
		{ID: 1, Author: "alice@example.com"},
		{ID: 2, Author: "bob@example.com"},
		{ID: 3, Author: "carol@example.com"},
	}
	reviewers := []*dto.Reviewer{
		{ID: 10, Email: "alice@example.com"},
		{ID: 20, Email: "bob@example.com"},
		{ID: 30, Email: "dave@example.com"},
	}

	tracker := NewTracker(submissions, reviewers, []AssignmentEdge{
		{SubmissionID: 1, ReviewerID: 20},
	})

	if tracker.HasConflict(3, 30) {
		t.Fatal("unrelated reviewer should not be blocked")
	}
}
