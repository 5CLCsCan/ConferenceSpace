package dto

import "time"

const (
	AnalyticsEventTypePageView = "page_view"
	AnalyticsEventTypeFeature  = "feature"
	AnalyticsEventTypeFlowStep = "flow_step"
	AnalyticsEventTypeTiming   = "timing"
)

type AnalyticsBatchRequest struct {
	SessionID string                 `json:"session_id" binding:"required"`
	Events    []AnalyticsEventCreate `json:"events" binding:"required,min=1,max=100"`
}

type AnalyticsEventCreate struct {
	EventID    string                 `json:"event_id" binding:"required"`
	EventName  string                 `json:"event_name" binding:"required"`
	EventType  string                 `json:"event_type" binding:"required"`
	Route      string                 `json:"route" binding:"required"`
	Role       string                 `json:"role,omitempty"`
	Feature    string                 `json:"feature,omitempty"`
	FlowID     string                 `json:"flow_id,omitempty"`
	FlowName   string                 `json:"flow_name,omitempty"`
	StepName   string                 `json:"step_name,omitempty"`
	StepIndex  *int                   `json:"step_index,omitempty"`
	ActiveMS   *int64                 `json:"active_ms,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	OccurredAt time.Time              `json:"occurred_at" binding:"required"`
}

type AnalyticsBatchResponse struct {
	Inserted int `json:"inserted"`
	Accepted int `json:"accepted"`
}
