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

// ScoreDetail contains the score and keyword breakdown
type ScoreDetail struct {
	Score                  float64
	MatchedKeywords        []string
	UnmatchedPaperKeywords []string
	ExtraReviewerKeywords  []string
}

// ComputeScoreWithDetails calculates Jaccard similarity and returns keyword breakdown
func (s *DomainJaccardScorer) ComputeScoreWithDetails(
	ctx context.Context,
	submission Submission,
	reviewer Reviewer,
) (ScoreDetail, error) {
	if len(submission.Domain) == 0 || len(reviewer.Domain) == 0 {
		return ScoreDetail{
			Score:                  0.0,
			MatchedKeywords:        []string{},
			UnmatchedPaperKeywords: submission.Domain,
			ExtraReviewerKeywords:  reviewer.Domain,
		}, nil
	}

	matched := intersect(submission.Domain, reviewer.Domain)
	allUnion := union(submission.Domain, reviewer.Domain)

	// Paper keywords not in reviewer domains
	unmatchedPaper := difference(submission.Domain, reviewer.Domain)
	// Reviewer domains not in paper keywords
	extraReviewer := difference(reviewer.Domain, submission.Domain)

	var score float64
	if len(allUnion) == 0 {
		score = 0.0
	} else {
		score = float64(len(matched)) / float64(len(allUnion))
	}

	return ScoreDetail{
		Score:                  score,
		MatchedKeywords:        matched,
		UnmatchedPaperKeywords: unmatchedPaper,
		ExtraReviewerKeywords:  extraReviewer,
	}, nil
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
			detail, err := s.ComputeScoreWithDetails(ctx, sub, rev)
			if err != nil {
				return nil, err
			}

			matrix = append(matrix, ScoreEntry{
				SubmissionID:           sub.ID,
				ReviewerID:             rev.ID,
				Score:                  detail.Score,
				MatchedKeywords:        detail.MatchedKeywords,
				UnmatchedPaperKeywords: detail.UnmatchedPaperKeywords,
				ExtraReviewerKeywords:  detail.ExtraReviewerKeywords,
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

// difference returns elements in a that are not in b
func difference(a, b []string) []string {
	set := make(map[string]bool)
	for _, item := range b {
		set[item] = true
	}

	result := []string{}
	for _, item := range a {
		if !set[item] {
			result = append(result, item)
		}
	}

	return result
}
