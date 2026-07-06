package quality

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// FixtureStats summarizes the dataset so report readers can judge validity.
type FixtureStats struct {
	NumAuthors         int
	NumPapers          int
	NumReviewers       int
	NumQueries         int
	VocabSize          int
	MeanTopicsPerPaper float64
}

// ComputeFixtureStats derives dataset health stats from a snapshot + ranking eval.
func ComputeFixtureStats(s *Snapshot, eval RankingEval) FixtureStats {
	vocab := make(map[string]bool)
	totalTopics := 0
	for _, p := range s.Papers {
		totalTopics += len(p.Topics)
		for _, t := range p.Topics {
			vocab[t] = true
		}
	}
	mean := 0.0
	if len(s.Papers) > 0 {
		mean = float64(totalTopics) / float64(len(s.Papers))
	}
	return FixtureStats{
		NumAuthors:         len(s.Authors),
		NumPapers:          len(s.Papers),
		NumReviewers:       len(eval.Reviewers),
		NumQueries:         len(eval.Queries),
		VocabSize:          len(vocab),
		MeanTopicsPerPaper: mean,
	}
}

// NamedRanking pairs a method label with its ranking metrics.
type NamedRanking struct {
	Name    string
	Metrics RankingMetrics
}

// NamedAssignment pairs a method label with its assignment metrics.
type NamedAssignment struct {
	Name    string
	Metrics AssignmentMetrics
}

// WriteReport writes quality-results.md and quality-results.csv into dir.
func WriteReport(dir string, stats FixtureStats, ranking []NamedRanking, assignment []NamedAssignment) error {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(dir, "quality-results.md"), []byte(renderMarkdown(stats, ranking, assignment)), 0o644); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "quality-results.csv"), []byte(renderCSV(ranking, assignment)), 0o644)
}

func renderMarkdown(stats FixtureStats, ranking []NamedRanking, assignment []NamedAssignment) string {
	var b strings.Builder
	b.WriteString("# Matching Quality Benchmark Results\n\n")
	b.WriteString("## Fixture\n\n")
	b.WriteString(fmt.Sprintf("- Authors: %d | Papers: %d | Reviewers: %d | LOO queries: %d\n", stats.NumAuthors, stats.NumPapers, stats.NumReviewers, stats.NumQueries))
	b.WriteString(fmt.Sprintf("- Topic vocabulary: %d | Mean topics/paper: %.2f\n\n", stats.VocabSize, stats.MeanTopicsPerPaper))

	b.WriteString("## Reviewer Suggestion (ranking)\n\n")
	b.WriteString("| Method | Hit@1 | Hit@5 | Hit@10 | MRR | nDCG@10 |\n")
	b.WriteString("|---|---|---|---|---|---|\n")
	for _, r := range ranking {
		m := r.Metrics
		b.WriteString(fmt.Sprintf("| %s | %.3f | %.3f | %.3f | %.3f | %.3f |\n", r.Name, m.HitAt1, m.HitAt5, m.HitAt10, m.MRR, m.NDCG10))
	}
	b.WriteString("\n## Assignment Suggestion (optimization)\n\n")
	b.WriteString("| Method | Coverage | Load StdDev | Load Gini | COI Violations | Mean Score | Min Score | Fallback Rate |\n")
	b.WriteString("|---|---|---|---|---|---|---|---|\n")
	for _, a := range assignment {
		m := a.Metrics
		b.WriteString(fmt.Sprintf("| %s | %.3f | %.3f | %.3f | %d | %.3f | %.3f | %.3f |\n", a.Name, m.Coverage, m.LoadStdDev, m.LoadGini, m.COIViolations, m.MeanScore, m.MinScore, m.FallbackRate))
	}
	return b.String()
}

func renderCSV(ranking []NamedRanking, assignment []NamedAssignment) string {
	var b strings.Builder
	b.WriteString("section,method,metric,value\n")
	for _, r := range ranking {
		m := r.Metrics
		rows := [][2]interface{}{
			{"hit_at_1", m.HitAt1}, {"hit_at_5", m.HitAt5}, {"hit_at_10", m.HitAt10},
			{"mrr", m.MRR}, {"ndcg_at_10", m.NDCG10},
		}
		for _, row := range rows {
			b.WriteString(fmt.Sprintf("ranking,%s,%s,%.6f\n", r.Name, row[0], row[1]))
		}
	}
	for _, a := range assignment {
		m := a.Metrics
		b.WriteString(fmt.Sprintf("assignment,%s,coverage,%.6f\n", a.Name, m.Coverage))
		b.WriteString(fmt.Sprintf("assignment,%s,load_stddev,%.6f\n", a.Name, m.LoadStdDev))
		b.WriteString(fmt.Sprintf("assignment,%s,load_gini,%.6f\n", a.Name, m.LoadGini))
		b.WriteString(fmt.Sprintf("assignment,%s,coi_violations,%d\n", a.Name, m.COIViolations))
		b.WriteString(fmt.Sprintf("assignment,%s,mean_score,%.6f\n", a.Name, m.MeanScore))
		b.WriteString(fmt.Sprintf("assignment,%s,min_score,%.6f\n", a.Name, m.MinScore))
		b.WriteString(fmt.Sprintf("assignment,%s,fallback_rate,%.6f\n", a.Name, m.FallbackRate))
	}
	return b.String()
}
