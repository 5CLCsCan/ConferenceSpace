package quality

import (
	"testing"

	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

func TestLoadSnapshot(t *testing.T) {
	s, err := LoadSnapshot(defaultSnapshotPath)
	if err != nil {
		t.Fatalf("LoadSnapshot: %v", err)
	}
	if len(s.Authors) == 0 || len(s.Papers) == 0 {
		t.Fatalf("empty snapshot: %d authors, %d papers", len(s.Authors), len(s.Papers))
	}
	// Every paper referenced by an author must exist, and every paper's authorIds
	// must resolve to a known author. This guards fixture integrity.
	paperIDs := map[string]bool{}
	for _, p := range s.Papers {
		paperIDs[p.ID] = true
	}
	authorIDs := map[string]bool{}
	for _, a := range s.Authors {
		authorIDs[a.ID] = true
		for _, pid := range a.Papers {
			if !paperIDs[pid] {
				t.Fatalf("author %s references unknown paper %s", a.ID, pid)
			}
		}
	}
	for _, p := range s.Papers {
		for _, aid := range p.AuthorIDs {
			if !authorIDs[aid] {
				t.Fatalf("paper %s references unknown author %s", p.ID, aid)
			}
		}
	}
}

func TestLoadSnapshotMissingFile(t *testing.T) {
	if _, err := LoadSnapshot("testdata/does_not_exist.json"); err == nil {
		t.Fatal("expected error for missing file")
	}
}

func TestBuildRankingEval(t *testing.T) {
	s := &Snapshot{
		Authors: []AuthorRecord{
			{ID: "A2", Name: "two", Papers: []string{"P3", "P4"}},
			{ID: "A1", Name: "one", Papers: []string{"P1", "P2"}},
			{ID: "A3", Name: "solo", Papers: []string{"P5"}},
		},
		Papers: []PaperRecord{
			{ID: "P1", AuthorIDs: []string{"A1"}, Topics: []string{"nlp"}},
			{ID: "P2", AuthorIDs: []string{"A1"}, Topics: []string{"translation"}},
			{ID: "P3", AuthorIDs: []string{"A2"}, Topics: []string{"vision"}},
			{ID: "P4", AuthorIDs: []string{"A2"}, Topics: []string{"segmentation"}},
			{ID: "P5", AuthorIDs: []string{"A3"}, Topics: []string{"graph"}},
		},
	}
	eval := BuildRankingEval(s)

	// All 3 authors become reviewers; IDs assigned by sorted author ID:
	// A1->1, A2->2, A3->3.
	if len(eval.Reviewers) != 3 {
		t.Fatalf("reviewers = %d, want 3", len(eval.Reviewers))
	}
	if eval.AuthorIDByReviewer[1] != "A1" || eval.AuthorIDByReviewer[2] != "A2" {
		t.Fatalf("reviewer->author map wrong: %v", eval.AuthorIDByReviewer)
	}

	// A3 has one paper -> no query. A1 and A2 -> one query each.
	if len(eval.Queries) != 2 {
		t.Fatalf("queries = %d, want 2", len(eval.Queries))
	}

	// A1's held-out paper is the highest ID ("P2" -> topic "translation");
	// the profile is built from "P1" -> topic "nlp".
	var a1 scoring.Reviewer
	for _, r := range eval.Reviewers {
		if r.ID == 1 {
			a1 = r
		}
	}
	if len(a1.Domain) != 1 || a1.Domain[0] != "nlp" {
		t.Fatalf("A1 profile = %v, want [nlp]", a1.Domain)
	}
	var q1 RankingQuery
	for _, q := range eval.Queries {
		if q.TrueReviewerID == 1 {
			q1 = q
		}
	}
	if len(q1.Topics) != 1 || q1.Topics[0] != "translation" {
		t.Fatalf("A1 query topics = %v, want [translation]", q1.Topics)
	}
}
