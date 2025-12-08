package notification

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	notificationStorage "github.com/dcao/conferencespace/internal/storage/notification"
	"github.com/dcao/conferencespace/internal/websocket"
)

// Service provides notification-related business logic
type Service struct {
	storage notificationStorage.StorageInterface
	hub     *websocket.Hub
}

// New creates a new notification service
func New(storage notificationStorage.StorageInterface) *Service {
	return &Service{
		storage: storage,
	}
}

// NewWithWebSocket creates a new notification service with WebSocket support
func NewWithWebSocket(storage notificationStorage.StorageInterface, hub *websocket.Hub) *Service {
	return &Service{
		storage: storage,
		hub:     hub,
	}
}

// SetHub sets the WebSocket hub for real-time broadcasting
func (s *Service) SetHub(hub *websocket.Hub) {
	s.hub = hub
}

// broadcastNotification sends a notification via WebSocket if hub is available
func (s *Service) broadcastNotification(notification *dto.Notification) {
	if s.hub != nil {
		s.hub.BroadcastToUser(notification.UserEmail, notification)
	}
}

// NotifyReviewerInvited notifies a reviewer when they are invited to a conference
func (s *Service) NotifyReviewerInvited(ctx context.Context, reviewerEmail string, conferenceName string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: reviewerEmail,
		Type:      model.NotificationTypeReviewAssigned, // Using review_assigned type for invitations too
		Title:     "Conference Reviewer Invitation",
		Message:   fmt.Sprintf("You have been invited to be a reviewer for \"%s\".", conferenceName),
		Metadata: map[string]interface{}{
			"conference_name": conferenceName,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyReviewerAccepted notifies chairs when a reviewer accepts their invitation
func (s *Service) NotifyReviewerAccepted(ctx context.Context, chairEmail string, reviewerName string, reviewerEmail string, conferenceName string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: chairEmail,
		Type:      model.NotificationTypeStatusChange,
		Title:     "Reviewer Accepted Invitation",
		Message:   fmt.Sprintf("%s (%s) has accepted the invitation to review for \"%s\".", reviewerName, reviewerEmail, conferenceName),
		Metadata: map[string]interface{}{
			"reviewer_name":   reviewerName,
			"reviewer_email":  reviewerEmail,
			"conference_name": conferenceName,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d/reviewers", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyReviewerRejected notifies chairs when a reviewer rejects their invitation
func (s *Service) NotifyReviewerRejected(ctx context.Context, chairEmail string, reviewerName string, reviewerEmail string, conferenceName string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: chairEmail,
		Type:      model.NotificationTypeStatusChange,
		Title:     "Reviewer Declined Invitation",
		Message:   fmt.Sprintf("%s (%s) has declined the invitation to review for \"%s\".", reviewerName, reviewerEmail, conferenceName),
		Metadata: map[string]interface{}{
			"reviewer_name":   reviewerName,
			"reviewer_email":  reviewerEmail,
			"conference_name": conferenceName,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d/reviewers", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifySubmissionReceived notifies chairs when a new submission is created
func (s *Service) NotifySubmissionReceived(ctx context.Context, chairEmail string, submissionTitle string, conferenceID int64, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: chairEmail,
		Type:      model.NotificationTypeSubmissionReceived,
		Title:     "New Submission Received",
		Message:   fmt.Sprintf("A new paper \"%s\" has been submitted to your conference.", submissionTitle),
		Metadata: map[string]interface{}{
			"submission_id":    submissionID,
			"submission_title": submissionTitle,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d/submission/%d", conferenceID, submissionID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	// Broadcast via WebSocket
	s.broadcastNotification(notification)
	return nil
}

// NotifyReviewAssigned notifies a reviewer when they are assigned to a paper
func (s *Service) NotifyReviewAssigned(ctx context.Context, reviewerEmail string, paperTitle string, conferenceID int64, submissionID int64, assignmentID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: reviewerEmail,
		Type:      model.NotificationTypeReviewAssigned,
		Title:     "New Review Assignment",
		Message:   fmt.Sprintf("You have been assigned to review the paper \"%s\".", paperTitle),
		Metadata: map[string]interface{}{
			"submission_id": submissionID,
			"assignment_id": assignmentID,
			"paper_title":   paperTitle,
		},
		ActionURL:    fmt.Sprintf("/dashboard/reviewer/papers/%d", submissionID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyReviewSubmitted notifies chairs when a reviewer submits a review
func (s *Service) NotifyReviewSubmitted(ctx context.Context, chairEmail string, reviewerName string, paperTitle string, conferenceID int64, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: chairEmail,
		Type:      model.NotificationTypeReviewSubmitted,
		Title:     "Review Submitted",
		Message:   fmt.Sprintf("%s has submitted a review for \"%s\".", reviewerName, paperTitle),
		Metadata: map[string]interface{}{
			"submission_id": submissionID,
			"reviewer_name": reviewerName,
			"paper_title":   paperTitle,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d/submission/%d", conferenceID, submissionID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyPaperAccepted notifies authors when their paper is accepted
func (s *Service) NotifyPaperAccepted(ctx context.Context, authorEmail string, paperTitle string, conferenceID int64, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: authorEmail,
		Type:      model.NotificationTypePaperAccepted,
		Title:     "Paper Accepted",
		Message:   fmt.Sprintf("Congratulations! Your paper \"%s\" has been accepted.", paperTitle),
		Metadata: map[string]interface{}{
			"submission_id": submissionID,
			"paper_title":   paperTitle,
		},
		ActionURL:    fmt.Sprintf("/dashboard/author/papers/%d", submissionID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyPaperRejected notifies authors when their paper is rejected
func (s *Service) NotifyPaperRejected(ctx context.Context, authorEmail string, paperTitle string, conferenceID int64, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: authorEmail,
		Type:      model.NotificationTypePaperRejected,
		Title:     "Paper Decision",
		Message:   fmt.Sprintf("We regret to inform you that your paper \"%s\" was not accepted.", paperTitle),
		Metadata: map[string]interface{}{
			"submission_id": submissionID,
			"paper_title":   paperTitle,
		},
		ActionURL:    fmt.Sprintf("/dashboard/author/papers/%d", submissionID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyDeadlineReminder notifies users about upcoming deadlines
func (s *Service) NotifyDeadlineReminder(ctx context.Context, userEmail string, deadlineType string, conferenceName string, conferenceID int64, daysLeft int) error {
	var message string
	if daysLeft == 1 {
		message = fmt.Sprintf("Reminder: The %s deadline for %s is tomorrow.", deadlineType, conferenceName)
	} else {
		message = fmt.Sprintf("Reminder: The %s deadline for %s is in %d days.", deadlineType, conferenceName, daysLeft)
	}

	req := &dto.NotificationCreateRequest{
		UserEmail: userEmail,
		Type:      model.NotificationTypeDeadlineReminder,
		Title:     "Deadline Reminder",
		Message:   message,
		Metadata: map[string]interface{}{
			"deadline_type":   deadlineType,
			"conference_name": conferenceName,
			"days_left":       daysLeft,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyStatusChange notifies users about conference or submission status changes
func (s *Service) NotifyStatusChange(ctx context.Context, userEmail string, entityType string, entityName string, oldStatus string, newStatus string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: userEmail,
		Type:      model.NotificationTypeStatusChange,
		Title:     "Status Update",
		Message:   fmt.Sprintf("The %s \"%s\" status has changed from \"%s\" to \"%s\".", entityType, entityName, oldStatus, newStatus),
		Metadata: map[string]interface{}{
			"entity_type": entityType,
			"entity_name": entityName,
			"old_status":  oldStatus,
			"new_status":  newStatus,
		},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// CreateCustomNotification creates a custom notification
func (s *Service) CreateCustomNotification(ctx context.Context, req *dto.NotificationCreateRequest) (*dto.Notification, error) {
	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return nil, err
	}

	s.broadcastNotification(notification)
	return notification, nil
}
