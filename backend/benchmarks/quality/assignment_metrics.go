package quality

import (
	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/matching"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

// AssignmentMetrics captures intrinsic quality of a whole allocation.
type AssignmentMetrics struct {
	Coverage      float64 // fraction of papers with >= MinReviewersPerPaper
	LoadStdDev    float64
	LoadGini      float64
	COIViolations int
	MeanScore     float64
	MinScore      float64
	FallbackRate  float64
	NumPapers     int
	NumReviewers  int
}

// buildScoreLookup indexes the score matrix by (submissionID, reviewerID) so
// baselines (which assign without scores) can be measured on the same footing.
func buildScoreLookup(scores scoring.ScoreMatrix) map[[2]int64]float64 {
	m := make(map[[2]int64]float64, len(scores))
	for _, e := range scores {
		m[[2]int64{e.SubmissionID, e.ReviewerID}] = e.Score
	}
	return m
}

// EvaluateAssignment computes intrinsic metrics for a match result. All values are
// derived from res.Assignments + inputs so every assigner is measured uniformly.
func EvaluateAssignment(
	res *matching.MatchResult,
	subs []scoring.Submission,
	revs []scoring.Reviewer,
	scores scoring.ScoreMatrix,
	conflicts commons.ConflictMap,
	cfg matching.MatchConfig,
) AssignmentMetrics {
	lookup := buildScoreLookup(scores)
	load := make(map[int64]int)
	perPaper := make(map[int64]int)
	coi := 0
	assignedScores := make([]float64, 0, len(res.Assignments))
	for _, a := range res.Assignments {
		load[a.ReviewerID]++
		perPaper[a.SubmissionID]++
		if conflicts.HasConflict(a.SubmissionID, a.ReviewerID) {
			coi++
		}
		assignedScores = append(assignedScores, lookup[[2]int64{a.SubmissionID, a.ReviewerID}])
	}

	covered := 0
	for _, s := range subs {
		if perPaper[s.ID] >= cfg.MinReviewersPerPaper {
			covered++
		}
	}

	loads := make([]int, len(revs))
	loadsF := make([]float64, len(revs))
	for i, r := range revs {
		loads[i] = load[r.ID]
		loadsF[i] = float64(load[r.ID])
	}

	return AssignmentMetrics{
		Coverage:      float64(covered) / float64(max(1, len(subs))),
		LoadStdDev:    StdDev(loadsF),
		LoadGini:      Gini(loads),
		COIViolations: coi,
		MeanScore:     Mean(assignedScores),
		MinScore:      Min(assignedScores),
		FallbackRate:  float64(len(res.FallbackAssignments)) / float64(max(1, len(subs))),
		NumPapers:     len(subs),
		NumReviewers:  len(revs),
	}
}
