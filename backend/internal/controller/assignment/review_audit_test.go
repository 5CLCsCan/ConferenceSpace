package assignment

import (
	"encoding/json"
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
			Rationale:            "The confidence value is higher than the technical support in the narrative.",
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
			Rationale:            "The review does not discuss the relevant briefing guidance.",
				Message:              "Review does not engage briefing guidance.",
				Suggestion:           "Address it.",
				ConditionFingerprint: "sha256:warning",
			},
			{
				Code:                 "consistency.recommendation_criteria_gap",
				Severity:             "blocking",
				Field:                "recommendation",
			Rationale:            "The recommendation is not aligned with the criterion scores.",
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

func TestReviewQualityAuditPayloadIncludesBriefingReadinessSignals(t *testing.T) {
	artifact := normalizeReviewerBriefingArtifactForReviewAudit(&aiServiceClient.ReviewerBriefingArtifact{
		SubmissionSnapshot: aiServiceClient.ReviewerBriefingSubmissionSnapshot{
			Title:              "Evidence-Aware Systems",
			AbstractSummary:    "Workflow-focused submission.",
			ManuscriptOverview: "The manuscript covers reviewer quality support.",
		},
		Guardrails: aiServiceClient.ReviewerBriefingGuardrails{
			NoRecommendation: true,
			NoScore:          true,
			BiasNotice:       "Assistive only.",
		},
	})
	payload := aiServiceClient.ReviewQualityAuditResolveRequest{
		Mode:         "draft_save",
		ConferenceID: 42,
		AssignmentID: 99,
		SubmissionID: 7,
		Actor: aiServiceClient.ActorPayload{
			UserID: 123,
			Email:  "reviewer@example.com",
			Role:   "reviewer",
		},
		Submission: aiServiceClient.ReviewerBriefingSubmissionPayload{
			Title:    "Evidence-Aware Systems",
			Abstract: "Structured reviewer workflows for academic review quality.",
		},
		Review: aiServiceClient.ReviewQualityAuditReviewPayload{
			Criteria: aiServiceClient.ReviewCriteriaPayload{
				Originality:      8,
				TechnicalQuality: 8,
				Clarity:          8,
				Significance:     8,
				Methodology:      8,
			},
			Feedback: aiServiceClient.ReviewFeedbackPayload{
				Summary: "The review contains enough text to reach the audit layer.",
			},
			Recommendation: "accept",
			Confidence:     "high",
		},
		BriefingArtifact: artifact,
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	var decoded map[string]interface{}
	if err := json.Unmarshal(encoded, &decoded); err != nil {
		t.Fatalf("unmarshal payload: %v", err)
	}

	decodedArtifact, ok := decoded["briefing_artifact"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected briefing_artifact object, got %#v", decoded["briefing_artifact"])
	}
	requiredLists := []string{
		"review_readiness_signals",
		"claimed_contributions",
		"notable_elements",
		"reviewer_attention_points",
		"stated_scope_and_limitations",
	}
	for _, field := range requiredLists {
		value, ok := decodedArtifact[field].([]interface{})
		if !ok {
			t.Fatalf("expected %s list in forwarded briefing artifact, got %#v", field, decodedArtifact[field])
		}
		if value == nil {
			t.Fatalf("expected %s to serialize as an empty list, not null", field)
		}
	}

	snapshot, ok := decodedArtifact["submission_snapshot"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected submission_snapshot object, got %#v", decodedArtifact["submission_snapshot"])
	}
	keywords, ok := snapshot["keywords"].([]interface{})
	if !ok {
		t.Fatalf("expected submission_snapshot.keywords list, got %#v", snapshot["keywords"])
	}
	if keywords == nil {
		t.Fatal("expected submission_snapshot.keywords to serialize as an empty list, not null")
	}
}
