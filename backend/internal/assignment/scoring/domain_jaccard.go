package scoring

import (
	"context"
)

// DomainJaccardScorer implements domain-based Jaccard similarity
type DomainJaccardScorer struct{}

// NewDomainJaccardScorer creates a new Jaccard scorer
func NewDomainJaccardScorer() *DomainJaccardScorer {
	return &DomainJaccardScorer{}
}

// Name returns the scorer identifier
func (s *DomainJaccardScorer) Name() string {
	return "domain_jaccard"
}

// ComputeScore calculates Jaccard similarity between submission and reviewer domains
// Formula: |intersection| / |union|
func (s *DomainJaccardScorer) ComputeScore(
	ctx context.Context,
	submission Submission,
	reviewer Reviewer,
) (float64, error) {
	if len(submission.Domain) == 0 || len(reviewer.Domain) == 0 {
		return 0.0, nil
	}

	intersection := intersect(submission.Domain, reviewer.Domain)
	union := union(submission.Domain, reviewer.Domain)

	if len(union) == 0 {
		return 0.0, nil
	}

	return float64(len(intersection)) / float64(len(union)), nil
}

// ComputeMatrix builds full N×M score matrix
func (s *DomainJaccardScorer) ComputeMatrix(
	ctx context.Context,
	submissions []Submission,
	reviewers []Reviewer,
) (ScoreMatrix, error) {
	matrix := make(ScoreMatrix, 0, len(submissions)*len(reviewers))

	for _, sub := range submissions {
		for _, rev := range reviewers {
			score, err := s.ComputeScore(ctx, sub, rev)
			if err != nil {
				return nil, err
			}

			matrix = append(matrix, ScoreEntry{
				SubmissionID: sub.ID,
				ReviewerID:   rev.ID,
				Score:        score,
			})
		}
	}

	return matrix, nil
}

// intersect returns the intersection of two string slices
func intersect(a, b []string) []string {
	set := make(map[string]bool)
	for _, item := range a {
		set[item] = true
	}

	result := []string{}
	for _, item := range b {
		if set[item] {
			result = append(result, item)
			delete(set, item) // Avoid duplicates
		}
	}

	return result
}

// union returns the union of two string slices
func union(a, b []string) []string {
	set := make(map[string]bool)
	for _, item := range a {
		set[item] = true
	}
	for _, item := range b {
		set[item] = true
	}

	result := make([]string, 0, len(set))
	for item := range set {
		result = append(result, item)
	}

	return result
}
