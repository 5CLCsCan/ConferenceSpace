package discussion

import (
	"context"
	"fmt"

	"github.com/dcao/conferencespace/internal/dto"
	"github.com/dcao/conferencespace/internal/model"
	notificationService "github.com/dcao/conferencespace/internal/service/notification"
	discussionStorage "github.com/dcao/conferencespace/internal/storage/discussion"
)

// Service provides discussion-related business logic
type Service struct {
	storage      discussionStorage.StorageInterface
	notification *notificationService.Service
}

// New creates a new discussion service
func New(storage discussionStorage.StorageInterface) *Service {
	return &Service{
		storage: storage,
	}
}

// NewWithNotification creates a new discussion service with notification support
func NewWithNotification(storage discussionStorage.StorageInterface, notifService *notificationService.Service) *Service {
	return &Service{
		storage:      storage,
		notification: notifService,
	}
}

// CreateThread creates a new discussion thread (reviewer only)
func (s *Service) CreateThread(ctx context.Context, userID int64, userEmail string, submissionID int64, req *dto.CreateThreadRequest) (*dto.CreateThreadResponse, error) {
	// Get conference ID for this submission
	conferenceID, err := s.storage.GetSubmissionConferenceID(ctx, submissionID)
	if err != nil {
		return nil, fmt.Errorf("submission not found")
	}

	// Check conference is in reviewing phase
	status, err := s.storage.GetConferenceStatus(ctx, conferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get conference status: %w", err)
	}
	if status != model.ConferenceStatusReviewing {
		return nil, fmt.Errorf("discussions are only allowed during the reviewing phase")
	}

	// Check user is assigned reviewer for this submission
	isReviewer, err := s.storage.IsUserAssignedReviewer(ctx, userID, submissionID)
	if err != nil {
		return nil, fmt.Errorf("failed to check reviewer status: %w", err)
	}
	if !isReviewer {
		return nil, fmt.Errorf("only assigned reviewers can create discussion threads")
	}

	// Create the thread
	visibility := req.Visibility
	if visibility == "" {
		visibility = "reviewers"
	}
	thread := &model.DiscussionThread{
		SubmissionID: submissionID,
		ReviewerID:   userID,
		ConferenceID: conferenceID,
		Title:        req.Title,
		Visibility:   visibility,
	}

	createdThread, err := s.storage.CreateThread(ctx, thread)
	if err != nil {
		return nil, fmt.Errorf("failed to create thread: %w", err)
	}

	// Create the first message
	message := &model.DiscussionMessage{
		ThreadID: createdThread.ID,
		AuthorID: userID,
		Content:  req.Content,
	}

	createdMessage, err := s.storage.CreateMessage(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("failed to create initial message: %w", err)
	}

	// Get full thread info for response
	fullThread, err := s.storage.GetThreadByID(ctx, createdThread.ID)
	if err != nil {
		// Use basic thread if full info fails
		fullThread = createdThread
	}

	// Send notification to author
	if s.notification != nil {
		authorEmail, _ := s.storage.GetSubmissionAuthorEmail(ctx, submissionID)
		if authorEmail != "" {
			s.notification.NotifyDiscussionThreadCreated(ctx, authorEmail, fullThread.SubmissionTitle, fullThread.Title, conferenceID, submissionID, createdThread.ID)
		}
	}

	return &dto.CreateThreadResponse{
		Thread:  fullThread.ToDTO(),
		Message: createdMessage.ToDTO(),
	}, nil
}

// GetThreadsForUser retrieves threads based on user role
func (s *Service) GetThreadsForUser(ctx context.Context, userID int64, userEmail string, submissionID int64) (*dto.ThreadListResponse, error) {
	// Get conference ID
	conferenceID, err := s.storage.GetSubmissionConferenceID(ctx, submissionID)
	if err != nil {
		return nil, fmt.Errorf("submission not found")
	}

	// Check if user is chair
	isChair, _ := s.storage.IsUserConferenceChair(ctx, userEmail, conferenceID)
	if isChair {
		// Chair sees all threads for this submission
		threads, err := s.storage.GetThreadsBySubmission(ctx, submissionID)
		if err != nil {
			return nil, fmt.Errorf("failed to get threads: %w", err)
		}
		return s.toThreadListResponse(threads), nil
	}

	// Check if user is the author
	authorEmail, err := s.storage.GetSubmissionAuthorEmail(ctx, submissionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get submission: %w", err)
	}
	if authorEmail == userEmail {
		// Author sees all threads for their paper
		threads, err := s.storage.GetThreadsForAuthor(ctx, userEmail, submissionID)
		if err != nil {
			return nil, fmt.Errorf("failed to get threads: %w", err)
		}
		return s.toThreadListResponse(threads), nil
	}

	// Check if user is assigned reviewer
	isReviewer, _ := s.storage.IsUserAssignedReviewer(ctx, userID, submissionID)
	if isReviewer {
		// Reviewer sees only their own threads
		threads, err := s.storage.GetThreadsByReviewer(ctx, userID, submissionID)
		if err != nil {
			return nil, fmt.Errorf("failed to get threads: %w", err)
		}
		return s.toThreadListResponse(threads), nil
	}

	// User has no access
	return nil, fmt.Errorf("you do not have access to discussions for this submission")
}

// AddMessage adds a message to a thread
func (s *Service) AddMessage(ctx context.Context, userID int64, userEmail string, threadID int64, req *dto.CreateMessageRequest) (*dto.DiscussionMessage, error) {
	// Get thread info
	thread, err := s.storage.GetThreadByID(ctx, threadID)
	if err != nil {
		return nil, fmt.Errorf("thread not found")
	}

	// Check conference is in reviewing phase
	status, err := s.storage.GetConferenceStatus(ctx, thread.ConferenceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get conference status: %w", err)
	}
	if status != model.ConferenceStatusReviewing {
		return nil, fmt.Errorf("discussions are only allowed during the reviewing phase")
	}

	// Check user is a participant (the reviewer who created the thread or the author)
	isParticipant := false
	var recipientEmail string

	if thread.ReviewerID == userID {
		// User is the reviewer
		isParticipant = true
		recipientEmail = thread.AuthorEmail
	} else if thread.AuthorEmail == userEmail {
		// User is the author
		isParticipant = true
		recipientEmail = thread.ReviewerEmail
	}

	if !isParticipant {
		return nil, fmt.Errorf("only thread participants can add messages")
	}

	// Create the message
	message := &model.DiscussionMessage{
		ThreadID: threadID,
		AuthorID: userID,
		Content:  req.Content,
	}

	createdMessage, err := s.storage.CreateMessage(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Send notification to the other participant
	if s.notification != nil && recipientEmail != "" {
		s.notification.NotifyDiscussionMessageCreated(ctx, recipientEmail, thread.SubmissionTitle, thread.Title, thread.ConferenceID, thread.SubmissionID, threadID)
	}

	return createdMessage.ToDTO(), nil
}

// GetMessages retrieves messages for a thread
func (s *Service) GetMessages(ctx context.Context, userID int64, userEmail string, threadID int64) (*dto.MessageListResponse, error) {
	// Get thread info
	thread, err := s.storage.GetThreadByID(ctx, threadID)
	if err != nil {
		return nil, fmt.Errorf("thread not found")
	}

	// Check access: must be reviewer, author, or chair
	hasAccess := false

	if thread.ReviewerID == userID {
		hasAccess = true
	} else if thread.AuthorEmail == userEmail {
		hasAccess = true
	} else {
		// Check if chair
		isChair, _ := s.storage.IsUserConferenceChair(ctx, userEmail, thread.ConferenceID)
		hasAccess = isChair
	}

	if !hasAccess {
		return nil, fmt.Errorf("you do not have access to this thread")
	}

	// Get messages
	messages, err := s.storage.GetMessagesByThread(ctx, threadID)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	dtoMessages := make([]*dto.DiscussionMessage, len(messages))
	for i, msg := range messages {
		dtoMessages[i] = msg.ToDTO()
	}

	return &dto.MessageListResponse{
		Messages: dtoMessages,
		Total:    int64(len(dtoMessages)),
	}, nil
}

// GetThread retrieves a single thread by ID with access control
func (s *Service) GetThread(ctx context.Context, userID int64, userEmail string, threadID int64) (*dto.DiscussionThread, error) {
	thread, err := s.storage.GetThreadByID(ctx, threadID)
	if err != nil {
		return nil, fmt.Errorf("thread not found")
	}

	// Check access
	hasAccess := false

	if thread.ReviewerID == userID {
		hasAccess = true
	} else if thread.AuthorEmail == userEmail {
		hasAccess = true
	} else {
		isChair, _ := s.storage.IsUserConferenceChair(ctx, userEmail, thread.ConferenceID)
		hasAccess = isChair
	}

	if !hasAccess {
		return nil, fmt.Errorf("you do not have access to this thread")
	}

	return thread.ToDTO(), nil
}

// DeleteMessage deletes a message authored by the requesting user
func (s *Service) DeleteMessage(ctx context.Context, userID int64, messageID int64) error {
	err := s.storage.DeleteMessage(ctx, messageID, userID)
	if err != nil {
		if err.Error() == "message not found or not authorized" {
			return fmt.Errorf("message not found or not authorized")
		}
		return fmt.Errorf("failed to delete message: %w", err)
	}
	return nil
}

func (s *Service) toThreadListResponse(threads []*model.DiscussionThread) *dto.ThreadListResponse {
	dtoThreads := make([]*dto.DiscussionThread, len(threads))
	for i, t := range threads {
		dtoThreads[i] = t.ToDTO()
	}
	return &dto.ThreadListResponse{
		Threads: dtoThreads,
		Total:   int64(len(dtoThreads)),
	}
}
