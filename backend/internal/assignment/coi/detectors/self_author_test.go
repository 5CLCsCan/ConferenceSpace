package detectors

import (
	"context"
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
)

func TestSelfAuthorDetector_NormalizesEmails(t *testing.T) {
	detector := NewSelfAuthorDetector()
	conflicts, err := detector.DetectConflicts(context.Background(),
		[]commons.Submission{
			{
				ID:          1,
				AuthorEmail: "author@example.com",
				CoAuthors:   []string{"coauthor@example.com"},
			},
		},
		[]commons.Reviewer{
			{ID: 10, UserEmail: "Author@Example.COM"},
			{ID: 20, UserEmail: "COAUTHOR@example.com"},
		},
	)
	if err != nil {
		t.Fatalf("DetectConflicts failed: %v", err)
	}
	if !conflicts.HasConflict(1, 10) {
		t.Fatal("expected primary author conflict with case-insensitive reviewer email")
	}
	if !conflicts.HasConflict(1, 20) {
		t.Fatal("expected co-author conflict with case-insensitive reviewer email")
	}
}
