package discussion

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/dcao/conferencespace/internal/model"
)

// StorageInterface defines the discussion storage operations
type StorageInterface interface {
	// Thread operations
	CreateThread(ctx context.Context, thread *model.DiscussionThread) (*model.DiscussionThread, error)
	GetThreadByID(ctx context.Context, threadID int64) (*model.DiscussionThread, error)
	GetThreadsBySubmission(ctx context.Context, submissionID int64) ([]*model.DiscussionThread, error)
	GetThreadsByReviewer(ctx context.Context, reviewerID int64, submissionID int64) ([]*model.DiscussionThread, error)
	GetThreadsForAuthor(ctx context.Context, authorEmail string, submissionID int64) ([]*model.DiscussionThread, error)
	GetThreadsByConference(ctx context.Context, conferenceID int64) ([]*model.DiscussionThread, error)

	// Message operations
	CreateMessage(ctx context.Context, message *model.DiscussionMessage) (*model.DiscussionMessage, error)
	GetMessagesByThread(ctx context.Context, threadID int64) ([]*model.DiscussionMessage, error)

	// Validation helpers
	GetSubmissionAuthorEmail(ctx context.Context, submissionID int64) (string, error)
	GetSubmissionConferenceID(ctx context.Context, submissionID int64) (int64, error)
	IsUserAssignedReviewer(ctx context.Context, userID int64, submissionID int64) (bool, error)
	GetConferenceStatus(ctx context.Context, conferenceID int64) (string, error)
	IsUserConferenceChair(ctx context.Context, userEmail string, conferenceID int64) (bool, error)
}

// Storage implements discussion storage operations
type Storage struct {
	db *sql.DB
	qb sq.StatementBuilderType
}

// New creates a new discussion storage instance
func New(db *sql.DB) *Storage {
	return &Storage{
		db: db,
		qb: sq.StatementBuilder.PlaceholderFormat(sq.Dollar),
	}
}

// CreateThread creates a new discussion thread
func (s *Storage) CreateThread(ctx context.Context, thread *model.DiscussionThread) (*model.DiscussionThread, error) {
	now := time.Now()

	query, args, err := s.qb.
		Insert(model.DiscussionThreadTableName).
		Columns(
			model.ColThreadSubmissionID,
			model.ColThreadReviewerID,
			model.ColThreadConferenceID,
			model.ColThreadTitle,
			model.ColThreadVisibility,
			model.ColThreadCreatedAt,
		).
		Values(
			thread.SubmissionID,
			thread.ReviewerID,
			thread.ConferenceID,
			thread.Title,
			thread.Visibility,
			now,
		).
		Suffix("RETURNING id, submission_id, reviewer_id, conference_id, title, visibility, created_at").
		ToSql()

	if err != nil {
		return nil, fmt.Errorf("failed to build insert query: %w", err)
	}

	result := &model.DiscussionThread{}
	err = s.db.QueryRowContext(ctx, query, args...).Scan(
		&result.ID,
		&result.SubmissionID,
		&result.ReviewerID,
		&result.ConferenceID,
		&result.Title,
		&result.Visibility,
		&result.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create thread: %w", err)
	}

	return result, nil
}

// GetThreadByID retrieves a thread by its ID with related info
func (s *Storage) GetThreadByID(ctx context.Context, threadID int64) (*model.DiscussionThread, error) {
	query := `
		SELECT
			t.id, t.submission_id, t.reviewer_id, t.conference_id, t.title, t.visibility, t.created_at,
			u.email as reviewer_email, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
			s.author as author_email, s.title as submission_title,
			COALESCE(m.message_count, 0) as message_count,
			m.last_message_at
		FROM discussion_threads t
		JOIN users u ON t.reviewer_id = u.user_id
		JOIN conference_submissions s ON t.submission_id = s.submission_id
		LEFT JOIN (
			SELECT thread_id, COUNT(*) as message_count, MAX(created_at) as last_message_at
			FROM discussion_messages
			GROUP BY thread_id
		) m ON t.id = m.thread_id
		WHERE t.id = $1
	`

	thread := &model.DiscussionThread{}
	err := s.db.QueryRowContext(ctx, query, threadID).Scan(
		&thread.ID,
		&thread.SubmissionID,
		&thread.ReviewerID,
		&thread.ConferenceID,
		&thread.Title,
		&thread.Visibility,
		&thread.CreatedAt,
		&thread.ReviewerEmail,
		&thread.ReviewerFirstName,
		&thread.ReviewerLastName,
		&thread.AuthorEmail,
		&thread.SubmissionTitle,
		&thread.MessageCount,
		&thread.LastMessageAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("thread not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get thread: %w", err)
	}

	return thread, nil
}

// GetThreadsBySubmission retrieves all threads for a submission
func (s *Storage) GetThreadsBySubmission(ctx context.Context, submissionID int64) ([]*model.DiscussionThread, error) {
	query := `
		SELECT
			t.id, t.submission_id, t.reviewer_id, t.conference_id, t.title, t.visibility, t.created_at,
			u.email as reviewer_email, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
			s.author as author_email, s.title as submission_title,
			COALESCE(m.message_count, 0) as message_count,
			m.last_message_at
		FROM discussion_threads t
		JOIN users u ON t.reviewer_id = u.user_id
		JOIN conference_submissions s ON t.submission_id = s.submission_id
		LEFT JOIN (
			SELECT thread_id, COUNT(*) as message_count, MAX(created_at) as last_message_at
			FROM discussion_messages
			GROUP BY thread_id
		) m ON t.id = m.thread_id
		WHERE t.submission_id = $1
		ORDER BY t.created_at DESC
	`

	return s.queryThreads(ctx, query, submissionID)
}

// GetThreadsByReviewer retrieves threads created by a specific reviewer for a submission
func (s *Storage) GetThreadsByReviewer(ctx context.Context, reviewerID int64, submissionID int64) ([]*model.DiscussionThread, error) {
	query := `
		SELECT
			t.id, t.submission_id, t.reviewer_id, t.conference_id, t.title, t.visibility, t.created_at,
			u.email as reviewer_email, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
			s.author as author_email, s.title as submission_title,
			COALESCE(m.message_count, 0) as message_count,
			m.last_message_at
		FROM discussion_threads t
		JOIN users u ON t.reviewer_id = u.user_id
		JOIN conference_submissions s ON t.submission_id = s.submission_id
		LEFT JOIN (
			SELECT thread_id, COUNT(*) as message_count, MAX(created_at) as last_message_at
			FROM discussion_messages
			GROUP BY thread_id
		) m ON t.id = m.thread_id
		WHERE t.reviewer_id = $1 AND t.submission_id = $2
		ORDER BY t.created_at DESC
	`

	return s.queryThreads(ctx, query, reviewerID, submissionID)
}

// GetThreadsForAuthor retrieves threads for a submission where the user is the author
func (s *Storage) GetThreadsForAuthor(ctx context.Context, authorEmail string, submissionID int64) ([]*model.DiscussionThread, error) {
	query := `
		SELECT
			t.id, t.submission_id, t.reviewer_id, t.conference_id, t.title, t.visibility, t.created_at,
			u.email as reviewer_email, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
			s.author as author_email, s.title as submission_title,
			COALESCE(m.message_count, 0) as message_count,
			m.last_message_at
		FROM discussion_threads t
		JOIN users u ON t.reviewer_id = u.user_id
		JOIN conference_submissions s ON t.submission_id = s.submission_id
		LEFT JOIN (
			SELECT thread_id, COUNT(*) as message_count, MAX(created_at) as last_message_at
			FROM discussion_messages
			GROUP BY thread_id
		) m ON t.id = m.thread_id
		WHERE t.submission_id = $1 AND s.author = $2 AND t.visibility = 'authors'
		ORDER BY t.created_at DESC
	`

	return s.queryThreads(ctx, query, submissionID, authorEmail)
}

// GetThreadsByConference retrieves all threads for a conference (for chairs)
func (s *Storage) GetThreadsByConference(ctx context.Context, conferenceID int64) ([]*model.DiscussionThread, error) {
	query := `
		SELECT
			t.id, t.submission_id, t.reviewer_id, t.conference_id, t.title, t.visibility, t.created_at,
			u.email as reviewer_email, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
			s.author as author_email, s.title as submission_title,
			COALESCE(m.message_count, 0) as message_count,
			m.last_message_at
		FROM discussion_threads t
		JOIN users u ON t.reviewer_id = u.user_id
		JOIN conference_submissions s ON t.submission_id = s.submission_id
		LEFT JOIN (
			SELECT thread_id, COUNT(*) as message_count, MAX(created_at) as last_message_at
			FROM discussion_messages
			GROUP BY thread_id
		) m ON t.id = m.thread_id
		WHERE t.conference_id = $1
		ORDER BY t.created_at DESC
	`

	return s.queryThreads(ctx, query, conferenceID)
}

// queryThreads is a helper to execute thread queries
func (s *Storage) queryThreads(ctx context.Context, query string, args ...interface{}) ([]*model.DiscussionThread, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query threads: %w", err)
	}
	defer rows.Close()

	var threads []*model.DiscussionThread
	for rows.Next() {
		thread := &model.DiscussionThread{}
		err := rows.Scan(
			&thread.ID,
			&thread.SubmissionID,
			&thread.ReviewerID,
			&thread.ConferenceID,
			&thread.Title,
			&thread.Visibility,
			&thread.CreatedAt,
			&thread.ReviewerEmail,
			&thread.ReviewerFirstName,
			&thread.ReviewerLastName,
			&thread.AuthorEmail,
			&thread.SubmissionTitle,
			&thread.MessageCount,
			&thread.LastMessageAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan thread: %w", err)
		}
		threads = append(threads, thread)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating threads: %w", err)
	}

	if threads == nil {
		threads = []*model.DiscussionThread{}
	}

	return threads, nil
}

// CreateMessage creates a new message in a thread
func (s *Storage) CreateMessage(ctx context.Context, message *model.DiscussionMessage) (*model.DiscussionMessage, error) {
	now := time.Now()

	query := `
		INSERT INTO discussion_messages (thread_id, author_id, content, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, thread_id, author_id, content, created_at
	`

	result := &model.DiscussionMessage{}
	err := s.db.QueryRowContext(ctx, query, message.ThreadID, message.AuthorID, message.Content, now).Scan(
		&result.ID,
		&result.ThreadID,
		&result.AuthorID,
		&result.Content,
		&result.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Get author info
	authorQuery := `SELECT email, first_name, last_name FROM users WHERE user_id = $1`
	err = s.db.QueryRowContext(ctx, authorQuery, result.AuthorID).Scan(
		&result.AuthorEmail,
		&result.AuthorFirstName,
		&result.AuthorLastName,
	)
	if err != nil {
		// Non-fatal, continue without author info
		result.AuthorEmail = ""
		result.AuthorFirstName = ""
		result.AuthorLastName = ""
	}

	return result, nil
}

// GetMessagesByThread retrieves all messages in a thread
func (s *Storage) GetMessagesByThread(ctx context.Context, threadID int64) ([]*model.DiscussionMessage, error) {
	query := `
		SELECT
			m.id, m.thread_id, m.author_id, m.content, m.created_at,
			u.email as author_email, u.first_name as author_first_name, u.last_name as author_last_name
		FROM discussion_messages m
		JOIN users u ON m.author_id = u.user_id
		WHERE m.thread_id = $1
		ORDER BY m.created_at ASC
	`

	rows, err := s.db.QueryContext(ctx, query, threadID)
	if err != nil {
		return nil, fmt.Errorf("failed to query messages: %w", err)
	}
	defer rows.Close()

	var messages []*model.DiscussionMessage
	for rows.Next() {
		msg := &model.DiscussionMessage{}
		err := rows.Scan(
			&msg.ID,
			&msg.ThreadID,
			&msg.AuthorID,
			&msg.Content,
			&msg.CreatedAt,
			&msg.AuthorEmail,
			&msg.AuthorFirstName,
			&msg.AuthorLastName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating messages: %w", err)
	}

	if messages == nil {
		messages = []*model.DiscussionMessage{}
	}

	return messages, nil
}

// GetSubmissionAuthorEmail gets the author email for a submission
func (s *Storage) GetSubmissionAuthorEmail(ctx context.Context, submissionID int64) (string, error) {
	var authorEmail string
	query := `SELECT author FROM conference_submissions WHERE submission_id = $1`
	err := s.db.QueryRowContext(ctx, query, submissionID).Scan(&authorEmail)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("submission not found")
	}
	if err != nil {
		return "", fmt.Errorf("failed to get submission author: %w", err)
	}
	return authorEmail, nil
}

// GetSubmissionConferenceID gets the conference ID for a submission
func (s *Storage) GetSubmissionConferenceID(ctx context.Context, submissionID int64) (int64, error) {
	var conferenceID int64
	query := `SELECT conference_id FROM conference_submissions WHERE submission_id = $1`
	err := s.db.QueryRowContext(ctx, query, submissionID).Scan(&conferenceID)
	if err == sql.ErrNoRows {
		return 0, fmt.Errorf("submission not found")
	}
	if err != nil {
		return 0, fmt.Errorf("failed to get submission conference: %w", err)
	}
	return conferenceID, nil
}

// IsUserAssignedReviewer checks if a user is an assigned reviewer for a submission
func (s *Storage) IsUserAssignedReviewer(ctx context.Context, userID int64, submissionID int64) (bool, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM paper_assignments pa
		JOIN conference_reviewers cr ON pa.reviewer_id = cr.id
		WHERE cr.user_id = $1 AND pa.submission_id = $2 AND pa.status IN ('pending', 'accepted', 'completed')
	`
	err := s.db.QueryRowContext(ctx, query, userID, submissionID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check reviewer assignment: %w", err)
	}
	return count > 0, nil
}

// GetConferenceStatus gets the status of a conference
func (s *Storage) GetConferenceStatus(ctx context.Context, conferenceID int64) (string, error) {
	var status string
	query := `SELECT status FROM conferences WHERE conference_id = $1`
	err := s.db.QueryRowContext(ctx, query, conferenceID).Scan(&status)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("conference not found")
	}
	if err != nil {
		return "", fmt.Errorf("failed to get conference status: %w", err)
	}
	return status, nil
}

// IsUserConferenceChair checks if a user is a chair or co-chair of a conference
func (s *Storage) IsUserConferenceChair(ctx context.Context, userEmail string, conferenceID int64) (bool, error) {
	var count int
	query := `
		SELECT COUNT(*) FROM conferences
		WHERE conference_id = $1 AND (chair = $2 OR $2 = ANY(co_chairs))
	`
	err := s.db.QueryRowContext(ctx, query, conferenceID, userEmail).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check chair status: %w", err)
	}
	return count > 0, nil
}

// Ensure Storage implements StorageInterface
var _ StorageInterface = (*Storage)(nil)
