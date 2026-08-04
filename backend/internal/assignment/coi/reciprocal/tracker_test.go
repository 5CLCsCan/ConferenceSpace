package reciprocal

import (
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestTracker_BlocksReciprocalCrossReviewWithCoAuthor(t *testing.T) {
	submissions := []*dto.Submission{
		{
			ID:     1,
			Author: "alice@example.com",
			Information: &dto.SubmissionInformation{
				CoAuthors: []string{"carol@example.com"},
			},
		},
		{ID: 2, Author: "bob@example.com"},
	}
	reviewers := []*dto.Reviewer{
		{ID: 10, Email: "alice@example.com"},
		{ID: 20, Email: "bob@example.com"},
		{ID: 30, Email: "carol@example.com"},
	}

	tracker := NewTracker(submissions, reviewers, []AssignmentEdge{
		{SubmissionID: 1, ReviewerID: 20},
	})

	if !tracker.HasConflict(2, 10) {
		t.Fatal("expected reciprocal conflict when alice reviews bob after bob reviews alice's paper")
	}
	if !tracker.HasConflict(2, 30) {
		t.Fatal("expected reciprocal conflict when co-author carol is blocked from reviewing bob after bob reviews alice's paper")
	}
}

func TestAuthorEmails_IncludesMetadataAuthors(t *testing.T) {
	sub := &dto.Submission{
		Author: "primary@example.com",
		Information: &dto.SubmissionInformation{
			Metadata: map[string]interface{}{
				"authors": []interface{}{
					map[string]interface{}{"email": "primary@example.com"},
					map[string]interface{}{"email": "CoAuthor@Example.COM"},
				},
			},
		},
	}

	emails := AuthorEmails(sub)
	if len(emails) != 2 {
		t.Fatalf("expected 2 author emails, got %d: %v", len(emails), emails)
	}
	if !ReviewerIsAuthor(sub, "coauthor@example.com") {
		t.Fatal("expected metadata co-author email match after normalization")
	}
}

func TestReviewerIsAuthor_CaseInsensitive(t *testing.T) {
	sub := &dto.Submission{
		Author: "Author@Example.com",
		Information: &dto.SubmissionInformation{
			CoAuthors: []string{"COAUTHOR@example.com"},
		},
	}
	if !ReviewerIsAuthor(sub, "author@example.com") {
		t.Fatal("expected primary author match")
	}
	if !ReviewerIsAuthor(sub, "coauthor@example.com") {
		t.Fatal("expected co-author match")
	}
}

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
