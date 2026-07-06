package quality

import "testing"

func TestBuildAssignmentScenario(t *testing.T) {
	s := &Snapshot{
		Authors: []AuthorRecord{
			{ID: "A1", Name: "one", Papers: []string{"P1"}},
			{ID: "A2", Name: "two", Papers: []string{"P2"}},
		},
		Papers: []PaperRecord{
			{ID: "P1", AuthorIDs: []string{"A1"}, Topics: []string{"nlp"}},
			{ID: "P2", AuthorIDs: []string{"A2"}, Topics: []string{"vision"}},
		},
	}
	sc := BuildAssignmentScenario(s)
	if len(sc.Submissions) != 2 || len(sc.Reviewers) != 2 {
		t.Fatalf("scenario size: %d subs, %d revs", len(sc.Submissions), len(sc.Reviewers))
	}
	// Score matrix is N*M.
	if len(sc.Scores) != 4 {
		t.Fatalf("score matrix size = %d, want 4", len(sc.Scores))
	}
	// Self-authorship COI: the author of P1 must conflict with P1's submission.
	// Find submission ID for P1 and reviewer ID for A1 via order (sorted).
	// Authors sorted A1,A2 -> reviewer IDs 1,2; papers sorted P1,P2 -> sub IDs 1,2.
	if !sc.Conflicts.HasConflict(1, 1) {
		t.Fatal("expected self-authorship COI for (sub P1, reviewer A1)")
	}
	if sc.Conflicts.HasConflict(1, 2) {
		t.Fatal("did not expect COI for (sub P1, reviewer A2)")
	}
}

func TestEvaluateAssignment(t *testing.T) {
	subs, revs, matrix, conflicts := smallScenario()
	cfg := cfg2()
	res := GreedyAssigner(subs, revs, matrix, conflicts, cfg)
	m := EvaluateAssignment(res, subs, revs, matrix, conflicts, cfg)
	if m.NumPapers != 2 || m.NumReviewers != 3 {
		t.Fatalf("sizes: %d papers, %d reviewers", m.NumPapers, m.NumReviewers)
	}
	if m.COIViolations != 0 {
		t.Fatalf("COIViolations = %d, want 0", m.COIViolations)
	}
	if m.Coverage < 0 || m.Coverage > 1 {
		t.Fatalf("Coverage out of range: %v", m.Coverage)
	}
}
