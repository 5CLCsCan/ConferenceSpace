package dto

import "time"

// Notification types
const (
	NotificationTypeSubmissionReceived = "submission_received"
	NotificationTypeReviewAssigned     = "review_assigned"
	NotificationTypeReviewSubmitted    = "review_submitted"
	NotificationTypePaperAccepted      = "paper_accepted"
	NotificationTypePaperRejected      = "paper_rejected"
	NotificationTypeDeadlineReminder   = "deadline_reminder"
	NotificationTypeStatusChange       = "status_change"
)

// Notification represents a notification in the system
type Notification struct {
	ID           int64                  `json:"id"`
	UserEmail    string                 `json:"user_email"`
	Type         string                 `json:"type"`
	Title        string                 `json:"title"`
	Message      string                 `json:"message"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	Read         bool                   `json:"read"`
	ActionURL    string                 `json:"action_url,omitempty"`
	ConferenceID *int64                 `json:"conference_id,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
}

// NotificationListRequest represents a request to list notifications
type NotificationListRequest struct {
	Limit  int    `form:"limit" json:"limit"`
	Offset int    `form:"offset" json:"offset"`
	Unread bool   `form:"unread" json:"unread"`
	Type   string `form:"type" json:"type"`
}

// NotificationListResponse represents a response for list notifications
type NotificationListResponse struct {
	Notifications []*Notification `json:"notifications"`
	Total         int64           `json:"total"`
}

// UnreadCountResponse represents the response for unread notification count
type UnreadCountResponse struct {
	Count int64 `json:"count"`
}

// NotificationCreateRequest represents a request to create a notification (internal use)
type NotificationCreateRequest struct {
	UserEmail    string                 `json:"user_email" binding:"required,email"`
	Type         string                 `json:"type" binding:"required"`
	Title        string                 `json:"title" binding:"required"`
	Message      string                 `json:"message" binding:"required"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	ActionURL    string                 `json:"action_url,omitempty"`
	ConferenceID *int64                 `json:"conference_id,omitempty"`
}

// MarkAsReadRequest represents a request to mark a notification as read
type MarkAsReadRequest struct {
	ID int64 `uri:"id" binding:"required"`
}

// MarkAllAsReadResponse represents the response for marking all notifications as read
type MarkAllAsReadResponse struct {
	MarkedCount int64 `json:"marked_count"`
}

