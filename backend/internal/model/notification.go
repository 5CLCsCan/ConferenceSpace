package model

import (
	"encoding/json"
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	NotificationTableName = "notifications"

	NotificationColID           = "id"
	NotificationColUserEmail    = "user_email"
	NotificationColType         = "type"
	NotificationColTitle        = "title"
	NotificationColMessage      = "message"
	NotificationColMetadata     = "metadata"
	NotificationColRead         = "read"
	NotificationColActionURL    = "action_url"
	NotificationColConferenceID = "conference_id"
	NotificationColCreatedAt    = "created_at"
)

// Notification types
const (
	NotificationTypeSubmissionReceived = "submission_received"
	NotificationTypeReviewAssigned     = "review_assigned"
	NotificationTypeReviewSubmitted    = "review_submitted"
	NotificationTypePaperAccepted      = "paper_accepted"
	NotificationTypePaperRejected      = "paper_rejected"
	NotificationTypeDeadlineReminder   = "deadline_reminder"
	NotificationTypeStatusChange       = "status_change"
	NotificationTypeDiscussionThread    = "discussion_thread"
	NotificationTypeDiscussionMessage   = "discussion_message"
	NotificationTypeRebuttalOpened      = "rebuttal_opened"
	NotificationTypeRebuttalSubmitted   = "rebuttal_submitted"
	NotificationTypeRebuttalAcknowledged = "rebuttal_acknowledged"
	NotificationTypeRebuttalFinalized   = "rebuttal_finalized"
	NotificationTypeRebuttalReminder    = "rebuttal_reminder"
	NotificationTypeAssignmentAccepted  = "assignment_accepted"
	NotificationTypeAssignmentDeclined  = "assignment_declined"
)

// Notification represents a notification in the database
type Notification struct {
	ID           int64     `db:"id"`
	UserEmail    string    `db:"user_email"`
	Type         string    `db:"type"`
	Title        string    `db:"title"`
	Message      string    `db:"message"`
	Metadata     []byte    `db:"metadata"`
	Read         bool      `db:"read"`
	ActionURL    *string   `db:"action_url"`
	ConferenceID *int64    `db:"conference_id"`
	CreatedAt    time.Time `db:"created_at"`
}

// ToDTO converts the model to a DTO
func (n *Notification) ToDTO() *dto.Notification {
	result := &dto.Notification{
		ID:           n.ID,
		UserEmail:    n.UserEmail,
		Type:         n.Type,
		Title:        n.Title,
		Message:      n.Message,
		Read:         n.Read,
		ConferenceID: n.ConferenceID,
		CreatedAt:    n.CreatedAt,
	}

	if n.ActionURL != nil {
		result.ActionURL = *n.ActionURL
	}

	// Parse metadata JSON
	if len(n.Metadata) > 0 && string(n.Metadata) != "{}" {
		var metadata map[string]interface{}
		if err := json.Unmarshal(n.Metadata, &metadata); err == nil {
			result.Metadata = metadata
		}
	}

	return result
}

// NotificationPreferences table constants
const (
	NotificationPreferencesTableName = "notification_preferences"

	NotificationPrefColID                 = "id"
	NotificationPrefColUserEmail          = "user_email"
	NotificationPrefColSubmissionReceived = "submission_received"
	NotificationPrefColReviewAssigned     = "review_assigned"
	NotificationPrefColReviewSubmitted    = "review_submitted"
	NotificationPrefColPaperAccepted      = "paper_accepted"
	NotificationPrefColPaperRejected      = "paper_rejected"
	NotificationPrefColDeadlineReminder   = "deadline_reminder"
	NotificationPrefColStatusChange       = "status_change"
	NotificationPrefColEmailNotifications = "email_notifications"
	NotificationPrefColCreatedAt          = "created_at"
	NotificationPrefColUpdatedAt          = "updated_at"
)

// NotificationPreferences represents user notification preferences
type NotificationPreferences struct {
	ID                 int64     `db:"id"`
	UserEmail          string    `db:"user_email"`
	SubmissionReceived bool      `db:"submission_received"`
	ReviewAssigned     bool      `db:"review_assigned"`
	ReviewSubmitted    bool      `db:"review_submitted"`
	PaperAccepted      bool      `db:"paper_accepted"`
	PaperRejected      bool      `db:"paper_rejected"`
	DeadlineReminder   bool      `db:"deadline_reminder"`
	StatusChange       bool      `db:"status_change"`
	EmailNotifications bool      `db:"email_notifications"`
	CreatedAt          time.Time `db:"created_at"`
	UpdatedAt          time.Time `db:"updated_at"`
}

func (n *NotificationPreferences) ToDTO() *dto.NotificationPreferencesResponse {
	if n == nil {
		return nil
	}

	return &dto.NotificationPreferencesResponse{
		UserEmail:          n.UserEmail,
		SubmissionReceived: n.SubmissionReceived,
		ReviewAssigned:     n.ReviewAssigned,
		ReviewSubmitted:    n.ReviewSubmitted,
		PaperAccepted:      n.PaperAccepted,
		PaperRejected:      n.PaperRejected,
		DeadlineReminder:   n.DeadlineReminder,
		StatusChange:       n.StatusChange,
		EmailNotifications: n.EmailNotifications,
		UpdatedAt:          n.UpdatedAt,
	}
}
