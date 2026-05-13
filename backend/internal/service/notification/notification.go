package notification

import (
	"context"
	"fmt"
	"html"
	"log"
	"strings"
	"time"

	"github.com/dcao/conferencespace/internal/clients/brevo"
	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	notificationStorage "github.com/dcao/conferencespace/internal/storage/notification"
	"github.com/dcao/conferencespace/internal/websocket"
)

// Service provides notification-related business logic
type Service struct {
	storage    notificationStorage.StorageInterface
	hub        *websocket.Hub
	email      *brevo.Client
	appBaseURL string
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

func (s *Service) SetEmailClient(email *brevo.Client, appBaseURL string) {
	s.email = email
	s.appBaseURL = strings.TrimRight(appBaseURL, "/")
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
		ActionURL:    "/role/reviewer/invitations",
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
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d", conferenceID),
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
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d", conferenceID),
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
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d/submissions/%d", conferenceID, submissionID),
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
		ActionURL:    fmt.Sprintf("/role/reviewer/invitations/%d", assignmentID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

func (s *Service) NotifyReviewDeadlineReminder(
	ctx context.Context,
	reviewerEmail string,
	paperTitle string,
	conferenceName string,
	conferenceID int64,
	submissionID int64,
	assignmentID int64,
	assignmentStatus string,
	dueDate *time.Time,
	sentBy string,
) (*dto.Notification, bool, error) {
	actionURL := fmt.Sprintf("/role/reviewer/assignments/%d?conferenceId=%d", assignmentID, conferenceID)
	message := fmt.Sprintf("Please complete your review for \"%s\".", paperTitle)
	if assignmentStatus == model.AssignmentStatusPending {
		actionURL = fmt.Sprintf("/role/reviewer/invitations/%d", assignmentID)
		message = fmt.Sprintf("Please respond to your review assignment for \"%s\".", paperTitle)
	}

	metadata := map[string]interface{}{
		"assignment_id": assignmentID,
		"submission_id": submissionID,
		"paper_title":   paperTitle,
		"sent_by":       sentBy,
	}
	if dueDate != nil {
		metadata["due_date"] = dueDate.Format(time.RFC3339)
	}

	req := &dto.NotificationCreateRequest{
		UserEmail:    reviewerEmail,
		Type:         model.NotificationTypeDeadlineReminder,
		Title:        "Review reminder",
		Message:      message,
		Metadata:     metadata,
		ActionURL:    actionURL,
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return nil, false, err
	}
	s.broadcastNotification(notification)

	emailSent := false
	if s.email != nil && s.email.Configured() {
		emailURL := actionURL
		if s.appBaseURL != "" {
			emailURL = s.appBaseURL + actionURL
		}
		htmlContent := buildReviewReminderEmailHTML(message, conferenceName, paperTitle, emailURL, dueDate)
		if err := s.email.SendEmail(ctx, reviewerEmail, fmt.Sprintf("Reminder: review needed for \"%s\"", paperTitle), htmlContent); err != nil {
			log.Printf("Warning: failed to send review reminder email to %s: %v", reviewerEmail, err)
		} else {
			emailSent = true
		}
	}

	return notification, emailSent, nil
}

func buildReviewReminderEmailHTML(message, conferenceName, paperTitle, actionURL string, dueDate *time.Time) string {
	deadlineText := "Not specified"
	deadlineTone := "#475569"
	if dueDate != nil {
		deadlineText = dueDate.Format("Jan 2, 2006 at 15:04 MST")
		if time.Now().After(*dueDate) {
			deadlineTone = "#b91c1c"
		} else if time.Until(*dueDate) <= 72*time.Hour {
			deadlineTone = "#b45309"
		}
	}

	escapedMessage := html.EscapeString(message)
	escapedConference := html.EscapeString(conferenceName)
	escapedPaper := html.EscapeString(paperTitle)
	escapedDeadline := html.EscapeString(deadlineText)
	escapedURL := html.EscapeString(actionURL)

	return fmt.Sprintf(`<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#1B3C53;padding:20px 24px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#cbd5e1;">ConferenceSpace</div>
                <div style="font-size:22px;line-height:1.25;font-weight:700;color:#ffffff;margin-top:8px;">Review reminder</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Hello,</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#0f172a;">%s</p>

                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;margin:0 0 24px;">
                  <tr>
                    <td style="padding:16px 18px;border-bottom:1px solid #e2e8f0;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Conference</div>
                      <div style="font-size:14px;line-height:1.5;font-weight:600;color:#0f172a;">%s</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px;border-bottom:1px solid #e2e8f0;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Paper</div>
                      <div style="font-size:14px;line-height:1.5;font-weight:600;color:#0f172a;">%s</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 18px;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Review deadline</div>
                      <div style="font-size:14px;line-height:1.5;font-weight:700;color:%s;">%s</div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                  <tr>
                    <td style="border-radius:8px;background:#1B3C53;">
                      <a href="%s" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:8px;">Open review assignment</a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">If the button does not work, open this link:<br><a href="%s" style="color:#1B3C53;word-break:break-all;">%s</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`, escapedMessage, escapedConference, escapedPaper, deadlineTone, escapedDeadline, escapedURL, escapedURL, escapedURL)
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
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d/submissions/%d", conferenceID, submissionID),
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
		ActionURL:    fmt.Sprintf("/role/author/submissions/%d", submissionID),
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
		ActionURL:    fmt.Sprintf("/role/author/submissions/%d", submissionID),
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
		ActionURL:    fmt.Sprintf("/role/author/conferences/%d", conferenceID),
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
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d", conferenceID),
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

// NotifyDiscussionThreadCreated notifies an author when a reviewer creates a discussion thread
func (s *Service) NotifyDiscussionThreadCreated(ctx context.Context, authorEmail string, paperTitle string, threadTitle string, conferenceID int64, submissionID int64, threadID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: authorEmail,
		Type:      model.NotificationTypeDiscussionThread,
		Title:     "New Discussion Thread",
		Message:   fmt.Sprintf("A reviewer has started a discussion \"%s\" on your paper \"%s\".", threadTitle, paperTitle),
		Metadata: map[string]interface{}{
			"thread_id":        threadID,
			"thread_title":     threadTitle,
			"submission_id":    submissionID,
			"submission_title": paperTitle,
		},
		ActionURL:    fmt.Sprintf("/role/author/submissions/%d?tab=discussion&thread=%d", submissionID, threadID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyDiscussionMessageCreated notifies a participant when a new message is added to a thread
func (s *Service) NotifyDiscussionMessageCreated(ctx context.Context, recipientEmail string, paperTitle string, threadTitle string, conferenceID int64, submissionID int64, threadID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: recipientEmail,
		Type:      model.NotificationTypeDiscussionMessage,
		Title:     "New Discussion Message",
		Message:   fmt.Sprintf("New message in discussion \"%s\" on paper \"%s\".", threadTitle, paperTitle),
		Metadata: map[string]interface{}{
			"thread_id":        threadID,
			"thread_title":     threadTitle,
			"submission_id":    submissionID,
			"submission_title": paperTitle,
		},
		ActionURL:    fmt.Sprintf("/role/author/submissions/%d?tab=discussion&thread=%d", submissionID, threadID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyAssignmentAccepted notifies chairs when a reviewer accepts a paper assignment
func (s *Service) NotifyAssignmentAccepted(ctx context.Context, chairEmail string, reviewerEmail string, paperTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail: chairEmail,
		Type:      model.NotificationTypeAssignmentAccepted,
		Title:     "Assignment Accepted",
		Message:   fmt.Sprintf("%s accepted the assignment to review \"%s\".", reviewerEmail, paperTitle),
		Metadata: map[string]interface{}{
			"reviewer_email": reviewerEmail,
			"paper_title":    paperTitle,
		},
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}

// NotifyAssignmentDeclined notifies chairs when a reviewer declines a paper assignment
func (s *Service) NotifyAssignmentDeclined(ctx context.Context, chairEmail string, reviewerEmail string, paperTitle string, conferenceID int64, declineCategory *string, declineReason *string) error {
	message := fmt.Sprintf("%s declined the assignment to review \"%s\".", reviewerEmail, paperTitle)

	metadata := map[string]interface{}{
		"reviewer_email": reviewerEmail,
		"paper_title":    paperTitle,
	}
	if declineCategory != nil {
		metadata["decline_category"] = *declineCategory
	}
	if declineReason != nil && *declineReason != "" {
		message += fmt.Sprintf(" Reason: %s", *declineReason)
		metadata["decline_reason"] = *declineReason
	}

	req := &dto.NotificationCreateRequest{
		UserEmail:    chairEmail,
		Type:         model.NotificationTypeAssignmentDeclined,
		Title:        "Assignment Declined",
		Message:      message,
		Metadata:     metadata,
		ActionURL:    fmt.Sprintf("/role/chair/conferences/%d", conferenceID),
		ConferenceID: &conferenceID,
	}

	notification, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}

	s.broadcastNotification(notification)
	return nil
}
