package model

import (
	"time"

	"github.com/dcao/conferencespace/internal/dto"
)

const (
	DiscussionThreadTableName  = "discussion_threads"
	DiscussionMessageTableName = "discussion_messages"

	// Thread columns
	ColThreadID       = "id"
	ColThreadTitle    = "title"
	ColThreadSubmissionID  = "submission_id"
	ColThreadReviewerID    = "reviewer_id"
	ColThreadConferenceID  = "conference_id"
	ColThreadCreatedAt     = "created_at"

	// Message columns
	ColMessageID        = "id"
	ColMessageThreadID  = "thread_id"
	ColMessageAuthorID  = "author_id"
	ColMessageContent   = "content"
	ColMessageCreatedAt = "created_at"
)

// DiscussionThread represents a discussion thread between a reviewer and author
type DiscussionThread struct {
	ID           int64     `db:"id"`
	SubmissionID int64     `db:"submission_id"`
	ReviewerID   int64     `db:"reviewer_id"`
	ConferenceID int64     `db:"conference_id"`
	Title        string    `db:"title"`
	CreatedAt    time.Time `db:"created_at"`

	// View fields (populated from JOINs)
	ReviewerEmail     string `db:"reviewer_email"`
	ReviewerFirstName string `db:"reviewer_first_name"`
	ReviewerLastName  string `db:"reviewer_last_name"`
	AuthorEmail       string `db:"author_email"`
	SubmissionTitle   string `db:"submission_title"`
	MessageCount      int    `db:"message_count"`
	LastMessageAt     *time.Time `db:"last_message_at"`
}

// ToDTO converts model to DTO
func (t *DiscussionThread) ToDTO() *dto.DiscussionThread {
	return &dto.DiscussionThread{
		ID:                t.ID,
		SubmissionID:      t.SubmissionID,
		ReviewerID:        t.ReviewerID,
		ConferenceID:      t.ConferenceID,
		Title:             t.Title,
		CreatedAt:         t.CreatedAt,
		ReviewerEmail:     t.ReviewerEmail,
		ReviewerFirstName: t.ReviewerFirstName,
		ReviewerLastName:  t.ReviewerLastName,
		AuthorEmail:       t.AuthorEmail,
		SubmissionTitle:   t.SubmissionTitle,
		MessageCount:      t.MessageCount,
		LastMessageAt:     t.LastMessageAt,
	}
}

// DiscussionMessage represents a message in a discussion thread
type DiscussionMessage struct {
	ID        int64     `db:"id"`
	ThreadID  int64     `db:"thread_id"`
	AuthorID  int64     `db:"author_id"`
	Content   string    `db:"content"`
	CreatedAt time.Time `db:"created_at"`

	// View fields (populated from JOINs)
	AuthorEmail     string `db:"author_email"`
	AuthorFirstName string `db:"author_first_name"`
	AuthorLastName  string `db:"author_last_name"`
}

// ToDTO converts model to DTO
func (m *DiscussionMessage) ToDTO() *dto.DiscussionMessage {
	return &dto.DiscussionMessage{
		ID:              m.ID,
		ThreadID:        m.ThreadID,
		AuthorID:        m.AuthorID,
		Content:         m.Content,
		CreatedAt:       m.CreatedAt,
		AuthorEmail:     m.AuthorEmail,
		AuthorFirstName: m.AuthorFirstName,
		AuthorLastName:  m.AuthorLastName,
	}
}
