package assignment

import (
	"testing"
	"time"

	aiServiceClient "github.com/dcao/conferencespace/internal/clients/ai_service"
	"github.com/dcao/conferencespace/internal/dto"
)

func TestMergeReviewAuditResult_ReopensChangedWarningFingerprints(t *testing.T) {
	result := &aiServiceClient.ReviewQualityAuditResolveResponse{
		RunID: "run-1",
		Findings: []aiServiceClient.ReviewQualityAuditFinding{
			{
				Code:                 "justification.high_confidence_low_support",
				Severity:             "warning",
				Field:                "confidence",
				Message:              "High confidence is paired with a thin written justification.",
				Suggestion:           "Add more support.",
				ConditionFingerprint: "sha256:new",
			},
		},
	}
	state := &dto.ReviewAuditState{
		DismissedWarnings: []dto.ReviewAuditDismissal{
			{
				Code:                 "justification.high_confidence_low_support",
				ConditionFingerprint: "sha256:old",
				DismissedAt:          time.Now().UTC(),
			},
		},
	}

	merged := mergeReviewAuditResult(result, state)

	if merged.Status != "warn" {
		t.Fatalf("expected warn status, got %s", merged.Status)
	}
	if len(merged.ActiveFindings) != 1 {
		t.Fatalf("expected finding to reopen when fingerprint changes, got %#v", merged.ActiveFindings)
	}
	if len(merged.DismissedFindings) != 0 {
		t.Fatalf("did not expect dismissed findings, got %#v", merged.DismissedFindings)
	}
}

func TestMergeReviewAuditResult_HidesDismissedWarningsButNotBlocks(t *testing.T) {
	result := &aiServiceClient.ReviewQualityAuditResolveResponse{
		RunID: "run-1",
		Findings: []aiServiceClient.ReviewQualityAuditFinding{
			{
				Code:                 "coverage.briefing_guidance_not_engaged",
				Severity:             "warning",
				Field:                "review",
				Message:              "Review does not engage briefing guidance.",
				Suggestion:           "Address it.",
				ConditionFingerprint: "sha256:warning",
			},
			{
				Code:                 "consistency.recommendation_criteria_gap",
				Severity:             "blocking",
				Field:                "recommendation",
				Message:              "Recommendation does not line up with scores.",
				Suggestion:           "Align them.",
				ConditionFingerprint: "sha256:block",
			},
		},
	}
	state := &dto.ReviewAuditState{
		DismissedWarnings: []dto.ReviewAuditDismissal{
			{
				Code:                 "coverage.briefing_guidance_not_engaged",
				ConditionFingerprint: "sha256:warning",
				DismissedAt:          time.Now().UTC(),
			},
			{
				Code:                 "consistency.recommendation_criteria_gap",
				ConditionFingerprint: "sha256:block",
				DismissedAt:          time.Now().UTC(),
			},
		},
	}

	merged := mergeReviewAuditResult(result, state)

	if merged.Status != "block" {
		t.Fatalf("expected block status, got %s", merged.Status)
	}
	if len(merged.DismissedFindings) != 1 {
		t.Fatalf("expected one dismissed warning, got %#v", merged.DismissedFindings)
	}
	if len(merged.ActiveFindings) != 1 || merged.ActiveFindings[0].Severity != "blocking" {
		t.Fatalf("expected blocking finding to remain active, got %#v", merged.ActiveFindings)
	}
}
