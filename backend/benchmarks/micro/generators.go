package micro

import (
	"fmt"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

func reviewerEmail(i int) string { return fmt.Sprintf("reviewer-%d@example.com", i) }

func benchReviewerEmail(i int) string { return fmt.Sprintf("bench-reviewer-%d@example.com", i) }

// GenCOIInputs builds in-memory COI detector inputs.
// conflictRatio in [0,1] controls how many submissions declare a conflict
// against a real reviewer (drives the declared-conflicts detector work).
func GenCOIInputs(numSubs, numReviewers int, conflictRatio float64) ([]commons.Submission, []commons.Reviewer) {
	return genCOIInputsWithEmail(numSubs, numReviewers, conflictRatio, reviewerEmail)
}

// GenCOIInputsBenchReviewers uses bench-reviewer-* emails to align with HTTP/graph seed data.
func GenCOIInputsBenchReviewers(numSubs, numReviewers int, conflictRatio float64) ([]commons.Submission, []commons.Reviewer) {
	return genCOIInputsWithEmail(numSubs, numReviewers, conflictRatio, benchReviewerEmail)
}

func genCOIInputsWithEmail(
	numSubs, numReviewers int,
	conflictRatio float64,
	emailFn func(int) string,
) ([]commons.Submission, []commons.Reviewer) {
	reviewers := make([]commons.Reviewer, numReviewers)
	for i := 0; i < numReviewers; i++ {
		reviewers[i] = commons.Reviewer{
			ID:        int64(i + 1),
			UserID:    int64(i + 1),
			UserEmail: emailFn(i),
		}
	}

	conflictEvery := 0
	if conflictRatio > 0 {
		conflictEvery = int(1.0 / conflictRatio)
	}

	submissions := make([]commons.Submission, numSubs)
	for i := 0; i < numSubs; i++ {
		sub := commons.Submission{
			ID:          int64(i + 1),
			AuthorEmail: fmt.Sprintf("author-%d@example.com", i),
			CoAuthors:   []string{fmt.Sprintf("coauthor-%d@example.com", i)},
		}
		if conflictEvery > 0 && i%conflictEvery == 0 && numReviewers > 0 {
			sub.Declared = []commons.ConflictDeclaration{
				{Email: emailFn(i % numReviewers), Reason: "prior collaboration"},
			}
		}
		submissions[i] = sub
	}
	return submissions, reviewers
}

// GenScoreMatrix builds a dense numSubs x numReviewers score matrix.
func GenScoreMatrix(numSubs, numReviewers int) scoring.ScoreMatrix {
	m := make(scoring.ScoreMatrix, 0, numSubs*numReviewers)
	for s := 0; s < numSubs; s++ {
		for r := 0; r < numReviewers; r++ {
			score := float64((s*31+r*17)%100+1) / 100.0
			m = append(m, scoring.ScoreEntry{
				SubmissionID: int64(s + 1),
				ReviewerID:   int64(r + 1),
				Score:        score,
			})
		}
	}
	return m
}
