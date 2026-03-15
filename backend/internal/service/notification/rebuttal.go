package notification

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
)

// NotifyRebuttalOpened notifies an author that the rebuttal period is open.
func (s *Service) NotifyRebuttalOpened(ctx context.Context, authorEmail, conferenceTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail:    authorEmail,
		Type:         model.NotificationTypeRebuttalOpened,
		Title:        "Rebuttal Period Open",
		Message:      fmt.Sprintf("The rebuttal period for \"%s\" is now open. Submit your response before the deadline.", conferenceTitle),
		Metadata:     map[string]interface{}{"conference_name": conferenceTitle},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalSubmitted notifies a reviewer that the author submitted a rebuttal.
func (s *Service) NotifyRebuttalSubmitted(ctx context.Context, reviewerEmail, paperTitle, conferenceTitle string, conferenceID, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail:    reviewerEmail,
		Type:         model.NotificationTypeRebuttalSubmitted,
		Title:        "Author Submitted Rebuttal",
		Message:      fmt.Sprintf("The author of \"%s\" has submitted a rebuttal for \"%s\".", paperTitle, conferenceTitle),
		Metadata:     map[string]interface{}{"paper_title": paperTitle, "conference_name": conferenceTitle},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d/submissions/%d", conferenceID, submissionID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalAcknowledged notifies the author that a reviewer acknowledged their rebuttal.
func (s *Service) NotifyRebuttalAcknowledged(ctx context.Context, authorEmail, paperTitle, conferenceTitle string, conferenceID, submissionID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail:    authorEmail,
		Type:         model.NotificationTypeRebuttalAcknowledged,
		Title:        "Reviewer Acknowledged Rebuttal",
		Message:      fmt.Sprintf("A reviewer has acknowledged your rebuttal for \"%s\" in \"%s\".", paperTitle, conferenceTitle),
		Metadata:     map[string]interface{}{"paper_title": paperTitle, "conference_name": conferenceTitle},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d/submissions/%d", conferenceID, submissionID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalFinalized notifies a user that the rebuttal period is finalized.
func (s *Service) NotifyRebuttalFinalized(ctx context.Context, userEmail, conferenceTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail:    userEmail,
		Type:         model.NotificationTypeRebuttalFinalized,
		Title:        "Rebuttal Period Finalized",
		Message:      fmt.Sprintf("The rebuttal period for \"%s\" has been finalized. No further changes are possible.", conferenceTitle),
		Metadata:     map[string]interface{}{"conference_name": conferenceTitle},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}

// NotifyRebuttalDeadlineReminder notifies an author 24h before the deadline.
func (s *Service) NotifyRebuttalDeadlineReminder(ctx context.Context, authorEmail, conferenceTitle string, conferenceID int64) error {
	req := &dto.NotificationCreateRequest{
		UserEmail:    authorEmail,
		Type:         model.NotificationTypeRebuttalReminder,
		Title:        "Rebuttal Deadline in 24 Hours",
		Message:      fmt.Sprintf("The rebuttal deadline for \"%s\" is in 24 hours. Submit your response now.", conferenceTitle),
		Metadata:     map[string]interface{}{"conference_name": conferenceTitle},
		ActionURL:    fmt.Sprintf("/dashboard/conference/%d", conferenceID),
		ConferenceID: &conferenceID,
	}
	n, err := s.storage.Create(ctx, req)
	if err != nil {
		return err
	}
	s.broadcastNotification(n)
	return nil
}
