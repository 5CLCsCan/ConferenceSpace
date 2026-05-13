package analytics

import (
	"testing"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

func TestValidateBatchAcceptsValidFlowStep(t *testing.T) {
	step := 1
	req := &dto.AnalyticsBatchRequest{
		SessionID: "11111111-1111-4111-8111-111111111111",
		Events: []dto.AnalyticsEventCreate{{
			EventID:    "22222222-2222-4222-8222-222222222222",
			EventName:  "reviewer_dashboard_opened",
			EventType:  dto.AnalyticsEventTypeFlowStep,
			Route:      "/role/reviewer",
			FlowID:     "33333333-3333-4333-8333-333333333333",
			FlowName:   "reviewer_review",
			StepName:   "reviewer_dashboard_opened",
			StepIndex:  &step,
			OccurredAt: time.Now(),
		}},
	}

	if err := validateBatch(req); err != nil {
		t.Fatalf("expected valid batch, got %v", err)
	}
}

func TestValidateBatchRejectsInvalidEventType(t *testing.T) {
	req := &dto.AnalyticsBatchRequest{
		SessionID: "11111111-1111-4111-8111-111111111111",
		Events: []dto.AnalyticsEventCreate{{
			EventID:    "22222222-2222-4222-8222-222222222222",
			EventName:  "bad_event",
			EventType:  "clickstream",
			Route:      "/role/reviewer",
			OccurredAt: time.Now(),
		}},
	}

	if err := validateBatch(req); err == nil {
		t.Fatal("expected invalid event type to be rejected")
	}
}

func TestValidateBatchRejectsIncompleteFlowStep(t *testing.T) {
	req := &dto.AnalyticsBatchRequest{
		SessionID: "11111111-1111-4111-8111-111111111111",
		Events: []dto.AnalyticsEventCreate{{
			EventID:    "22222222-2222-4222-8222-222222222222",
			EventName:  "assignment_opened",
			EventType:  dto.AnalyticsEventTypeFlowStep,
			Route:      "/role/reviewer/assignments/1",
			OccurredAt: time.Now(),
		}},
	}

	if err := validateBatch(req); err == nil {
		t.Fatal("expected incomplete flow step to be rejected")
	}
}

func TestValidateBatchRejectsInvalidRole(t *testing.T) {
	req := &dto.AnalyticsBatchRequest{
		SessionID: "11111111-1111-4111-8111-111111111111",
		Events: []dto.AnalyticsEventCreate{{
			EventID:    "22222222-2222-4222-8222-222222222222",
			EventName:  "page_view",
			EventType:  dto.AnalyticsEventTypePageView,
			Route:      "/role/reviewer",
			Role:       "visitor",
			OccurredAt: time.Now(),
		}},
	}

	if err := validateBatch(req); err == nil {
		t.Fatal("expected invalid role to be rejected")
	}
}
