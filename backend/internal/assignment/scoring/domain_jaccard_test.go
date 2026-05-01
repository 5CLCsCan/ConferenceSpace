package scoring

import (
	"context"
	"sort"
	"testing"
)

// sortedEqual returns true if two string slices contain the same elements (order-independent).
func sortedEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	ac := make([]string, len(a))
	bc := make([]string, len(b))
	copy(ac, a)
	copy(bc, b)
	sort.Strings(ac)
	sort.Strings(bc)
	for i := range ac {
		if ac[i] != bc[i] {
			return false
		}
	}
	return true
}

func TestComputeScoreWithDetails(t *testing.T) {
	scorer := NewDomainJaccardScorer()
	ctx := context.Background()

	tests := []struct {
		name                   string
		paperDomain            []string
		reviewerDomain         []string
		wantScore              float64
		wantMatched            []string
		wantUnmatchedPaper     []string
		wantExtraReviewer      []string
	}{
		{
			name:               "full overlap",
			paperDomain:        []string{"NLP", "ML"},
			reviewerDomain:     []string{"NLP", "ML"},
			wantScore:          1.0,
			wantMatched:        []string{"NLP", "ML"},
			wantUnmatchedPaper: []string{},
			wantExtraReviewer:  []string{},
		},
		{
			name:               "partial overlap",
			paperDomain:        []string{"NLP", "ML", "CV"},
			reviewerDomain:     []string{"NLP", "CV", "Robotics"},
			wantScore:          0.5, // 2/4
			wantMatched:        []string{"NLP", "CV"},
			wantUnmatchedPaper: []string{"ML"},
			wantExtraReviewer:  []string{"Robotics"},
		},
		{
			name:               "no overlap",
			paperDomain:        []string{"NLP"},
			reviewerDomain:     []string{"CV"},
			wantScore:          0.0,
			wantMatched:        []string{},
			wantUnmatchedPaper: []string{"NLP"},
			wantExtraReviewer:  []string{"CV"},
		},
		{
			name:               "empty paper keywords",
			paperDomain:        []string{},
			reviewerDomain:     []string{"NLP"},
			wantScore:          0.0,
			wantMatched:        []string{},
			wantUnmatchedPaper: []string{},
			wantExtraReviewer:  []string{"NLP"},
		},
		{
			name:               "empty reviewer domains",
			paperDomain:        []string{"NLP"},
			reviewerDomain:     []string{},
			wantScore:          0.0,
			wantMatched:        []string{},
			wantUnmatchedPaper: []string{"NLP"},
			wantExtraReviewer:  []string{},
		},
		{
			name:               "both empty",
			paperDomain:        []string{},
			reviewerDomain:     []string{},
			wantScore:          0.0,
			wantMatched:        []string{},
			wantUnmatchedPaper: []string{},
			wantExtraReviewer:  []string{},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			submission := Submission{ID: 1, Domain: tc.paperDomain}
			reviewer := Reviewer{ID: 1, Domain: tc.reviewerDomain}

			detail, err := scorer.ComputeScoreWithDetails(ctx, submission, reviewer)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if detail.Score != tc.wantScore {
				t.Errorf("Score: got %v, want %v", detail.Score, tc.wantScore)
			}

			// Normalize nil slices to empty for comparison
			got := detail.MatchedKeywords
			if got == nil {
				got = []string{}
			}
			if !sortedEqual(got, tc.wantMatched) {
				t.Errorf("MatchedKeywords: got %v, want %v", got, tc.wantMatched)
			}

			got = detail.UnmatchedPaperKeywords
			if got == nil {
				got = []string{}
			}
			if !sortedEqual(got, tc.wantUnmatchedPaper) {
				t.Errorf("UnmatchedPaperKeywords: got %v, want %v", got, tc.wantUnmatchedPaper)
			}

			got = detail.ExtraReviewerKeywords
			if got == nil {
				got = []string{}
			}
			if !sortedEqual(got, tc.wantExtraReviewer) {
				t.Errorf("ExtraReviewerKeywords: got %v, want %v", got, tc.wantExtraReviewer)
			}
		})
	}
}

func TestDifference(t *testing.T) {
	tests := []struct {
		name string
		a    []string
		b    []string
		want []string
	}{
		{
			name: "normal",
			a:    []string{"a", "b", "c"},
			b:    []string{"b", "c", "d"},
			want: []string{"a"},
		},
		{
			name: "no overlap",
			a:    []string{"a", "b"},
			b:    []string{"c", "d"},
			want: []string{"a", "b"},
		},
		{
			name: "complete overlap",
			a:    []string{"a", "b"},
			b:    []string{"a", "b"},
			want: []string{},
		},
		{
			name: "empty first",
			a:    []string{},
			b:    []string{"a"},
			want: []string{},
		},
		{
			name: "empty second",
			a:    []string{"a", "b"},
			b:    []string{},
			want: []string{"a", "b"},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := difference(tc.a, tc.b)
			if got == nil {
				got = []string{}
			}
			if !sortedEqual(got, tc.want) {
				t.Errorf("difference(%v, %v): got %v, want %v", tc.a, tc.b, got, tc.want)
			}
		})
	}
}

func TestComputeMatrixKeywords(t *testing.T) {
	scorer := NewDomainJaccardScorer()
	ctx := context.Background()

	submissions := []Submission{
		{ID: 1, Domain: []string{"NLP", "ML"}},
	}
	reviewers := []Reviewer{
		{ID: 10, Domain: []string{"NLP"}},
		{ID: 20, Domain: []string{"CV"}},
	}

	matrix, err := scorer.ComputeMatrix(ctx, submissions, reviewers)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(matrix) != 2 {
		t.Fatalf("expected 2 entries in matrix, got %d", len(matrix))
	}

	// Build a lookup by reviewer ID for easier assertion
	byReviewer := make(map[int64]ScoreEntry)
	for _, entry := range matrix {
		byReviewer[entry.ReviewerID] = entry
	}

	// Reviewer 10 (NLP): matched=["NLP"], unmatched=["ML"], extra=[]
	e10, ok := byReviewer[10]
	if !ok {
		t.Fatal("missing entry for reviewer 10")
	}
	if !sortedEqual(nilToEmpty(e10.MatchedKeywords), []string{"NLP"}) {
		t.Errorf("reviewer 10 MatchedKeywords: got %v, want [NLP]", e10.MatchedKeywords)
	}
	if !sortedEqual(nilToEmpty(e10.UnmatchedPaperKeywords), []string{"ML"}) {
		t.Errorf("reviewer 10 UnmatchedPaperKeywords: got %v, want [ML]", e10.UnmatchedPaperKeywords)
	}
	if !sortedEqual(nilToEmpty(e10.ExtraReviewerKeywords), []string{}) {
		t.Errorf("reviewer 10 ExtraReviewerKeywords: got %v, want []", e10.ExtraReviewerKeywords)
	}

	// Reviewer 20 (CV): matched=[], unmatched=["NLP","ML"], extra=["CV"]
	e20, ok := byReviewer[20]
	if !ok {
		t.Fatal("missing entry for reviewer 20")
	}
	if !sortedEqual(nilToEmpty(e20.MatchedKeywords), []string{}) {
		t.Errorf("reviewer 20 MatchedKeywords: got %v, want []", e20.MatchedKeywords)
	}
	if !sortedEqual(nilToEmpty(e20.UnmatchedPaperKeywords), []string{"NLP", "ML"}) {
		t.Errorf("reviewer 20 UnmatchedPaperKeywords: got %v, want [NLP ML]", e20.UnmatchedPaperKeywords)
	}
	if !sortedEqual(nilToEmpty(e20.ExtraReviewerKeywords), []string{"CV"}) {
		t.Errorf("reviewer 20 ExtraReviewerKeywords: got %v, want [CV]", e20.ExtraReviewerKeywords)
	}
}

func nilToEmpty(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}
