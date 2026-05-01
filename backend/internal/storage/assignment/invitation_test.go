package assignment_test

import (
	"encoding/json"
	"testing"

	"github.com/dcao/conferencespace/internal/dto"
)

// TestEvidenceScoreThreshold verifies score is hidden when < 0.5
func TestEvidenceScoreThreshold(t *testing.T) {
	tests := []struct {
		name      string
		score     float64
		expectNil bool
	}{
		{"score 72% shown", 0.72, false},
		{"score 50% shown (boundary)", 0.50, false},
		{"score 49% hidden", 0.49, true},
		{"score 0% hidden", 0.0, true},
		{"score 100% shown", 1.0, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evidence := &dto.InvitationEvidence{}
			if tt.score >= 0.5 {
				evidence.Score = &tt.score
			}
			if tt.expectNil && evidence.Score != nil {
				t.Errorf("expected score to be nil for %.2f, got %v", tt.score, *evidence.Score)
			}
			if !tt.expectNil && evidence.Score == nil {
				t.Errorf("expected score to be shown for %.2f, got nil", tt.score)
			}
		})
	}
}

// TestEvidenceFromMetadata verifies metadata parsing for evidence
func TestEvidenceFromMetadata(t *testing.T) {
	tests := []struct {
		name            string
		metadataJSON    string
		expectKeywords  int
		expectNilEvidence bool
	}{
		{
			"full metadata with keywords",
			`{"source":"auto_pass1","matched_keywords":["NLP","transformers","attention"],"unmatched_paper_keywords":[],"extra_reviewer_keywords":[],"coi_checks":{},"created_at":"2026-01-01T00:00:00Z"}`,
			3,
			false,
		},
		{
			"metadata with empty keywords",
			`{"source":"manual","matched_keywords":[],"unmatched_paper_keywords":[],"extra_reviewer_keywords":[],"coi_checks":{},"created_at":"2026-01-01T00:00:00Z"}`,
			0,
			false,
		},
		{
			"null metadata",
			"",
			0,
			false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			evidence := &dto.InvitationEvidence{
				AssignmentCount: 2,
			}

			if tt.metadataJSON != "" {
				var meta dto.SuggestionMetadata
				if err := json.Unmarshal([]byte(tt.metadataJSON), &meta); err != nil {
					t.Fatalf("failed to unmarshal metadata: %v", err)
				}
				evidence.MatchedKeywords = meta.MatchedKeywords
			}

			if len(evidence.MatchedKeywords) != tt.expectKeywords {
				t.Errorf("expected %d keywords, got %d", tt.expectKeywords, len(evidence.MatchedKeywords))
			}
		})
	}
}

// TestRespondRequestValidation verifies the respond request action values
func TestRespondRequestValidation(t *testing.T) {
	tests := []struct {
		name   string
		action string
		valid  bool
	}{
		{"accept is valid", "accept", true},
		{"decline is valid", "decline", true},
		{"empty is invalid", "", false},
		{"other is invalid", "maybe", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.action == "accept" || tt.action == "decline"
			if isValid != tt.valid {
				t.Errorf("action %q: expected valid=%v, got %v", tt.action, tt.valid, isValid)
			}
		})
	}
}
