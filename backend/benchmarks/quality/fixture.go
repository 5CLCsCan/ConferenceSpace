package quality

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"github.com/dcao/conferencespace/internal/assignment/coi/commons"
	"github.com/dcao/conferencespace/internal/assignment/scoring"
)

const benchSeed int64 = 42

const defaultSnapshotPath = "testdata/s2_snapshot.json"

// Snapshot is the checked-in, deterministic dataset the benchmark reads.
type Snapshot struct {
	Authors []AuthorRecord `json:"authors"`
	Papers  []PaperRecord  `json:"papers"`
}

// AuthorRecord is one author and the IDs of the papers attributed to them.
type AuthorRecord struct {
	ID     string   `json:"id"`
	Name   string   `json:"name"`
	Papers []string `json:"papers"`
}

// PaperRecord is one paper with its author IDs and extracted topics.
type PaperRecord struct {
	ID        string   `json:"id"`
	AuthorIDs []string `json:"authorIds"`
	Title     string   `json:"title"`
	Topics    []string `json:"topics"`
}

// LoadSnapshot reads and parses a snapshot JSON file.
func LoadSnapshot(path string) (*Snapshot, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read snapshot: %w", err)
	}
	var s Snapshot
	if err := json.Unmarshal(b, &s); err != nil {
		return nil, fmt.Errorf("parse snapshot: %w", err)
	}
	return &s, nil
}

// RankingEval is the leave-one-out ranking setup derived from a snapshot.
type RankingEval struct {
	Reviewers          []scoring.Reviewer
	Queries            []RankingQuery
	AuthorIDByReviewer map[int64]string
}

// topicUnion merges the topics of the given paper IDs into a deduped, sorted set.
func topicUnion(paperIDs []string, topicsByPaper map[string][]string) []string {
	set := make(map[string]bool)
	for _, pid := range paperIDs {
		for _, t := range topicsByPaper[pid] {
			set[t] = true
		}
	}
	out := make([]string, 0, len(set))
	for k := range set {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

// BuildRankingEval builds reviewer profiles and leave-one-out queries from a
// snapshot. Author int64 IDs are assigned by sorted author string ID for
// determinism. The held-out paper is the one with the highest string ID.
func BuildRankingEval(s *Snapshot) RankingEval {
	topicsByPaper := make(map[string][]string, len(s.Papers))
	for _, p := range s.Papers {
		topicsByPaper[p.ID] = p.Topics
	}

	authors := append([]AuthorRecord(nil), s.Authors...)
	sort.Slice(authors, func(i, j int) bool { return authors[i].ID < authors[j].ID })

	eval := RankingEval{AuthorIDByReviewer: make(map[int64]string)}
	for idx, a := range authors {
		id := int64(idx + 1)
		eval.AuthorIDByReviewer[id] = a.ID

		papers := append([]string(nil), a.Papers...)
		sort.Strings(papers)

		if len(papers) < 2 {
			// Single-paper author: distractor reviewer, no query.
			eval.Reviewers = append(eval.Reviewers, scoring.Reviewer{
				ID:     id,
				Domain: topicUnion(papers, topicsByPaper),
			})
			continue
		}

		held := papers[len(papers)-1]
		profilePapers := papers[:len(papers)-1]
		eval.Reviewers = append(eval.Reviewers, scoring.Reviewer{
			ID:     id,
			Domain: topicUnion(profilePapers, topicsByPaper),
		})
		eval.Queries = append(eval.Queries, RankingQuery{
			Topics:         topicsByPaper[held],
			TrueReviewerID: id,
		})
	}
	return eval
}

// AssignmentScenario is a full conference matching scenario built from a snapshot.
type AssignmentScenario struct {
	Submissions []scoring.Submission
	Reviewers   []scoring.Reviewer
	Scores      scoring.ScoreMatrix
	Conflicts   commons.ConflictMap
}

// BuildAssignmentScenario maps papers to submissions and authors to reviewers,
// adds self-authorship COI, and computes the Jaccard score matrix.
func BuildAssignmentScenario(s *Snapshot) AssignmentScenario {
	authors := append([]AuthorRecord(nil), s.Authors...)
	sort.Slice(authors, func(i, j int) bool { return authors[i].ID < authors[j].ID })
	reviewerIDByAuthor := make(map[string]int64, len(authors))

	topicsByPaper := make(map[string][]string, len(s.Papers))
	for _, p := range s.Papers {
		topicsByPaper[p.ID] = p.Topics
	}

	revs := make([]scoring.Reviewer, len(authors))
	for i, a := range authors {
		id := int64(i + 1)
		reviewerIDByAuthor[a.ID] = id
		revs[i] = scoring.Reviewer{ID: id, Domain: topicUnion(a.Papers, topicsByPaper)}
	}

	papers := append([]PaperRecord(nil), s.Papers...)
	sort.Slice(papers, func(i, j int) bool { return papers[i].ID < papers[j].ID })
	submissionIDByPaper := make(map[string]int64, len(papers))
	subs := make([]scoring.Submission, len(papers))
	for i, p := range papers {
		id := int64(i + 1)
		submissionIDByPaper[p.ID] = id
		subs[i] = scoring.Submission{ID: id, Domain: p.Topics}
	}

	conflicts := commons.ConflictMap{}
	for _, p := range papers {
		subID := submissionIDByPaper[p.ID]
		for _, aid := range p.AuthorIDs {
			if rid, ok := reviewerIDByAuthor[aid]; ok {
				conflicts.AddConflict(subID, rid)
			}
		}
	}

	scorer := scoring.NewDomainJaccardScorer()
	matrix, _ := scorer.ComputeMatrix(context.Background(), subs, revs)

	return AssignmentScenario{Submissions: subs, Reviewers: revs, Scores: matrix, Conflicts: conflicts}
}
