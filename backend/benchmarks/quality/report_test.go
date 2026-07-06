package quality

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestComputeFixtureStats(t *testing.T) {
	s := &Snapshot{
		Authors: []AuthorRecord{{ID: "A1", Papers: []string{"P1", "P2"}}},
		Papers: []PaperRecord{
			{ID: "P1", Topics: []string{"a", "b"}},
			{ID: "P2", Topics: []string{"b", "c"}},
		},
	}
	eval := BuildRankingEval(s)
	fs := ComputeFixtureStats(s, eval)
	if fs.NumAuthors != 1 || fs.NumPapers != 2 {
		t.Fatalf("counts wrong: %+v", fs)
	}
	if fs.VocabSize != 3 { // a, b, c
		t.Fatalf("VocabSize = %d, want 3", fs.VocabSize)
	}
	if fs.MeanTopicsPerPaper != 2.0 {
		t.Fatalf("MeanTopicsPerPaper = %v, want 2.0", fs.MeanTopicsPerPaper)
	}
}

func TestWriteReport(t *testing.T) {
	dir := t.TempDir()
	stats := FixtureStats{NumAuthors: 6, NumPapers: 16, NumReviewers: 6, NumQueries: 4, VocabSize: 30, MeanTopicsPerPaper: 3.2}
	ranking := []NamedRanking{
		{Name: "jaccard", Metrics: RankingMetrics{HitAt1: 0.75, MRR: 0.8, NDCG10: 0.85, NumQueries: 4}},
		{Name: "random", Metrics: RankingMetrics{HitAt1: 0.1, MRR: 0.2, NumQueries: 4}},
	}
	assignment := []NamedAssignment{
		{Name: "greedy", Metrics: AssignmentMetrics{Coverage: 1.0, MeanScore: 0.4, COIViolations: 0}},
	}
	if err := WriteReport(dir, stats, ranking, assignment); err != nil {
		t.Fatalf("WriteReport: %v", err)
	}
	md, err := os.ReadFile(filepath.Join(dir, "quality-results.md"))
	if err != nil {
		t.Fatalf("read md: %v", err)
	}
	if !strings.Contains(string(md), "jaccard") || !strings.Contains(string(md), "greedy") {
		t.Fatal("markdown missing expected rows")
	}
	csv, err := os.ReadFile(filepath.Join(dir, "quality-results.csv"))
	if err != nil {
		t.Fatalf("read csv: %v", err)
	}
	if !strings.Contains(string(csv), "jaccard") {
		t.Fatal("csv missing expected rows")
	}
}
