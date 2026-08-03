package coi

import (
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/coi/reciprocal"
	"github.com/dcao/conferencespace/internal/dto"
)

func TestCombinedCheckerBlocksStaticAndReciprocalConflicts(t *testing.T) {
	submissions := []*dto.Submission{
		{ID: 1, Author: "alice@example.com"},
		{ID: 2, Author: "bob@example.com"},
	}
	reviewers := []*dto.Reviewer{
		{ID: 10, Email: "alice@example.com"},
		{ID: 20, Email: "bob@example.com"},
	}

	static := commons.ConflictMap{
		1: {10: true},
	}
	reciprocalTracker := reciprocal.NewTracker(submissions, reviewers, []reciprocal.AssignmentEdge{
		{SubmissionID: 2, ReviewerID: 10},
	})

	checker := &CombinedChecker{
		Static:     static,
		Reciprocal: reciprocalTracker,
	}

	if !checker.HasConflict(1, 10) {
		t.Fatal("expected static self-author conflict")
	}
	if !checker.HasConflict(1, 20) {
		t.Fatal("expected reciprocal conflict for bob reviewing alice")
	}
}
